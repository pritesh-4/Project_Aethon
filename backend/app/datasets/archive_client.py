"""Breakthrough Listen Open Data archive HTTP client with caching and SSRF validation."""

from __future__ import annotations

import ipaddress
import socket
import time
from contextlib import nullcontext
from typing import Any
from urllib.parse import urljoin, urlparse

import httpx

from app.core.config import Settings
from app.core.logging import get_logger
from app.schemas.public_datasets import (
    PublicDatasetItem,
    PublicDatasetQueryResponse,
    PublicDatasetStatusResponse,
)

logger = get_logger("datasets.archive_client")

MAX_REDIRECT_HOPS: int = 5

# Recognized Breakthrough Listen archive storage domains
ALLOWED_DOWNLOAD_DOMAINS: set[str] = {
    "seti.berkeley.edu",
    "bldata.berkeley.edu",
    "storage.googleapis.com",
    "berkeley.edu",
}
ALLOWED_DOWNLOAD_SUFFIXES: tuple[str, ...] = (
    ".berkeley.edu",
    ".ssl.berkeley.edu",
)
ALLOWED_PORTS: set[int] = {80, 443}
FORBIDDEN_HOSTS: set[str] = {
    "localhost",
    "localhost.localdomain",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "metadata.google.internal",
    "169.254.169.254",
}


def is_safe_ip(ip_str: str) -> tuple[bool, str]:
    """Check whether an IP address is public and safe to connect to."""
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return False, f"Invalid IP address literal '{ip_str}'"

    if (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_reserved
        or ip.is_multicast
        or ip.is_unspecified
    ):
        return False, f"Access to private/internal/reserved IP address '{ip_str}' is forbidden"

    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        v4 = ip.ipv4_mapped
        if (
            v4.is_private
            or v4.is_loopback
            or v4.is_link_local
            or v4.is_reserved
            or v4.is_multicast
            or v4.is_unspecified
        ):
            return (
                False,
                f"Access to private/internal IPv4-mapped IPv6 address '{ip_str}' is forbidden",
            )

    return True, ""


