"""Breakthrough Listen Open Data archive HTTP client with caching and SSRF validation."""

from __future__ import annotations

import ipaddress
import time
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.config import Settings
from app.core.logging import get_logger
from app.schemas.public_datasets import (
    PublicDatasetItem,
    PublicDatasetQueryResponse,
    PublicDatasetStatusResponse,
)

logger = get_logger("datasets.archive_client")

# Recognized Breakthrough Listen archive storage domains
ALLOWED_DOWNLOAD_DOMAINS: set[str] = {
    "seti.berkeley.edu",
    "bldata.berkeley.edu",
    "storage.googleapis.com",
}
ALLOWED_DOWNLOAD_SUFFIXES: tuple[str, ...] = (
    ".berkeley.edu",
    ".ssl.berkeley.edu",
)


def is_safe_remote_url(url: str, archive_host: str) -> tuple[bool, str]:
    """Validate that a remote observation URL is safe and points to an authorized archive host.

    Protects against SSRF, internal port scanning, and unauthorized data sources.
    """
    try:
        parsed = urlparse(url)
    except Exception as e:
        return False, f"Invalid URL structure: {e}"

    if parsed.scheme not in ("http", "https"):
        return False, f"Unsupported URL scheme '{parsed.scheme}'; must be http or https"

    hostname = (parsed.hostname or "").lower()
    if not hostname:
        return False, "URL lacks a valid hostname"

    # Block localhost and loopback hostnames
    if hostname in ("localhost", "127.0.0.1", "0.0.0.0", "::1"):
        return False, "Access to localhost or loopback destinations is forbidden"

    # Check IP addresses directly
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return False, f"Access to private/internal IP address '{hostname}' is forbidden"
    except ValueError:
        # Not a raw IP literal; validate against authorized domain whitelist
        pass

    # Domain authorization check
    is_authorized = False
    if hostname == archive_host or hostname in ALLOWED_DOWNLOAD_DOMAINS:
        is_authorized = True
    elif any(hostname.endswith(suffix) for suffix in ALLOWED_DOWNLOAD_SUFFIXES):
        is_authorized = True

    if not is_authorized:
        return (
            False,
            f"Hostname '{hostname}' is not an authorized Breakthrough Listen data repository",
        )

    return True, ""


