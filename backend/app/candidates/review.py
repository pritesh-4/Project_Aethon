"""Candidate review lifecycle management, state transitions, and audit records."""

import uuid
from datetime import UTC, datetime

from app.candidates.exceptions import InvalidCandidateStateTransitionError
from app.candidates.schemas import Candidate, CandidateStatus, ReviewRecord

VALID_TRANSITIONS: dict[CandidateStatus, set[CandidateStatus]] = {
    CandidateStatus.UNREVIEWED: {
        CandidateStatus.UNDER_REVIEW,
        CandidateStatus.LIKELY_INTERFERENCE,
        CandidateStatus.DISMISSED,
    },
    CandidateStatus.UNDER_REVIEW: {
        CandidateStatus.NEEDS_MORE_DATA,
        CandidateStatus.LIKELY_INTERFERENCE,
        CandidateStatus.INTERESTING,
        CandidateStatus.DISMISSED,
    },
    CandidateStatus.NEEDS_MORE_DATA: {
        CandidateStatus.UNDER_REVIEW,
        CandidateStatus.LIKELY_INTERFERENCE,
        CandidateStatus.INTERESTING,
        CandidateStatus.DISMISSED,
    },
    CandidateStatus.LIKELY_INTERFERENCE: {
        CandidateStatus.UNDER_REVIEW,
        CandidateStatus.INTERESTING,
        CandidateStatus.DISMISSED,
    },
    CandidateStatus.INTERESTING: {
        CandidateStatus.UNDER_REVIEW,
        CandidateStatus.LIKELY_INTERFERENCE,
        CandidateStatus.DISMISSED,
    },
    CandidateStatus.DISMISSED: {
        CandidateStatus.UNDER_REVIEW,
    },
}


def validate_and_apply_review(
    candidate: Candidate,
    new_status: CandidateStatus,
    reviewer_id: str,
    notes: str = "",
    action: str = "status_transition",
    evidence_references: list[str] | None = None,
) -> tuple[Candidate, ReviewRecord]:
    """Validate lifecycle state transition and append audit record to candidate history.

    Args:
        candidate: Candidate record to transition.
        new_status: Desired target CandidateStatus.
        reviewer_id: Identifier of human analyst or automated triage agent.
        notes: Mandatory or optional scientific rationale for disposition change.
        action: Review action description.
        evidence_references: Optional IDs of evidence items supporting this decision.

    Returns:
        tuple[Candidate, ReviewRecord]: Updated candidate and persisted review entry.

    Raises:
        InvalidCandidateStateTransitionError: If transition is illegal under lifecycle rules.
    """
    current_status = candidate.status

    if new_status == current_status:
        # Same status permitted only if providing an annotation note
        if not notes.strip():
            raise InvalidCandidateStateTransitionError(
                f"Candidate '{candidate.candidate_id}' is already in status '{current_status}'. "
                f"A non-empty note is required to add an audit record without changing status."
            )
        action_name = "annotation"
    else:
        allowed_targets = VALID_TRANSITIONS.get(current_status, set())
        if new_status not in allowed_targets:
            raise InvalidCandidateStateTransitionError(
                f"Illegal lifecycle transition for candidate '{candidate.candidate_id}' "
                f"from '{current_status}' to '{new_status}'. Allowed transitions: "
                f"{[s.value for s in allowed_targets]}"
            )
        action_name = action

    review = ReviewRecord(
        review_id=f"rev_{uuid.uuid4().hex[:12]}",
        candidate_id=candidate.candidate_id,
        created_at_utc=datetime.now(UTC).isoformat(),
        action=action_name,
        previous_status=current_status,
        new_status=new_status,
        reviewer_id=str(reviewer_id).strip() or "unauthenticated_analyst",
        notes=notes.strip(),
        evidence_references=evidence_references or [],
    )

    candidate.status = new_status
    candidate.review_history.append(review)
    candidate.updated_at_utc = datetime.now(UTC).isoformat()

    return candidate, review
