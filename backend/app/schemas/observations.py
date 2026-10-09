"""Canonical observation schemas and scientific metadata representation."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ScientificMetadata(BaseModel):
    """Scientific observation metadata extracted from header and telemetry axes."""

    channel_count: int | None = Field(
        default=None,
        description="Number of discrete frequency channels",
        examples=[1024],
    )
    frequency_reference_mhz: float | None = Field(
        default=None,
        description="Reference frequency in MHz (e.g. center of channel 0 or WCS reference)",
        examples=[1420.0],
    )
    channel_spacing_mhz: float | None = Field(
        default=None,
        description=(
            "Signed frequency channel width/spacing in MHz (negative for descending channels)"
        ),
        examples=[-0.00286102294921875],
    )

    frequency_unit: str = Field(
        default="MHz",
        description="Physical unit of frequency measurements",
        examples=["MHz"],
    )
    frequency_min_mhz: float | None = Field(
        default=None,
        description="Lower frequency boundary (channel edge) in MHz",
        examples=[1418.53],
    )
    frequency_max_mhz: float | None = Field(
        default=None,
        description="Upper frequency boundary (channel edge) in MHz",
        examples=[1421.46],
    )
    bandwidth_mhz: float | None = Field(
        default=None,
        description="Total frequency bandwidth span in MHz",
        examples=[2.93],
    )
    time_sample_count: int | None = Field(
        default=None,
        description="Number of time integrations or subintegrations",
        examples=[16],
    )
    time_step_seconds: float | None = Field(
        default=None,
        description="Sampling time interval (tsamp or tbin) in seconds",
        examples=[1.073741824],
    )
    time_unit: str = Field(
        default="s",
        description="Physical unit of time sampling interval",
        examples=["s"],
    )
    start_mjd: float | None = Field(
        default=None,
        description="Observation start epoch in Modified Julian Date",
        examples=[59000.125],
    )
    start_time_utc: str | None = Field(
        default=None,
        description="Observation start epoch in UTC ISO-8601 string",
        examples=["2020-05-31T03:00:00.000"],
    )
    telescope_name: str | None = Field(
        default=None,
        description="Telescope or observatory facility name",
        examples=["Green Bank Telescope (GBT)"],
    )
    source_name: str | None = Field(
        default=None,
        description="Target astronomical source name",
        examples=["VOYAGER-1"],
    )
    ra_deg: float | None = Field(
        default=None,
        description="Target Right Ascension in decimal degrees [0, 360)",
        examples=[297.6958],
    )
    dec_deg: float | None = Field(
        default=None,
        description="Target Declination in decimal degrees [-90, +90]",
        examples=[8.8683],
    )
    ra_str: str | None = Field(
        default=None,
        description="Target Right Ascension in sexagesimal notation",
        examples=["19h50m47.0s"],
    )
    dec_str: str | None = Field(
        default=None,
        description="Target Declination in sexagesimal notation",
        examples=["+08d52m06.0s"],
    )
    data_dimensions: list[int] | None = Field(
        default=None,
        description="Observed data array dimensions (e.g., [time, pol, freq])",
        examples=[[16, 1, 1024]],
    )
    bits_per_sample: int | None = Field(
        default=None,
        description="Quantization bit depth per sample (e.g. 8, 16, 32)",
        examples=[32],
    )
    polarization_count: int | None = Field(
        default=None,
        description="Number of recorded polarization or IF channels",
        examples=[1],
    )
    raw_header: dict[str, Any] = Field(
        default_factory=dict,
        description="Sanitized format-specific header keywords (JSON-serializable primitives)",
    )


class Provenance(BaseModel):
    """Parser execution metadata and file provenance tracking."""

    parser_name: str = Field(
        ...,
        description="Identifier of parser engine used for ingestion",
        examples=["blimpy.filterbank"],
    )
    parser_version: str = Field(
        ...,
        description="Version string of parser library",
        examples=["2.1.4"],
    )
    parsed_at: str = Field(
        ...,
        description="ISO-8601 UTC timestamp when parsing occurred",
        examples=["2026-10-09T12:00:00Z"],
    )
    source_format: str = Field(
        ...,
        description="Recognized input format extension",
        examples=["fil"],
    )
    layout: str | None = Field(
        default=None,
        description="Specific scientific container layout identified",
        examples=["sigproc_filterbank"],
    )
    notes: str | None = Field(
        default=None,
        description="Provenance execution notes or observations",
    )


class ObservationRecordResponse(BaseModel):
    """Canonical persistent observation record returned by API."""

    id: str = Field(
        ...,
        description="Stable unique observation identifier (UUID4)",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    )
    original_filename: str = Field(
        ...,
        description="Sanitized display filename of uploaded file",
        examples=["voyager_f1024.fil"],
    )
    format: str = Field(
        ...,
        description="Standardized format classification ('fil' or 'fits')",
        examples=["fil"],
    )
    file_size_bytes: int = Field(
        ...,
        description="Validated source file size in bytes",
        examples=[65536],
    )
    sha256: str = Field(
        ...,
        description="SHA-256 cryptographic checksum of original uploaded bytes",
        examples=["e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    )
    ingested_at: datetime = Field(
        ...,
        description="Timezone-aware UTC timestamp when ingestion was persisted",
    )
    status: str = Field(
        default="ingested",
        description="Explicit observation status ('ingested')",
        examples=["ingested"],
    )
    metadata: ScientificMetadata = Field(
        ...,
        description="Extracted scientific astronomical metadata",
    )
    provenance: Provenance = Field(
        ...,
        description="Provenance and parser details",
    )
    warnings: list[str] = Field(
        default_factory=list,
        description="Non-fatal warnings or missing optional metadata notifications",
        examples=[["Sky coordinates (RA/Dec) were not present in header"]],
    )


class ObservationListResponse(BaseModel):
    """Paginated collection of canonical observation records."""

    items: list[ObservationRecordResponse] = Field(
        ...,
        description="Array of persisted observation records",
    )
    total: int = Field(
        ...,
        description="Total number of observations matching query criteria",
        examples=[42],
    )
    limit: int = Field(
        ...,
        description="Maximum number of items per page requested",
        examples=[20],
    )
    offset: int = Field(
        ...,
        description="Zero-indexed pagination offset",
        examples=[0],
    )
