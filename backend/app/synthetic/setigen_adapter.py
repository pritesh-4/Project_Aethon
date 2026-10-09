"""Isolated setigen adapter mapping setigen frames to AETHON canonical representations."""

import numpy as np

try:
    import setigen as stg

    SETIGEN_AVAILABLE = True
except ImportError:  # pragma: no cover
    stg = None  # type: ignore[assignment]
    SETIGEN_AVAILABLE = False

from app.representation.axes import FrequencyAxisModel, TimeAxisModel
from app.representation.models import CanonicalSlice
from app.synthetic.config import NoiseBackgroundConfig, ObservationGeometryConfig, SignalConfig
from app.synthetic.exceptions import SyntheticLaboratoryError
from app.synthetic.ground_truth import InjectedSignalGroundTruth, ObservationGroundTruth


class SetigenAdapter:
    """Scientific adapter encapsulating setigen synthetic radio frame generation."""

    def __init__(self) -> None:
        if not SETIGEN_AVAILABLE or stg is None:
            raise SyntheticLaboratoryError(
                "setigen library is not installed or available in current environment",
                code="SETIGEN_NOT_INSTALLED",
            )

    def generate_observation(
        self,
        geometry: ObservationGeometryConfig,
        background: NoiseBackgroundConfig,
        signals: list[SignalConfig],
        dataset_id: str,
        observation_id: str,
    ) -> tuple[CanonicalSlice, ObservationGroundTruth]:
        """Generate a synthetic observation using setigen and map to AETHON's canonical slice.

        Canonical axis mapping:
            setigen.Frame.data has shape (tchans, fchans), matching canonical
            values[time_index][frequency_index].
            Axis 0: Time samples (increasing chronologically)
            Axis 1: Frequency channels (strictly ascending in Hz)
        """
        # Create setigen Frame
        frame = stg.Frame(
            fchans=geometry.n_freq,
            tchans=geometry.n_time,
            df=geometry.f_step_hz,
            dt=geometry.sampling_interval_s,
            fch1=geometry.f_min_hz,
        )

        # Inject noise background
        frame.add_noise(x_mean=background.mean, x_std=background.std_dev)

        gt_records: list[InjectedSignalGroundTruth] = []
        noise_std = background.std_dev

        for idx, sig in enumerate(signals):
            sig_id = sig.signal_id or f"stg_sig_{idx + 1:03d}_{sig.family}"
            amplitude = (
                sig.amplitude if sig.amplitude is not None else ((sig.snr or 10.0) * noise_std)
            )
            effective_snr = amplitude / max(1e-12, noise_std)

            # Define path: linear drift
            drift = sig.drift_rate_hz_per_s
            path = stg.constant_path(f_start=sig.f_start_hz, drift_rate=drift)

            # Frequency profile
            f_width = max(geometry.f_step_hz, sig.bandwidth_hz)
            if sig.shape_profile == "boxcar":
                f_prof = stg.box_f_profile(width=f_width)
            else:
                f_prof = stg.gaussian_f_profile(width=f_width)

            # Time profile
            t_prof = stg.constant_t_profile(level=amplitude)

            # Add to frame
            frame.add_signal(path=path, t_profile=t_prof, f_profile=f_prof)

            # Compute bounding box and trajectory coordinates
            t_start_idx = max(0, int(np.floor(sig.t_start_s / geometry.sampling_interval_s)))
            if sig.duration_s is not None:
                t_stop_idx = min(
                    geometry.n_time,
                    int(np.ceil((sig.t_start_s + sig.duration_s) / geometry.sampling_interval_s)),
                )
            else:
                t_stop_idx = geometry.n_time

            trajectory: list[float] = []
            f_indices: list[int] = []
            t_indices: list[int] = []
            clipped_count = 0

            for t_idx in range(t_start_idx, t_stop_idx):
                elapsed_t = (t_idx - t_start_idx) * geometry.sampling_interval_s
                f_cur = sig.f_start_hz + drift * elapsed_t
                chan = int(np.round((f_cur - geometry.f_min_hz) / geometry.f_step_hz))
                if 0 <= chan < geometry.n_freq:
                    t_indices.append(t_idx)
                    f_indices.append(chan)
                    trajectory.append(round(f_cur, 6))
                else:
                    clipped_count += 1

            min_t = min(t_indices) if t_indices else t_start_idx
            max_t = (max(t_indices) + 1) if t_indices else t_stop_idx
            min_f = min(f_indices) if f_indices else 0
            max_f = (max(f_indices) + 1) if f_indices else geometry.n_freq

            gt_records.append(
                InjectedSignalGroundTruth(
                    signal_id=sig_id,
                    family=sig.family,
                    time_start_index=min_t,
                    time_stop_index=max_t,
                    frequency_start_index=min_f,
                    frequency_stop_index=max_f,
                    bounding_box=(min_t, max_t, min_f, max_f),
                    center_frequency_hz=sig.f_start_hz,
                    frequency_trajectory_hz=trajectory,
                    drift_rate_hz_per_s=drift,
                    bandwidth_hz=f_width,
                    peak_amplitude=amplitude,
                    effective_snr=effective_snr,
                    snr_convention="peak_amplitude_over_noise_std_dev",
                    is_clipped=(clipped_count > 0),
                    clipped_samples_count=clipped_count,
                    support_cells_count=len(t_indices),
                    notes="Generated using setigen adapter",
                    parameters=sig.model_dump(),
                )
            )

        data_array = np.array(frame.data, dtype=np.float32)

        freq_axis = FrequencyAxisModel(
            channel_count=geometry.n_freq,
            reference_frequency_hz=geometry.f_min_hz,
            channel_spacing_hz=geometry.f_step_hz,
            unit=geometry.unit,
            source_ordering="ascending",
            is_valid=True,
            derivation_notes="setigen synthetic frame frequency axis",
        )

        time_axis = TimeAxisModel(
            sample_count=geometry.n_time,
            sampling_interval_seconds=geometry.sampling_interval_s,
            reference_time_seconds=0.0,
            start_mjd=geometry.start_mjd,
            unit="s",
            is_uniform=True,
            is_valid=True,
            derivation_notes="setigen synthetic frame time axis",
        )

        canonical_slice = CanonicalSlice(
            observation_id=observation_id,
            source_format="setigen_synthetic_frame",
            values=data_array,
            time_axis=time_axis,
            frequency_axis=freq_axis,
            time_start=0,
            time_stop=geometry.n_time,
            frequency_start=0,
            frequency_stop=geometry.n_freq,
            sample_value_semantics="synthetic_detector_power",
            sample_value_unit="relative_power",
            reader_backend="setigen_adapter",
        )

        obs_gt = ObservationGroundTruth(
            dataset_id=dataset_id,
            observation_id=observation_id,
            is_negative_control=(len(signals) == 0),
            target_count=len(gt_records),
            signals=gt_records,
            background_metadata={
                "mean": background.mean,
                "std_dev": background.std_dev,
                "library": "setigen",
                "version": getattr(stg, "__version__", "unknown"),
            },
            notes="setigen synthetic observation run",
        )

        return canonical_slice, obs_gt
