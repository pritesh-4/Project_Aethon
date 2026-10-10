from __future__ import annotations

import hashlib
import os
import re
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import TYPE_CHECKING

from fastapi import UploadFile

from app.core.config import Settings
from app.core.logging import get_logger
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
from app.schemas.observations import ObservationRecordResponse

if TYPE_CHECKING:
    from app.storage.repository import ObservationRepository

logger = get_logger("ingestion.service")

SUPPORTED_EXTENSIONS: dict[str, str] = {
    ".fil": "fil",
    ".fits": "fits",
    ".fit": "fits",
}


def sanitize_filename(filename: str | None) -> str:
    """Sanitize original client filename to prevent path traversal."""

    if not filename:
        return "unnamed_observation.dat"
    # Strip any directory path components (both UNIX and Windows)
    basename = os.path.basename(filename.replace("\\", "/"))
    # Allow alphanumeric, dots, dashes, underscores
    sanitized = re.sub(r"[^\w\.\-]", "_", basename)
    # Remove leading dots or dashes that might hide files or cause shell issues
    sanitized = sanitized.lstrip(".-")
    return sanitized or "unnamed_observation.dat"


class IngestionService:
    """Orchestrates streaming upload staging, parser validation, and persistent storage."""

    def __init__(self, settings: Settings, repository: ObservationRepository) -> None:
        self.settings = settings
        self.repository = repository
        self.temp_upload_dir = Path(settings.temp_upload_dir).resolve()
        self.temp_upload_dir.mkdir(parents=True, exist_ok=True)

        self._adapters: dict[str, BaseFormatAdapter] = {
            "fil": FilterbankAdapter(),
            "fits": FitsAdapter(),
        }

    async def ingest_file(self, upload_file: UploadFile) -> ObservationRecordResponse:
        """Stream an uploaded observation file, validate content, extract metadata, and persist.

        Args:
            upload_file: FastAPI multipart UploadFile.

        Returns:
            Canonical ObservationRecordResponse.

        Raises:
            UnsupportedFormatError: If file extension is unsupported.
            EmptyFileError: If file is 0 bytes.
            FileSizeExceededError: If file exceeds max_upload_size_bytes.
            InvalidFileContentError: If file is corrupt or violates format.
            UnsupportedFitsLayoutError: If FITS file lacks supported radio layout.
        """
        raw_name = upload_file.filename or ""
        clean_name = sanitize_filename(raw_name)
        ext = Path(clean_name).suffix.lower()

        if ext not in SUPPORTED_EXTENSIONS:
            supported = ", ".join(sorted(SUPPORTED_EXTENSIONS.keys()))
            raise UnsupportedFormatError(
                message=(
                    f"File extension '{ext or 'none'}' is not supported. "
                    f"Supported extensions: {supported}"
                ),
                details={
                    "filename": clean_name,
                    "supported_extensions": list(SUPPORTED_EXTENSIONS.keys()),
                },
            )

        format_code = SUPPORTED_EXTENSIONS[ext]
        adapter = self._adapters[format_code]

        # Stage file in temporary staging directory
        temp_id = f"stage_{uuid.uuid4().hex}"
        temp_path = self.temp_upload_dir / f"{temp_id}.tmp"

        hasher = hashlib.sha256()
        bytes_written = 0
        chunk_size = 64 * 1024  # 64 KB streaming buffer

        try:
            with open(temp_path, "wb") as f_out:
                while True:
                    chunk = await upload_file.read(chunk_size)
                    if not chunk:
                        break
                    bytes_written += len(chunk)
                    if bytes_written > self.settings.max_upload_size_bytes:
                        raise FileSizeExceededError(
                            message=(
                                f"Uploaded file size ({bytes_written} bytes) exceeds "
                                f"configured limit of {self.settings.max_upload_size_bytes} bytes."
                            ),
                            details={
                                "bytes_received": bytes_written,
                                "max_allowed_bytes": self.settings.max_upload_size_bytes,
                            },
                        )
                    hasher.update(chunk)
                    f_out.write(chunk)

            if bytes_written == 0:
                raise EmptyFileError(
                    message=f"Uploaded file '{clean_name}' contains zero bytes.",
                    details={"filename": clean_name},
                )

            # Scientific format parsing & metadata extraction
            logger.info(
                "Parsing %s (%d bytes) with %s adapter", clean_name, bytes_written, format_code
            )
            parsed = adapter.parse(temp_path)

            # Create internal record
            obs_id = str(uuid.uuid4())
            sha256_digest = hasher.hexdigest()
            now_utc = datetime.now(UTC)

            internal_record = ObservationRecordInternal(
                id=obs_id,
                original_filename=clean_name,
                format=format_code,
                file_size_bytes=bytes_written,
                sha256=sha256_digest,
                ingested_at=now_utc,
                status="ingested",
                file_rel_path="",  # Set during save_observation
                metadata=parsed.metadata,
                provenance=parsed.provenance,
                warnings=parsed.warnings,
            )

            # Atomic move from temp staging to persistent storage & SQLite commit
            response = self.repository.save_observation(internal_record, temp_path)
            logger.info(
                "Successfully ingested observation %s (SHA: %s)", obs_id, sha256_digest[:12]
            )
            return response

        except IngestionError:
            # Known domain exceptions: ensure temp file is purged
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass
            raise

        except Exception as e:
            # Unexpected exceptions: purge temp staging and wrap
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass
            logger.exception(
                "Unexpected error during observation ingestion for %s: %s", clean_name, e
            )
            raise InvalidFileContentError(
                message=f"Failed to process scientific observation file: {e}",
                details={"filename": clean_name},
            ) from e

        finally:
            # Guarantee temporary file cleanup if it was not moved
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass
