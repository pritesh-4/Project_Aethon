"""Remote observation import service for streaming and ingesting public datasets safely."""

from __future__ import annotations

import hashlib
import os
import time
import uuid
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse

import httpx

from app.core.config import Settings
from app.core.logging import get_logger
from app.datasets.archive_client import is_safe_remote_url
from app.ingestion.adapters.base import BaseFormatAdapter
from app.ingestion.adapters.filterbank import FilterbankAdapter
from app.ingestion.adapters.fits import FitsAdapter
from app.ingestion.exceptions import (
    EmptyFileError,
    FileSizeExceededError,
    IngestionError,
    InvalidFileContentError,
    UnsupportedFormatError,
)
from app.ingestion.models import ObservationRecordInternal
from app.ingestion.service import SUPPORTED_EXTENSIONS, sanitize_filename
from app.schemas.public_datasets import (
    PublicDatasetImportRequest,
    PublicDatasetImportResponse,
)
from app.storage.repository import ObservationRepository

logger = get_logger("datasets.import_service")


class DatasetImportService:
    """Manages secure streaming download, validation, and persistent ingestion
    of public datasets.
    """

    def __init__(
        self,
        settings: Settings,
        repository: ObservationRepository,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.settings = settings
        self.repository = repository
        self.max_import_bytes = settings.breakthrough_listen_max_import_bytes
        self.timeout_seconds = settings.breakthrough_listen_timeout_seconds
        self.temp_upload_dir = Path(settings.temp_upload_dir).resolve()
        self.temp_upload_dir.mkdir(parents=True, exist_ok=True)

        base_url = settings.breakthrough_listen_archive_url or "https://seti.berkeley.edu/opendata"
        parsed_base = urlparse(base_url)
        raw_host = parsed_base.hostname or "seti.berkeley.edu"
        self.archive_host: str = str(raw_host).lower()

        self._client = client
        self._adapters: dict[str, BaseFormatAdapter] = {
            "fil": FilterbankAdapter(),
            "fits": FitsAdapter(),
        }

    async def import_dataset(
        self,
        request: PublicDatasetImportRequest,
    ) -> PublicDatasetImportResponse:
        """Stream a remote observation from an authorized archive and ingest into AETHON.

        Args:
            request: Import request containing target URL and optional checksum/metadata.

        Returns:
            PublicDatasetImportResponse containing the persisted ObservationRecordResponse.

        Raises:
            ValueError: If the remote URL fails SSRF safety checks.
            UnsupportedFormatError: If the remote file format is unsupported (.h5, .raw, etc.).
            FileSizeExceededError: If the remote file exceeds the configured import limit.
            InvalidFileContentError: If checksum verification fails or parsing errors occur.
        """
        start_time = time.monotonic()
        url = request.url.strip()

        # 1. URL security & SSRF validation
        is_safe, error_msg = is_safe_remote_url(url, self.archive_host)
        if not is_safe:
            raise ValueError(f"Remote import rejected for security: {error_msg}")

        # 2. Extract and sanitize filename
        parsed_url = urlparse(url)
        raw_filename = os.path.basename(parsed_url.path) or "remote_observation.fil"
        clean_filename = sanitize_filename(raw_filename)
        ext = Path(clean_filename).suffix.lower()

        if ext not in SUPPORTED_EXTENSIONS:
            supported = ", ".join(sorted(SUPPORTED_EXTENSIONS.keys()))
            raise UnsupportedFormatError(
                message=(
                    f"Remote file '{clean_filename}' format '{ext or 'unknown'}' is unsupported. "
                    f"AETHON requires direct filterbank or radio FITS data ({supported}). "
                    "HDF5 (.h5) and raw baseband formats are not directly ingestible."
                ),
                details={"filename": clean_filename, "url": url},
            )

        format_code = SUPPORTED_EXTENSIONS[ext]
        adapter = self._adapters[format_code]

        # 3. Pre-flight size check if reported by caller
        if request.expected_size_bytes and request.expected_size_bytes > self.max_import_bytes:
            raise FileSizeExceededError(
                message=(
                    f"Remote observation size ({request.expected_size_bytes} bytes) exceeds "
                    f"the maximum import limit of {self.max_import_bytes} bytes."
                ),
                details={
                    "expected_size_bytes": request.expected_size_bytes,
                    "max_allowed_bytes": self.max_import_bytes,
                },
            )

        # 4. Stream remote file into temporary staging file
        temp_id = f"import_{uuid.uuid4().hex}"
        temp_path = self.temp_upload_dir / f"{temp_id}.tmp"

        sha256_hasher = hashlib.sha256()
        md5_hasher = hashlib.md5()
        bytes_downloaded = 0
        chunk_size = 64 * 1024  # 64 KB streaming buffer

        try:
            logger.info("Starting streaming import from %s to %s", url, temp_path.name)

            if self._client is not None:
                async with self._client.stream("GET", url, timeout=self.timeout_seconds) as resp:
                    resp.raise_for_status()
                    with open(temp_path, "wb") as f_out:
                        async for chunk in resp.aiter_bytes(chunk_size):
                            bytes_downloaded += len(chunk)
                            if bytes_downloaded > self.max_import_bytes:
                                raise FileSizeExceededError(
                                    message=(
                                        f"Remote download exceeded maximum import limit of "
                                        f"{self.max_import_bytes} bytes."
                                    ),
                                    details={"bytes_received": bytes_downloaded},
                                )
                            sha256_hasher.update(chunk)
                            md5_hasher.update(chunk)
                            f_out.write(chunk)
            else:
                async with httpx.AsyncClient(follow_redirects=True) as client:
                    async with client.stream("GET", url, timeout=self.timeout_seconds) as resp:
                        resp.raise_for_status()
                        with open(temp_path, "wb") as f_out:
                            async for chunk in resp.aiter_bytes(chunk_size):
                                bytes_downloaded += len(chunk)
                                if bytes_downloaded > self.max_import_bytes:
                                    raise FileSizeExceededError(
                                        message=(
                                            f"Remote download exceeded maximum import limit of "
                                            f"{self.max_import_bytes} bytes."
                                        ),
                                        details={"bytes_received": bytes_downloaded},
                                    )
                                sha256_hasher.update(chunk)
                                md5_hasher.update(chunk)
                                f_out.write(chunk)

            if bytes_downloaded == 0:
                raise EmptyFileError(
                    message=f"Remote file at '{url}' contained zero bytes.",
                    details={"url": url},
                )

            # 5. Checksum verifications
            sha256_digest = sha256_hasher.hexdigest()
            md5_digest = md5_hasher.hexdigest()

            if request.expected_md5sum and request.expected_md5sum.strip():
                expected_clean = request.expected_md5sum.strip().lower()
                if md5_digest.lower() != expected_clean:
                    raise InvalidFileContentError(
                        message=(
                            f"MD5 checksum verification failed for remote import: "
                            f"expected {expected_clean}, calculated {md5_digest}"
                        ),
                        details={"expected_md5": expected_clean, "calculated_md5": md5_digest},
                    )

            # 6. Idempotency / Deduplication check
            existing_obs = self.repository.get_observation_by_sha256(sha256_digest)
            if existing_obs is not None:
                logger.info(
                    "Observation with SHA %s already ingested as %s (reusing existing)",
                    sha256_digest[:12],
                    existing_obs.id,
                )
                duration = time.monotonic() - start_time
                return PublicDatasetImportResponse(
                    observation=existing_obs,
                    import_source_url=url,
                    bytes_downloaded=bytes_downloaded,
                    is_duplicate=True,
                    duration_seconds=round(duration, 2),
                    message=(
                        f"Observation already persisted in AETHON repository ({existing_obs.id}); "
                        "reused existing scientific index without duplicating storage."
                    ),
                )

            # 7. Scientific parsing & metadata extraction
            logger.info("Parsing imported file %s with %s adapter", clean_filename, format_code)
            parsed = adapter.parse(temp_path)

            # 8. Create internal record
            obs_id = str(uuid.uuid4())
            now_utc = datetime.now(UTC)

            # Enrich provenance with upstream origin
            provenance = parsed.provenance
            provenance.notes = f"Imported from Breakthrough Listen Open Data archive: {url}"

            internal_record = ObservationRecordInternal(
                id=obs_id,
                original_filename=clean_filename,
                format=format_code,
                file_size_bytes=bytes_downloaded,
                sha256=sha256_digest,
                ingested_at=now_utc,
                status="ingested",
                file_rel_path="",
                metadata=parsed.metadata,
                provenance=provenance,
                warnings=parsed.warnings,
            )

            # 9. Atomic move into persistent storage & SQLite index commit
            obs_response = self.repository.save_observation(internal_record, temp_path)
            duration = time.monotonic() - start_time
            logger.info(
                "Successfully imported observation %s (%d bytes, SHA: %s)",
                obs_id,
                bytes_downloaded,
                sha256_digest[:12],
            )

            return PublicDatasetImportResponse(
                observation=obs_response,
                import_source_url=url,
                bytes_downloaded=bytes_downloaded,
                is_duplicate=False,
                duration_seconds=round(duration, 2),
                message=f"Successfully imported and ingested observation {obs_id} into AETHON.",
            )

        except IngestionError:
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass
            raise

        except Exception as e:
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass
            logger.exception("Failed remote observation import from %s: %s", url, e)
            raise InvalidFileContentError(
                message=f"Failed to stream and ingest remote observation: {e}",
                details={"url": url, "filename": clean_filename},
            ) from e

        finally:
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass
