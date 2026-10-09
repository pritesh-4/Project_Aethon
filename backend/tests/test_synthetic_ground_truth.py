"""Unit tests for ground-truth schema, serialization round-trips, and data separation."""

import json

from app.synthetic.ground_truth import InjectedSignalGroundTruth, ObservationGroundTruth


def test_injected_signal_ground_truth_serialization_round_trip() -> None:
    """InjectedSignalGroundTruth must serialize to JSON and deserialize with zero fidelity loss."""
    gt = InjectedSignalGroundTruth(
        signal_id="sig_test_001",
        family="drifting_tone",
        time_start_index=0,
        time_stop_index=16,
        frequency_start_index=10,
        frequency_stop_index=26,
        bounding_box=(0, 16, 10, 26),
        center_frequency_hz=1420.0e6,
        frequency_trajectory_hz=[1420.0e6 + i * 1000.0 for i in range(16)],
        drift_rate_hz_per_s=1000.0,
        bandwidth_hz=1000.0,
        peak_amplitude=10.0,
        effective_snr=10.0,
        snr_convention="peak_amplitude_over_noise_std_dev",
        is_clipped=False,
        clipped_samples_count=0,
        support_cells_count=16,
        notes="High-SNR Doppler drift validation signal",
        parameters={"seed": 42},
    )

    json_str = gt.model_dump_json()
    parsed_dict = json.loads(json_str)
    reconstructed = InjectedSignalGroundTruth.model_validate(parsed_dict)

    assert reconstructed.signal_id == gt.signal_id
    assert reconstructed.family == gt.family
    assert reconstructed.bounding_box == gt.bounding_box
    assert reconstructed.frequency_trajectory_hz == gt.frequency_trajectory_hz
    assert reconstructed.effective_snr == gt.effective_snr
    assert reconstructed.drift_rate_hz_per_s == gt.drift_rate_hz_per_s


def test_observation_ground_truth_negative_control_representation() -> None:
    """ObservationGroundTruth must explicitly represent negative controls without target signals."""
    obs_gt = ObservationGroundTruth(
        dataset_id="benchmark_suite_01",
        observation_id="neg_control_01",
        is_negative_control=True,
        target_count=0,
        signals=[],
        background_metadata={"mean": 0.0, "std_dev": 1.0, "type": "gaussian"},
        notes="Noise-only negative control for false positive assessment",
    )

    assert obs_gt.is_negative_control
    assert obs_gt.target_count == 0
    assert len(obs_gt.signals) == 0

    json_str = obs_gt.model_dump_json()
    reconstructed = ObservationGroundTruth.model_validate_json(json_str)
    assert reconstructed.is_negative_control
    assert reconstructed.target_count == 0
