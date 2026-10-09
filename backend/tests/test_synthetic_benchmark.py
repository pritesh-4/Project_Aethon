"""Unit and integration tests for benchmark dataset persistence and manifest integrity."""

from pathlib import Path

import numpy as np
import pytest

from app.synthetic.dataset import (
    BenchmarkDatasetGenerator,
    load_benchmark_dataset,
)
from app.synthetic.exceptions import BenchmarkSerializationError


def test_benchmark_suite_generation_and_integrity(tmp_path: Path) -> None:
    """Benchmark suite must generate manifest and observations with verifiable SHA-256 hashes."""
    generator = BenchmarkDatasetGenerator(base_seed=42)
    manifest = generator.generate_and_save_suite(output_dir=tmp_path, dataset_id="test_suite_run")

    assert manifest.total_observations == 9
    assert manifest.positive_observations_count == 7
    assert manifest.negative_control_count == 2
    assert manifest.total_injected_targets == 9
    assert manifest.is_synthetic is True
    assert (tmp_path / "manifest.json").exists()

    # Load and verify checksums
    loaded_manifest, obs_dict = load_benchmark_dataset(tmp_path, verify_checksums=True)
    assert loaded_manifest.dataset_id == "test_suite_run"
    assert len(obs_dict) == 9

    for item in loaded_manifest.observations:
        arr = obs_dict[item.observation_id]
        assert arr.shape == (32, 128)
        assert np.all(np.isfinite(arr))


def test_benchmark_checksum_tampering_detection(tmp_path: Path) -> None:
    """Tampering with an observation array must trigger BenchmarkSerializationError on load."""
    generator = BenchmarkDatasetGenerator(base_seed=42)
    manifest = generator.generate_and_save_suite(output_dir=tmp_path, dataset_id="tamper_test")

    first_obs = manifest.observations[0]
    file_path = tmp_path / first_obs.file_name

    # Tamper with the binary file
    arr = np.load(file_path)
    arr[0, 0] += 999.0
    np.save(file_path, arr)

    # Attempt reload with checksum verification
    with pytest.raises(BenchmarkSerializationError) as exc_info:
        load_benchmark_dataset(tmp_path, verify_checksums=True)
    assert "Checksum mismatch" in str(exc_info.value)


def test_load_benchmark_missing_manifest_raises_error(tmp_path: Path) -> None:
    """Attempting to load from an empty directory must raise BenchmarkSerializationError."""
    with pytest.raises(BenchmarkSerializationError):
        load_benchmark_dataset(tmp_path)
