"""Configuration schemas and safety limits for signal processing and quality assessment."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.processing.exceptions import InvalidProcessingConfigError

# Resource limits to prevent accidental unbounded memory exhaustion
MAX_PROCESSING_CELLS: int = 16 * 1024 * 1024  # 16M cells = ~64MB float32
MAX_LOCAL_WINDOW_DIM: int = 127


class ChannelFlaggerConfig(BaseModel):
    """Configuration for statistical frequency-channel assessment."""

    enabled: bool = Field(default=True, description="Enable channel-level quality assessment")
    mad_threshold: float = Field(
        default=4.5,
        description="Robust modified z-score threshold across frequency channels",
    )
    outlier_fraction_threshold: float = Field(
        default=0.4,
        description="Fraction of active time samples exceeding threshold to flag entire channel",
    )
    min_samples_per_channel: int = Field(
        default=4,
        description="Minimum number of valid time samples required to assess a channel",
    )

    @field_validator("mad_threshold")
    @classmethod
    def validate_mad_threshold(cls, v: float) -> float:
        if v <= 0.0:
            raise InvalidProcessingConfigError(
                "Channel mad_threshold must be strictly positive", details={"mad_threshold": v}
            )
        return v

    @field_validator("outlier_fraction_threshold")
    @classmethod
    def validate_outlier_fraction(cls, v: float) -> float:
        if not (0.0 < v <= 1.0):
            raise InvalidProcessingConfigError(
                "outlier_fraction_threshold must be in range (0.0, 1.0]",
                details={"outlier_fraction_threshold": v},
            )
        return v


class TimeFlaggerConfig(BaseModel):
    """Configuration for statistical time-sample (integration) assessment."""

    enabled: bool = Field(default=True, description="Enable time-integration quality assessment")
    mad_threshold: float = Field(
        default=4.5,
        description="Robust modified z-score threshold across time sample integrations",
    )
    broadband_fraction_threshold: float = Field(
        default=0.4,
        description="Fraction of channels elevated to flag time sample as broadband event",
    )
    min_channels_per_time: int = Field(
        default=8,
        description="Minimum number of valid channels required to assess a time sample",
    )

    @field_validator("mad_threshold")
    @classmethod
    def validate_mad_threshold(cls, v: float) -> float:
        if v <= 0.0:
            raise InvalidProcessingConfigError(
                "Time mad_threshold must be strictly positive", details={"mad_threshold": v}
            )
        return v

    @field_validator("broadband_fraction_threshold")
    @classmethod
    def validate_broadband_fraction(cls, v: float) -> float:
        if not (0.0 < v <= 1.0):
            raise InvalidProcessingConfigError(
                "broadband_fraction_threshold must be in range (0.0, 1.0]",
                details={"broadband_fraction_threshold": v},
            )
        return v


class LocalFlaggerConfig(BaseModel):
    """Configuration for local moving time-frequency window outlier detection."""

    enabled: bool = Field(default=True, description="Enable localized 2D window assessment")
    window_time: int = Field(
        default=5,
        description="Time dimension window size (must be odd integer >= 3)",
    )
    window_freq: int = Field(
        default=5,
        description="Frequency dimension window size (must be odd integer >= 3)",
    )
    mad_threshold: float = Field(
        default=5.0,
        description="Local robust deviation threshold relative to window median/MAD",
    )

    @field_validator("window_time", "window_freq")
    @classmethod
    def validate_window_dim(cls, v: int) -> int:
        if v < 3 or v % 2 == 0:
            raise InvalidProcessingConfigError(
                "Local window dimensions must be odd integers >= 3", details={"window": v}
            )
        if v > MAX_LOCAL_WINDOW_DIM:
            raise InvalidProcessingConfigError(
                f"Local window dimension exceeds maximum of {MAX_LOCAL_WINDOW_DIM}",
                details={"window": v, "max": MAX_LOCAL_WINDOW_DIM},
            )
        return v

    @field_validator("mad_threshold")
    @classmethod
    def validate_mad_threshold(cls, v: float) -> float:
        if v <= 0.0:
            raise InvalidProcessingConfigError(
                "Local mad_threshold must be strictly positive", details={"mad_threshold": v}
            )
        return v


BaselineMethod = Literal["per_channel_median", "moving_median_2d", "none"]


class BaselineConfig(BaseModel):
    """Configuration for background and baseline estimation."""

    method: BaselineMethod = Field(
        default="per_channel_median",
        description="Background estimation estimator method",
    )
    window_time: int = Field(default=9, description="Window time size for 2D moving median")
    window_freq: int = Field(default=9, description="Window freq size for 2D moving median")
    exclude_flagged: bool = Field(
        default=True,
        description="Exclude flagged samples from baseline estimation calculation",
    )

    @field_validator("window_time", "window_freq")
    @classmethod
    def validate_window(cls, v: int) -> int:
        if v < 3 or v % 2 == 0:
            raise InvalidProcessingConfigError(
                "Baseline window dimensions must be odd integers >= 3", details={"window": v}
            )
        return v


class TransformationConfig(BaseModel):
    """Specification of optional reproducible transformations."""

    subtract_channel_background: bool = Field(
        default=False,
        description="Subtract estimated per-channel baseline from values: V' = V - B_chan",
    )
    robust_standardization: bool = Field(
        default=False,
        description="Robustly standardize values: V' = (V - median) / sigma_MAD",
    )
    apply_mask_in_output: bool = Field(
        default=False,
        description="If True, set flagged samples to NaN in transformed matrix (non-destructive)",
    )


class ProcessingPipelineConfig(BaseModel):
    """Complete configuration specification for an end-to-end processing pipeline execution."""

    channel_flagger: ChannelFlaggerConfig = Field(default_factory=ChannelFlaggerConfig)
    time_flagger: TimeFlaggerConfig = Field(default_factory=TimeFlaggerConfig)
    local_flagger: LocalFlaggerConfig = Field(default_factory=LocalFlaggerConfig)
    baseline: BaselineConfig = Field(default_factory=BaselineConfig)
    transformations: TransformationConfig = Field(default_factory=TransformationConfig)
    pipeline_version: str = Field(default="1.0.0", description="Processing pipeline version")

    @model_validator(mode="after")
    def validate_processing_options(self) -> "ProcessingPipelineConfig":
        return self
