#!/usr/bin/env python3
"""AETHON Synthetic CNN Dataset Generator.

Generates a compact, deterministic, multi-class spectrogram dataset for
training and validating experimental radio-signal classification CNNs.

Classes (5 explicitly synthetic categories):
  0: noise              - Gaussian background noise without injected signal
  1: stationary_tone    - Narrowband carrier tone at constant frequency
  2: drifting_tone      - Narrowband tone drifting linearly across frequency
  3: burst              - Transient pulse localized in time and frequency
  4: broadband          - Wide-band emission spanning multiple channels

Key Features:
- 100% synthetic, offline generation using AETHON production synthetic models.
- Strict split isolation (independent SeedSequence streams for train/val/test).
- Lightweight float32 2D matrices suitable for CPU training experiments.
- Writes compressed .npz archive and comprehensive provenance manifest.
- Overwrite protection: refuses to silently overwrite existing files.

Example Usage:
  # Generate default dataset into backend/data/cnn_dataset:
  python backend/scripts/prepare_cnn_dataset.py

  # Generate into isolated directory with custom seed and counts:
  python backend/scripts/prepare_cnn_dataset.py --output-dir /tmp/cnn_dataset --seed 123 --train-per-class 100
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

# Ensure backend root is on sys.path
_SCRIPT_DIR = Path(__file__).resolve().parent
_BACKEND_ROOT = _SCRIPT_DIR.parent
_REPO_ROOT = _BACKEND_ROOT.parent if _BACKEND_ROOT.name == "backend" else _BACKEND_ROOT

if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

try:
    import numpy as np

    from app.synthetic.backgrounds import generate_noise_background
    from app.synthetic.config import (
        NoiseBackgroundConfig,
        ObservationGeometryConfig,
        SignalConfig,
    )
    from app.synthetic.signals import get_signal_generator
except ImportError as err:
    print(
        f"ERROR: Missing required backend dependency: {err}\n"
        f"Please run this script using the AETHON backend virtual environment, for example:\n"
        f"  backend\\.venv\\Scripts\\python.exe backend/scripts/prepare_cnn_dataset.py\n"
        f"or:\n"
        f"  source backend/.venv/bin/activate && python backend/scripts/prepare_cnn_dataset.py",
        file=sys.stderr,
    )
    sys.exit(1)


CLASS_NAMES: list[str] = [
    "noise",
    "stationary_tone",
    "drifting_tone",
    "burst",
    "broadband",
]
CLASS_TO_IDX: dict[str, int] = {name: i for i, name in enumerate(CLASS_NAMES)}

DEFAULT_SEED = 42
DEFAULT_TIME_STEPS = 32
DEFAULT_FREQ_CHANNELS = 32
DEFAULT_TRAIN_PER_CLASS = 70
DEFAULT_VAL_PER_CLASS = 15
DEFAULT_TEST_PER_CLASS = 15


def compute_file_sha256(path: Path) -> str:
    """Compute SHA-256 hex digest of a file in streaming chunks."""
    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def generate_single_sample(
    class_name: str,
    geometry: ObservationGeometryConfig,
    rng: np.random.Generator,
    sample_id: str,
) -> tuple[np.ndarray, dict[str, Any]]:
    """Generate a single 2D spectrogram matrix and metadata for the given class."""
    n_t = geometry.n_time
    n_f = geometry.n_freq
    dt = geometry.sampling_interval_s
    df = geometry.f_step_hz
    f_min = geometry.f_min_hz

    # 1. Base noise background with slight randomized variance
    noise_std = float(rng.uniform(0.85, 1.15))
    noise_cfg = NoiseBackgroundConfig(
        background_type="gaussian",
        std_dev=noise_std,
        mean=0.0,
    )
    bg_matrix, _ = generate_noise_background(geometry, noise_cfg, rng)

    sample_meta: dict[str, Any] = {
        "sample_id": sample_id,
        "class_name": class_name,
        "class_index": CLASS_TO_IDX[class_name],
        "noise_std_dev": noise_std,
    }

    if class_name == "noise":
        # Pure noise class
        return bg_matrix.astype(np.float32), sample_meta

    if class_name == "stationary_tone":
        # Stationary carrier tone
        f_chan = int(rng.integers(3, n_f - 3))
        f_start_hz = f_min + f_chan * df
        t_start_step = int(rng.integers(0, 3))
        duration_steps = int(rng.integers(max(16, n_t - 6), n_t - t_start_step + 1))
        snr = float(rng.uniform(8.0, 22.0))

        sig_cfg = SignalConfig(
            signal_id=sample_id,
            family="stationary_tone",
            f_start_hz=f_start_hz,
            t_start_s=t_start_step * dt,
            duration_s=duration_steps * dt,
            snr=snr,
        )
        gen = get_signal_generator("stationary_tone")
        res = gen.generate(geometry, sig_cfg, noise_std)
        matrix = bg_matrix + res.signal_matrix

        sample_meta.update(
            {
                "channel_index": f_chan,
                "f_start_hz": f_start_hz,
                "snr": snr,
                "t_start_s": t_start_step * dt,
                "duration_s": duration_steps * dt,
            }
        )
        return matrix.astype(np.float32), sample_meta

    if class_name == "drifting_tone":
        # Drifting narrowband tone
        drift_direction = int(rng.choice([-1, 1]))
        max_drift_chans = max(4, min(14, n_f // 2))
        drift_chans = int(rng.integers(4, max_drift_chans + 1)) * drift_direction

        # Pick start channel so drift remains well within frequency bounds
        if drift_direction > 0:
            start_chan = int(rng.integers(2, n_f - abs(drift_chans) - 2))
        else:
            start_chan = int(rng.integers(abs(drift_chans) + 2, n_f - 2))

        f_start_hz = f_min + start_chan * df
        duration_s = n_t * dt
        drift_rate_hz_s = (drift_chans * df) / duration_s
        snr = float(rng.uniform(8.0, 22.0))

        sig_cfg = SignalConfig(
            signal_id=sample_id,
            family="drifting_tone",
            f_start_hz=f_start_hz,
            drift_rate_hz_per_s=drift_rate_hz_s,
            t_start_s=0.0,
            duration_s=duration_s,
            snr=snr,
        )
        gen = get_signal_generator("drifting_tone")
        res = gen.generate(geometry, sig_cfg, noise_std)
        matrix = bg_matrix + res.signal_matrix

        sample_meta.update(
            {
                "start_channel": start_chan,
                "drift_channels": drift_chans,
                "drift_rate_hz_s": drift_rate_hz_s,
                "snr": snr,
            }
        )
        return matrix.astype(np.float32), sample_meta

    if class_name == "burst":
        # Transient pulse burst localized in time and frequency
        f_chan = int(rng.integers(3, n_f - 3))
        f_start_hz = f_min + f_chan * df
        t_start_step = int(rng.integers(2, max(3, n_t - 10)))
        duration_steps = int(rng.integers(2, 7))
        bandwidth_chans = int(rng.integers(1, 4))
        snr = float(rng.uniform(10.0, 25.0))

        sig_cfg = SignalConfig(
            signal_id=sample_id,
            family="burst",
            f_start_hz=f_start_hz,
            t_start_s=t_start_step * dt,
            duration_s=duration_steps * dt,
            bandwidth_hz=bandwidth_chans * df,
            snr=snr,
        )
        gen = get_signal_generator("burst")
        res = gen.generate(geometry, sig_cfg, noise_std)
        matrix = bg_matrix + res.signal_matrix

        sample_meta.update(
            {
                "center_channel": f_chan,
                "t_start_s": t_start_step * dt,
                "duration_s": duration_steps * dt,
                "bandwidth_chans": bandwidth_chans,
                "snr": snr,
            }
        )
        return matrix.astype(np.float32), sample_meta

    if class_name == "broadband":
        # Broadband emission spanning substantial bandwidth
        bandwidth_chans = int(rng.integers(8, max(9, int(n_f * 0.6))))
        start_chan = int(rng.integers(2, max(3, n_f - bandwidth_chans - 2)))
        f_start_hz = f_min + start_chan * df
        t_start_step = int(rng.integers(0, 4))
        duration_steps = int(rng.integers(max(10, n_t // 2), n_t - t_start_step + 1))
        profile_shape = str(rng.choice(["boxcar", "gaussian"]))
        snr = float(rng.uniform(6.0, 16.0))

        sig_cfg = SignalConfig(
            signal_id=sample_id,
            family="broadband_emission",
            f_start_hz=f_start_hz,
            bandwidth_hz=bandwidth_chans * df,
            t_start_s=t_start_step * dt,
            duration_s=duration_steps * dt,
            snr=snr,
            shape_profile=profile_shape,
        )
        gen = get_signal_generator("broadband_emission")
        res = gen.generate(geometry, sig_cfg, noise_std)
        matrix = bg_matrix + res.signal_matrix

        sample_meta.update(
            {
                "start_channel": start_chan,
                "bandwidth_chans": bandwidth_chans,
                "profile": profile_shape,
                "snr": snr,
                "duration_s": duration_steps * dt,
            }
        )
        return matrix.astype(np.float32), sample_meta

    raise ValueError(f"Unknown class name: {class_name}")


def generate_dataset_split(
    split_name: str,
    count_per_class: int,
    geometry: ObservationGeometryConfig,
    rng: np.random.Generator,
) -> tuple[np.ndarray, np.ndarray, list[dict[str, Any]]]:
    """Generate independent, balanced samples and labels for a specific split."""
    images: list[np.ndarray] = []
    labels: list[int] = []
    metadata_list: list[dict[str, Any]] = []

    for class_name in CLASS_NAMES:
        class_idx = CLASS_TO_IDX[class_name]
        for item_idx in range(count_per_class):
            sample_id = f"{split_name}_{class_name}_{item_idx:04d}"
            mat, meta = generate_single_sample(class_name, geometry, rng, sample_id)

            if not np.all(np.isfinite(mat)):
                raise ValueError(f"Non-finite values detected in sample {sample_id}")

            images.append(mat)
            labels.append(class_idx)
            metadata_list.append(meta)

    # Shuffle the split deterministically using the split's PRNG
    perm = rng.permutation(len(images))
    shuffled_images = np.stack([images[i] for i in perm], axis=0).astype(np.float32)
    shuffled_labels = np.array([labels[i] for i in perm], dtype=np.int64)
    shuffled_meta = [metadata_list[i] for i in perm]

    return shuffled_images, shuffled_labels, shuffled_meta


def build_cnn_dataset(
    output_dir: Path,
    dataset_name: str = "aethon_spectrogram_cnn",
    seed: int = DEFAULT_SEED,
    time_steps: int = DEFAULT_TIME_STEPS,
    freq_channels: int = DEFAULT_FREQ_CHANNELS,
    train_per_class: int = DEFAULT_TRAIN_PER_CLASS,
    val_per_class: int = DEFAULT_VAL_PER_CLASS,
    test_per_class: int = DEFAULT_TEST_PER_CLASS,
    overwrite: bool = False,
) -> dict[str, Any]:
    """Build, save, and verify synthetic multi-class spectrogram dataset."""
    output_dir = output_dir.resolve()
    npz_path = output_dir / f"{dataset_name}.npz"
    manifest_path = output_dir / f"{dataset_name}_manifest.json"

    print("=====================================================================")
    print("      AETHON — Synthetic Spectrogram CNN Dataset Generator           ")
    print("=====================================================================")
    print(f"Timestamp:       {datetime.now(UTC).isoformat()}")
    print(f"Target Dir:      {output_dir}")
    print(f"Dataset Name:    {dataset_name}")
    print(f"Master Seed:     {seed}")
    print(f"Dimensions:      {time_steps} time steps x {freq_channels} channels (float32)")
    print(f"Classes (5):     {', '.join(CLASS_NAMES)}")
    print(f"Counts / class:  Train={train_per_class}, Val={val_per_class}, Test={test_per_class}")
    total_samples = 5 * (train_per_class + val_per_class + test_per_class)
    print(f"Total Samples:   {total_samples}")
    print("---------------------------------------------------------------------")

    # Safety Guard: Check for existing files
    if (npz_path.exists() or manifest_path.exists()) and not overwrite:
        existing = [p.name for p in [npz_path, manifest_path] if p.exists()]
        raise RuntimeError(
            f"SAFETY ABORT: Output file(s) already exist at target directory:\n"
            f"  {', '.join(existing)}\n"
            f"The generator refuses to silently overwrite existing datasets.\n"
            f"To allow replacing existing files, provide the --overwrite flag,\n"
            f"or specify a different output directory via --output-dir."
        )

    output_dir.mkdir(parents=True, exist_ok=True)

    # Establish canonical observation geometry
    geometry = ObservationGeometryConfig(
        n_time=time_steps,
        n_freq=freq_channels,
        sampling_interval_s=0.5,
        f_min_hz=1420.0e6,
        f_max_hz=1420.0e6 + freq_channels * 1000.0,
        f_step_hz=1000.0,
    )

    # Strict split isolation using spawned SeedSequence streams
    seed_seq = np.random.SeedSequence(seed)
    train_seq, val_seq, test_seq = seed_seq.spawn(3)
    train_rng = np.random.default_rng(train_seq)
    val_rng = np.random.default_rng(val_seq)
    test_rng = np.random.default_rng(test_seq)

    # 1. Generate Train Split
    print("\n[Step 1/4] Generating training split (independent PRNG stream)...")
    train_x, train_y, _ = generate_dataset_split("train", train_per_class, geometry, train_rng)
    print(f"  Train shape:  {train_x.shape}, labels: {train_y.shape}")

    # Compute normalization statistics STRICTLY from training split
    train_mean = float(np.mean(train_x))
    train_std = float(np.std(train_x))
    print(f"  Train stats:  mean={train_mean:.4f}, std={train_std:.4f}")

    # 2. Generate Validation Split
    print("\n[Step 2/4] Generating validation split (independent PRNG stream)...")
    val_x, val_y, _ = generate_dataset_split("val", val_per_class, geometry, val_rng)
    print(f"  Val shape:    {val_x.shape}, labels: {val_y.shape}")

    # 3. Generate Test Split
    print("\n[Step 3/4] Generating testing split (independent PRNG stream)...")
    test_x, test_y, _ = generate_dataset_split("test", test_per_class, geometry, test_rng)
    print(f"  Test shape:   {test_x.shape}, labels: {test_y.shape}")

    # 4. Save Compressed NPZ Archive
    print("\n[Step 4/4] Writing compressed NPZ archive and companion manifest...")
    np.savez_compressed(
        npz_path,
        train_images=train_x,
        train_labels=train_y,
        val_images=val_x,
        val_labels=val_y,
        test_images=test_x,
        test_labels=test_y,
        class_names=np.array(CLASS_NAMES),
    )
    npz_sha256 = compute_file_sha256(npz_path)
    npz_bytes = npz_path.stat().st_size
    print(f"  Saved NPZ:    {npz_path.name} ({npz_bytes:,} bytes, SHA: {npz_sha256[:12]}...)")

    # Compile Comprehensive Manifest
    manifest_content: dict[str, Any] = {
        "manifest_version": "1.0.0",
        "provenance": "synthetic_experimental_training_data",
        "dataset_name": dataset_name,
        "created_at_utc": datetime.now(UTC).isoformat(),
        "generator": "backend/scripts/prepare_cnn_dataset.py",
        "master_seed": seed,
        "sample_dimensions": {
            "time_steps": time_steps,
            "freq_channels": freq_channels,
            "sampling_interval_seconds": geometry.sampling_interval_s,
            "channel_spacing_hz": geometry.f_step_hz,
            "f_min_hz": geometry.f_min_hz,
        },
        "dtype": "float32",
        "classes": CLASS_NAMES,
        "class_to_idx": CLASS_TO_IDX,
        "split_counts": {
            "train": {
                "per_class": train_per_class,
                "total": int(train_x.shape[0]),
            },
            "val": {
                "per_class": val_per_class,
                "total": int(val_x.shape[0]),
            },
            "test": {
                "per_class": test_per_class,
                "total": int(test_x.shape[0]),
            },
            "total_samples": total_samples,
        },
        "normalization_parameters": {
            "train_mean": round(train_mean, 6),
            "train_std": round(train_std, 6),
            "computed_from": "train_split_only",
        },
        "generator_parameter_ranges": {
            "noise": {
                "description": "Standard Gaussian background without injected signal",
                "mean": 0.0,
                "std_dev_range": [0.85, 1.15],
            },
            "stationary_tone": {
                "description": "Narrowband unmodulated carrier tone at constant frequency channel",
                "snr_range": [8.0, 22.0],
                "channel_range": [3, freq_channels - 3],
            },
            "drifting_tone": {
                "description": "Narrowband tone with linear frequency drift rate",
                "snr_range": [8.0, 22.0],
                "drift_channels_range": [4, max(4, freq_channels // 2)],
                "drift_directions": ["positive", "negative"],
            },
            "burst": {
                "description": "Transient pulse localized in time and frequency",
                "snr_range": [10.0, 25.0],
                "duration_steps_range": [2, 6],
                "bandwidth_channels_range": [1, 3],
            },
            "broadband": {
                "description": "Emission spanning substantial bandwidth across multiple channels",
                "snr_range": [6.0, 16.0],
                "bandwidth_channels_range": [8, max(8, int(freq_channels * 0.6))],
                "profiles": ["boxcar", "gaussian"],
            },
        },
        "disclaimer": (
            "Strictly synthetic experimental numerical dataset generated for CNN model development "
            "and benchmark evaluations. Does not represent real astronomical radio telescope recordings. "
            "These synthetic signal families do not cover all possible astrophysical emissions or RFI morphologies."
        ),
        "files": {
            "archive": npz_path.name,
            "archive_sha256": npz_sha256,
            "archive_size_bytes": npz_bytes,
        },
    }

    with open(manifest_path, "w", encoding="utf-8") as f_out:
        json.dump(manifest_content, f_out, indent=2)
    print(f"  Manifest:     {manifest_path.name}")
    print("=====================================================================")
    print("SUCCESS: Synthetic spectrogram CNN dataset compiled successfully.")
    print("=====================================================================")

    return {
        "npz_path": str(npz_path),
        "manifest_path": str(manifest_path),
        "sha256": npz_sha256,
        "total_samples": total_samples,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a reproducible synthetic spectrogram dataset for experimental CNN training.",
        epilog=(
            "Example:\n"
            "  python backend/scripts/prepare_cnn_dataset.py --output-dir backend/data/cnn_dataset\n"
            "  python backend/scripts/prepare_cnn_dataset.py --seed 123 --train-per-class 100\n"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=_BACKEND_ROOT / "data" / "cnn_dataset",
        help="Destination directory for dataset archive and manifest (default: backend/data/cnn_dataset)",
    )
    parser.add_argument(
        "--dataset-name",
        type=str,
        default="aethon_spectrogram_cnn",
        help="Base filename prefix for the .npz archive and manifest (default: aethon_spectrogram_cnn)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=DEFAULT_SEED,
        help="Master deterministic random seed (default: 42)",
    )
    parser.add_argument(
        "--time-steps",
        type=int,
        default=DEFAULT_TIME_STEPS,
        help="Spectrogram time axis dimension (default: 32)",
    )
    parser.add_argument(
        "--freq-channels",
        type=int,
        default=DEFAULT_FREQ_CHANNELS,
        help="Spectrogram frequency axis dimension (default: 32)",
    )
    parser.add_argument(
        "--train-per-class",
        type=int,
        default=DEFAULT_TRAIN_PER_CLASS,
        help="Number of training samples per class (default: 70)",
    )
    parser.add_argument(
        "--val-per-class",
        type=int,
        default=DEFAULT_VAL_PER_CLASS,
        help="Number of validation samples per class (default: 15)",
    )
    parser.add_argument(
        "--test-per-class",
        type=int,
        default=DEFAULT_TEST_PER_CLASS,
        help="Number of test samples per class (default: 15)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Allow overwriting existing dataset files if already present",
    )

    args = parser.parse_args()

    try:
        build_cnn_dataset(
            output_dir=args.output_dir,
            dataset_name=args.dataset_name,
            seed=args.seed,
            time_steps=args.time_steps,
            freq_channels=args.freq_channels,
            train_per_class=args.train_per_class,
            val_per_class=args.val_per_class,
            test_per_class=args.test_per_class,
            overwrite=args.overwrite,
        )
    except RuntimeError as err:
        print(str(err), file=sys.stderr)
        sys.exit(1)
    except Exception as err:
        print(f"Unexpected fatal error: {err}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
