"""Conservative RFI and quality assessment indicators emitting explainable evidence."""

import numpy as np

from app.processing.config import ProcessingPipelineConfig
from app.processing.models import (
    FlagReason,
    IndicatorEvidence,
    QualityMask,
    RfiAssessmentReport,
)
from app.processing.rfi.channel_flags import flag_suspicious_channels
from app.processing.rfi.local_flags import flag_local_outliers
from app.processing.rfi.time_flags import flag_suspicious_time_samples


def assess_rfi(
    values: np.ndarray,
    quality_mask: QualityMask,
    config: ProcessingPipelineConfig,
) -> RfiAssessmentReport:
    """Execute all configured quality and RFI indicators and compile an explainable report.

    Rules:
        1. Indicators run in order: Channel -> Time -> Local.
        2. Each indicator produces evidence without modifying the underlying raw values.
        3. Multiple distinct flag reasons are recorded independently in QualityMask.
    """
    indicators: list[IndicatorEvidence] = []
    all_flagged_channels: list[int] = []
    all_flagged_times: list[int] = []

    # 1. Frequency-channel assessment
    if config.channel_flagger.enabled:
        chan_mask, flagged_chans, chan_ev = flag_suspicious_channels(
            values, quality_mask, config.channel_flagger
        )
        if np.any(chan_mask):
            quality_mask.add_reason_flag(FlagReason.SUSPICIOUS_CHANNEL.value, chan_mask)
        indicators.append(chan_ev)
        all_flagged_channels.extend(flagged_chans)

    # 2. Time-sample assessment
    if config.time_flagger.enabled:
        time_mask, flagged_times, time_ev = flag_suspicious_time_samples(
            values, quality_mask, config.time_flagger
        )
        if np.any(time_mask):
            quality_mask.add_reason_flag(FlagReason.SUSPICIOUS_TIME_SAMPLE.value, time_mask)
        indicators.append(time_ev)
        all_flagged_times.extend(flagged_times)

    # 3. Local 2D window outlier assessment
    if config.local_flagger.enabled:
        local_mask, local_ev = flag_local_outliers(values, quality_mask, config.local_flagger)
        if np.any(local_mask):
            quality_mask.add_reason_flag(FlagReason.LOCAL_OUTLIER.value, local_mask)
        indicators.append(local_ev)

    total_flagged = quality_mask.flagged_count
    total_cells = quality_mask.total_cells
    flagged_frac = float(total_flagged / total_cells) if total_cells > 0 else 0.0

    return RfiAssessmentReport(
        total_flagged_cells=total_flagged,
        flagged_fraction=round(flagged_frac, 6),
        flagged_channels=sorted(list(set(all_flagged_channels))),
        flagged_time_samples=sorted(list(set(all_flagged_times))),
        indicators=indicators,
    )
