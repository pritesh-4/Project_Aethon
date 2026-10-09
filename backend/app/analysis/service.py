"""Internal Doppler drift and temporal analysis service."""

import uuid
from datetime import UTC, datetime
from typing import Any

import numpy as np

from app.analysis.config import AnalysisPipelineConfig
from app.analysis.dedrift import apply_linear_dedrift
from app.analysis.drift_estimation import estimate_linear_drift
from app.analysis.drift_search import search_linear_drift_hypotheses
from app.analysis.exceptions import InvalidAnalysisConfigError
from app.analysis.recurrence import compare_observation_events
from app.analysis.schemas import (
    SCIENTIFIC_DOPPLER_DISCLAIMER,
    AnalysisResult,
    RecurrenceComparisonRecord,
)
from app.analysis.temporal import characterize_temporal_behavior
from app.analysis.trajectory import extract_frequency_trajectory
from app.processing.models import QualityMask
from app.representation.axes import FrequencyAxisModel, TimeAxisModel
from app.representation.models import CanonicalSlice


class AnalysisService:
    """Scientific Doppler drift, trajectory, and temporal analysis service.

    Callable directly from Python without HTTP framework dependencies.
    """

    def analyze_array(
        self,
        values: np.ndarray,
        observation_id: str,
        time_axis: TimeAxisModel,
        frequency_axis: FrequencyAxisModel,
        quality_mask: QualityMask | None = None,
        config: AnalysisPipelineConfig | None = None,
        target_region: dict[str, Any] | None = None,
        historical_events: list[dict[str, Any]] | None = None,
    ) -> AnalysisResult:
        """Run complete temporal, trajectory, and linear drift pipeline on an observation region.

        Args:
            values: 2D numpy array [time_index, freq_index].
            observation_id: Identifier of the source observation.
            time_axis: TimeAxisModel providing time resolution.
            frequency_axis: FrequencyAxisModel providing frequency resolution.
            quality_mask: Optional QualityMask aligned with values.
            config: Pipeline configuration.
            target_region: Optional metadata describing region bounds (e.g. from Phase 5 detection).
            historical_events: Optional list of past event records for recurrence comparison.

        Returns:
            AnalysisResult: Structured measurements, uncertainty estimates, and provenance.
        """
        if values.ndim != 2:
            raise InvalidAnalysisConfigError(
                f"Array must be exactly 2D [time, freq], received shape {values.shape}"
            )

        cfg = config or AnalysisPipelineConfig()
        n_t, n_f = values.shape

        if n_t > cfg.max_time_steps or n_f > cfg.max_channels:
            raise InvalidAnalysisConfigError(
                f"Array dimensions [{n_t}, {n_f}] exceed safety limits of "
                f"[{cfg.max_time_steps}, {cfg.max_channels}]"
            )

        analysis_run_id = str(uuid.uuid4())

        # Establish default quality mask if omitted
        if quality_mask is None:
            quality_mask = QualityMask(primary_mask=~np.isfinite(values))

        # 1. Trajectory extraction
        t_offset = int(target_region.get("time_start", 0)) if target_region else 0
        f_offset = int(target_region.get("freq_start", 0)) if target_region else 0

        trajectory = extract_frequency_trajectory(
            values=values,
            quality_mask=quality_mask,
            time_axis=time_axis,
            frequency_axis=frequency_axis,
            config=cfg.trajectory,
            time_offset_index=t_offset,
            frequency_offset_index=f_offset,
        )

        # 2. Linear drift estimation
        drift_estimate = estimate_linear_drift(
            trajectory=trajectory,
            config=cfg.drift_estimation,
        )

        # 3. Optional drift search
        drift_search_result = None
        if cfg.drift_search.enabled:
            drift_search_result = search_linear_drift_hypotheses(
                values=values,
                time_axis=time_axis,
                frequency_axis=frequency_axis,
                quality_mask=quality_mask,
                config=cfg.drift_search,
            )

        # 4. Optional de-drift transformation view
        dedrift_result = None
        if cfg.dedrift.enabled:
            # Use estimated drift rate if available, else best search rate
            rate_to_use = drift_estimate.drift_rate_hz_per_s
            if rate_to_use is None and drift_search_result is not None:
                rate_to_use = drift_search_result.best_drift_rate_hz_per_s

            if rate_to_use is not None:
                _, dedrift_result = apply_linear_dedrift(
                    values=values,
                    drift_rate_hz_per_s=rate_to_use,
                    time_axis=time_axis,
                    frequency_axis=frequency_axis,
                    quality_mask=quality_mask,
                    config=cfg.dedrift,
                )

        # 5. Temporal characterization
        temporal = characterize_temporal_behavior(
            values=values,
            trajectory=trajectory,
            time_axis=time_axis,
            quality_mask=quality_mask,
            config=cfg.temporal,
        )

        # 6. Recurrence comparisons if historical events provided
        recurrence_records: list[RecurrenceComparisonRecord] | None = None
        if historical_events:
            recurrence_records = []
            current_event = {
                "observation_id": observation_id,
                "center_frequency_hz": drift_estimate.reference_frequency_hz,
                "drift_rate_hz_per_s": drift_estimate.drift_rate_hz_per_s,
                "start_mjd": getattr(time_axis, "start_mjd", None),
                "start_time_utc": getattr(time_axis, "start_time_utc", None),
            }
            for hist in historical_events:
                comp = compare_observation_events(
                    event_a=current_event,
                    event_b=hist,
                    config=cfg.recurrence,
                )
                recurrence_records.append(comp)

        provenance: dict[str, Any] = {
            "timestamp_utc": datetime.now(UTC).isoformat(),
            "numpy_version": np.__version__,
            "drift_convention": "df_over_dt_canonical_ascending",
            "time_axis_unit": time_axis.unit,
            "frequency_axis_unit": frequency_axis.unit,
            "search_enabled": cfg.drift_search.enabled,
            "dedrift_enabled": cfg.dedrift.enabled,
        }

        return AnalysisResult(
            observation_id=observation_id,
            analysis_run_id=analysis_run_id,
            target_region=target_region,
            trajectory=trajectory,
            drift_estimate=drift_estimate,
            drift_search=drift_search_result,
            dedrift=dedrift_result,
            temporal=temporal,
            recurrence=recurrence_records,
            pipeline_config=cfg,
            provenance=provenance,
            scientific_disclaimer=SCIENTIFIC_DOPPLER_DISCLAIMER,
        )

    def analyze_canonical_slice(
        self,
        slice_obj: CanonicalSlice,
        quality_mask: QualityMask | None = None,
        config: AnalysisPipelineConfig | None = None,
        historical_events: list[dict[str, Any]] | None = None,
    ) -> AnalysisResult:
        """Analyze a Phase 2 CanonicalSlice object."""
        target_region = {
            "time_start": slice_obj.time_start,
            "time_stop": slice_obj.time_stop,
            "freq_start": slice_obj.frequency_start,
            "freq_stop": slice_obj.frequency_stop,
        }
        return self.analyze_array(
            values=slice_obj.values,
            observation_id=slice_obj.observation_id,
            time_axis=slice_obj.time_axis,
            frequency_axis=slice_obj.frequency_axis,
            quality_mask=quality_mask,
            config=config,
            target_region=target_region,
            historical_events=historical_events,
        )
