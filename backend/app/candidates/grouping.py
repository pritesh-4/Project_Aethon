"""Deterministic grouping and duplicate detection for candidate records."""

from datetime import UTC, datetime
from typing import Any

from app.candidates.schemas import Candidate, EvidenceItem


def compute_region_iou(
    box_a: tuple[int, int, int, int] | dict[str, Any],
    box_b: tuple[int, int, int, int] | dict[str, Any],
) -> float:
    """Calculate 2D Intersection over Union (IoU) between two time-frequency bounding boxes.

    Box format: (time_start, time_stop, freq_start, freq_stop) or dict with corresponding keys.
    Intervals are half-open [start, stop).
    """
    if isinstance(box_a, dict):
        t_start_a = int(box_a["time_start"])
        t_stop_a = int(box_a["time_stop"])
        f_start_a = int(box_a["freq_start"])
        f_stop_a = int(box_a["freq_stop"])
    else:
        t_start_a, t_stop_a, f_start_a, f_stop_a = box_a

    if isinstance(box_b, dict):
        t_start_b = int(box_b["time_start"])
        t_stop_b = int(box_b["time_stop"])
        f_start_b = int(box_b["freq_start"])
        f_stop_b = int(box_b["freq_stop"])
    else:
        t_start_b, t_stop_b, f_start_b, f_stop_b = box_b

    t_inter_start = max(t_start_a, t_start_b)
    t_inter_stop = min(t_stop_a, t_stop_b)
    f_inter_start = max(f_start_a, f_start_b)
    f_inter_stop = min(f_stop_a, f_stop_b)

    t_overlap = max(0, t_inter_stop - t_inter_start)
    f_overlap = max(0, f_inter_stop - f_inter_start)
    intersection_area = t_overlap * f_overlap

    area_a = max(0, t_stop_a - t_start_a) * max(0, f_stop_a - f_start_a)
    area_b = max(0, t_stop_b - t_start_b) * max(0, f_stop_b - f_start_b)
    union_area = area_a + area_b - intersection_area

    if union_area <= 0:
        return 0.0
    return float(intersection_area / union_area)


def find_matching_candidate(
    observation_id: str,
    target_region: dict[str, Any],
    existing_candidates: list[Candidate],
    iou_threshold: float = 0.20,
    time_proximity_steps: int = 4,
    freq_proximity_channels: int = 4,
) -> tuple[Candidate | None, str]:
    """Find an existing candidate record representing the same underlying signal event.

    Args:
        observation_id: Source observation identifier.
        target_region: Dictionary with time_start, time_stop, freq_start, freq_stop.
        existing_candidates: List of previously created candidate objects.
        iou_threshold: Minimum 2D bounding box IoU to trigger grouping.
        time_proximity_steps: Margin in time steps to consider contiguous tracks.
        freq_proximity_channels: Margin in frequency channels to consider contiguous tracks.

    Returns:
        tuple[Candidate | None, str]: Matching candidate and explanatory rationale.
    """
    t_start = int(target_region["time_start"])
    t_stop = int(target_region["time_stop"])
    f_start = int(target_region["freq_start"])
    f_stop = int(target_region["freq_stop"])
    query_box = (t_start, t_stop, f_start, f_stop)

    best_match: Candidate | None = None
    best_iou: float = 0.0
    match_rationale = ""

    for candidate in existing_candidates:
        # Candidate must originate from same source observation
        if observation_id not in candidate.source_observation_ids:
            continue

        c_reg = candidate.target_region
        c_box = (
            int(c_reg["time_start"]),
            int(c_reg["time_stop"]),
            int(c_reg["freq_start"]),
            int(c_reg["freq_stop"]),
        )

        iou = compute_region_iou(query_box, c_box)
        if iou >= iou_threshold and iou > best_iou:
            best_iou = iou
            best_match = candidate
            match_rationale = (
                f"Grouped into candidate '{candidate.candidate_id}' based on 2D time-frequency "
                f"IoU overlap of {iou:.3f} (>= threshold {iou_threshold})."
            )

        # Also check close spatial proximity if IoU is near threshold
        if best_match is None:
            # Check bounding box distance
            t_dist = max(0, max(t_start - c_box[1], c_box[0] - t_stop))
            f_dist = max(0, max(f_start - c_box[3], c_box[2] - f_stop))
            if t_dist <= time_proximity_steps and f_dist <= freq_proximity_channels:
                best_match = candidate
                match_rationale = (
                    f"Grouped into candidate '{candidate.candidate_id}' based on proximity: "
                    f"delta_t={t_dist} steps (<= {time_proximity_steps}), "
                    f"delta_f={f_dist} channels (<= {freq_proximity_channels})."
                )

    return best_match, match_rationale


def merge_into_candidate(
    candidate: Candidate,
    new_detection_id: str | None,
    new_region: dict[str, Any],
    new_evidence: list[EvidenceItem] | None = None,
    grouping_rationale: str = "",
) -> Candidate:
    """Incorporate a duplicate or contiguous detection into an existing candidate record.

    Mutates and returns the candidate with expanded bounding box, updated timestamps,
    and associated detection references.
    """
    if new_detection_id and new_detection_id not in candidate.associated_detection_ids:
        candidate.associated_detection_ids.append(new_detection_id)

    # Expand bounding box
    cur = candidate.target_region
    expanded_region = {
        "time_start": min(int(cur["time_start"]), int(new_region["time_start"])),
        "time_stop": max(int(cur["time_stop"]), int(new_region["time_stop"])),
        "freq_start": min(int(cur["freq_start"]), int(new_region["freq_start"])),
        "freq_stop": max(int(cur["freq_stop"]), int(new_region["freq_stop"])),
    }
    candidate.target_region = expanded_region

    if new_evidence:
        existing_ev_ids = {e.evidence_id for e in candidate.evidence_items}
        for item in new_evidence:
            if item.evidence_id not in existing_ev_ids:
                candidate.evidence_items.append(item)
                existing_ev_ids.add(item.evidence_id)

    candidate.updated_at_utc = datetime.now(UTC).isoformat()
    if grouping_rationale:
        candidate.provenance["last_grouping_rationale"] = grouping_rationale

    return candidate
