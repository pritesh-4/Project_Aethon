"""Pydantic schemas and evidence containers for Doppler drift and temporal analysis."""

from typing import Any

from pydantic import BaseModel, Field

from app.analysis.config import AnalysisPipelineConfig

SCIENTIFIC_DOPPLER_DISCLAIMER: str = (
    "A measured apparent frequency drift rate describes the observed rate of change of frequency "
    "over time in the topocentric reference frame of the observation. It does not constitute proof "
    "of extraterrestrial intelligence or a complete physical Doppler velocity solution, which "
    "requires observatory barycentric corrections, orbital modeling, and astronomical "
    "reference frames."
)


class TrajectoryPoint(BaseModel):
    """Frequency position and intensity measurement for an individual time step."""

    time_index: int = Field(..., description="0-based discrete time index")
    freq_index: int = Field(..., description="0-based discrete frequency channel index")
    time_s: float | None = Field(default=None, description="Physical relative time in seconds")
    freq_hz: float | None = Field(default=None, description="Physical frequency in Hz")
    amplitude: float = Field(..., description="Sample power/amplitude value")
    snr: float = Field(..., description="Sample signal-to-noise ratio relative to background")
    is_valid: bool = Field(default=True, description="True if unmasked and above SNR threshold")


class FrequencyTrajectory(BaseModel):
    """Extracted time-frequency path of an observed carrier or burst over time."""

    points: list[TrajectoryPoint] = Field(
        default_factory=list, description="Per-time step trajectory points"
    )
    total_points: int = Field(..., description="Total time steps in evaluated region")
    valid_points: int = Field(..., description="Number of finite unmasked points above threshold")
    extraction_method: str = Field(..., description="Method used to isolate trajectory ridge")
    extraction_notes: str = Field(default="", description="Diagnostic details or quality notes")
    time_span_s: float | None = Field(
        default=None, description="Physical duration between first and last valid points"
    )
    frequency_span_hz: float | None = Field(
        default=None, description="Frequency coverage in Hz between minimum and maximum tracks"
    )


class DriftFitResult(BaseModel):
    """Linear trajectory regression fit output and uncertainty estimates."""

    drift_rate_hz_per_s: float | None = Field(
        default=None,
        description="Apparent frequency drift rate in Hz/s; None if physical axis unavailable",
    )
    drift_rate_index_slope: float = Field(
        ...,
        description="Index-space slope in channels/time_step",
    )
    reference_frequency_hz: float | None = Field(
        default=None,
        description="Estimated frequency at reference pivot time t_0 in Hz",
    )
    reference_time_s: float | None = Field(
        default=None,
        description="Reference pivot time in seconds from observation start",
    )
    uncertainty_hz_per_s: float | None = Field(
        default=None,
        description="1-sigma analytical standard error of the fitted slope in Hz/s",
    )
    r_squared: float | None = Field(
        default=None,
        description="Coefficient of determination R^2 of the linear fit",
    )
    residual_std_hz: float | None = Field(
        default=None,
        description="Standard deviation of linear fit residuals in Hz",
    )
    is_physical: bool = Field(
        default=True,
        description="True if physical time/frequency coordinates were available and valid",
    )
    sample_count: int = Field(..., description="Number of valid points used in regression")
    fitted_trajectory_points: list[tuple[float, float]] = Field(
        default_factory=list,
        description="List of (time, fitted_freq) coordinate tuples",
    )
    quality_warning: str | None = Field(
        default=None,
        description="Warning message if fitting had insufficient points or high residuals",
    )
    drift_convention: str = Field(
        default="df_over_dt_canonical_ascending",
        description="Documented drift convention: positive means increasing Hz with time",
    )


class DriftHypothesis(BaseModel):
    """Evaluation score for a single tested drift rate hypothesis."""

    drift_rate_hz_per_s: float = Field(..., description="Tested linear drift rate in Hz/s")
    score: float = Field(..., description="Integrated metric score (e.g. integrated SNR)")
    integrated_snr: float = Field(..., description="Signal-to-noise ratio of integrated spectrum")
    peak_channel_index: int = Field(..., description="Channel index of maximum integrated power")


class DriftSearchResult(BaseModel):
    """Result of linear drift rate hypothesis grid search."""

    hypotheses_evaluated: int = Field(..., description="Number of distinct drift rates evaluated")
    best_drift_rate_hz_per_s: float = Field(
        ..., description="Drift rate achieving peak integrated coherence"
    )
    best_score: float = Field(..., description="Peak score achieved")
    is_on_boundary: bool = Field(
        ..., description="True if optimal rate is on min/max boundary of search grid"
    )
    grid_step_hz_per_s: float = Field(..., description="Step size of evaluated grid in Hz/s")
    search_metric: str = Field(..., description="Objective metric used for ranking hypotheses")
    top_hypotheses: list[DriftHypothesis] = Field(
        default_factory=list, description="Top scoring drift rate hypotheses"
    )
    provenance: dict[str, Any] = Field(default_factory=dict)


