"""Configuration models and resource limits for anomaly detection pipelines."""

from typing import Literal

from pydantic import BaseModel, Field, model_validator

MAX_TOTAL_WINDOWS: int = 50_000
MAX_FEATURE_ROWS: int = 100_000


class WindowConfig(BaseModel):
    """Configuration governing time-frequency partition window geometry and stride."""

    time_size: int = Field(default=16, ge=2, le=512, description="Window height in time steps")
    freq_size: int = Field(
        default=16, ge=2, le=512, description="Window width in frequency channels"
    )
    time_stride: int = Field(default=8, ge=1, le=512, description="Stride step across time axis")
    freq_stride: int = Field(
        default=8, ge=1, le=512, description="Stride step across frequency axis"
    )
    min_valid_sample_fraction: float = Field(
        default=0.5,
        ge=0.1,
        le=1.0,
        description="Minimum fraction of finite unflagged samples required to analyze window",
    )

    @model_validator(mode="after")
    def validate_strides(self) -> "WindowConfig":
        if self.time_stride > self.time_size:
            raise ValueError(
                f"time_stride ({self.time_stride}) cannot exceed time_size ({self.time_size})"
            )
        if self.freq_stride > self.freq_size:
            raise ValueError(
                f"freq_stride ({self.freq_stride}) cannot exceed freq_size ({self.freq_size})"
            )
        return self


class StatisticalBaselineConfig(BaseModel):
    """Configuration for transparent distribution-free robust anomaly detection."""

    enabled: bool = Field(default=True, description="Enable robust statistical baseline detector")
    mad_threshold: float = Field(
        default=4.0, ge=1.0, le=20.0, description="Modified z-score threshold for anomaly flag"
    )
    reference_mode: Literal["in_situ", "external"] = Field(
        default="in_situ",
        description="Reference distribution: 'in_situ' (observation ensemble) or 'external'",
    )
    aggregation: Literal["max", "robust_mean"] = Field(
        default="robust_mean",
        description="Multi-feature aggregation method for baseline composite score",
    )


class IsolationForestConfig(BaseModel):
    """Configuration for scikit-learn unsupervised Isolation Forest anomaly detector."""

    enabled: bool = Field(default=True, description="Enable Isolation Forest detector")
    n_estimators: int = Field(
        default=100, ge=10, le=500, description="Number of isolation trees in ensemble"
    )
    max_samples: float | int | str = Field(
        default="auto",
        description="Number of samples or fraction to draw from X to train each tree",
    )
    contamination: float = Field(
        default=0.05,
        ge=0.001,
        le=0.5,
        description="Expected proportion of outliers in the data set",
    )
    random_state: int = Field(
        default=42, description="Deterministic seed for reproducible tree building"
    )
    standardize_features: bool = Field(
        default=True, description="Apply robust median/IQR scaling to features before fitting"
    )
    score_percentile_threshold: float | None = Field(
        default=None,
        ge=50.0,
        le=99.9,
        description="Optional empirical percentile threshold (e.g. 95.0) overriding contamination",
    )


class RealRadioAutoencoderConfig(BaseModel):
    """Configuration for learned real-radio autoencoder anomaly detection."""

    enabled: bool = Field(
        default=False,
        description="Enable trained real-radio autoencoder detector (defaults to False; opt-in)",
    )
    checkpoint_path: str | None = Field(
        default=None,
        description="Path to checkpoint; if None, uses default training artifact",
    )

    score_threshold: float | None = Field(
        default=None,
        description="Optional override for calibrated MSE reconstruction error threshold",
    )


class DetectionPipelineConfig(BaseModel):
    """Unified configuration orchestrating windowing, baseline, and Isolation Forest."""

    window: WindowConfig = Field(default_factory=WindowConfig)
    baseline: StatisticalBaselineConfig = Field(default_factory=StatisticalBaselineConfig)
    isolation_forest: IsolationForestConfig = Field(default_factory=IsolationForestConfig)
    real_radio_autoencoder: RealRadioAutoencoderConfig = Field(
        default_factory=RealRadioAutoencoderConfig
    )
    max_windows: int = Field(
        default=20_000,
        ge=1,
        le=MAX_TOTAL_WINDOWS,
        description="Maximum permitted analysis windows before raising safety limit error",
    )
    merge_overlapping_regions: bool = Field(
        default=False,
        description="Whether to merge adjacent/overlapping anomalous windows into bounding boxes",
    )
