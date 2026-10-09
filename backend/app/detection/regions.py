"""Deterministic spatial grouping and bounding-box merging for anomalous analysis windows."""

from collections import deque

import numpy as np

from app.detection.schemas import AnomalousRegion, MergedRegion
from app.representation.axes import FrequencyAxisModel, TimeAxisModel


def do_windows_overlap_or_touch(
    w1_bounds: tuple[int, int, int, int],
    w2_bounds: tuple[int, int, int, int],
) -> bool:
    """Check if two (time_start, time_stop, freq_start, freq_stop) boxes overlap or touch."""
    t1_start, t1_stop, f1_start, f1_stop = w1_bounds
    t2_start, t2_stop, f2_start, f2_stop = w2_bounds

    t_overlap = max(t1_start, t2_start) <= min(t1_stop, t2_stop)
    f_overlap = max(f1_start, f2_start) <= min(f1_stop, f2_stop)

    return t_overlap and f_overlap


def merge_anomalous_windows(
    anomalous_regions: list[AnomalousRegion],
    time_axis: TimeAxisModel | None = None,
    frequency_axis: FrequencyAxisModel | None = None,
) -> list[MergedRegion]:
    """Merge contiguous or overlapping anomalous windows into consolidated bounding boxes.

    Uses connected component analysis over the window intersection graph.
    All component window IDs are preserved to maintain complete provenance.

    Args:
        anomalous_regions: List of flagged AnomalousRegion instances.
        time_axis: Optional time axis model for physical coordinate mapping.
        frequency_axis: Optional frequency axis model for physical coordinate mapping.

    Returns:
        list[MergedRegion]: Consolidated bounding regions sorted deterministically.
    """
    if not anomalous_regions:
        return []

    n = len(anomalous_regions)
    # Build adjacency graph
    adj: list[list[int]] = [[] for _ in range(n)]

    boxes = [
        (
            ar.window.time_start,
            ar.window.time_stop,
            ar.window.freq_start,
            ar.window.freq_stop,
        )
        for ar in anomalous_regions
    ]

    for i in range(n):
        for j in range(i + 1, n):
            if do_windows_overlap_or_touch(boxes[i], boxes[j]):
                adj[i].append(j)
                adj[j].append(i)

    visited = [False] * n
    merged_results: list[MergedRegion] = []
    cluster_idx = 0

    for i in range(n):
        if visited[i]:
            continue

        # BFS component discovery
        component: list[int] = []
        queue = deque([i])
        visited[i] = True

        while queue:
            curr = queue.popleft()
            component.append(curr)
            for neighbor in adj[curr]:
                if not visited[neighbor]:
                    visited[neighbor] = True
                    queue.append(neighbor)

        # Compute merged bounds
        member_regions = [anomalous_regions[idx] for idx in component]
        min_t = min(r.window.time_start for r in member_regions)
        max_t = max(r.window.time_stop for r in member_regions)
        min_f = min(r.window.freq_start for r in member_regions)
        max_f = max(r.window.freq_stop for r in member_regions)

        # Compute composite scores
        all_scores: list[float] = []
        for r in member_regions:
            scores_for_r: list[float] = []
            if r.baseline_evidence is not None:
                scores_for_r.append(r.baseline_evidence.anomaly_score)
            if r.isolation_forest_evidence is not None:
                scores_for_r.append(r.isolation_forest_evidence.anomaly_score)
            if scores_for_r:
                all_scores.append(max(scores_for_r))

        peak_score = float(np.max(all_scores)) if all_scores else 0.0
        mean_score = float(np.mean(all_scores)) if all_scores else 0.0

        # Physical coordinates
        t_center_s = None
        if time_axis and time_axis.sampling_interval_seconds is not None:
            dt = time_axis.sampling_interval_seconds
            t_center_s = round((min_t + (max_t - min_t) / 2.0) * dt, 6)

        f_center_hz = None
        bw_hz = None
        if (
            frequency_axis
            and frequency_axis.reference_frequency_hz is not None
            and frequency_axis.channel_spacing_hz is not None
        ):
            f0 = frequency_axis.reference_frequency_hz
            df = abs(frequency_axis.channel_spacing_hz)
            bw_hz = round((max_f - min_f) * df, 3)
            f_center_hz = round(f0 + (min_f + (max_f - min_f) / 2.0) * df, 3)

        contributing_ids = sorted(r.window.window_id for r in member_regions)
        merged = MergedRegion(
            merged_id=f"merged_{cluster_idx}_{min_t}_{min_f}",
            time_start=min_t,
            time_stop=max_t,
            freq_start=min_f,
            freq_stop=max_f,
            time_center_s=t_center_s,
            freq_center_hz=f_center_hz,
            bandwidth_hz=bw_hz,
            contributing_window_ids=contributing_ids,
            max_anomaly_score=round(peak_score, 6),
            mean_anomaly_score=round(mean_score, 6),
        )
        merged_results.append(merged)
        cluster_idx += 1

    # Deterministic ordering by (time_start, freq_start)
    merged_results.sort(key=lambda m: (m.time_start, m.freq_start))
    return merged_results