def is_safe_remote_url(
    url: str,
    archive_host: str,
    validate_dns: bool = True,
) -> tuple[bool, str]:
    """Validate that a remote observation URL is safe and points to an authorized archive host.

    Protects against SSRF, internal port scanning, DNS rebinding, and unauthorized data sources.
    """
    if not url or not isinstance(url, str):
        return False, "URL must be a non-empty string"

    try:
        parsed = urlparse(url.strip())
    except Exception as e:
        return False, f"Invalid URL structure: {e}"

    if parsed.scheme.lower() not in ("http", "https"):
        return False, f"Unsupported URL scheme '{parsed.scheme}'; must be http or https"

    hostname = (parsed.hostname or "").lower()
    if not hostname:
        return False, "URL lacks a valid hostname"

    # Block well-known loopback, internal, and cloud metadata hostnames
    if hostname in FORBIDDEN_HOSTS or any(
        hostname.endswith("." + h) for h in ("localhost", "local", "internal")
    ):
        return False, f"Access to forbidden/internal destination '{hostname}' is rejected"

    # Port validation: only allow standard HTTP/HTTPS ports or unspecified
    if parsed.port is not None and parsed.port not in ALLOWED_PORTS:
        return (
            False,
            f"Access to non-standard port '{parsed.port}' is forbidden; "
            "only ports 80/443 are allowed",
        )

    # Literal IP address checks
    try:
        ip = ipaddress.ip_address(hostname)
        is_safe, reason = is_safe_ip(str(ip))
        if not is_safe:
            return False, reason
    except ValueError:
        pass

    # Domain authorization check
    archive_host_clean = archive_host.lower().strip()
    is_authorized = False
    if hostname == archive_host_clean or hostname in ALLOWED_DOWNLOAD_DOMAINS:
        is_authorized = True
    elif any(hostname.endswith(suffix) for suffix in ALLOWED_DOWNLOAD_SUFFIXES):
        is_authorized = True

    if not is_authorized:
        return (
            False,
            f"Hostname '{hostname}' is not an authorized Breakthrough Listen data repository",
        )

    # DNS resolution check (protects against DNS rebinding to private/loopback IPs)
    if validate_dns:
        try:
            port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)
            addrinfo = socket.getaddrinfo(hostname, port)
            for _, _, _, _, sockaddr in addrinfo:
                resolved_ip = str(sockaddr[0])
                is_safe, reason = is_safe_ip(resolved_ip)
                if not is_safe:
                    return (
                        False,
                        f"Hostname '{hostname}' resolves to forbidden IP '{resolved_ip}': {reason}",
                    )
        except socket.gaierror:
            # If DNS resolution fails (e.g. offline mock testing), hostname has passed whitelist
            pass
        except Exception as e:
            logger.warning("DNS resolution check error for %s: %s", hostname, e)

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

    def _get_cached(self, key: str) -> Any:
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
        """Perform an HTTP GET request with manual redirect validation and SSRF protection."""
        if not self.base_url:
            raise ValueError("Archive URL is not configured")

        initial_url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {
            "User-Agent": "AETHON-Radio-Discovery/1.0",
            "Accept": "application/json",
        }
        if self.settings.breakthrough_listen_api_key:
            headers["Authorization"] = f"Bearer {self.settings.breakthrough_listen_api_key}"

        current_url = initial_url
        visited_urls: set[str] = {current_url}
        redirect_count = 0

        # Validate initial URL
        is_safe, error_msg = is_safe_remote_url(current_url, self.archive_host)
        if not is_safe:
            raise ValueError(f"Initial archive URL rejected for security: {error_msg}")

        client_to_use = self._client
        async with (
            httpx.AsyncClient(follow_redirects=False)
            if client_to_use is None
            else nullcontext(client_to_use)
        ) as client:
            while True:
                req = client.build_request(
                    "GET",
                    current_url,
                    params=params if redirect_count == 0 else None,
                    headers=headers,
                )
                resp = await client.send(req, follow_redirects=False)

                if resp.status_code in (301, 302, 303, 307, 308):
                    await resp.aclose()
                    redirect_count += 1
                    if redirect_count > MAX_REDIRECT_HOPS:
                        raise ValueError(
                            f"Too many redirects: exceeded maximum of {MAX_REDIRECT_HOPS} hops"
                        )

                    location = resp.headers.get("Location")
                    if not location:
                        raise ValueError("Redirect response missing Location header")

                    next_url = urljoin(current_url, location)
                    if next_url in visited_urls:
                        raise ValueError(
                            f"Redirect loop detected: '{next_url}' already visited in chain"
                        )
                    visited_urls.add(next_url)

                    is_safe, error_msg = is_safe_remote_url(next_url, self.archive_host)
                    if not is_safe:
                        raise ValueError(f"Redirect destination rejected for security: {error_msg}")

                    current_url = next_url
                    continue

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

        cache_key = "check-status"
        cached = self._get_cached(cache_key)
        if isinstance(cached, PublicDatasetStatusResponse):
            return cached

        try:
            # Probe lightweight file-types endpoint
            data = await self._request("api/list-file-types")
            res: PublicDatasetStatusResponse
            if isinstance(data, list):
                res = PublicDatasetStatusResponse(
                    configured=True,
                    archive_url=self.base_url,
                    available=True,
                    max_import_bytes=self.max_import_bytes,
                    message="Connected to Breakthrough Listen Open Data archive successfully",
                )
            else:
                res = PublicDatasetStatusResponse(
                    configured=True,
                    archive_url=self.base_url,
                    available=True,
                    max_import_bytes=self.max_import_bytes,
                    message="Archive responded with valid data",
                )
            self._set_cached(cache_key, res)
            return res
        except Exception as e:
            logger.warning("Breakthrough Listen archive health probe failed: %s", e)
            res = PublicDatasetStatusResponse(
                configured=True,
                archive_url=self.base_url,
                available=False,
                max_import_bytes=self.max_import_bytes,
                message=f"Archive unavailable or unreachable: {e}",
            )
            self._set_cached(cache_key, res)
            return res

    async def get_targets(self) -> list[str]:
        """Fetch list of available target names from the archive with caching."""
        if not self.base_url:
            return []

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
            self._set_cached(cache_key, [])
            return []

    async def get_telescopes(self) -> list[str]:
        """Fetch list of supported telescope names with caching."""
        if not self.base_url:
            return []

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
            self._set_cached(cache_key, [])
            return []

    async def get_file_types(self) -> list[str]:
        """Fetch list of available file types with caching."""
        if not self.base_url:
            return []

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
            self._set_cached(cache_key, [])
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

        if not self.base_url:
            return PublicDatasetQueryResponse(
                items=[],
                total=0,
                limit=limit,
                offset=offset,
                has_more=False,
                provider_status="unconfigured",
                cached=False,
                query_target=query_target,
            )

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
            err_resp = PublicDatasetQueryResponse(
                items=[],
                total=0,
                limit=limit,
                offset=offset,
                has_more=False,
                provider_status="unavailable",
                cached=False,
                query_target=query_target,
            )
            self._set_cached(cache_key, err_resp)
            return err_resp

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
