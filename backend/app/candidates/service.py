"""Internal coordinator service orchestrating candidates, evidence, scoring, and dossiers."""

import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.analysis.schemas import AnalysisResult
from app.candidates.dossier import generate_candidate_dossier
from app.candidates.eligibility import check_candidate_eligibility
from app.candidates.evidence import (
    create_analysis_evidence,
    create_detection_evidence,
    create_quality_evidence,
)
from app.candidates.exceptions import (
    CandidateNotFoundError,
    IneligibleDetectionError,
)
from app.candidates.grouping import find_matching_candidate, merge_into_candidate
from app.candidates.pdf import generate_candidate_pdf
from app.candidates.repository import CandidateRepository
from app.candidates.review import validate_and_apply_review
from app.candidates.schemas import (
    Candidate,
    CandidateAssessment,
    CandidateDossier,
    CandidateStatus,
    EvidenceItem,
    ReviewRecord,
)
from app.candidates.scoring import CandidateScoringConfig, assess_candidate_evidence
from app.detection.schemas import AnomalousRegion
from app.processing.models import RfiAssessmentReport


class CandidateService:
    """Scientific candidate management service callable directly from Python."""

    def __init__(self, repository: CandidateRepository, dossiers_dir: Path | None = None) -> None:
        self.repository = repository
        self.dossiers_dir = (
            Path(dossiers_dir).resolve()
            if dossiers_dir
            else self.repository.db_path.parent / "dossiers"
        )
        self.dossiers_dir.mkdir(parents=True, exist_ok=True)

    def create_or_group_candidate(
        self,
        observation_id: str,
        target_region: dict[str, Any],
        detection: AnomalousRegion | None = None,
        detection_id: str | None = None,
        analysis_result: AnalysisResult | None = None,
        rfi_report: RfiAssessmentReport | None = None,
        physical_coordinates: dict[str, Any] | None = None,
        scoring_config: CandidateScoringConfig | None = None,
        is_synthetic: bool = False,
    ) -> tuple[Candidate, bool]:
        """Convert a detection into a persistent candidate or group with existing.

        Args:
            observation_id: Source observation UUID.
            target_region: Bounding box indices {time_start, time_stop, freq_start, freq_stop}.
            detection: Optional AnomalousRegion detection record from Phase 5.
            detection_id: Optional detection identifier string.
            analysis_result: Optional Phase 6 AnalysisResult.
            rfi_report: Optional Phase 4 RfiAssessmentReport.
            physical_coordinates: Optional physical center frequency and duration metadata.
            scoring_config: Optional custom CandidateScoringConfig.
            is_synthetic: Whether candidate represents synthetic benchmark injection.

        Returns:
            tuple[Candidate, bool]: (candidate_record, is_newly_created).

        Raises:
            IneligibleDetectionError: If region fails eligibility rules.
        """
        # 1. Eligibility Check
        flagged_frac = rfi_report.flagged_fraction if rfi_report else None
        anom_score = (
            detection.baseline_evidence.anomaly_score
            if detection and detection.baseline_evidence
            else None
        )
        valid_samples = (
            detection.window.valid_sample_count if detection and detection.window else None
        )

        eligibility = check_candidate_eligibility(
            observation_id=observation_id,
            target_region=target_region,
            valid_sample_count=valid_samples,
            flagged_sample_fraction=flagged_frac,
            anomaly_score=anom_score,
        )

        if not eligibility.is_eligible:
            raise IneligibleDetectionError(
                f"Region does not qualify for candidate creation: "
                f"{'; '.join(eligibility.rejection_reasons)}",
                details={"rejection_reasons": eligibility.rejection_reasons},
            )

        # 2. Extract Evidence
        evidence_items: list[EvidenceItem] = []
        if detection:
            evidence_items.extend(
                create_detection_evidence(detection=detection, observation_id=observation_id)
            )
        if rfi_report:
            evidence_items.append(
                create_quality_evidence(
                    rfi_report=rfi_report,
                    observation_id=observation_id,
                    target_region=target_region,
                )
            )
        if analysis_result:
            evidence_items.extend(
                create_analysis_evidence(
                    analysis_res=analysis_result, observation_id=observation_id
                )
            )

        det_id = (
            detection.detection_id if detection else (detection_id or f"det_{uuid.uuid4().hex[:8]}")
        )

        # 3. Duplicate Detection & Grouping
        existing_cands, _ = self.repository.list_candidates(
            observation_id=observation_id, limit=100
        )
        matching_cand, rationale = find_matching_candidate(
            observation_id=observation_id,
            target_region=target_region,
            existing_candidates=existing_cands,
        )

        if matching_cand is not None:
            # Group into existing candidate
            updated_cand = merge_into_candidate(
                candidate=matching_cand,
                new_detection_id=det_id,
                new_region=target_region,
                new_evidence=evidence_items,
                grouping_rationale=rationale,
            )
            # Re-assess with updated evidence
            next_ver = (
                (updated_cand.current_assessment.version + 1)
                if updated_cand.current_assessment
                else 1
            )
            assessment = assess_candidate_evidence(
                candidate_id=updated_cand.candidate_id,
                evidence_items=updated_cand.evidence_items,
                assessment_version=next_ver,
                config=scoring_config,
            )
            updated_cand.current_assessment = assessment
            self.repository.save_assessment(assessment)
            self.repository.save_candidate(updated_cand)
            return updated_cand, False

        # 4. Create New Candidate
        cand_id = f"cand_{uuid.uuid4().hex[:12]}"
        now_utc = datetime.now(UTC).isoformat()

        coords = physical_coordinates or {}
        if detection and detection.window:
            if detection.window.freq_center_hz is not None:
                coords["freq_center_hz"] = detection.window.freq_center_hz
            if detection.window.bandwidth_hz is not None:
                coords["bandwidth_hz"] = detection.window.bandwidth_hz
            if detection.window.time_span_s is not None:
                coords["duration_s"] = detection.window.time_span_s

        new_candidate = Candidate(
            candidate_id=cand_id,
            created_at_utc=now_utc,
            updated_at_utc=now_utc,
            status=CandidateStatus.UNREVIEWED,
            source_observation_ids=[observation_id],
            associated_detection_ids=[det_id],
            processing_run_ids=[],
            analysis_run_ids=[analysis_result.analysis_run_id] if analysis_result else [],
            target_region=target_region,
            physical_coordinates=coords,
            evidence_items=evidence_items,
            review_history=[],
            is_synthetic=is_synthetic,
            warnings=eligibility.warnings,
            provenance={"created_by": "CandidateService", "timestamp": now_utc},
        )

        # Initial assessment
        initial_assessment = assess_candidate_evidence(
            candidate_id=cand_id,
            evidence_items=evidence_items,
            assessment_version=1,
            config=scoring_config,
        )
        new_candidate.current_assessment = initial_assessment

        self.repository.save_candidate(new_candidate)
        self.repository.save_assessment(initial_assessment)
        return new_candidate, True

    def assess_candidate(
        self,
        candidate_id: str,
        scoring_config: CandidateScoringConfig | None = None,
    ) -> CandidateAssessment:
        """Create a new versioned assessment for an existing candidate."""
        candidate = self.get_candidate(candidate_id)
        current_ver = candidate.current_assessment.version if candidate.current_assessment else 0
        next_ver = current_ver + 1

        new_assessment = assess_candidate_evidence(
            candidate_id=candidate.candidate_id,
            evidence_items=candidate.evidence_items,
            assessment_version=next_ver,
            config=scoring_config,
        )

        candidate.current_assessment = new_assessment
        candidate.updated_at_utc = datetime.now(UTC).isoformat()

        self.repository.save_assessment(new_assessment)
        self.repository.save_candidate(candidate)
        return new_assessment

    def review_candidate(
        self,
        candidate_id: str,
        new_status: CandidateStatus,
        reviewer_id: str,
        notes: str = "",
        action: str = "status_transition",
        evidence_references: list[str] | None = None,
    ) -> tuple[Candidate, ReviewRecord]:
        """Perform a validated review transition and record audit entry."""
        candidate = self.get_candidate(candidate_id)
        updated_cand, review = validate_and_apply_review(
            candidate=candidate,
            new_status=new_status,
            reviewer_id=reviewer_id,
            notes=notes,
            action=action,
            evidence_references=evidence_references,
        )
        self.repository.save_candidate(updated_cand)
        return updated_cand, review

    def get_candidate(self, candidate_id: str) -> Candidate:
        """Retrieve candidate by ID or raise CandidateNotFoundError."""
        cand = self.repository.get_candidate(candidate_id)
        if cand is None:
            raise CandidateNotFoundError(f"Candidate with ID '{candidate_id}' not found.")
        return cand

    def list_candidates(
        self,
        observation_id: str | None = None,
        status: CandidateStatus | None = None,
        min_score: float | None = None,
        max_score: float | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Candidate], int]:
        """List persisted candidates with optional filters and pagination."""
        return self.repository.list_candidates(
            observation_id=observation_id,
            status=status,
            min_score=min_score,
            max_score=max_score,
            limit=limit,
            offset=offset,
        )

    def generate_dossier(
        self,
        candidate_id: str,
        assessment_version: int | None = None,
    ) -> CandidateDossier:
        """Compile a frozen structured case file snapshot."""
        candidate = self.get_candidate(candidate_id)
        assessment = None
        if assessment_version is not None:
            assessment = self.repository.get_assessment(candidate_id, version=assessment_version)

        return generate_candidate_dossier(candidate=candidate, assessment=assessment)

    def export_dossier_pdf(
        self,
        candidate_id: str,
        assessment_version: int | None = None,
    ) -> Path:
        """Generate and save publication-grade PDF dossier, returning file path."""
        dossier = self.generate_dossier(candidate_id, assessment_version=assessment_version)
        safe_filename = f"{candidate_id}_assessment_v{dossier.assessment_version}.pdf"
        out_path = self.dossiers_dir / safe_filename
        return generate_candidate_pdf(dossier=dossier, output_path=out_path)
