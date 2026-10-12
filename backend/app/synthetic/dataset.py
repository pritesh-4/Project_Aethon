"""Packaging, persistence, checksum verification, and loading of synthetic benchmark datasets."""

import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
from pydantic import BaseModel, Field

from app.synthetic.backgrounds import generate_noise_background
from app.synthetic.config import (
    NoiseBackgroundConfig,
    ObservationGeometryConfig,
    SignalConfig,
    SyntheticDatasetConfig,
)
from app.synthetic.exceptions import BenchmarkSerializationError
from app.synthetic.ground_truth import ObservationGroundTruth
from app.synthetic.injection import inject_signals


class ObservationManifestItem(BaseModel):
    """Manifest record for an individual synthetic observation within a benchmark dataset."""

    observation_id: str
    is_negative_control: bool
    file_name: str
    sha256: str
    shape: list[int]
    ground_truth: ObservationGroundTruth


class BenchmarkManifest(BaseModel):
    """Provenance and ground-truth manifest for a complete synthetic benchmark dataset."""

    dataset_id: str
    version: str = "1.0.0"
    created_at_utc: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    seed: int
    generator_name: str = "AETHON Synthetic Laboratory"
    generator_version: str = "1.0.0"
    is_synthetic: bool = True
    data_origin: str = "synthetic_laboratory"
    total_observations: int
    positive_observations_count: int
    negative_control_count: int
    total_injected_targets: int
    observations: list[ObservationManifestItem]
    scientific_disclaimer: str = (
        "This dataset contains purely synthetic signals generated for detector calibration. "
        "It must not be presented as genuine astronomical observation data."
    )


def compute_array_sha256(array: np.ndarray) -> str:
    """Compute a deterministic SHA-256 hash of a numpy array buffer."""
    hasher = hashlib.sha256()
    hasher.update(array.tobytes())
    return hasher.hexdigest()


