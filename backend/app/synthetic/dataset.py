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
