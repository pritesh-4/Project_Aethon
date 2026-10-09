"""Pydantic schemas for canonical time-frequency spectral slice API responses."""

from pydantic import BaseModel, Field


class SliceIndexRange(BaseModel):
    """Zero-based half-open index bounds [start, stop) for a slice query."""

    time_start: int = Field(
        ...,
        description="Inclusive start index along the time axis",
        examples=[0],
    )
    time_stop: int = Field(
        ...,
        description="Exclusive stop index along the time axis",
        examples=[16],
    )
    frequency_start: int = Field(
        ...,
        description="Inclusive start index along the canonical frequency axis (ascending)",
        examples=[0],
    )
    frequency_stop: int = Field(
        ...,
        description="Exclusive stop index along the canonical frequency axis (ascending)",
        examples=[64],
    )


class DataQualityInfo(BaseModel):
    """Quality metrics and non-finite sample statistics for a spectral slice."""

    total_samples: int = Field(
        ...,
        description="Total number of elements in the 2D matrix (time_samples * frequency_channels)",
        examples=[1024],
    )
    non_finite_sample_count: int = Field(
        ...,
        description="Count of IEEE non-finite samples (NaN or Inf) detected in the slice",
        examples=[0],
    )
    has_non_finite_samples: bool = Field(
        ...,
        description="Boolean flag indicating whether any samples are non-finite",
        examples=[False],
    )
    null_representation: str = Field(
        default="null represents non-finite sample (NaN or Inf)",
        description="Explanation of non-finite sample encoding for JSON compliance",
    )


class SliceProvenance(BaseModel):
    """Data provenance and axis transformation metadata for a spectral slice."""

    source_channel_order: str = Field(
        ...,
        description="Frequency ordering in original source container ('ascending' or 'descending')",
        examples=["descending"],
    )
    frequency_axis_reversed: bool = Field(
        ...,
        description=(
            "True if values were reversed along the frequency axis to enforce "
            "canonical ascending order"
        ),
        examples=[True],
    )
    reader_backend: str = Field(
        ...,
        description="Internal low-level reader backend used to extract the bounded slice",
        examples=["np.memmap.fil"],
    )
    source_sha256: str = Field(
        ...,
        description="Cryptographic SHA-256 checksum of original raw observation file",
    )


class SpectralSliceResponse(BaseModel):
    """Canonical 2D time-frequency spectral slice response conforming to AETHON data contract."""

    observation_id: str = Field(
        ...,
        description="Unique identifier of the source observation",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    )
    source_format: str = Field(
        ...,
        description="Source observation container format ('fil' or 'fits')",
        examples=["fil"],
    )
    matrix_shape: list[int] = Field(
        ...,
        description="Canonical array dimensions [time_steps, frequency_channels]",
        examples=[[16, 64]],
    )
    canonical_axis_convention: str = Field(
        default="values[time_index][frequency_index]",
        description="Authoritative axis ordering: Axis 0 = Time, Axis 1 = Ascending Frequency",
    )
    requested_range: SliceIndexRange = Field(
        ...,
        description="Index bounds requested by caller",
    )
    actual_range: SliceIndexRange = Field(
        ...,
        description="Actual index bounds extracted from observation data",
    )
    values: list[list[float | None]] = Field(
        ...,
        description=(
            "2D numerical matrix ordered as values[time_idx][frequency_idx]. "
            "Non-finite samples (NaN/Inf) are safely encoded as null."
        ),
    )
    frequency_coordinates_hz: list[float] | None = Field(
        default=None,
        description=(
            "Channel center frequencies in Hz ordered ascending corresponding to matrix columns"
        ),
        examples=[[1419250000.0, 1419300000.0]],
    )
    time_coordinates_seconds: list[float] | None = Field(
        default=None,
        description="Relative time coordinates in seconds from observation start for matrix rows",
        examples=[[0.0, 0.5, 1.0]],
    )
    start_time_utc: str | None = Field(
        default=None,
        description="Observation start epoch in UTC ISO-8601 notation",
        examples=["2020-05-31T00:00:00.000"],
    )
    start_mjd: float | None = Field(
        default=None,
        description="Observation start epoch in Modified Julian Date",
        examples=[59000.0],
    )
    frequency_unit: str = Field(
        default="Hz",
        description="Physical unit of returned frequency coordinates",
    )
    time_unit: str = Field(
        default="s",
        description="Physical unit of returned relative time coordinates",
    )
    sample_value_semantics: str = Field(
        default="uncalibrated_detector_power",
        description="Scientific interpretation of numeric matrix elements",
    )
    sample_value_unit: str | None = Field(
        default=None,
        description="Unit of matrix sample values if calibrated, or null if uncalibrated",
    )
    data_quality: DataQualityInfo = Field(
        ...,
        description="Quality flags and non-finite sample counts",
    )
    provenance: SliceProvenance = Field(
        ...,
        description="Provenance and transformation audit trace",
    )
    warnings: list[str] = Field(
        default_factory=list,
        description="Scientific caveats, coordinate limitations, or non-finite notifications",
    )