class BenchmarkDatasetGenerator:
    """Generates standard benchmark suites containing negative controls and known signal targets."""

    def __init__(self, base_seed: int = 42) -> None:
        self.base_seed = base_seed

    def create_standard_suite_configs(
        self, dataset_id: str = "aethon_standard_benchmark"
    ) -> list[SyntheticDatasetConfig]:
        """Produce standard benchmark configurations covering negative controls and morphologies."""
        geom = ObservationGeometryConfig(
            n_time=32,
            n_freq=128,
            sampling_interval_s=1.0,
            f_min_hz=1420.0e6,
            f_step_hz=1000.0,
        )
        bg = NoiseBackgroundConfig(background_type="gaussian", mean=0.0, std_dev=1.0)

        configs: list[SyntheticDatasetConfig] = [
            # 1. Negative control 1 (Pure Gaussian noise)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_001_neg_control_a",
                seed=self.base_seed + 1,
                geometry=geom,
                background=bg,
                injections=[],
                description="Negative control A: Uncontaminated Gaussian noise",
            ),
            # 2. Negative control 2 (Time-varying noise baseline)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_002_neg_control_b",
                seed=self.base_seed + 2,
                geometry=geom,
                background=NoiseBackgroundConfig(
                    background_type="time_varying_noise",
                    std_dev=1.0,
                    time_variation_amplitude=0.3,
                ),
                injections=[],
                description="Negative control B: Time-varying noise without target signals",
            ),
            # 3. Narrowband stationary tone (Moderate SNR)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_003_stationary_tone_snr12",
                seed=self.base_seed + 3,
                geometry=geom,
                background=bg,
                injections=[
                    SignalConfig(
                        signal_id="sig_stat_01",
                        family="stationary_tone",
                        f_start_hz=1420.0e6 + 40 * 1000.0,
                        snr=12.0,
                        t_start_s=4.0,
                        duration_s=24.0,
                    )
                ],
                description="Single narrowband stationary tone at channel 40",
            ),
            # 4. Drifting tone (Positive drift rate)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_004_drifting_positive",
                seed=self.base_seed + 4,
                geometry=geom,
                background=bg,
                injections=[
                    SignalConfig(
                        signal_id="sig_drift_pos_01",
                        family="drifting_tone",
                        f_start_hz=1420.0e6 + 20 * 1000.0,
                        drift_rate_hz_per_s=1500.0,  # 1.5 channels per second
                        snr=15.0,
                        t_start_s=2.0,
                        duration_s=20.0,
                    )
                ],
                description="Narrowband tone with positive Doppler drift (+1500 Hz/s)",
            ),
            # 5. Drifting tone (Negative drift rate)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_005_drifting_negative",
                seed=self.base_seed + 5,
                geometry=geom,
                background=bg,
                injections=[
                    SignalConfig(
                        signal_id="sig_drift_neg_01",
                        family="drifting_tone",
                        f_start_hz=1420.0e6 + 100 * 1000.0,
                        drift_rate_hz_per_s=-2000.0,  # -2.0 channels per second
                        snr=14.0,
                        t_start_s=0.0,
                        duration_s=25.0,
                    )
                ],
                description="Narrowband tone with negative Doppler drift (-2000 Hz/s)",
            ),
            # 6. Finite-duration burst
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_006_burst_short",
                seed=self.base_seed + 6,
                geometry=geom,
                background=bg,
                injections=[
                    SignalConfig(
                        signal_id="sig_burst_01",
                        family="burst",
                        f_start_hz=1420.0e6 + 70 * 1000.0,
                        snr=18.0,
                        t_start_s=10.0,
                        duration_s=6.0,
                        bandwidth_hz=4000.0,  # 4 channels wide
                    )
                ],
                description="Localized short burst of 6 seconds duration and 4 kHz bandwidth",
            ),
            # 7. Broadband emission
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_007_broadband",
                seed=self.base_seed + 7,
                geometry=geom,
                background=bg,
                injections=[
                    SignalConfig(
                        signal_id="sig_broadband_01",
                        family="broadband_emission",
                        f_start_hz=1420.0e6 + 85 * 1000.0,
                        bandwidth_hz=15000.0,  # 15 channels wide
                        snr=10.0,
                        t_start_s=5.0,
                        duration_s=20.0,
                    )
                ],
                description="Broadband contiguous emission spanning 15 kHz",
            ),
            # 8. Multiple simultaneous signals (stationary + drifting + burst)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_008_multi_target",
                seed=self.base_seed + 8,
                geometry=geom,
                background=bg,
                injections=[
                    SignalConfig(
                        signal_id="sig_multi_01",
                        family="stationary_tone",
                        f_start_hz=1420.0e6 + 15 * 1000.0,
                        snr=12.0,
                    ),
                    SignalConfig(
                        signal_id="sig_multi_02",
                        family="drifting_tone",
                        f_start_hz=1420.0e6 + 50 * 1000.0,
                        drift_rate_hz_per_s=1200.0,
                        snr=16.0,
                    ),
                ],
                description="Multiple simultaneous signals in one observation",
            ),
            # 9. Edge boundary placement (boundary verification)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_009_edge_boundary",
                seed=self.base_seed + 9,
                geometry=geom,
                background=bg,
                injections=[
                    SignalConfig(
                        signal_id="sig_edge_01",
                        family="stationary_tone",
                        f_start_hz=1420.0e6,  # Channel 0 (lower edge)
                        snr=15.0,
                    ),
                    SignalConfig(
                        signal_id="sig_edge_02",
                        family="stationary_tone",
                        f_start_hz=1420.0e6 + 127 * 1000.0,  # Channel 127 (upper edge)
                        snr=15.0,
                    ),
                ],
                description="Signals positioned precisely at channel 0 and channel N-1 edges",
            ),
        ]
        return configs

    def create_comprehensive_suite_configs(
        self, dataset_id: str = "aethon_comprehensive_benchmark"
    ) -> list[SyntheticDatasetConfig]:
        """Produce expanded benchmark configs (10 negative controls, 15 positive observations)."""
        geom = ObservationGeometryConfig(
            n_time=32,
            n_freq=128,
            sampling_interval_s=1.0,
            f_min_hz=1420.0e6,
            f_step_hz=1000.0,
        )
        bg_gauss = NoiseBackgroundConfig(background_type="gaussian", mean=0.0, std_dev=1.0)

        configs: list[SyntheticDatasetConfig] = [
            # 1-10: 10 Independent Negative Controls
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_001_neg_gaussian_std1",
                seed=self.base_seed + 1,
                geometry=geom,
                background=bg_gauss,
                injections=[],
                description="Negative control 1: Standard stationary Gaussian noise (sigma=1.0)",
            ),
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_002_neg_gaussian_std2",
                seed=self.base_seed + 2,
                geometry=geom,
                background=NoiseBackgroundConfig(background_type="gaussian", mean=0.0, std_dev=2.0),
                injections=[],
                description="Negative control 2: Elevated-dispersion Gaussian noise (sigma=2.0)",
            ),
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_003_neg_time_varying_low",
                seed=self.base_seed + 3,
                geometry=geom,
                background=NoiseBackgroundConfig(
                    background_type="time_varying_noise",
                    std_dev=1.0,
                    time_variation_amplitude=0.20,
                ),
                injections=[],
                description="Negative control 3: Low-amplitude time-modulated noise (A=0.20)",
            ),
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_004_neg_time_varying_med",
                seed=self.base_seed + 4,
                geometry=geom,
                background=NoiseBackgroundConfig(
                    background_type="time_varying_noise",
                    std_dev=1.0,
                    time_variation_amplitude=0.35,
                ),
                injections=[],
                description="Negative control 4: Moderate-amplitude time-modulated noise (A=0.35)",
            ),
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_005_neg_flat_baseline_dc",
                seed=self.base_seed + 5,
                geometry=geom,
                background=NoiseBackgroundConfig(
                    background_type="flat_baseline",
                    std_dev=1.0,
                    baseline_offset=5.0,
                ),
                injections=[],
                description="Negative control 5: Flat baseline with DC offset (+5.0)",
            ),
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_006_neg_flat_baseline_slope",
                seed=self.base_seed + 6,
                geometry=geom,
                background=NoiseBackgroundConfig(
                    background_type="flat_baseline",
                    std_dev=1.0,
                    baseline_slope=2.0,
                ),
                injections=[],
                description="Negative control 6: Flat baseline with spectral gradient slope (+2.0)",
            ),
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_007_neg_time_varying_fast",
                seed=self.base_seed + 7,
                geometry=geom,
                background=NoiseBackgroundConfig(
                    background_type="time_varying_noise",
                    std_dev=1.0,
                    time_variation_amplitude=0.25,
                    time_variation_period_s=12.0,
                ),
                injections=[],
                description="Negative control 7: Rapid time-varying noise (T=12s)",
            ),
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_008_neg_gaussian_mean10",
                seed=self.base_seed + 8,
                geometry=geom,
                background=NoiseBackgroundConfig(
                    background_type="gaussian", mean=10.0, std_dev=1.0
                ),
                injections=[],
                description="Negative control 8: Positive-mean Gaussian noise (mean=10.0)",
            ),
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_009_neg_flat_baseline_dc_slope",
                seed=self.base_seed + 9,
                geometry=geom,
                background=NoiseBackgroundConfig(
                    background_type="flat_baseline",
                    std_dev=1.0,
                    baseline_offset=3.0,
                    baseline_slope=-1.5,
                ),
                injections=[],
                description="Negative control 9: Combined DC offset and negative spectral slope",
            ),
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_010_neg_gaussian_independent",
                seed=self.base_seed + 10,
                geometry=geom,
                background=bg_gauss,
                injections=[],
                description="Negative control 10: Independent realization of pure Gaussian noise",
            ),
            # 11-25: 15 Diverse Positive Injected Observations
            # 11: Weak stationary tone (SNR < 5)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_011_stat_tone_weak_snr4",
                seed=self.base_seed + 11,
                geometry=geom,
                background=bg_gauss,
                injections=[
                    SignalConfig(
                        signal_id="sig_stat_weak",
                        family="stationary_tone",
                        f_start_hz=1420.0e6 + 30 * 1000.0,
                        snr=4.2,
                        t_start_s=2.0,
                        duration_s=26.0,
                    )
                ],
                description="Weak stationary tone (SNR 4.2, low-SNR band <5)",
            ),
            # 12: Moderate stationary tone (SNR 5-10)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_012_stat_tone_med_snr8",
                seed=self.base_seed + 12,
                geometry=geom,
                background=bg_gauss,
                injections=[
                    SignalConfig(
                        signal_id="sig_stat_med",
                        family="stationary_tone",
                        f_start_hz=1420.0e6 + 45 * 1000.0,
                        snr=8.0,
                        t_start_s=4.0,
                        duration_s=24.0,
                    )
                ],
                description="Moderate stationary tone (SNR 8.0, medium-SNR band 5-10)",
            ),
            # 13: Strong stationary tone (SNR > 10)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_013_stat_tone_strong_snr16",
                seed=self.base_seed + 13,
                geometry=geom,
                background=bg_gauss,
                injections=[
                    SignalConfig(
                        signal_id="sig_stat_strong",
                        family="stationary_tone",
                        f_start_hz=1420.0e6 + 60 * 1000.0,
                        snr=16.0,
                        t_start_s=0.0,
                        duration_s=30.0,
                    )
                ],
                description="Strong stationary tone (SNR 16.0, high-SNR band >10)",
            ),
            # 14: Weak positive drift (SNR < 5)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_014_drift_pos_weak_snr45",
                seed=self.base_seed + 14,
                geometry=geom,
                background=bg_gauss,
                injections=[
                    SignalConfig(
                        signal_id="sig_drift_pos_weak",
                        family="drifting_tone",
                        f_start_hz=1420.0e6 + 25 * 1000.0,
                        drift_rate_hz_per_s=600.0,
                        snr=4.5,
                        t_start_s=2.0,
                        duration_s=24.0,
                    )
                ],
                description="Weak positive drifting tone (+600 Hz/s, SNR 4.5)",
            ),
            # 15: Moderate positive drift (SNR 5-10)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_015_drift_pos_med_snr9",
                seed=self.base_seed + 15,
                geometry=geom,
                background=bg_gauss,
                injections=[
                    SignalConfig(
                        signal_id="sig_drift_pos_med",
                        family="drifting_tone",
                        f_start_hz=1420.0e6 + 20 * 1000.0,
                        drift_rate_hz_per_s=1500.0,
                        snr=9.0,
                        t_start_s=2.0,
                        duration_s=20.0,
                    )
                ],
                description="Moderate positive drifting tone (+1500 Hz/s, SNR 9.0)",
            ),
            # 16: Strong positive drift (SNR > 10)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_016_drift_pos_strong_snr18",
                seed=self.base_seed + 16,
                geometry=geom,
                background=bg_gauss,
                injections=[
                    SignalConfig(
                        signal_id="sig_drift_pos_strong",
                        family="drifting_tone",
                        f_start_hz=1420.0e6 + 15 * 1000.0,
                        drift_rate_hz_per_s=2500.0,
                        snr=18.0,
                        t_start_s=0.0,
                        duration_s=25.0,
                    )
                ],
                description="Strong positive drifting tone (+2500 Hz/s, SNR 18.0)",
            ),
            # 17: Moderate negative drift
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_017_drift_neg_med_snr10",
                seed=self.base_seed + 17,
                geometry=geom,
                background=bg_gauss,
                injections=[
                    SignalConfig(
                        signal_id="sig_drift_neg_med",
                        family="drifting_tone",
                        f_start_hz=1420.0e6 + 90 * 1000.0,
                        drift_rate_hz_per_s=-1600.0,
                        snr=10.0,
                        t_start_s=0.0,
                        duration_s=24.0,
                    )
                ],
                description="Moderate negative drifting tone (-1600 Hz/s, SNR 10.0)",
            ),
            # 18: Strong negative drift
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_018_drift_neg_strong_snr15",
                seed=self.base_seed + 18,
                geometry=geom,
                background=bg_gauss,
                injections=[
                    SignalConfig(
                        signal_id="sig_drift_neg_strong",
                        family="drifting_tone",
                        f_start_hz=1420.0e6 + 105 * 1000.0,
                        drift_rate_hz_per_s=-2200.0,
                        snr=15.0,
                        t_start_s=0.0,
                        duration_s=25.0,
                    )
                ],
                description="Strong negative drifting tone (-2200 Hz/s, SNR 15.0)",
            ),
            # 19: Short localized burst
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_019_burst_short_snr14",
                seed=self.base_seed + 19,
                geometry=geom,
                background=bg_gauss,
                injections=[
                    SignalConfig(
                        signal_id="sig_burst_short",
                        family="burst",
                        f_start_hz=1420.0e6 + 70 * 1000.0,
                        snr=14.0,
                        t_start_s=10.0,
                        duration_s=5.0,
                        bandwidth_hz=4000.0,
                    )
                ],
                description="Short localized burst (duration 5s, bandwidth 4 kHz, SNR 14.0)",
            ),
            # 20: Weak short burst (SNR < 5)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_020_burst_weak_snr48",
                seed=self.base_seed + 20,
                geometry=geom,
                background=bg_gauss,
                injections=[
                    SignalConfig(
                        signal_id="sig_burst_weak",
                        family="burst",
                        f_start_hz=1420.0e6 + 35 * 1000.0,
                        snr=4.8,
                        t_start_s=8.0,
                        duration_s=6.0,
                        bandwidth_hz=3000.0,
                    )
                ],
                description="Weak short burst (SNR 4.8, duration 6s)",
            ),
            # 21: Broadband emission
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_021_broadband_snr10",
                seed=self.base_seed + 21,
                geometry=geom,
                background=bg_gauss,
                injections=[
                    SignalConfig(
                        signal_id="sig_broadband_med",
                        family="broadband_emission",
                        f_start_hz=1420.0e6 + 80 * 1000.0,
                        bandwidth_hz=18000.0,
                        snr=10.0,
                        t_start_s=5.0,
                        duration_s=20.0,
                    )
                ],
                description="Broadband contiguous emission (18 kHz width, SNR 10.0)",
            ),
            # 22: Boundary lower edge (channel 0)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_022_boundary_lower_edge",
                seed=self.base_seed + 22,
                geometry=geom,
                background=bg_gauss,
                injections=[
                    SignalConfig(
                        signal_id="sig_edge_lower",
                        family="stationary_tone",
                        f_start_hz=1420.0e6,
                        snr=14.0,
                    )
                ],
                description="Signal positioned at lower boundary edge (channel 0)",
            ),
            # 23: Boundary upper edge (channel 127)
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_023_boundary_upper_edge",
                seed=self.base_seed + 23,
                geometry=geom,
                background=bg_gauss,
                injections=[
                    SignalConfig(
                        signal_id="sig_edge_upper",
                        family="stationary_tone",
                        f_start_hz=1420.0e6 + 127 * 1000.0,
                        snr=14.0,
                    )
                ],
                description="Signal positioned at upper boundary edge (channel 127)",
            ),
            # 24: Multiple simultaneous signals
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_024_multi_target",
                seed=self.base_seed + 24,
                geometry=geom,
                background=bg_gauss,
                injections=[
                    SignalConfig(
                        signal_id="sig_multi_stat",
                        family="stationary_tone",
                        f_start_hz=1420.0e6 + 25 * 1000.0,
                        snr=12.0,
                    ),
                    SignalConfig(
                        signal_id="sig_multi_drift",
                        family="drifting_tone",
                        f_start_hz=1420.0e6 + 65 * 1000.0,
                        drift_rate_hz_per_s=1200.0,
                        snr=15.0,
                    ),
                ],
                description="Multiple simultaneous signals (stationary + drifting)",
            ),
            # 25: Crossing / intersecting signals
            SyntheticDatasetConfig(
                dataset_id=f"{dataset_id}_obs_025_crossing_targets",
                seed=self.base_seed + 25,
                geometry=geom,
                background=bg_gauss,
                injections=[
                    SignalConfig(
                        signal_id="sig_cross_stat",
                        family="stationary_tone",
                        f_start_hz=1420.0e6 + 55 * 1000.0,
                        snr=12.0,
                    ),
                    SignalConfig(
                        signal_id="sig_cross_drift",
                        family="drifting_tone",
                        f_start_hz=1420.0e6 + 35 * 1000.0,
                        drift_rate_hz_per_s=1400.0,
                        snr=14.0,
                    ),
                ],
                description=(
                    "Intersecting/crossing signals (stationary intersecting with drifting tone)"
                ),
            ),
        ]
        return configs

    def generate_and_save_suite(
        self,
        output_dir: Path,
        dataset_id: str = "aethon_standard_benchmark",
        custom_configs: list[SyntheticDatasetConfig] | None = None,
    ) -> BenchmarkManifest:
        """Generate observation matrices, compute checksums, and save manifest and files."""
        output_dir.mkdir(parents=True, exist_ok=True)
        configs = custom_configs or self.create_standard_suite_configs(dataset_id)

        manifest_items: list[ObservationManifestItem] = []
        positive_count = 0
        negative_count = 0
        total_targets = 0

        for cfg in configs:
            rng = np.random.default_rng(cfg.seed)
            bg_matrix, bg_meta = generate_noise_background(cfg.geometry, cfg.background, rng)

            injection_res = inject_signals(
                background_matrix=bg_matrix,
                background_metadata=bg_meta,
                geometry=cfg.geometry,
                injections=cfg.injections,
                dataset_id=dataset_id,
                observation_id=cfg.dataset_id,
            )

            arr = injection_res.canonical_slice.values
            sha256 = compute_array_sha256(arr)
            filename = f"{cfg.dataset_id}.npy"
            file_path = output_dir / filename

            # Persist array
            np.save(file_path, arr)

            is_neg = injection_res.ground_truth.is_negative_control
            if is_neg:
                negative_count += 1
            else:
                positive_count += 1
            total_targets += injection_res.ground_truth.target_count

            manifest_items.append(
                ObservationManifestItem(
                    observation_id=cfg.dataset_id,
                    is_negative_control=is_neg,
                    file_name=filename,
                    sha256=sha256,
                    shape=list(arr.shape),
                    ground_truth=injection_res.ground_truth,
                )
            )

        manifest = BenchmarkManifest(
            dataset_id=dataset_id,
            seed=self.base_seed,
            total_observations=len(manifest_items),
            positive_observations_count=positive_count,
            negative_control_count=negative_count,
            total_injected_targets=total_targets,
            observations=manifest_items,
        )

        # Write manifest JSON
        manifest_file = output_dir / "manifest.json"
        with open(manifest_file, "w", encoding="utf-8") as f:
            json.dump(manifest.model_dump(), f, indent=2)

        return manifest


