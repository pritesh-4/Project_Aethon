"""Statistical frequency-channel quality assessment and persistent interference flagging."""

import numpy as np

from app.processing.config import ChannelFlaggerConfig
from app.processing.models import IndicatorEvidence, QualityMask
from app.processing.statistics import (
    compute_channel_statistics,
    compute_robust_statistics,
    compute_robust_z_scores,
)


def flag_suspicious_channels(
    values: np.ndarray,
    quality_mask: QualityMask,
    config: ChannelFlaggerConfig,
) -> tuple[np.ndarray, list[int], IndicatorEvidence]:
    """Identify frequency channels exhibiting statistically persistent anomalous power.

    Algorithm:
        1. Compute robust channel medians across valid, unmasked time samples.
        2. Compute robust modified z-scores across the ensemble of channel medians.
        3. Channels exceeding mad_threshold are flagged as SUSPICIOUS_CHANNEL.
        4. Channels where outlier sample fraction > outlier_fraction_threshold are flagged.

    Returns:
        tuple containing:
            - 2D boolean mask of shape (n_time, n_freq) where True indicates flagged channel.
            - list of 0-based channel indices flagged.
            - IndicatorEvidence documenting thresholds, sample counts, and rationale.
    """
    n_t, n_f = values.shape
    flag_mask_2d = np.zeros((n_t, n_f), dtype=bool)

    if not config.enabled or n_f < 3:
        evidence = IndicatorEvidence(
            indicator_name="channel_flagger",
            target_type="channel",
            threshold_used=config.mad_threshold,
            flagged_cells_count=0,
            reason="Channel flagging skipped or insufficient channel count (<3)",
            parameters=config.model_dump(),
        )
        return flag_mask_2d, [], evidence

    # Step 1: Channel-level robust statistics (excluding already flagged / non-finite samples)
    channel_medians, _channel_mads, _ = compute_channel_statistics(
        values, mask=quality_mask.primary_mask
    )

    valid_channels = np.where(np.isfinite(channel_medians))[0]
    if valid_channels.size < 3:
        evidence = IndicatorEvidence(
            indicator_name="channel_flagger",
            target_type="channel",
            threshold_used=config.mad_threshold,
            flagged_cells_count=0,
            reason="Insufficient valid channels (<3) to establish statistical baseline",
            parameters=config.model_dump(),
        )
        return flag_mask_2d, [], evidence

    # Step 2: Modified z-scores of channel medians
    med_values = channel_medians[valid_channels]
    z_scores = compute_robust_z_scores(med_values)

    flagged_channels_set: set[int] = set()

    for idx, chan_idx in enumerate(valid_channels):
        # Check median elevation
        if z_scores[idx] > config.mad_threshold:
            flagged_channels_set.add(int(chan_idx))

    # Step 3: Outlier fraction within each channel relative to overall observation noise
    global_stats = compute_robust_statistics(values, mask=quality_mask.primary_mask)
    if (
        global_stats.median is not None
        and global_stats.robust_sigma is not None
        and global_stats.robust_sigma > 0
    ):
        obs_median = global_stats.median
        obs_sigma = global_stats.robust_sigma

        for c in range(n_f):
            if c in flagged_channels_set:
                continue
            col = values[:, c]
            valid_t = np.where(np.isfinite(col) & (~quality_mask.primary_mask[:, c]))[0]
            if valid_t.size >= config.min_samples_per_channel:
                outlier_count = np.count_nonzero((col[valid_t] - obs_median) / obs_sigma > 4.0)
                if (outlier_count / valid_t.size) >= config.outlier_fraction_threshold:
                    flagged_channels_set.add(c)

    flagged_channels = sorted(list(flagged_channels_set))

    # Broadcast to 2D mask
    if flagged_channels:
        flag_mask_2d[:, flagged_channels] = True

    flagged_cells = int(np.count_nonzero(flag_mask_2d))

    evidence = IndicatorEvidence(
        indicator_name="channel_flagger",
        target_type="channel",
        threshold_used=config.mad_threshold,
        affected_indices=flagged_channels,
        flagged_cells_count=flagged_cells,
        reason=f"Flagged {len(flagged_channels)} channels exceeding robust threshold",
        notes="Flagged channels excluded from background estimation but preserved in raw data.",
        parameters=config.model_dump(),
    )

    return flag_mask_2d, flagged_channels, evidence
