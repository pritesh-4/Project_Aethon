"""Evaluation framework measuring signal retention, false flags, and interference detection."""

from dataclasses import dataclass

import numpy as np
from pydantic import BaseModel, Field

from app.processing.models import ProcessingResult
from app.synthetic.ground_truth import ObservationGroundTruth


@dataclass
class ContaminationRegion:
    """Ground-truth bounding region of a simulated interference-like artifact."""

    name: str
    artifact_type: str  # "broadband_burst", "persistent_channel", "impulsive_spike"
    time_start: int
    time_stop: int
    freq_start: int
    freq_stop: int
    amplitude: float


class PreprocessingEvaluationMetrics(BaseModel):
    """Quantitative performance report assessing signal preservation and interference flagging."""

    total_cells: int
    contamination_cells_count: int
    target_signal_cells_count: int
    clean_background_cells_count: int

    contamination_flag_rate: float | None = Field(
        default=None,
        description="Fraction of simulated interference cells correctly flagged",
    )
    clean_false_flag_rate: float | None = Field(
        default=None,
        description="Fraction of clean background cells erroneously flagged",
    )
    target_signal_flag_rate: float | None = Field(
        default=None,
        description="Fraction of legitimate target-signal support cells flagged",
    )
    target_signal_retention_rate: float | None = Field(
        default=None,
        description="Fraction of legitimate target-signal support cells retained unmasked",
    )
    raw_array_preserved: bool = Field(
        default=True,
        description="True if original observation was bit-for-bit unchanged",
    )
    notes: str = ""


class SyntheticContaminationInjector:
    """Injects clearly labelled, simulated interference artifacts into a test array."""

    @staticmethod
    def inject_broadband_burst(
        arr: np.ndarray,
        time_idx: int,
        amplitude: float = 20.0,
    ) -> tuple[np.ndarray, ContaminationRegion]:
        """Inject a high-power burst across all frequency channels at a specific time index."""
        contaminated = np.copy(arr)
        contaminated[time_idx, :] += amplitude
        region = ContaminationRegion(
            name="simulated_broadband_burst",
            artifact_type="broadband_burst",
            time_start=time_idx,
            time_stop=time_idx + 1,
            freq_start=0,
            freq_stop=arr.shape[1],
            amplitude=amplitude,
        )
        return contaminated, region

    @staticmethod
    def inject_persistent_channel(
        arr: np.ndarray,
        channel_idx: int,
        amplitude: float = 25.0,
    ) -> tuple[np.ndarray, ContaminationRegion]:
        """Inject persistent carrier power across all time samples in a single channel."""
        contaminated = np.copy(arr)
        contaminated[:, channel_idx] += amplitude
        region = ContaminationRegion(
            name="simulated_persistent_channel",
            artifact_type="persistent_channel",
            time_start=0,
            time_stop=arr.shape[0],
            freq_start=channel_idx,
            freq_stop=channel_idx + 1,
            amplitude=amplitude,
        )
        return contaminated, region

    @staticmethod
    def inject_impulsive_spike(
        arr: np.ndarray,
        time_idx: int,
        channel_idx: int,
        amplitude: float = 30.0,
    ) -> tuple[np.ndarray, ContaminationRegion]:
        """Inject an isolated localized impulse spike at a single (time, freq) cell."""
        contaminated = np.copy(arr)
        contaminated[time_idx, channel_idx] += amplitude
        region = ContaminationRegion(
            name="simulated_impulse_spike",
            artifact_type="impulsive_spike",
            time_start=time_idx,
            time_stop=time_idx + 1,
            freq_start=channel_idx,
            freq_stop=channel_idx + 1,
            amplitude=amplitude,
        )
        return contaminated, region


class PreprocessingEvaluator:
    """Evaluates processing and flagging results against exact ground truth."""

    def evaluate(
        self,
        result: ProcessingResult,
        ground_truth: ObservationGroundTruth | None = None,
        contaminations: list[ContaminationRegion] | None = None,
        original_input_copy: np.ndarray | None = None,
    ) -> PreprocessingEvaluationMetrics:
        """Calculate signal preservation, interference flagging, and false-alarm metrics.

        Ground-truth separation:
            The evaluator has access to ground-truth and contamination regions;
            the processing algorithm itself NEVER received this information.
        """
        n_t, n_f = result.raw_values.shape
        total_cells = n_t * n_f
        primary_mask = result.quality_mask.primary_mask

        # Verify raw array preservation
        raw_preserved = True
        if original_input_copy is not None:
            raw_preserved = bool(np.array_equal(result.raw_values, original_input_copy))

        # 1. Build ground-truth contamination mask
        contam_mask = np.zeros((n_t, n_f), dtype=bool)
        if contaminations:
            for c in contaminations:
                contam_mask[c.time_start : c.time_stop, c.freq_start : c.freq_stop] = True
        contam_cells_count = int(np.count_nonzero(contam_mask))

        # 2. Build ground-truth target signal support mask
        target_mask = np.zeros((n_t, n_f), dtype=bool)
        if ground_truth and ground_truth.signals:
            for sig in ground_truth.signals:
                bb = sig.bounding_box
                # Use bounding box coordinates
                target_mask[bb[0] : bb[1], bb[2] : bb[3]] = True
        target_cells_count = int(np.count_nonzero(target_mask))

        # 3. Clean background mask = not contamination and not target signal
        clean_mask = (~contam_mask) & (~target_mask)
        clean_cells_count = int(np.count_nonzero(clean_mask))

        # 4. Compute metrics
        contam_flag_rate = (
            float(np.count_nonzero(primary_mask & contam_mask) / contam_cells_count)
            if contam_cells_count > 0
            else None
        )

        clean_false_flag_rate = (
            float(np.count_nonzero(primary_mask & clean_mask) / clean_cells_count)
            if clean_cells_count > 0
            else None
        )

        target_flag_rate = (
            float(np.count_nonzero(primary_mask & target_mask) / target_cells_count)
            if target_cells_count > 0
            else None
        )

        # Retention rate: fraction of target cells unmasked in transformed array
        # In default pipeline, raw data retention is 100%. If transformed array exists and has NaNs:
        if result.transformed_values is not None and np.any(np.isnan(result.transformed_values)):
            masked_target = np.isnan(result.transformed_values) & target_mask
            target_retention_rate = (
                float(1.0 - (np.count_nonzero(masked_target) / target_cells_count))
                if target_cells_count > 0
                else None
            )
        else:
            # Fully retained unmasked
            target_retention_rate = 1.0 if target_cells_count > 0 else None

        return PreprocessingEvaluationMetrics(
            total_cells=total_cells,
            contamination_cells_count=contam_cells_count,
            target_signal_cells_count=target_cells_count,
            clean_background_cells_count=clean_cells_count,
            contamination_flag_rate=(
                round(contam_flag_rate, 4) if contam_flag_rate is not None else None
            ),
            clean_false_flag_rate=(
                round(clean_false_flag_rate, 4) if clean_false_flag_rate is not None else None
            ),
            target_signal_flag_rate=(
                round(target_flag_rate, 4) if target_flag_rate is not None else None
            ),
            target_signal_retention_rate=(
                round(target_retention_rate, 4) if target_retention_rate is not None else None
            ),
            raw_array_preserved=raw_preserved,
            notes="Evaluated with strict separation between ground truth and flagger inputs.",
        )