def load_benchmark_dataset(
    dataset_dir: Path, verify_checksums: bool = True
) -> tuple[BenchmarkManifest, dict[str, np.ndarray]]:
    """Load and optionally verify a benchmark manifest and its observation matrices from disk."""
    manifest_file = dataset_dir / "manifest.json"
    if not manifest_file.exists():
        raise BenchmarkSerializationError(
            f"Manifest file not found in benchmark directory: {dataset_dir}"
        )

    try:
        with open(manifest_file, encoding="utf-8") as f:
            manifest_dict = json.load(f)
        manifest = BenchmarkManifest(**manifest_dict)
    except Exception as exc:
        raise BenchmarkSerializationError(
            f"Failed to parse benchmark manifest: {exc}", details={"dir": str(dataset_dir)}
        ) from exc

    observations: dict[str, np.ndarray] = {}
    for item in manifest.observations:
        file_path = dataset_dir / item.file_name
        if not file_path.exists():
            raise BenchmarkSerializationError(
                f"Observation binary file missing: {file_path}",
                details={"observation_id": item.observation_id},
            )
        arr = np.load(file_path)
        if verify_checksums:
            calculated_hash = compute_array_sha256(arr)
            if calculated_hash != item.sha256:
                raise BenchmarkSerializationError(
                    f"Checksum mismatch for observation '{item.observation_id}'. "
                    f"Expected {item.sha256}, got {calculated_hash}",
                    details={
                        "observation_id": item.observation_id,
                        "expected_sha256": item.sha256,
                        "actual_sha256": calculated_hash,
                    },
                )
        observations[item.observation_id] = arr

    return manifest, observations
