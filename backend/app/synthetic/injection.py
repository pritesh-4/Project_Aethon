"""Non-destructive signal injection combining synthetic targets with background noise."""

from dataclasses import dataclass

import numpy as np

from app.representation.axes import FrequencyAxisModel, TimeAxisModel
from app.representation.models import CanonicalSlice
from app.synthetic.config import ObservationGeometryConfig, SignalConfig
from app.synthetic.ground_truth import InjectedSignalGroundTruth, ObservationGroundTruth
from app.synthetic.signals import get_signal_generator


@dataclass
class InjectionResult:
    """Output bundle containing the canonical slice, exact ground truth, and isolated components."""

    canonical_slice: CanonicalSlice
    ground_truth: ObservationGroundTruth
    untouched_background: np.ndarray
    isolated_signals: list[tuple[str, np.ndarray]]


def inject_signals(
    background_matrix: np.ndarray,
    background_metadata: dict,
    geometry: ObservationGeometryConfig,
    injections: list[SignalConfig],
    dataset_id: str,
    observation_id: str,
) -> InjectionResult:
    """Inject synthetic signals non-destructively into a background noise matrix.

    Mathematical Model:
        V_combined[t, f] = V_background[t, f] + sum_i S_i[t, f]
        where S_i is zero outside the exact physical support region of signal i.

    SNR Convention:
        SNR_peak = A_peak / sigma_noise, where sigma_noise is the background std_dev.

    Args:
        background_matrix: 2D numpy array of shape (n_time, n_freq).
        background_metadata: Dictionary of noise background parameters and statistics.
        geometry: Observation spatial and temporal geometry.
        injections: List of SignalConfig objects specifying signals to generate and inject.
        dataset_id: Identifier of the parent dataset.
        observation_id: Identifier of this observation.

    Returns:
        InjectionResult containing:
            - canonical_slice: CanonicalSlice adhering to AETHON's canonical contract.
            - ground_truth: ObservationGroundTruth keeping exact labels strictly separate.
            - untouched_background: Pristine background array for empirical verification.
            - isolated_signals: List of (signal_id, 2D array) for each injected component.
    """
    n_t, n_f = background_matrix.shape
    noise_std = float(background_metadata.get("theoretical_std_dev", 1.0))

    # Keep background completely pristine
    untouched_bg = np.copy(background_matrix)
    combined = np.copy(background_matrix)

    isolated_signals: list[tuple[str, np.ndarray]] = []
    ground_truth_records: list[InjectedSignalGroundTruth] = []
    generation_warnings: list[str] = []

    for idx, sig_config in enumerate(injections):
        sig_id = sig_config.signal_id or f"sig_{idx + 1:03d}_{sig_config.family}"

        # Retrieve generator and produce realization
        generator = get_signal_generator(sig_config.family)
        gen_res = generator.generate(geometry, sig_config, noise_std)

        # Additive injection into combined matrix
        combined += gen_res.signal_matrix.astype(combined.dtype)
        isolated_signals.append((sig_id, gen_res.signal_matrix))

        if gen_res.is_clipped:
            generation_warnings.append(
                f"Signal '{sig_id}' was clipped at observation boundaries: "
                f"{gen_res.clipped_samples} samples outside grid."
            )

        # Build separate ground-truth record
        gt_record = InjectedSignalGroundTruth(
            signal_id=sig_id,
            family=sig_config.family,
            time_start_index=gen_res.bounding_box[0],
            time_stop_index=gen_res.bounding_box[1],
            frequency_start_index=gen_res.bounding_box[2],
            frequency_stop_index=gen_res.bounding_box[3],
            bounding_box=gen_res.bounding_box,
            center_frequency_hz=gen_res.details.get("center_frequency_hz", sig_config.f_start_hz),
            frequency_trajectory_hz=gen_res.trajectory_hz,
            drift_rate_hz_per_s=sig_config.drift_rate_hz_per_s,
            bandwidth_hz=sig_config.bandwidth_hz,
            peak_amplitude=gen_res.peak_amplitude,
            effective_snr=gen_res.effective_snr,
            snr_convention="peak_amplitude_over_noise_std_dev",
            is_clipped=gen_res.is_clipped,
            clipped_samples_count=gen_res.clipped_samples,
            support_cells_count=gen_res.support_cells_count,
            notes=f"Synthetic {sig_config.family} injected at SNR={gen_res.effective_snr:.2f}",
            parameters=sig_config.model_dump(),
        )
        ground_truth_records.append(gt_record)

    is_negative = len(injections) == 0

    observation_gt = ObservationGroundTruth(
        dataset_id=dataset_id,
        observation_id=observation_id,
        is_negative_control=is_negative,
        target_count=len(ground_truth_records),
        signals=ground_truth_records,
        background_metadata=background_metadata,
        notes="Negative control (pure background noise)"
        if is_negative
        else "Injected synthetic targets",
    )

    # Construct canonical axis models
    freq_axis = FrequencyAxisModel(
        channel_count=n_f,
        reference_frequency_hz=geometry.f_min_hz,
        channel_spacing_hz=geometry.f_step_hz,
        reference_channel_index=0,
        unit=geometry.unit,
        source_ordering="ascending",
        is_valid=True,
        derivation_notes="Synthetic frequency axis with uniform spacing",
    )

    time_axis = TimeAxisModel(
        sample_count=n_t,
        sampling_interval_seconds=geometry.sampling_interval_s,
        reference_time_seconds=0.0,
        start_mjd=geometry.start_mjd,
        unit="s",
        is_uniform=True,
        is_valid=True,
        derivation_notes="Synthetic time axis with uniform delta_t",
    )

    canonical_slice = CanonicalSlice(
        observation_id=observation_id,
        source_format="synthetic_laboratory",
        values=combined,
        time_axis=time_axis,
        frequency_axis=freq_axis,
        time_start=0,
        time_stop=n_t,
        frequency_start=0,
        frequency_stop=n_f,
        sample_value_semantics="synthetic_detector_power",
        sample_value_unit="relative_power",
        frequency_axis_reversed=False,
        reader_backend="synthetic_laboratory",
        source_sha256="",
        warnings=generation_warnings,
    )

    return InjectionResult(
        canonical_slice=canonical_slice,
        ground_truth=observation_gt,
        untouched_background=untouched_bg,
        isolated_signals=isolated_signals,
    )
