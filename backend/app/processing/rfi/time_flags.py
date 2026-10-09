"""Statistical time-sample quality assessment and broadband transient flagging."""

import numpy as np

from app.processing.config import TimeFlaggerConfig
from app.processing.models import IndicatorEvidence, QualityMask
from app.processing.statistics import (
    compute_robust_statistics,
    compute_robust_z_scores,
    compute_time_statistics,
)


def flag_suspicious_time_samples(
    values: np.ndarray,
    quality_mask: QualityMask,
    config: TimeFlaggerConfig,
) -> tuple[np.ndarray, list[int], IndicatorEvidence]:
    """Identify time samples exhibiting statistically anomalous broadband power bursts.

    Algorithm:
        1. Compute robust time-integration medians across valid, unmasked channels.
        2. Compute robust modified z-scores across the ensemble of time medians.
        3. Time integrations exceeding mad_threshold or broadband_fraction_threshold are flagged.

    Returns:
        tuple containing:
            - 2D boolean mask of shape (n_time, n_freq) where True indicates flagged time sample.
            - list of 0-based time sample indices flagged.
            - IndicatorEvidence documenting thresholds and reasons.
    """
    n_t, n_f = values.shape
    flag_mask_2d = np.zeros((n_t, n_f), dtype=bool)

    if not config.enabled or n_t < 3:
        evidence = IndicatorEvidence(
            indicator_name="time_flagger",
            target_type="time_sample",
            threshold_used=config.mad_threshold,
            flagged_cells_count=0,
            reason="Time flagging skipped or insufficient time sample count (<3)",
            parameters=config.model_dump(),
        )
        return flag_mask_2d, [], evidence

    # Step 1: Time-level robust statistics across unmasked channels
    time_medians, _time_mads, _ = compute_time_statistics(values, mask=quality_mask.primary_mask)

    valid_times = np.where(np.isfinite(time_medians))[0]
    if valid_times.size < 3:
        evidence = IndicatorEvidence(
            indicator_name="time_flagger",
            target_type="time_sample",
            threshold_used=config.mad_threshold,
            flagged_cells_count=0,
            reason="Insufficient valid time samples (<3) to establish baseline",
            parameters=config.model_dump(),
        )
        return flag_mask_2d, [], evidence

    # Step 2: Modified z-scores of time integration medians
    med_values = time_medians[valid_times]
    z_scores = compute_robust_z_scores(med_values)

    flagged_times_set: set[int] = set()

    for idx, t_idx in enumerate(valid_times):
        if z_scores[idx] > config.mad_threshold:
            flagged_times_set.add(int(t_idx))

    # Step 3: Check broadband channel elevation fraction relative to overall observation noise
    global_stats = compute_robust_statistics(values, mask=quality_mask.primary_mask)
    if (
        global_stats.median is not None
        and global_stats.robust_sigma is not None
        and global_stats.robust_sigma > 0
    ):
        obs_median = global_stats.median
        obs_sigma = global_stats.robust_sigma

        for t in range(n_t):
            if t in flagged_times_set:
                continue
            row = values[t, :]
            valid_chans = np.where(np.isfinite(row) & (~quality_mask.primary_mask[t, :]))[0]
            if valid_chans.size >= config.min_channels_per_time:
                elevated_count = np.count_nonzero((row[valid_chans] - obs_median) / obs_sigma > 4.0)
                if (elevated_count / valid_chans.size) >= config.broadband_fraction_threshold:
                    flagged_times_set.add(t)

    flagged_times = sorted(list(flagged_times_set))

    # Broadcast to 2D mask
    if flagged_times:
        flag_mask_2d[flagged_times, :] = True

    flagged_cells = int(np.count_nonzero(flag_mask_2d))

    evidence = IndicatorEvidence(
        indicator_name="time_flagger",
        target_type="time_sample",
        threshold_used=config.mad_threshold,
        affected_indices=flagged_times,
        flagged_cells_count=flagged_cells,
        reason=f"Flagged {len(flagged_times)} time samples exhibiting broadband power spikes",
        notes="Flagged time samples indicate suspicious broadband contamination; raw data intact.",
        parameters=config.model_dump(),
    )

    return flag_mask_2d, flagged_times, evidence
