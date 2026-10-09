"""Signal processing pipeline orchestrating validation, quality checks, RFI flags, and baseline."""

import numpy as np

from app.processing.baseline import estimate_baseline
from app.processing.config import ProcessingPipelineConfig
from app.processing.models import ProcessingResult
from app.processing.quality import initialize_quality_mask, validate_observation_input
from app.processing.rfi import assess_rfi
from app.processing.statistics import compute_robust_statistics
from app.processing.transformations import apply_transformations
from app.representation.axes import FrequencyAxisModel, TimeAxisModel
from app.representation.models import CanonicalSlice


def run_processing_pipeline(
    values: np.ndarray,
    observation_id: str,
    time_axis: TimeAxisModel,
    frequency_axis: FrequencyAxisModel,
    config: ProcessingPipelineConfig | None = None,
) -> ProcessingResult:
    """Execute the end-to-end scientific preprocessing and RFI quality assessment pipeline.

    Guarantees:
        1. Non-mutating: values input is NEVER modified in-place.
        2. Traceable: every decision, threshold, and transformation is recorded in metadata.
        3. Explainable: quality flags provide specific statistical justification.

    Args:
        values: 2D numpy array conforming to canonical values[time_index][frequency_index].
        observation_id: Unique identifier of the observation.
        time_axis: Associated TimeAxisModel.
        frequency_axis: Associated FrequencyAxisModel.
        config: Processing configuration, or None to use default settings.

    Returns:
        ProcessingResult containing original array, quality mask, RFI report, statistics,
        optional baseline estimate, and optional transformed representation.
    """
    pipeline_cfg = config or ProcessingPipelineConfig()

    # Step 1: Input validation
    validate_observation_input(values)

    # Step 2: Quality mask initialization (flags NaNs and Infs)
    quality_mask = initialize_quality_mask(values)

    # Step 3: Conservative statistical RFI assessment
    rfi_report = assess_rfi(values, quality_mask, pipeline_cfg)

    # Step 4: Robust statistical characterization on unflagged samples
    stats = compute_robust_statistics(values, mask=quality_mask.primary_mask)

    # Step 5: Background and baseline estimation
    baseline_2d, _ = estimate_baseline(values, quality_mask, pipeline_cfg.baseline)

    # Step 6: Optional, reproducible transformations
    transformed, history, semantics, unit = apply_transformations(
        values=values,
        quality_mask=quality_mask,
        config=pipeline_cfg.transformations,
        baseline_2d=baseline_2d,
    )

    warnings: list[str] = []
    if quality_mask.flagged_fraction > 0.5:
        warnings.append(
            f"Over 50% ({quality_mask.flagged_fraction:.1%}) of observation cells were flagged."
        )

    return ProcessingResult(
        observation_id=observation_id,
        raw_values=values,
        quality_mask=quality_mask,
        statistics=stats,
        estimated_baseline=baseline_2d,
        transformed_values=transformed,
        rfi_report=rfi_report,
        transformation_history=history,
        time_axis=time_axis,
        frequency_axis=frequency_axis,
        sample_value_semantics=semantics,
        sample_value_unit=unit,
        pipeline_version=pipeline_cfg.pipeline_version,
        warnings=warnings,
    )


class ProcessingService:
    """High-level service interface for executing processing pipelines on canonical slices."""

    def __init__(self, default_config: ProcessingPipelineConfig | None = None) -> None:
        self.default_config = default_config or ProcessingPipelineConfig()

    def process_slice(
        self,
        canonical_slice: CanonicalSlice,
        config: ProcessingPipelineConfig | None = None,
    ) -> ProcessingResult:
        """Run processing on a CanonicalSlice instance."""
        cfg = config or self.default_config
        return run_processing_pipeline(
            values=canonical_slice.values,
            observation_id=canonical_slice.observation_id,
            time_axis=canonical_slice.time_axis,
            frequency_axis=canonical_slice.frequency_axis,
            config=cfg,
        )
