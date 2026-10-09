"""Data models for quality masks, robust statistics, RFI evidence, and processing manifests."""

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any, Literal

import numpy as np
from pydantic import BaseModel, Field

from app.representation.axes import FrequencyAxisModel, TimeAxisModel


class FlagReason(StrEnum):
    """Explicit standard reason codes for data flagging."""

    NON_FINITE = "non_finite"
    SUSPICIOUS_CHANNEL = "suspicious_channel"
    SUSPICIOUS_TIME_SAMPLE = "suspicious_time_sample"
    LOCAL_OUTLIER = "local_outlier"
    MANUAL_EXCLUSION = "manual_exclusion"


@dataclass
class QualityMask:
    """Multi-condition quality flag container maintaining primary mask and reason layers.

    Convention:
        True = flagged / excluded from statistical calculations or subsequent processing.
        False = unflagged / nominally valid data.
    """

    primary_mask: np.ndarray  # 2D boolean array (n_time, n_freq)
    reason_masks: dict[str, np.ndarray] = field(default_factory=dict)

    @property
    def total_cells(self) -> int:
        return int(self.primary_mask.size)

    @property
    def flagged_count(self) -> int:
        return int(np.count_nonzero(self.primary_mask))

    @property
    def flagged_fraction(self) -> float:
        if self.total_cells == 0:
            return 0.0
        return float(self.flagged_count / self.total_cells)

    def add_reason_flag(self, reason: str, mask: np.ndarray) -> None:
        """Add or update a specific reason layer and update the unified primary mask."""
        if reason in self.reason_masks:
            self.reason_masks[reason] = np.logical_or(self.reason_masks[reason], mask)
        else:
            self.reason_masks[reason] = np.copy(mask)
        self.primary_mask = np.logical_or(self.primary_mask, mask)


class GlobalStatistics(BaseModel):
    """Robust statistical summary of an observation matrix."""

    total_samples: int
    finite_samples: int
    non_finite_samples: int
    mean: float | None = None
    std_dev: float | None = None
    median: float | None = None
    mad: float | None = None
    robust_sigma: float | None = None
    p25: float | None = None
    p75: float | None = None
    min_value: float | None = None
    max_value: float | None = None
    estimator_notes: str = ""


class IndicatorEvidence(BaseModel):
    """Explainable diagnostic evidence emitted by a statistical flagger."""

    indicator_name: str
    target_type: Literal["channel", "time_sample", "local_cell"]
    threshold_used: float
    affected_indices: list[int] = Field(default_factory=list)
    flagged_cells_count: int
    reason: str
    notes: str = ""
    parameters: dict[str, Any] = Field(default_factory=dict)


class RfiAssessmentReport(BaseModel):
    """Aggregate quality and interference assessment report combining all indicator findings."""

    total_flagged_cells: int
    flagged_fraction: float
    flagged_channels: list[int] = Field(default_factory=list)
    flagged_time_samples: list[int] = Field(default_factory=list)
    indicators: list[IndicatorEvidence] = Field(default_factory=list)
    scientific_disclaimer: str = (
        "Statistical outlier flags indicate unusual dispersion or power relative to the "
        "local baseline; they do not constitute physical or astronomical source classifications."
    )


class TransformationRecord(BaseModel):
    """Traceable ledger entry documenting an applied mathematical transformation."""

    step_index: int
    operation: str
    parameters: dict[str, Any] = Field(default_factory=dict)
    input_shape: list[int]
    output_shape: list[int]
    sample_value_semantics: str
    sample_value_unit: str | None = None
    notes: str = ""


@dataclass
class ProcessingResult:
    """Authoritative output container preserving raw observation, quality flags, and results."""

    observation_id: str
    raw_values: np.ndarray  # Strictly immutable reference to input observation
    quality_mask: QualityMask
    statistics: GlobalStatistics
    estimated_baseline: np.ndarray | None
    transformed_values: np.ndarray | None
    rfi_report: RfiAssessmentReport
    transformation_history: list[TransformationRecord]
    time_axis: TimeAxisModel
    frequency_axis: FrequencyAxisModel
    sample_value_semantics: str = "uncalibrated_detector_power"
    sample_value_unit: str | None = None
    pipeline_version: str = "1.0.0"
    warnings: list[str] = field(default_factory=list)
