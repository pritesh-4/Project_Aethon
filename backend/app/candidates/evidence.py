"""Evidence aggregation and normalization across AETHON scientific modules."""

import uuid
from typing import Any

from app.analysis.schemas import AnalysisResult
from app.candidates.schemas import EvidenceItem, EvidenceType
from app.detection.schemas import AnomalousRegion
from app.processing.models import RfiAssessmentReport


def create_detection_evidence(
    detection: AnomalousRegion,
    observation_id: str,
    analysis_run_id: str | None = None,
) -> list[EvidenceItem]:
    """Convert an anomalous detection window into structured EvidenceItems."""
    items: list[EvidenceItem] = []

    # 1. Statistical baseline evidence
    if detection.baseline_evidence is not None:
        be = detection.baseline_evidence
        items.append(
            EvidenceItem(
                evidence_id=f"ev_det_base_{uuid.uuid4().hex[:8]}",
                evidence_type=EvidenceType.DETECTION,
                source_observation_id=observation_id,
                producing_module="detection",
                run_id=analysis_run_id,
                method_and_version="statistical_baseline_v1",
                scores_or_parameters={
                    "anomaly_score": be.anomaly_score,
                    "threshold_used": be.threshold_used,
                    "is_anomalous": be.is_anomalous,
                    "features": detection.features,
                },
                time_frequency_bounds={
                    "time_start": detection.window.time_start,
                    "time_stop": detection.window.time_stop,
                    "freq_start": detection.window.freq_start,
                    "freq_stop": detection.window.freq_stop,
                },
                is_supportive=be.is_anomalous,
                quality_or_limitations=be.decision_rationale,
            )
        )

    # 2. Isolation Forest evidence
    if detection.isolation_forest_evidence is not None:
        ife = detection.isolation_forest_evidence
        items.append(
            EvidenceItem(
                evidence_id=f"ev_det_if_{uuid.uuid4().hex[:8]}",
                evidence_type=EvidenceType.DETECTION,
                source_observation_id=observation_id,
                producing_module="detection",
                run_id=analysis_run_id,
                method_and_version="isolation_forest_v1",
                scores_or_parameters={
                    "anomaly_score": ife.anomaly_score,
                    "threshold_used": ife.threshold_used,
                    "is_anomalous": ife.is_anomalous,
                },
                time_frequency_bounds={
                    "time_start": detection.window.time_start,
                    "time_stop": detection.window.time_stop,
                    "freq_start": detection.window.freq_start,
                    "freq_stop": detection.window.freq_stop,
                },
                is_supportive=ife.is_anomalous,
                quality_or_limitations=ife.decision_rationale,
            )
        )

    return items


def create_quality_evidence(
    rfi_report: RfiAssessmentReport,
    observation_id: str,
    target_region: dict[str, Any] | None = None,
) -> EvidenceItem:
    """Create data quality and contamination evidence from Phase 4 RFI assessment."""
    is_clean = rfi_report.flagged_fraction < 0.20
    flag_reasons = [ind.reason for ind in rfi_report.indicators]

    return EvidenceItem(
        evidence_id=f"ev_qual_{uuid.uuid4().hex[:8]}",
        evidence_type=EvidenceType.QUALITY,
        source_observation_id=observation_id,
        producing_module="processing",
        run_id=None,
        method_and_version="statistical_quality_v1",
        scores_or_parameters={
            "flagged_fraction": rfi_report.flagged_fraction,
            "total_flagged_cells": rfi_report.total_flagged_cells,
            "flagged_channels_count": len(rfi_report.flagged_channels),
            "flagged_time_samples_count": len(rfi_report.flagged_time_samples),
            "flag_reasons": flag_reasons,
        },
        time_frequency_bounds=target_region,
        is_supportive=is_clean,
        quality_or_limitations=(
            "Clean baseline (<20% flagged)"
            if is_clean
            else f"Contaminated region ({rfi_report.flagged_fraction:.1%} flagged cells)"
        ),
    )


def create_analysis_evidence(
    analysis_res: AnalysisResult,
    observation_id: str,
) -> list[EvidenceItem]:
    """Convert Phase 6 Doppler drift, temporal, and recurrence results into EvidenceItems."""
    items: list[EvidenceItem] = []
    run_id = analysis_res.analysis_run_id

    # 1. Drift estimate evidence
    drift = analysis_res.drift_estimate
    has_physical_fit = drift.is_physical and drift.drift_rate_hz_per_s is not None
    items.append(
        EvidenceItem(
            evidence_id=f"ev_drift_{uuid.uuid4().hex[:8]}",
            evidence_type=EvidenceType.DRIFT,
            source_observation_id=observation_id,
            producing_module="analysis",
            run_id=run_id,
            method_and_version="linear_regression_v1",
            scores_or_parameters={
                "drift_rate_hz_per_s": drift.drift_rate_hz_per_s,
                "drift_rate_index_slope": drift.drift_rate_index_slope,
                "uncertainty_hz_per_s": drift.uncertainty_hz_per_s,
                "r_squared": drift.r_squared,
                "sample_count": drift.sample_count,
                "is_physical": drift.is_physical,
            },
            time_frequency_bounds=analysis_res.target_region,
            is_supportive=has_physical_fit
            and (drift.r_squared is not None and drift.r_squared > 0.8),
            quality_or_limitations=drift.quality_warning or "Valid physical regression fit",
        )
    )

    # 2. Temporal evidence
    temp = analysis_res.temporal
    items.append(
        EvidenceItem(
            evidence_id=f"ev_temp_{uuid.uuid4().hex[:8]}",
            evidence_type=EvidenceType.TEMPORAL,
            source_observation_id=observation_id,
            producing_module="analysis",
            run_id=run_id,
            method_and_version="temporal_characterization_v1",
            scores_or_parameters={
                "observed_duration_s": temp.observed_duration_s,
                "valid_time_fraction": temp.valid_time_fraction,
                "temporal_persistence": temp.temporal_persistence,
                "max_consecutive_gap_s": temp.max_consecutive_gap_s,
                "temporal_variability": temp.temporal_variability,
            },
            time_frequency_bounds=analysis_res.target_region,
            is_supportive=bool(temp.temporal_persistence > 0.5),
            quality_or_limitations=temp.temporal_notes,
        )
    )

    # 3. Recurrence evidence (if multi-observation comparison was run)
    if analysis_res.recurrence:
        for rec in analysis_res.recurrence:
            items.append(
                EvidenceItem(
                    evidence_id=f"ev_rec_{uuid.uuid4().hex[:8]}",
                    evidence_type=EvidenceType.RECURRENCE,
                    source_observation_id=observation_id,
                    producing_module="analysis",
                    run_id=run_id,
                    method_and_version="recurrence_comparison_v1",
                    scores_or_parameters={
                        "observation_b_id": rec.observation_b_id,
                        "is_compatible": rec.is_compatible,
                        "compatibility_score": rec.compatibility_score,
                        "frequency_delta_hz": rec.frequency_delta_hz,
                        "time_delta_days": rec.time_delta_days,
                    },
                    is_supportive=rec.is_compatible,
                    quality_or_limitations=rec.notes,
                )
            )

    return items
