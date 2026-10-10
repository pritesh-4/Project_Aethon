"""Pydantic schemas for Breakthrough Listen public open-data catalogue and import."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.observations import ObservationRecordResponse


class PublicDatasetStatusResponse(BaseModel):
    """Health and configuration status of Breakthrough Listen Open Data archive integration."""

    configured: bool = Field(
        ...,
        description="Whether BREAKTHROUGH_LISTEN_ARCHIVE_URL is configured",
    )
    archive_url: str = Field(
        ...,
        description="Configured upstream archive URL",
    )
    available: bool = Field(
        ...,
        description="Whether upstream archive is currently reachable and responding",
    )
    max_import_bytes: int = Field(
        ...,
        description="Maximum permissible import byte size (default 80 MiB)",
    )
    supported_file_types: list[str] = Field(
        default_factory=lambda: ["filterbank", ".fil", "FITS", ".fits"],
        description="File formats supported for direct ingestion into AETHON",
    )
    message: str | None = Field(
        default=None,
        description="Human-readable status summary or diagnostic message",
    )


class PublicDatasetItem(BaseModel):
    """Normalized astronomical observation entry from Breakthrough Listen catalogue."""

    id: str = Field(..., description="Unique catalogue identifier or index")
    target: str = Field(..., description="Astronomical target name (e.g. VOYAGER1, 3C123)")
    telescope: str = Field(..., description="Observing telescope (e.g. GBT, Parkes, APF)")
    utc: str | None = Field(default=None, description="Observation UTC timestamp string")
    mjd: float | None = Field(default=None, description="Modified Julian Date of observation")
    ra_deg: float | None = Field(default=None, description="Right Ascension in decimal degrees")
    dec_deg: float | None = Field(default=None, description="Declination in decimal degrees")
    center_freq_mhz: float | None = Field(
        default=None,
        description="Observation center frequency in MHz",
    )
    file_type: str = Field(
        ...,
        description="Upstream file format (e.g. filterbank, HDF5, baseband data)",
    )
    size_bytes: int = Field(..., description="Observation file size in bytes")
    quality: str | None = Field(default=None, description="Observational quality grade or status")
    md5sum: str | None = Field(default=None, description="Upstream MD5 checksum if provided")
    url: str = Field(..., description="Public download or data URL")
    is_compatible: bool = Field(
        ...,
        description="True if file format is supported by AETHON's scientific ingestion adapters",
    )
    compatibility_reason: str | None = Field(
        default=None,
        description="Explanation if file format cannot be ingested directly",
    )
    is_within_size_limit: bool = Field(
        ...,
        description="True if file size does not exceed the configured import ceiling",
    )
    size_reason: str | None = Field(
        default=None,
        description="Explanation if file exceeds maximum import byte limit",
    )


class PublicDatasetQueryResponse(BaseModel):
    """Paginated search results from Breakthrough Listen catalogue query."""

    items: list[PublicDatasetItem] = Field(..., description="List of normalized catalogue entries")
    total: int = Field(..., description="Total matching catalogue records found")
    limit: int = Field(..., description="Requested page size limit")
    offset: int = Field(..., description="Requested zero-indexed offset")
    has_more: bool = Field(..., description="True if further pages are available")
    provider_status: str = Field(
        ...,
        description="Status indicator ('ok', 'unavailable', 'empty')",
    )
    cached: bool = Field(
        default=False,
        description="True if response was served from backend cache",
    )
    query_target: str | None = Field(
        default=None,
        description="Astronomical target filter used for the query",
    )


class PublicDatasetImportRequest(BaseModel):
    """Payload to request remote observation import from public archive into AETHON."""

    url: str = Field(..., description="Public observation file URL to download and ingest")
    target: str | None = Field(default=None, description="Optional target identifier for metadata")
    telescope: str | None = Field(default=None, description="Optional telescope identifier")
    expected_md5sum: str | None = Field(
        default=None,
        description="Optional expected upstream MD5 checksum for verification",
    )
    expected_size_bytes: int | None = Field(
        default=None,
        description="Optional expected file size in bytes",
    )


class PublicDatasetImportResponse(BaseModel):
    """Response returned upon successful remote dataset import and local ingestion."""

    observation: ObservationRecordResponse = Field(
        ...,
        description="Created AETHON observation record and scientific metadata",
    )
    import_source_url: str = Field(..., description="Upstream archive URL used for import")
    bytes_downloaded: int = Field(..., description="Total bytes streamed and verified")
    is_duplicate: bool = Field(
        ...,
        description="True if matching observation already existed by SHA-256 (reused)",
    )
    duration_seconds: float = Field(..., description="Time taken to stream and ingest the file")
    message: str = Field(..., description="User-facing summary message")
