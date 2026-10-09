"""Structured scientific case file (dossier) generation and snapshot assembly."""

import uuid
from datetime import UTC, datetime
from typing import Any

import numpy as np

from app.candidates.exceptions import AssessmentNotFoundError, DossierGenerationError
from app.candidates.schemas import (
    Candidate,
    CandidateAssessment,
    CandidateDossier,
)


def generate_candidate_dossier(
    candidate: Candidate,
    assessment: CandidateAssessment | None = None,
) -> CandidateDossier:
    """Compile a reproducible, immutable scientific case file snapshot for a candidate.

    Args:
        candidate: Candidate record to document.
        assessment: CandidateAssessment version to freeze. If omitted, uses current_assessment.

    Returns:
        CandidateDossier: Structured, machine-readable case file snapshot.

    Raises:
        AssessmentNotFoundError: If no assessment is provided or available on candidate.
        DossierGenerationError: If compilation fails.
    """
    target_assessment = assessment or candidate.current_assessment
    if target_assessment is None:
        raise AssessmentNotFoundError(
            f"Cannot generate dossier for candidate '{candidate.candidate_id}': "
            f"no assessment record is associated."
        )

    try:
        dossier_id = f"dos_{uuid.uuid4().hex[:12]}"
        now_utc = datetime.now(UTC).isoformat()

        # Build executive summary
        status_str = candidate.status.value.replace("_", " ").title()
        score_val = target_assessment.overall_score
        band_str = target_assessment.priority_band.value.upper()

        exec_summary = (
            f"AETHON Scientific Case File for Candidate {candidate.candidate_id}. "
            f"Current Investigation Status: [{status_str}]. "
            f"Assigned Investigation Priority: {score_val:.1f}/100 ({band_str}) "
            f"under {target_assessment.policy_name} v{target_assessment.policy_version}. "
            f"Associated with observation(s): {', '.join(candidate.source_observation_ids)}. "
            f"{target_assessment.explanation}"
        )

        reproducibility: dict[str, Any] = {
            "dossier_schema_version": "1.0.0",
            "candidate_id": candidate.candidate_id,
            "assessment_id": target_assessment.assessment_id,
            "assessment_version": target_assessment.version,
            "generated_at_utc": now_utc,
            "numpy_version": np.__version__,
            "source_observations": candidate.source_observation_ids,
            "evidence_item_count": len(candidate.evidence_items),
            "review_record_count": len(candidate.review_history),
            "policy_configuration": {
                "policy_name": target_assessment.policy_name,
                "policy_version": target_assessment.policy_version,
            },
            "warnings": candidate.warnings + target_assessment.warnings,
        }

        return CandidateDossier(
            dossier_id=dossier_id,
            generated_at_utc=now_utc,
            candidate_id=candidate.candidate_id,
            assessment_version=target_assessment.version,
            candidate=candidate,
            assessment=target_assessment,
            executive_summary=exec_summary,
            reproducibility_appendix=reproducibility,
        )
    except Exception as exc:
        raise DossierGenerationError(
            f"Failed to compile dossier for candidate '{candidate.candidate_id}': {exc}"
        ) from exc