class ArchiveClient:
    """Async client for querying the Breakthrough Listen Open Data Archive API."""

    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self.settings = settings
        self.base_url = (settings.breakthrough_listen_archive_url or "").rstrip("/")
        self.max_import_bytes = settings.breakthrough_listen_max_import_bytes
        self.timeout_seconds = settings.breakthrough_listen_timeout_seconds
        self.cache_ttl = settings.breakthrough_listen_catalog_cache_seconds

        parsed_base = urlparse(self.base_url)
        self.archive_host = (parsed_base.hostname or "seti.berkeley.edu").lower()

        self._client = client
        self._cache: dict[str, tuple[float, Any]] = {}

    def _get_cached(self, key: str) -> Any | None:
        """Retrieve entry from in-memory cache if TTL has not expired."""
        if self.cache_ttl <= 0:
            return None
        cached = self._cache.get(key)
        if cached is None:
            return None
        timestamp, value = cached
        if (time.monotonic() - timestamp) > self.cache_ttl:
            del self._cache[key]
            return None
        return value

    def _set_cached(self, key: str, value: Any) -> None:
        """Store entry in in-memory cache with current monotonic timestamp."""
        if self.cache_ttl > 0:
            self._cache[key] = (time.monotonic(), value)

    async def _request(self, endpoint: str, params: dict[str, Any] | None = None) -> Any:
        """Perform an HTTP GET request to the configured archive endpoint."""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {
            "User-Agent": "AETHON-Radio-Discovery/1.0",
            "Accept": "application/json",
        }
        if self.settings.breakthrough_listen_api_key:
            headers["Authorization"] = f"Bearer {self.settings.breakthrough_listen_api_key}"

        if self._client is not None:
            resp = await self._client.get(
                url,
                params=params,
                headers=headers,
                timeout=self.timeout_seconds,
            )
            resp.raise_for_status()
            return resp.json()

        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get(
                url,
                params=params,
                headers=headers,
                timeout=self.timeout_seconds,
            )
            resp.raise_for_status()
            return resp.json()

    async def check_status(self) -> PublicDatasetStatusResponse:
        """Check provider configuration and verify live reachability of the archive."""
        if not self.base_url:
            return PublicDatasetStatusResponse(
                configured=False,
                archive_url="",
                available=False,
                max_import_bytes=self.max_import_bytes,
                message="BREAKTHROUGH_LISTEN_ARCHIVE_URL is not configured",
            )

        try:
            # Probe lightweight file-types endpoint
            data = await self._request("api/list-file-types")
            if isinstance(data, list):
                return PublicDatasetStatusResponse(
                    configured=True,
                    archive_url=self.base_url,
                    available=True,
                    max_import_bytes=self.max_import_bytes,
                    message="Connected to Breakthrough Listen Open Data archive successfully",
                )
            return PublicDatasetStatusResponse(
                configured=True,
                archive_url=self.base_url,
                available=True,
                max_import_bytes=self.max_import_bytes,
                message="Archive responded with valid data",
            )
        except Exception as e:
            logger.warning("Breakthrough Listen archive health probe failed: %s", e)
            return PublicDatasetStatusResponse(
                configured=True,
                archive_url=self.base_url,
                available=False,
                max_import_bytes=self.max_import_bytes,
                message=f"Archive unavailable or unreachable: {e}",
            )

    async def get_targets(self) -> list[str]:
        """Fetch list of available target names from the archive with caching."""
        cache_key = "list-targets"
        cached = self._get_cached(cache_key)
        if isinstance(cached, list):
            return cached

        try:
            raw = await self._request("api/list-targets")
            targets: list[str] = []
            if isinstance(raw, list):
                for item in raw:
                    if isinstance(item, list) and item and item[0]:
                        targets.append(str(item[0]).strip())
                    elif isinstance(item, str) and item.strip():
                        targets.append(item.strip())
            self._set_cached(cache_key, targets)
            return targets
        except Exception as e:
            logger.warning("Failed to retrieve targets from archive: %s", e)
            return []

    async def get_telescopes(self) -> list[str]:
        """Fetch list of supported telescope names with caching."""
        cache_key = "list-telescopes"
        cached = self._get_cached(cache_key)
        if isinstance(cached, list):
            return cached

        try:
            raw = await self._request("api/list-telescopes")
            telescopes: list[str] = []
            if isinstance(raw, list):
                for item in raw:
                    if isinstance(item, list) and item and item[0]:
                        telescopes.append(str(item[0]).strip())
                    elif isinstance(item, str) and item.strip():
                        telescopes.append(item.strip())
            self._set_cached(cache_key, telescopes)
            return telescopes
        except Exception as e:
            logger.warning("Failed to retrieve telescopes from archive: %s", e)
            return []

    async def get_file_types(self) -> list[str]:
        """Fetch list of available file types with caching."""
        cache_key = "list-file-types"
        cached = self._get_cached(cache_key)
        if isinstance(cached, list):
            return cached

        try:
            raw = await self._request("api/list-file-types")
            file_types: list[str] = []
            if isinstance(raw, list):
                for item in raw:
                    if isinstance(item, list) and item and item[0]:
                        file_types.append(str(item[0]).strip())
                    elif isinstance(item, str) and item.strip():
                        file_types.append(item.strip())
            self._set_cached(cache_key, file_types)
            return file_types
        except Exception as e:
            logger.warning("Failed to retrieve file types from archive: %s", e)
            return []

    async def query_files(
        self,
        target: str | None = None,
        telescopes: str | None = None,
        file_types: str | None = None,
        quality: str | None = None,
        limit: int = 25,
        offset: int = 0,
        max_size_mb: float | None = None,
    ) -> PublicDatasetQueryResponse:
        """Query observations matching criteria and normalize into AETHON response format."""
        # Breakthrough Listen query-files requires target; default to common target if omitted
        query_target = target.strip() if target and target.strip() else ""
        if not query_target:
            query_target = "3C123"  # Default canonical target with filterbank observations

        cache_key = (
            f"query:{query_target}:{telescopes}:{file_types}:{quality}:"
            f"{limit}:{offset}:{max_size_mb}"
        )
        cached = self._get_cached(cache_key)
        if isinstance(cached, PublicDatasetQueryResponse):
            cached_copy = cached.model_copy()
            cached_copy.cached = True
            return cached_copy

        params: dict[str, Any] = {"target": query_target}
        if telescopes:
            params["telescopes"] = telescopes
        if file_types:
            params["file-types"] = file_types
        if quality:
            params["quality"] = quality

        try:
            raw_data = await self._request("api/query-files", params=params)
        except Exception as e:
            logger.error("Failed to query files from archive: %s", e)
            return PublicDatasetQueryResponse(
                items=[],
                total=0,
                limit=limit,
                offset=offset,
                has_more=False,
                provider_status="unavailable",
                cached=False,
                query_target=query_target,
            )

        raw_items: list[dict[str, Any]] = []
        if isinstance(raw_data, dict):
            if raw_data.get("result") == "error":
                return PublicDatasetQueryResponse(
                    items=[],
                    total=0,
                    limit=limit,
                    offset=offset,
                    has_more=False,
                    provider_status="empty",
                    cached=False,
                    query_target=query_target,
                )
            raw_items = raw_data.get("data", [])
        elif isinstance(raw_data, list):
            raw_items = raw_data

        # Normalize upstream items
        normalized: list[PublicDatasetItem] = []
        for raw in raw_items:
            item_id = str(raw.get("id") or "")
            item_target = str(raw.get("target") or query_target)
            item_telescope = str(raw.get("telescope") or "Unknown")
            item_file_type = str(raw.get("file_type") or "Unknown")
            item_size = int(raw.get("size") or 0)
            item_url = str(raw.get("url") or "")
            item_quality = raw.get("quality")

            # Determine compatibility with AETHON ingestion
            ft_lower = item_file_type.lower()
            url_lower = item_url.lower()

            is_filterbank = (
                "filterbank" in ft_lower or url_lower.endswith(".fil") or ".gpuspec" in url_lower
            )
            is_fits = "fits" in ft_lower or url_lower.endswith((".fits", ".fit"))

            is_compatible = is_filterbank or is_fits
            if not is_compatible:
                compat_reason = (
                    f"Format '{item_file_type}' is not supported for direct ingestion; "
                    "AETHON requires Filterbank (.fil) or Radio FITS (.fits) data."
                )
            else:
                compat_reason = None

            # Check size limits
            is_within_size = item_size <= self.max_import_bytes
            if not is_within_size:
                size_mb = item_size / (1024 * 1024)
                limit_mb = self.max_import_bytes / (1024 * 1024)
                size_reason = (
                    f"File size ({size_mb:.1f} MiB) exceeds the configured import limit "
                    f"of {limit_mb:.0f} MiB."
                )
            else:
                size_reason = None

            # Optional client-side max_size filter
            if max_size_mb is not None:
                max_bytes = max_size_mb * 1024 * 1024
                if item_size > max_bytes:
                    continue

            normalized.append(
                PublicDatasetItem(
                    id=item_id,
                    target=item_target,
                    telescope=item_telescope,
                    utc=raw.get("utc"),
                    mjd=float(raw["mjd"]) if raw.get("mjd") is not None else None,
                    ra_deg=float(raw["ra"]) if raw.get("ra") is not None else None,
                    dec_deg=float(raw["decl"]) if raw.get("decl") is not None else None,
                    center_freq_mhz=(
                        float(raw["center_freq"]) if raw.get("center_freq") is not None else None
                    ),
                    file_type=item_file_type,
                    size_bytes=item_size,
                    quality=str(item_quality) if item_quality is not None else None,
                    md5sum=raw.get("md5sum"),
                    url=item_url,
                    is_compatible=is_compatible,
                    compatibility_reason=compat_reason,
                    is_within_size_limit=is_within_size,
                    size_reason=size_reason,
                )
            )

        total_count = len(normalized)
        paginated_items = normalized[offset : offset + limit]
        has_more = (offset + limit) < total_count

        response = PublicDatasetQueryResponse(
            items=paginated_items,
            total=total_count,
            limit=limit,
            offset=offset,
            has_more=has_more,
            provider_status="ok" if normalized else "empty",
            cached=False,
            query_target=query_target,
        )

        self._set_cached(cache_key, response)
        return response
