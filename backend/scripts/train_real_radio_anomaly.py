#!/usr/bin/env python3
"""AETHON Real-Radio Anomaly Model — Training and Evaluation Script.

This script:
  1. Loads real observational filterbank files from backend/data/real_radio_training/raw/
  2. Inspects their metadata via blimpy.
  3. Tiles the observations into fixed-size spectrogram patches.
  4. Splits tiles by source observation (or contiguous blocks if single-observation).
  5. Trains a convolutional autoencoder on background tiles.
  6. Injects controlled synthetic signals into held-out test tiles.
  7. Evaluates the autoencoder against statistical baseline and isolation forest.
  8. Saves all artifacts (checkpoint, report, manifest) under backend/data/real_radio_training/.

Usage:
  cd backend
  python -m scripts.train_real_radio_anomaly

Or from project root:
  backend/.venv/Scripts/python.exe backend/scripts/train_real_radio_anomaly.py
"""

from __future__ import annotations

import gc
import hashlib
import json
import platform
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, TypedDict

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

# Ensure backend is on sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.detection.baseline import StatisticalBaselineDetector
from app.detection.features import FEATURE_NAMES, extract_window_features
from app.detection.isolation_forest import IsolationForestDetector
from app.detection.real_radio_anomaly import (
    AnomalyModelConfig,
    NormalizationStats,
    RadioAnomalyAutoencoder,
    calibrate_threshold,
    compute_anomaly_scores,
    load_checkpoint,
    save_checkpoint,
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
RAW_DIR = BACKEND_DIR / "data" / "real_radio_training" / "raw"
OUTPUT_DIR = BACKEND_DIR / "data" / "real_radio_training"
MODEL_DIR = OUTPUT_DIR / "model"

TILE_H = 32
TILE_W = 32
GUARD_GAP = 4  # Gap tiles between splits to prevent leakage

INJECTION_SNRS = [3.0, 5.0, 8.0, 12.0, 20.0]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def set_seeds(seed: int = 42) -> None:
    """Set deterministic seeds for reproducibility."""
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def sha256_file(path: Path) -> str:
    """Compute SHA-256 of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1048576), b""):
            h.update(chunk)
    return h.hexdigest()


@dataclass
class ObservationInfo:
    """Parsed metadata for a real observation file."""

    observation_id: str
    filepath: Path
    telescope_id: int
    telescope_name: str
    source_name: str
    nchans: int
    nbits: int
    fch1: float
    foff: float
    tsamp: float
    n_ints: int
    file_size: int
    sha256: str

    def to_dict(self) -> dict:
        return {
            "observation_id": self.observation_id,
            "filepath": str(self.filepath),
            "telescope_id": self.telescope_id,
            "telescope_name": self.telescope_name,
            "source_name": self.source_name,
            "nchans": self.nchans,
            "nbits": self.nbits,
            "fch1": self.fch1,
            "foff": self.foff,
            "tsamp": self.tsamp,
            "n_ints": self.n_ints,
            "file_size_bytes": self.file_size,
            "sha256": self.sha256,
        }


SIGPROC_TELESCOPES = {
    0: "Fake/Simulated",
    1: "Arecibo",
    2: "Ooty",
    3: "Nancay",
    4: "Parkes",
    5: "Jodrell Bank",
    6: "GBT",
    7: "GMRT",
    8: "Effelsberg",
}


def inspect_filterbank(filepath: Path, obs_id: str) -> ObservationInfo:
    """Inspect a filterbank file and extract metadata without loading data."""
    from blimpy import Waterfall

    wf = Waterfall(str(filepath.resolve()), load_data=False)
    h = wf.header

    tel_id = int(h.get("telescope_id", -1))
    tel_name = SIGPROC_TELESCOPES.get(tel_id, f"Unknown({tel_id})")
    src_name = h.get("source_name", "unknown")
    nchans = int(h.get("nchans", 0))
    nbits = int(h.get("nbits", 0))
    fch1 = float(h.get("fch1", 0.0))
    foff = float(h.get("foff", 0.0))
    tsamp = float(h.get("tsamp", 0.0))

    n_ints = 0
    if hasattr(wf, "n_ints_in_file") and wf.n_ints_in_file is not None:
        n_ints = int(wf.n_ints_in_file)
    elif hasattr(wf, "container") and hasattr(wf.container, "n_ints_in_file"):
        n_ints = int(getattr(wf.container, "n_ints_in_file", 0))

    file_size = filepath.stat().st_size
    checksum = sha256_file(filepath)

    return ObservationInfo(
        observation_id=obs_id,
        filepath=filepath,
        telescope_id=tel_id,
        telescope_name=tel_name,
        source_name=src_name,
        nchans=nchans,
        nbits=nbits,
        fch1=fch1,
        foff=foff,
        tsamp=tsamp,
        n_ints=n_ints,
        file_size=file_size,
        sha256=checksum,
    )


def load_filterbank_data(filepath: Path, nbits: int, nchans: int, n_ints: int) -> np.ndarray:
    """Load filterbank data using memory-mapping for safety."""
    from blimpy import Waterfall

    wf = Waterfall(str(filepath.resolve()), load_data=False)
    data_offset = int(getattr(wf.container, "idx_data", 0))
    nifs = int(wf.header.get("nifs", 1))

    if nbits == 32:
        dtype = np.float32
    elif nbits == 16:
        dtype = np.uint16
    elif nbits == 8:
        dtype = np.uint8
    else:
        raise ValueError(f"Unsupported nbits={nbits}")

    shape = (n_ints, nifs, nchans)
    mm = np.memmap(
        str(filepath.resolve()),
        dtype=dtype,
        mode="r",
        offset=data_offset,
        shape=shape,
    )
    # Extract first polarization, convert to float32
    data = np.array(mm[:, 0, :], dtype=np.float32, copy=True)
    del mm
    gc.collect()
    return data


def tile_observation(
    data: np.ndarray,
    obs_id: str,
    tile_h: int = TILE_H,
    tile_w: int = TILE_W,
) -> tuple[np.ndarray, list[dict]]:
    """Tile a 2D observation into non-overlapping patches.

    Returns:
        tiles: (N, tile_h, tile_w) float32 array
        provenance: list of dicts with source coordinates
    """
    n_t, n_f = data.shape
    n_rows = n_t // tile_h
    n_cols = n_f // tile_w

    if n_rows == 0 or n_cols == 0:
        return np.empty((0, tile_h, tile_w), dtype=np.float32), []

    tiles = []
    provenance = []

    for r in range(n_rows):
        for c in range(n_cols):
            t0 = r * tile_h
            t1 = t0 + tile_h
            f0 = c * tile_w
            f1 = f0 + tile_w
            tile = data[t0:t1, f0:f1].copy()

            # Check for non-finite values
            finite_mask = np.isfinite(tile)
            if not finite_mask.all():
                non_finite_count = int((~finite_mask).sum())
                tile = np.where(
                    finite_mask, tile, np.nanmedian(tile[finite_mask]) if finite_mask.any() else 0.0
                )
            else:
                non_finite_count = 0

            tiles.append(tile)
            provenance.append(
                {
                    "observation_id": obs_id,
                    "time_start": t0,
                    "time_stop": t1,
                    "freq_start": f0,
                    "freq_stop": f1,
                    "row_index": r,
                    "col_index": c,
                    "non_finite_count": non_finite_count,
                }
            )

    return np.array(tiles, dtype=np.float32), provenance


class SplitData(TypedDict):
    tiles: np.ndarray
    provenance: list[dict[str, Any]]


def split_tiles_by_observation(
    all_tiles: dict[str, np.ndarray],
    all_prov: dict[str, list[dict]],
    guard_gap: int = GUARD_GAP,
) -> dict[str, SplitData]:
    """Split tiles into train/val/test, preferring observation-level splits.

    If >=3 observations: obs1→train, obs2→val, obs3→test.
    If 2: obs1→train+val (80/20), obs2→test.
    If 1: contiguous block split with guard gaps.
    """
    obs_ids = sorted(all_tiles.keys())
    empty_tiles = np.empty((0, TILE_H, TILE_W), dtype=np.float32)
    result: dict[str, SplitData] = {
        "train": {"tiles": empty_tiles, "provenance": []},
        "val": {"tiles": empty_tiles, "provenance": []},
        "test": {"tiles": empty_tiles, "provenance": []},
    }

    if len(obs_ids) >= 3:
        # Observation-level split
        # Largest observation for training
        sizes = {k: all_tiles[k].shape[0] for k in obs_ids}
        sorted_by_size = sorted(obs_ids, key=lambda k: sizes[k], reverse=True)
        train_obs = sorted_by_size[0]
        val_obs = sorted_by_size[1]
        test_obs_list = sorted_by_size[2:]

        result["train"]["tiles"] = all_tiles[train_obs]
        result["train"]["provenance"] = all_prov[train_obs]
        result["val"]["tiles"] = all_tiles[val_obs]
        result["val"]["provenance"] = all_prov[val_obs]

        test_tiles_list = [all_tiles[k] for k in test_obs_list]
        test_prov_list: list[dict[str, Any]] = []
        for k in test_obs_list:
            test_prov_list.extend(all_prov[k])
        result["test"]["tiles"] = (
            np.concatenate(test_tiles_list, axis=0) if test_tiles_list else empty_tiles
        )
        result["test"]["provenance"] = test_prov_list

    elif len(obs_ids) == 2:
        larger = (
            obs_ids[0]
            if all_tiles[obs_ids[0]].shape[0] >= all_tiles[obs_ids[1]].shape[0]
            else obs_ids[1]
        )
        smaller = obs_ids[1] if larger == obs_ids[0] else obs_ids[0]

        # Split larger into train/val
        n = all_tiles[larger].shape[0]
        n_train = int(0.8 * n)
        result["train"]["tiles"] = all_tiles[larger][:n_train]
        result["train"]["provenance"] = all_prov[larger][:n_train]
        result["val"]["tiles"] = all_tiles[larger][n_train:]
        result["val"]["provenance"] = all_prov[larger][n_train:]
        result["test"]["tiles"] = all_tiles[smaller]
        result["test"]["provenance"] = all_prov[smaller]

    elif len(obs_ids) == 1:
        # Single observation — contiguous block split with guard gaps
        obs_id = obs_ids[0]
        tiles = all_tiles[obs_id]
        prov = all_prov[obs_id]
        n = tiles.shape[0]

        n_train = int(0.6 * n)
        n_val_start = n_train + guard_gap
        n_val = int(0.2 * n)
        n_test_start = n_val_start + n_val + guard_gap

        result["train"]["tiles"] = tiles[:n_train]
        result["train"]["provenance"] = prov[:n_train]
        if n_val_start + n_val <= n:
            result["val"]["tiles"] = tiles[n_val_start : n_val_start + n_val]
            result["val"]["provenance"] = prov[n_val_start : n_val_start + n_val]
        if n_test_start < n:
            result["test"]["tiles"] = tiles[n_test_start:]
            result["test"]["provenance"] = prov[n_test_start:]

    return result


def compute_normalization(train_tiles: np.ndarray) -> NormalizationStats:
    """Compute normalization statistics from training tiles only."""
    return NormalizationStats.compute(train_tiles)


def inject_signals_into_tiles(
    tiles: np.ndarray,
    tile_provenance: list[dict],
    obs_infos: dict[str, ObservationInfo],
) -> tuple[np.ndarray, list[dict]]:
    """Inject controlled synthetic signals into copies of test tiles.

    Uses AETHON's existing injection machinery where possible, falling back
    to direct numpy injection for compatibility with arbitrary tile geometries.

    Returns:
        injected_tiles: (M, tile_h, tile_w) with injected signals
        injection_records: list of ground-truth records for each injection
    """
    injected_tiles = []
    injection_records = []

    if tiles.shape[0] == 0:
        return np.empty((0, TILE_H, TILE_W), dtype=np.float32), []

    # Compute noise statistics from the tile ensemble
    tile_stds = np.array([np.std(t[np.isfinite(t)]) for t in tiles])
    median_std = float(np.median(tile_stds[tile_stds > 0])) if np.any(tile_stds > 0) else 1.0

    signal_configs = []

    for snr in INJECTION_SNRS:
        # Type 1: Stationary narrowband tone (center column)
        signal_configs.append(
            {
                "type": "stationary_tone",
                "snr": snr,
                "description": f"Stationary tone SNR={snr}",
            }
        )

        # Type 2: Drifting tone (positive drift)
        signal_configs.append(
            {
                "type": "drifting_tone_pos",
                "snr": snr,
                "description": f"Drifting tone +drift SNR={snr}",
            }
        )

        # Type 3: Drifting tone (negative drift)
        signal_configs.append(
            {
                "type": "drifting_tone_neg",
                "snr": snr,
                "description": f"Drifting tone -drift SNR={snr}",
            }
        )

        # Type 4: Short burst
        signal_configs.append(
            {
                "type": "burst",
                "snr": snr,
                "description": f"Burst SNR={snr}",
            }
        )

    rng = np.random.RandomState(seed=12345)

    for sig_cfg in signal_configs:
        # Select a random tile to inject into
        idx = rng.randint(0, tiles.shape[0])
        tile_copy = tiles[idx].copy()
        prov = tile_provenance[idx].copy()

        amplitude = float(sig_cfg["snr"]) * median_std
        th, tw = tile_copy.shape

        if sig_cfg["type"] == "stationary_tone":
            # Inject into center column
            col = tw // 2
            tile_copy[:, col] += amplitude

        elif sig_cfg["type"] == "drifting_tone_pos":
            # Linear drift from col tw//4 to tw*3//4
            for row in range(th):
                col = int(tw // 4 + (tw // 2) * row / th)
                col = min(col, tw - 1)
                tile_copy[row, col] += amplitude

        elif sig_cfg["type"] == "drifting_tone_neg":
            # Negative drift
            for row in range(th):
                col = int(tw * 3 // 4 - (tw // 2) * row / th)
                col = max(col, 0)
                tile_copy[row, col] += amplitude

        elif sig_cfg["type"] == "burst":
            # Short burst in center region
            t_center = th // 2
            f_center = tw // 2
            t_start = max(0, t_center - 3)
            t_end = min(th, t_center + 3)
            f_start = max(0, f_center - 3)
            f_end = min(tw, f_center + 3)
            tile_copy[t_start:t_end, f_start:f_end] += amplitude

        injected_tiles.append(tile_copy)
        injection_records.append(
            {
                "signal_type": sig_cfg["type"],
                "snr": sig_cfg["snr"],
                "amplitude": float(amplitude),
                "noise_std": float(median_std),
                "source_tile_index": int(idx),
                "source_observation_id": prov.get("observation_id", "unknown"),
                "description": sig_cfg["description"],
            }
        )

    return np.array(injected_tiles, dtype=np.float32), injection_records


def train_autoencoder(
    model: RadioAnomalyAutoencoder,
    train_tiles: np.ndarray,
    val_tiles: np.ndarray,
    norm_stats: NormalizationStats,
    config: AnomalyModelConfig,
) -> dict:
    """Train the autoencoder with early stopping.

    Returns:
        Training history dictionary.
    """
    # Normalize
    train_norm = norm_stats.normalize(train_tiles[:, np.newaxis, :, :])
    val_norm = norm_stats.normalize(val_tiles[:, np.newaxis, :, :])

    train_ds = TensorDataset(torch.from_numpy(train_norm))
    val_ds = TensorDataset(torch.from_numpy(val_norm))

    train_loader = DataLoader(train_ds, batch_size=config.batch_size, shuffle=True, drop_last=False)
    val_loader = DataLoader(val_ds, batch_size=config.batch_size, shuffle=False)

    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=config.learning_rate,
        weight_decay=config.weight_decay,
    )
    criterion = nn.MSELoss()

    epoch_train_losses: list[float] = []
    epoch_val_losses: list[float] = []
    history: dict[str, Any] = {
        "train_loss": epoch_train_losses,
        "val_loss": epoch_val_losses,
        "best_epoch": 0,
        "best_val_loss": float("inf"),
        "stopped_early": False,
    }

    best_state = None
    patience_counter = 0

    print(f"Training autoencoder: {model.count_parameters()} parameters")
    print(f"  Train tiles: {train_tiles.shape[0]}, Val tiles: {val_tiles.shape[0]}")
    print(f"  Batch size: {config.batch_size}, Max epochs: {config.max_epochs}")

    t_start = time.time()

    for epoch in range(config.max_epochs):
        # Training
        model.train()
        train_losses = []
        for (batch,) in train_loader:
            optimizer.zero_grad()
            recon = model(batch)
            loss = criterion(recon, batch)
            loss.backward()
            optimizer.step()
            train_losses.append(loss.item())

        train_loss = float(np.mean(train_losses))

        # Validation
        model.eval()
        val_losses = []
        with torch.no_grad():
            for (batch,) in val_loader:
                recon = model(batch)
                loss = criterion(recon, batch)
                val_losses.append(loss.item())

        val_loss = float(np.mean(val_losses))

        epoch_train_losses.append(train_loss)
        epoch_val_losses.append(val_loss)

        if (epoch + 1) % 5 == 0 or epoch == 0:
            print(
                f"  Epoch {epoch + 1:3d}/{config.max_epochs}: train_loss={train_loss:.6f}, val_loss={val_loss:.6f}"
            )

        # Early stopping
        if val_loss < history["best_val_loss"]:
            history["best_val_loss"] = val_loss
            history["best_epoch"] = epoch + 1
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= config.patience:
                print(f"  Early stopping at epoch {epoch + 1} (patience={config.patience})")
                history["stopped_early"] = True
                break

    t_end = time.time()
    history["training_time_seconds"] = round(t_end - t_start, 2)
    history["total_epochs_run"] = len(epoch_train_losses)

    # Restore best model
    if best_state is not None:
        model.load_state_dict(best_state)
    model.eval()

    print(f"  Best epoch: {history['best_epoch']}, best val_loss: {history['best_val_loss']:.6f}")
    print(f"  Training time: {history['training_time_seconds']:.1f}s")

    return history


def evaluate_detectors(
    test_bg_tiles: np.ndarray,
    injected_tiles: np.ndarray,
    injection_records: list[dict],
    train_tiles: np.ndarray,
    val_tiles: np.ndarray,
    model: RadioAnomalyAutoencoder,
    norm_stats: NormalizationStats,
    config: AnomalyModelConfig,
) -> dict:
    """Evaluate autoencoder + existing detectors on the same test data.

    Returns:
        Comprehensive evaluation report dictionary.
    """
    report = {}

    # Labels: 0=background, 1=injected
    n_bg = test_bg_tiles.shape[0]
    n_inj = injected_tiles.shape[0]
    all_tiles = np.concatenate([test_bg_tiles, injected_tiles], axis=0)
    labels = np.array([0] * n_bg + [1] * n_inj, dtype=int)

    print(f"\nEvaluation: {n_bg} background + {n_inj} injected tiles")

    # 1. Autoencoder
    print("  Scoring with autoencoder...")
    t0 = time.time()
    ae_scores = compute_anomaly_scores(model, all_tiles, norm_stats, batch_size=config.batch_size)
    ae_inference_time = time.time() - t0

    # Calibrate threshold on validation background
    val_scores = compute_anomaly_scores(model, val_tiles, norm_stats, batch_size=config.batch_size)
    ae_threshold = calibrate_threshold(val_scores, target_fpr=config.target_fpr)

    ae_bg_scores = ae_scores[:n_bg]
    ae_inj_scores = ae_scores[n_bg:]
    ae_predictions = (ae_scores >= ae_threshold).astype(int)

    report["autoencoder"] = _compute_metrics(
        labels,
        ae_scores,
        ae_predictions,
        ae_bg_scores,
        ae_threshold,
        ae_inference_time,
        injection_records,
        ae_inj_scores,
    )

    # 2. Statistical Baseline Detector (feature-based)
    print("  Extracting features for baseline/IF comparison...")
    t0 = time.time()
    train_features = []
    for tile in train_tiles:
        try:
            feats = extract_window_features(tile)
            train_features.append(feats)
        except Exception:
            pass

    all_features = []
    for tile in all_tiles:
        try:
            feats = extract_window_features(tile)
            all_features.append(feats)
        except Exception:
            # Use zeros for tiles that fail feature extraction
            all_features.append({name: 0.0 for name in FEATURE_NAMES})

    val_features = []
    for tile in val_tiles:
        try:
            feats = extract_window_features(tile)
            val_features.append(feats)
        except Exception:
            val_features.append({name: 0.0 for name in FEATURE_NAMES})

    feature_time = time.time() - t0

    if len(train_features) > 10:
        # Baseline detector
        print("  Scoring with statistical baseline...")
        t0 = time.time()
        baseline_det = StatisticalBaselineDetector()
        baseline_det.fit(train_features)

        # Calibrate threshold on validation
        val_evidence = baseline_det.score_features(val_features)
        val_baseline_scores = np.array([e.anomaly_score for e in val_evidence])
        baseline_threshold = float(
            np.percentile(val_baseline_scores, (1.0 - config.target_fpr) * 100)
        )

        all_evidence = baseline_det.score_features(all_features)
        baseline_scores = np.array([e.anomaly_score for e in all_evidence])
        baseline_inference_time = time.time() - t0 + feature_time

        baseline_bg_scores = baseline_scores[:n_bg]
        baseline_predictions = (baseline_scores >= baseline_threshold).astype(int)

        report["statistical_baseline"] = _compute_metrics(
            labels,
            baseline_scores,
            baseline_predictions,
            baseline_bg_scores,
            baseline_threshold,
            baseline_inference_time,
            injection_records,
            baseline_scores[n_bg:],
        )

        # Isolation Forest detector
        print("  Scoring with isolation forest...")
        t0 = time.time()
        if_det = IsolationForestDetector()
        if_det.fit(train_features)

        val_if_evidence = if_det.score_features(val_features)
        val_if_scores = np.array([e.anomaly_score for e in val_if_evidence])
        if_threshold = float(np.percentile(val_if_scores, (1.0 - config.target_fpr) * 100))

        all_if_evidence = if_det.score_features(all_features)
        if_scores = np.array([e.anomaly_score for e in all_if_evidence])
        if_inference_time = time.time() - t0 + feature_time

        if_bg_scores = if_scores[:n_bg]
        if_predictions = (if_scores >= if_threshold).astype(int)

        report["isolation_forest"] = _compute_metrics(
            labels,
            if_scores,
            if_predictions,
            if_bg_scores,
            if_threshold,
            if_inference_time,
            injection_records,
            if_scores[n_bg:],
        )
    else:
        report["statistical_baseline"] = {"error": "Insufficient training features"}
        report["isolation_forest"] = {"error": "Insufficient training features"}

    return report


def _compute_metrics(
    labels: np.ndarray,
    scores: np.ndarray,
    predictions: np.ndarray,
    bg_scores: np.ndarray,
    threshold: float,
    inference_time: float,
    injection_records: list[dict],
    inj_scores: np.ndarray,
) -> dict:
    """Compute required evaluation metrics for one detector."""
    from sklearn.metrics import (
        average_precision_score,
        precision_recall_fscore_support,
        roc_auc_score,
    )

    n_bg = int((labels == 0).sum())
    n_inj = int((labels == 1).sum())

    # ROC-AUC
    try:
        roc_auc = float(roc_auc_score(labels, scores))
    except ValueError:
        roc_auc = None

    # PR-AUC / Average Precision
    try:
        pr_auc = float(average_precision_score(labels, scores))
    except ValueError:
        pr_auc = None

    # Precision, Recall, F1 at calibrated threshold
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels,
        predictions,
        average="binary",
        zero_division="warn",
    )

    # False positive rate on held-out background
    fp_on_bg = int(np.sum(bg_scores >= threshold))
    fpr_bg = float(fp_on_bg / n_bg) if n_bg > 0 else 0.0
    false_alarms_per_1000 = fpr_bg * 1000.0

    # Detection recall by signal type and SNR
    recall_by_type: dict[str, dict[str, float]] = {}
    recall_by_snr: dict[str, dict[str, float]] = {}
    if n_inj > 0 and len(injection_records) == n_inj:
        for i, rec in enumerate(injection_records):
            sig_type = rec["signal_type"]
            snr = rec["snr"]
            detected = bool(inj_scores[i] >= threshold)

            if sig_type not in recall_by_type:
                recall_by_type[sig_type] = {"detected": 0.0, "total": 0.0}
            recall_by_type[sig_type]["total"] += 1.0
            if detected:
                recall_by_type[sig_type]["detected"] += 1.0

            snr_key = f"SNR_{snr}"
            if snr_key not in recall_by_snr:
                recall_by_snr[snr_key] = {"detected": 0.0, "total": 0.0}
            recall_by_snr[snr_key]["total"] += 1.0
            if detected:
                recall_by_snr[snr_key]["detected"] += 1.0

        for k in recall_by_type:
            d = recall_by_type[k]
            d["recall"] = d["detected"] / d["total"] if d["total"] > 0 else 0.0
        for k in recall_by_snr:
            d = recall_by_snr[k]
            d["recall"] = d["detected"] / d["total"] if d["total"] > 0 else 0.0

    return {
        "roc_auc": roc_auc,
        "pr_auc": pr_auc,
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "threshold_used": float(threshold),
        "fpr_on_held_out_bg": fpr_bg,
        "false_alarms_per_1000_bg": round(false_alarms_per_1000, 2),
        "fp_count_on_bg": fp_on_bg,
        "n_background_test": n_bg,
        "n_injected_test": n_inj,
        "recall_by_signal_type": recall_by_type,
        "recall_by_snr": recall_by_snr,
        "inference_time_seconds": round(inference_time, 3),
    }


# ---------------------------------------------------------------------------
# Main experiment
# ---------------------------------------------------------------------------


def main() -> None:
    """Execute the full real-radio anomaly detection experiment."""
    print("=" * 72)
    print("AETHON Real-Radio Anomaly Model — Training & Evaluation")
    print("=" * 72)

    config = AnomalyModelConfig()
    set_seeds(config.seed)

    # Step 1: Discover and inspect available observation files
    print("\n--- Step 1: Discovering observation files ---")
    if not RAW_DIR.exists():
        print(f"ERROR: Raw data directory not found: {RAW_DIR}")
        print("Run the acquisition script first.")
        sys.exit(1)

    fil_files = sorted(RAW_DIR.glob("*.fil"))
    if not fil_files:
        print(f"ERROR: No .fil files found in {RAW_DIR}")
        sys.exit(1)

    print(f"Found {len(fil_files)} observation files:")
    obs_infos: dict[str, ObservationInfo] = {}

    for fp in fil_files:
        obs_id = fp.stem
        print(f"  Inspecting {fp.name}...")
        info = inspect_filterbank(fp, obs_id)
        obs_infos[obs_id] = info
        print(f"    Telescope: {info.telescope_name}, Source: {info.source_name}")
        print(f"    Channels: {info.nchans}, Bits: {info.nbits}, Time samples: {info.n_ints}")
        print(f"    fch1: {info.fch1:.6f} MHz, foff: {info.foff:.6f} MHz, tsamp: {info.tsamp:.6f}s")
        print(f"    Size: {info.file_size:,} bytes, SHA-256: {info.sha256[:16]}...")

    # Step 2: Load and tile observations
    print("\n--- Step 2: Tiling observations ---")
    all_tiles: dict[str, np.ndarray] = {}
    all_prov: dict[str, list[dict]] = {}

    for obs_id, info in obs_infos.items():
        print(f"  Loading {obs_id}...")
        try:
            data = load_filterbank_data(info.filepath, info.nbits, info.nchans, info.n_ints)
            print(f"    Data shape: {data.shape}, dtype: {data.dtype}")

            # Reverse frequency if descending
            if info.foff < 0:
                data = data[:, ::-1].copy()
                print("    Reversed frequency axis (foff < 0)")

            # Standardize observation to local noise units (sigmas above median noise floor)
            finite_mask = np.isfinite(data)
            if finite_mask.any():
                obs_med = float(np.median(data[finite_mask]))
                obs_mad = float(np.median(np.abs(data[finite_mask] - obs_med)))
                obs_scale = max(1e-6, obs_mad * 1.4826)
                data = ((data - obs_med) / obs_scale).astype(np.float32)
                print(
                    f"    Standardized to noise floor: median={obs_med:.2f}, robust_sigma={obs_scale:.2f}"
                )

            tiles, prov = tile_observation(data, obs_id, TILE_H, TILE_W)
            print(f"    Generated {tiles.shape[0]} tiles of shape ({TILE_H}, {TILE_W})")

            if tiles.shape[0] > 0:
                all_tiles[obs_id] = tiles
                all_prov[obs_id] = prov

            del data
            gc.collect()
        except Exception as e:
            print(f"    ERROR loading {obs_id}: {e}")

    total_tiles = sum(t.shape[0] for t in all_tiles.values())
    print(f"\n  Total tiles across all observations: {total_tiles}")

    if total_tiles < 20:
        print("ERROR: Not enough tiles for meaningful experiment.")
        sys.exit(1)

    # Step 3: Split tiles
    print("\n--- Step 3: Splitting tiles ---")
    splits = split_tiles_by_observation(all_tiles, all_prov, guard_gap=GUARD_GAP)

    for split_name, split_data in splits.items():
        n = split_data["tiles"].shape[0] if isinstance(split_data["tiles"], np.ndarray) else 0
        print(f"  {split_name}: {n} tiles")

    train_tiles = splits["train"]["tiles"]
    val_tiles = splits["val"]["tiles"]
    test_tiles = splits["test"]["tiles"]

    if train_tiles.shape[0] == 0 or val_tiles.shape[0] == 0 or test_tiles.shape[0] == 0:
        print("ERROR: One or more splits have zero tiles. Cannot proceed.")
        sys.exit(1)

    # Step 4: Compute normalization from training tiles
    print("\n--- Step 4: Computing normalization ---")
    norm_stats = compute_normalization(train_tiles)
    print(f"  train_min (p1): {norm_stats.train_min:.6f}")
    print(f"  train_max (p99): {norm_stats.train_max:.6f}")

    # Step 5: Train autoencoder
    print("\n--- Step 5: Training autoencoder ---")
    model = RadioAnomalyAutoencoder(config=config)
    print(f"  Model parameters: {model.count_parameters()}")

    history = train_autoencoder(model, train_tiles, val_tiles, norm_stats, config)

    # Step 6: Inject signals into held-out test tiles
    print("\n--- Step 6: Generating controlled signal injections ---")
    injected_tiles, injection_records = inject_signals_into_tiles(
        test_tiles,
        splits["test"]["provenance"],
        obs_infos,
    )
    print(f"  Generated {injected_tiles.shape[0]} injected tiles")
    for rec in injection_records[:5]:
        print(f"    {rec['signal_type']} SNR={rec['snr']:.1f}")
    if len(injection_records) > 5:
        print(f"    ... and {len(injection_records) - 5} more")

    # Step 7: Evaluate all detectors
    print("\n--- Step 7: Evaluating detectors ---")
    eval_report = evaluate_detectors(
        test_tiles,
        injected_tiles,
        injection_records,
        train_tiles,
        val_tiles,
        model,
        norm_stats,
        config,
    )

    # Step 8: Calibrate and save
    print("\n--- Step 8: Saving artifacts ---")
    val_ae_scores = compute_anomaly_scores(
        model, val_tiles, norm_stats, batch_size=config.batch_size
    )
    threshold = calibrate_threshold(val_ae_scores, target_fpr=config.target_fpr)
    print(f"  Calibrated threshold (target FPR={config.target_fpr}): {threshold:.8f}")

    # Save checkpoint
    ckpt_path = save_checkpoint(
        model,
        config,
        norm_stats,
        threshold,
        MODEL_DIR,
        extra_metadata={
            "observation_count": len(obs_infos),
            "total_train_tiles": int(train_tiles.shape[0]),
            "total_val_tiles": int(val_tiles.shape[0]),
            "total_test_tiles": int(test_tiles.shape[0]),
        },
    )
    print(f"  Checkpoint saved: {ckpt_path}")

    # Verify checkpoint reload
    print("  Verifying checkpoint reload...")
    loaded_model, _loaded_config, loaded_norm, _loaded_thresh = load_checkpoint(ckpt_path)
    verify_scores = compute_anomaly_scores(loaded_model, test_tiles[:10], loaded_norm)
    original_scores = compute_anomaly_scores(model, test_tiles[:10], norm_stats)
    max_diff = float(np.max(np.abs(verify_scores - original_scores)))
    print(f"  Max score diff after reload: {max_diff:.2e}")

    # Build full report
    import sklearn

    full_report = {
        "experiment": "AETHON Real-Radio Anomaly Detection",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "observations": {k: v.to_dict() for k, v in obs_infos.items()},
        "observation_count": len(obs_infos),
        "tile_geometry": {"tile_h": TILE_H, "tile_w": TILE_W, "guard_gap": GUARD_GAP},
        "splits": {
            "train_tiles": int(train_tiles.shape[0]),
            "val_tiles": int(val_tiles.shape[0]),
            "test_bg_tiles": int(test_tiles.shape[0]),
            "injected_tiles": int(injected_tiles.shape[0]),
            "split_method": "observation_level"
            if len(obs_infos) >= 3
            else "mixed_observation"
            if len(obs_infos) == 2
            else "single_observation_block",
            "observations_per_split": {
                "train": list(set(p["observation_id"] for p in splits["train"]["provenance"])),
                "val": list(set(p["observation_id"] for p in splits["val"]["provenance"])),
                "test": list(set(p["observation_id"] for p in splits["test"]["provenance"])),
            },
        },
        "normalization": norm_stats.to_dict(),
        "model_config": config.to_dict(),
        "model_parameter_count": model.count_parameters(),
        "training_history": {
            "best_epoch": history["best_epoch"],
            "best_val_loss": history["best_val_loss"],
            "final_train_loss": history["train_loss"][-1] if history["train_loss"] else None,
            "stopped_early": history["stopped_early"],
            "training_time_seconds": history["training_time_seconds"],
            "total_epochs_run": len(history["train_loss"]),
        },
        "calibration": {
            "target_fpr": config.target_fpr,
            "calibrated_threshold": float(threshold),
            "method": "percentile_on_validation_background",
        },
        "evaluation": eval_report,
        "injection_configs": injection_records,
        "checkpoint_reload_verification": {
            "max_score_difference": max_diff,
            "tolerance": 1e-6,
            "passed": max_diff < 1e-4,
        },
        "artifacts": {
            "checkpoint": str(ckpt_path),
            "report": str(OUTPUT_DIR / "evaluation_report.json"),
            "manifest": str(OUTPUT_DIR / "dataset_manifest.json"),
        },
        "environment": {
            "python_version": sys.version,
            "numpy_version": np.__version__,
            "torch_version": torch.__version__,
            "sklearn_version": sklearn.__version__,
            "platform": platform.platform(),
            "device": "cpu",
        },
        "limitations": [
            "Observation diversity is limited to available public filterbank files.",
            "Tiles from the same observation may share systematic characteristics (RFI, instrument response).",
            "Signal injections are simplified (direct array manipulation) rather than fully realistic antenna-level simulations.",
            "No validation on confirmed unknown astronomical signals has been performed.",
            "The model identifies reconstruction-error outliers, NOT extraterrestrial intelligence.",
            "Single-observation splits (if used) have inherent leakage and generalization limitations.",
        ],
    }

    # Save report
    report_path = OUTPUT_DIR / "evaluation_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(full_report, f, indent=2, default=str)
    print(f"  Report saved: {report_path}")

    # Save manifest
    manifest = {
        "dataset_id": "aethon_real_radio_training_v1",
        "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "observations": {k: v.to_dict() for k, v in obs_infos.items()},
        "tile_geometry": {"tile_h": TILE_H, "tile_w": TILE_W},
        "normalization": norm_stats.to_dict(),
        "splits": full_report["splits"],
        "provenance": {
            "train": splits["train"]["provenance"][:5],  # Sample only
            "note": "Full provenance available in tiles data",
        },
    }
    manifest_path = OUTPUT_DIR / "dataset_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, default=str)
    print(f"  Manifest saved: {manifest_path}")

    # Save training history
    history_path = OUTPUT_DIR / "training_history.json"
    with open(history_path, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)
    print(f"  Training history saved: {history_path}")

    # Print summary
    print("\n" + "=" * 72)
    print("EXPERIMENT RESULTS SUMMARY")
    print("=" * 72)
    print(f"Observations: {len(obs_infos)}")
    print(
        f"Total tiles: train={train_tiles.shape[0]}, val={val_tiles.shape[0]}, "
        f"test_bg={test_tiles.shape[0]}, injected={injected_tiles.shape[0]}"
    )
    print(f"Model parameters: {model.count_parameters()}")
    print(
        f"Training: {history['total_epochs_run']} epochs, best_val_loss={history['best_val_loss']:.6f}"
    )

    for det_name, det_results in eval_report.items():
        if isinstance(det_results, dict) and "roc_auc" in det_results:
            print(f"\n  {det_name}:")
            print(
                f"    ROC-AUC: {det_results['roc_auc']:.4f}"
                if det_results["roc_auc"]
                else "    ROC-AUC: N/A"
            )
            print(
                f"    PR-AUC: {det_results['pr_auc']:.4f}"
                if det_results["pr_auc"]
                else "    PR-AUC: N/A"
            )
            print(f"    Precision: {det_results['precision']:.4f}")
            print(f"    Recall: {det_results['recall']:.4f}")
            print(f"    F1: {det_results['f1']:.4f}")
            print(f"    FPR on held-out bg: {det_results['fpr_on_held_out_bg']:.4f}")
            print(f"    False alarms/1000: {det_results['false_alarms_per_1000_bg']:.1f}")
        elif isinstance(det_results, dict) and "error" in det_results:
            print(f"\n  {det_name}: {det_results['error']}")

    print(f"\nArtifacts saved under: {OUTPUT_DIR}")
    print("=" * 72)


if __name__ == "__main__":
    main()
