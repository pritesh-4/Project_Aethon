"""Scientific benchmark evaluation for Doppler drift estimation against synthetic ground truth."""

from datetime import UTC, datetime

import numpy as np
from pydantic import BaseModel, Field

from app.analysis.config import AnalysisPipelineConfig
from app.analysis.service import AnalysisService
from app.representation.axes import FrequencyAxisModel, TimeAxisModel
from app.synthetic.ground_truth import ObservationGroundTruth


class DriftEvaluationItem(BaseModel):
    """Detailed evaluation result comparing measured drift against exact injection ground truth."""

    signal_id: str
    family: str
    effective_snr: float
    true_drift_rate_hz_per_s: float
    estimated_drift_rate_hz_per_s: float | None
    absolute_drift_error_hz_per_s: float | None
    signed_drift_error_hz_per_s: float | None
    uncertainty_hz_per_s: float | None
    is_recovered: bool
    quality_warning: str | None = None


class DriftBenchmarkReport(BaseModel):
    """Aggregate benchmark report measuring Doppler drift estimation accuracy and uncertainty."""

    benchmark_id: str
    evaluated_at_utc: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    total_evaluated_targets: int
    successfully_fitted_targets: int
    target_recovery_rate: float
    mean_absolute_drift_error_hz_per_s: float
    median_absolute_drift_error_hz_per_s: float
    max_absolute_drift_error_hz_per_s: float
    items: list[DriftEvaluationItem]
    scientific_disclaimer: str = (
        "Synthetic drift benchmark results measure estimation error against controlled "
        "numerical injections under known laboratory noise. They do not represent real-world "
        "observatory discovery limits or physical source orbital dynamics."
    )


class DriftAnalysisEvaluator:
    """Evaluates Doppler drift estimation accuracy against Phase 3 synthetic ground truth."""

    def __init__(self, tolerance_hz_per_s: float = 0.5) -> None:
        self.tolerance_hz_per_s = tolerance_hz_per_s
        self.service = AnalysisService()

    def evaluate_targets(
        self,
        values: np.ndarray,
        ground_truth: ObservationGroundTruth,
        time_axis: TimeAxisModel,
        frequency_axis: FrequencyAxisModel,
        config: AnalysisPipelineConfig | None = None,
        padding_channels: int = 4,
    ) -> DriftBenchmarkReport:
        """Run drift estimation on regions containing synthetic targets and measure errors.

        Args:
            values: 2D numpy array [time_index, freq_index].
            ground_truth: ObservationGroundTruth containing injected target definitions.
            time_axis: TimeAxisModel for time coordinates.
            frequency_axis: FrequencyAxisModel for frequency coordinates.
            config: Optional AnalysisPipelineConfig.
            padding_channels: Extra channel margin around target bounding box.

        Returns:
            DriftBenchmarkReport: Summary statistics and per-target evaluations.
        """
        n_t, n_f = values.shape
        cfg = config or AnalysisPipelineConfig()
        items: list[DriftEvaluationItem] = []
        abs_errors: list[float] = []

        for target in ground_truth.signals:
            t_start, t_stop, f_start, f_stop = target.bounding_box
            # Bound region with optional padding
            t_min = max(0, t_start)
            t_max = min(n_t, t_stop)
            f_min = max(0, f_start - padding_channels)
            f_max = min(n_f, f_stop + padding_channels)

            sub_vals = values[t_min:t_max, f_min:f_max]
            target_region = {
                "time_start": t_min,
                "time_stop": t_max,
                "freq_start": f_min,
                "freq_stop": f_max,
            }

            res = self.service.analyze_array(
                values=sub_vals,
                observation_id=ground_truth.observation_id,
                time_axis=time_axis,
                frequency_axis=frequency_axis,
                config=cfg,
                target_region=target_region,
            )

            fit = res.drift_estimate
            est_rate = fit.drift_rate_hz_per_s
            true_rate = target.drift_rate_hz_per_s

            if est_rate is not None:
                err_signed = float(est_rate - true_rate)
                err_abs = abs(err_signed)
                is_rec = bool(err_abs <= self.tolerance_hz_per_s)
                abs_errors.append(err_abs)
            else:
                err_signed = None
                err_abs = None
                is_rec = False

            item = DriftEvaluationItem(
                signal_id=target.signal_id,
                family=target.family,
                effective_snr=target.effective_snr,
                true_drift_rate_hz_per_s=round(true_rate, 4),
                estimated_drift_rate_hz_per_s=round(est_rate, 4) if est_rate is not None else None,
                absolute_drift_error_hz_per_s=round(err_abs, 4) if err_abs is not None else None,
                signed_drift_error_hz_per_s=round(err_signed, 4)
                if err_signed is not None
                else None,
                uncertainty_hz_per_s=round(fit.uncertainty_hz_per_s, 4)
                if fit.uncertainty_hz_per_s is not None
                else None,
                is_recovered=is_rec,
                quality_warning=fit.quality_warning,
            )
            items.append(item)

        total_targets = len(items)
        rec_count = sum(1 for it in items if it.is_recovered)
        rec_rate = float(rec_count / total_targets) if total_targets > 0 else 0.0

        mean_err = float(np.mean(abs_errors)) if abs_errors else 0.0
        med_err = float(np.median(abs_errors)) if abs_errors else 0.0
        max_err = float(np.max(abs_errors)) if abs_errors else 0.0

        return DriftBenchmarkReport(
            benchmark_id=f"drift_eval_{ground_truth.observation_id}",
            total_evaluated_targets=total_targets,
            successfully_fitted_targets=rec_count,
            target_recovery_rate=round(rec_rate, 4),
            mean_absolute_drift_error_hz_per_s=round(mean_err, 4),
            median_absolute_drift_error_hz_per_s=round(med_err, 4),
            max_absolute_drift_error_hz_per_s=round(max_err, 4),
            items=items,
        )
