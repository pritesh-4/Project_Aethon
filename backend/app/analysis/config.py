"""Configuration models and resource bounds for Doppler drift and temporal analysis."""

from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


class TrajectoryExtractionConfig(BaseModel):
    """Configuration for per-time frequency trajectory/ridge identification."""

    method: Literal["max_ridge", "centroid"] = Field(
        default="max_ridge",
        description="Ridge selection method: 'max_ridge' (peak power) or 'centroid'",
    )
    snr_threshold: float = Field(
        default=2.5,
        ge=0.5,
        le=50.0,
        description="Minimum sample robust SNR required to classify sample as valid point",
    )
    min_valid_points: int = Field(
        default=3,
        ge=2,
        le=1024,
        description="Minimum valid time points required to form an analyzed trajectory",
    )


class DriftEstimationConfig(BaseModel):
    """Configuration for linear drift rate regression and uncertainty estimation."""

    method: Literal["ols_linear", "robust_theil_sen"] = Field(
        default="ols_linear",
        description="Regression method: 'ols_linear' (least-squares) or 'robust_theil_sen'",
    )
    min_points: int = Field(
        default=3,
        ge=2,
        description="Minimum valid points required to compute linear regression slope",
    )
    fallback_to_index_slope: bool = Field(
        default=True,
        description="Calculate index-space slope (channels/step) when physical Hz/s is unavailable",
    )


class DriftSearchConfig(BaseModel):
    """Configuration for coherent linear frequency-drift hypothesis testing."""

    enabled: bool = Field(
        default=False,
        description="Whether to run exhaustive grid hypothesis search",
    )
    min_drift_rate_hz_per_s: float = Field(
        default=-10.0,
        ge=-500.0,
        le=500.0,
        description="Minimum drift rate in Hz/s to evaluate in search grid",
    )
    max_drift_rate_hz_per_s: float = Field(
        default=10.0,
        ge=-500.0,
        le=500.0,
        description="Maximum drift rate in Hz/s to evaluate in search grid",
    )
    drift_step_hz_per_s: float = Field(
        default=0.25,
        ge=0.001,
        le=50.0,
        description="Drift rate step increment in Hz/s",
    )
    max_hypotheses: int = Field(
        default=2000,
        ge=10,
        le=10_000,
        description="Safety ceiling on total evaluated drift rate hypotheses",
    )
    reference_time_mode: Literal["start", "center"] = Field(
        default="start",
        description="Reference pivot timestamp: 'start' (t=0) or 'center' (t_mid)",
    )
    metric: Literal["integrated_snr", "coherence_peak"] = Field(
        default="integrated_snr",
        description="Hypothesis scoring objective: integrated spectrum SNR or peak coherence",
    )

    @model_validator(mode="before")
    @classmethod
    def remap_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            mapping = {
                "min_drift_hz_per_sec": "min_drift_rate_hz_per_s",
                "max_drift_hz_per_sec": "max_drift_rate_hz_per_s",
                "step_hz_per_sec": "drift_step_hz_per_s",
            }
            new_data = dict(data)
            for old_k, new_k in mapping.items():
                if old_k in new_data and new_k not in new_data:
                    new_data[new_k] = new_data.pop(old_k)
            return new_data
        return data

    @model_validator(mode="after")
    def validate_bounds(self) -> "DriftSearchConfig":
        if self.min_drift_rate_hz_per_s >= self.max_drift_rate_hz_per_s:
            raise ValueError(
                f"min_drift_rate_hz_per_s ({self.min_drift_rate_hz_per_s}) must be strictly less "
                f"than max_drift_rate_hz_per_s ({self.max_drift_rate_hz_per_s})"
            )
        return self


class DeDriftConfig(BaseModel):
    """Configuration for linear frequency-drift compensation transformation."""

    enabled: bool = Field(
        default=False,
        description="Whether to generate a de-drifted diagnostic array representation",
    )
    reference_time_mode: Literal["start", "center"] = Field(
        default="start",
        description="Reference pivot timestamp for zero shift: 'start' or 'center'",
    )
    fill_value: float = Field(
        default=0.0,
        description="Value used to fill boundary cells revealed by shear transformation",
    )


class TemporalConfig(BaseModel):
    """Configuration for duration, persistence, and temporal profile measurements."""

    persistence_threshold_sigma: float = Field(
        default=2.0,
        ge=0.5,
        le=20.0,
        description="Sample elevation threshold in sigmas to count toward temporal persistence",
    )


class RecurrenceConfig(BaseModel):
    """Configuration for cross-observation event compatibility comparison."""

    max_frequency_separation_hz: float = Field(
        default=50_000.0,
        ge=0.0,
        description="Maximum center frequency difference in Hz for event compatibility",
    )
    max_time_separation_days: float = Field(
        default=365.0,
        ge=0.0,
        description="Maximum observation timestamp difference in days to consider recurrence",
    )
    min_target_match_confidence: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Minimum score threshold required to declare cross-observation compatibility",
    )


class AnalysisPipelineConfig(BaseModel):
    """Unified configuration orchestrating trajectory, drift, dedrift, and temporal analysis."""

    trajectory: TrajectoryExtractionConfig = Field(default_factory=TrajectoryExtractionConfig)
    drift_estimation: DriftEstimationConfig = Field(default_factory=DriftEstimationConfig)
    drift_search: DriftSearchConfig = Field(default_factory=DriftSearchConfig)
    dedrift: DeDriftConfig = Field(default_factory=DeDriftConfig)
    temporal: TemporalConfig = Field(default_factory=TemporalConfig)
    recurrence: RecurrenceConfig = Field(default_factory=RecurrenceConfig)

    max_time_steps: int = Field(
        default=2048,
        ge=2,
        le=16_384,
        description="Maximum permitted time steps in analysis slice",
    )
    max_channels: int = Field(
        default=4096,
        ge=2,
        le=32_768,
        description="Maximum permitted frequency channels in analysis slice",
    )