class DeDriftResult(BaseModel):
    """Metadata and diagnostics for a linear de-drift transformation."""

    applied_drift_rate_hz_per_s: float = Field(
        ..., description="Drift rate hypothesis used for compensation in Hz/s"
    )
    reference_time_s: float = Field(
        ..., description="Reference pivot time in seconds where shift is zero"
    )
    matrix_shape: list[int] = Field(..., description="Shape of de-drifted array [n_time, n_freq]")
    clipped_energy_fraction: float = Field(
        ..., description="Fraction of signal energy sheared beyond matrix frequency boundaries"
    )
    de_drifted_values: list[list[float]] | None = Field(
        default=None, description="Optional serialized 2D de-drifted values"
    )
    provenance: dict[str, Any] = Field(default_factory=dict)


class TemporalCharacterization(BaseModel):
    """Characterization of signal duration, coverage, persistence, and variability."""

    first_active_time_s: float | None = Field(
        default=None, description="Earliest active time step in seconds"
    )
    last_active_time_s: float | None = Field(
        default=None, description="Latest active time step in seconds"
    )
    observed_duration_s: float | None = Field(
        default=None, description="Total observed duration in seconds"
    )
    valid_time_fraction: float = Field(
        ..., description="Fraction of evaluated time steps with valid signal presence"
    )
    max_consecutive_gap_s: float | None = Field(
        default=None, description="Longest duration of unobserved or dropped signal in seconds"
    )
    temporal_persistence: float = Field(
        ..., description="Fraction of time steps exceeding background threshold"
    )
    temporal_variability: float = Field(
        ..., description="Relative variability of power across time profile"
    )
    temporal_profile_snr: float = Field(
        ..., description="Peak signal-to-noise ratio of time-integrated profile"
    )
    temporal_notes: str = Field(default="", description="Descriptive notes on temporal continuity")


class RecurrenceComparisonRecord(BaseModel):
    """Evaluation of potential cross-observation signal recurrence."""

    observation_a_id: str = Field(..., description="First observation identifier")
    observation_b_id: str = Field(..., description="Second observation identifier")
    is_compatible: bool = Field(
        ..., description="True if observations meet frequency, spatial, and timing tolerances"
    )
    frequency_delta_hz: float | None = Field(
        default=None, description="Difference in center frequencies in Hz"
    )
    time_delta_days: float | None = Field(
        default=None, description="Elapsed time difference in days"
    )
    compatibility_score: float = Field(
        ..., description="Composite match score [0.0, 1.0] across verified metadata"
    )
    criteria_evaluated: dict[str, Any] = Field(
        default_factory=dict, description="Detailed tolerances and match evaluations"
    )
    notes: str = Field(default="", description="Scientific reasoning and caveats")
    warnings: list[str] = Field(default_factory=list)


class AnalysisResult(BaseModel):
    """Complete, traceable temporal and Doppler drift analysis record."""

    observation_id: str = Field(..., description="Source observation identifier")
    analysis_run_id: str = Field(..., description="Unique UUID for this analysis execution run")
    target_region: dict[str, Any] | None = Field(
        default=None, description="Bounds of analyzed region (time/freq indices and coordinates)"
    )
    trajectory: FrequencyTrajectory = Field(..., description="Extracted frequency ridge trajectory")
    drift_estimate: DriftFitResult = Field(
        ..., description="Linear drift regression fit and errors"
    )
    drift_search: DriftSearchResult | None = Field(
        default=None, description="Drift hypothesis search result if configured"
    )
    dedrift: DeDriftResult | None = Field(
        default=None, description="De-drift transformation result if configured"
    )
    temporal: TemporalCharacterization = Field(
        ..., description="Temporal duration, persistence, and gap characterization"
    )
    recurrence: list[RecurrenceComparisonRecord] | None = Field(
        default=None, description="Recurrence comparisons if multi-observation records provided"
    )
    pipeline_config: AnalysisPipelineConfig = Field(
        ..., description="Configuration parameters used during analysis"
    )
    provenance: dict[str, Any] = Field(default_factory=dict)
    scientific_disclaimer: str = Field(
        default=SCIENTIFIC_DOPPLER_DISCLAIMER,
        description="Mandatory scientific interpretation notice",
    )
