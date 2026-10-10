#!/usr/bin/env python3
"""AETHON Real-Radio Anomaly Model — Training, Model Selection & Signal Characterization.

Phase A: Bounded chunk loading, header validation, frequency-axis reversal, robust standardization.
Phase B: Multi-telescope real observational data (GBT, Parkes, GMRT).
Phase C: Observation-grouped 4-way partitioning (Train, Val, Calibration, Test) and 9-family signal injection suite.
Phase D & E: Model comparison (Autoencoder vs Statistical Baseline vs Isolation Forest vs Morphology CNN)
             with independently calibrated thresholds on held-out calibration background.
Phase F: Checkpoint saving and reload parity verification.
Phase G: Signal characterization documentation and disclaimer on message decoding.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Any

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

# Ensure backend directory is in sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.detection.baseline import StatisticalBaselineDetector
from app.detection.features import extract_window_features
from app.detection.isolation_forest import IsolationForestDetector
from app.detection.real_radio_anomaly import (
    AnomalyModelConfig,
    NormalizationStats,
    RadioAnomalyAutoencoder,
    calibrate_threshold,
    compute_anomaly_scores,
    inspect_observation_file,
    load_checkpoint,
    load_observation_tiles,
    save_checkpoint,
)

# ---------------------------------------------------------------------------
# Configuration & Constants
# ---------------------------------------------------------------------------
RAW_DIR = BACKEND_DIR / "data" / "real_radio_training" / "raw"
OUTPUT_DIR = BACKEND_DIR / "data" / "real_radio_training"
MODEL_DIR = OUTPUT_DIR / "model"

TILE_H: int = 32
TILE_W: int = 32
GUARD_CHANNELS: int = 512  # 16 tiles guard gap between GBT train subband and test subband

INJECTION_SNRS: list[float] = [3.0, 5.0, 8.0, 12.0, 20.0]


def set_seeds(seed: int = 42) -> None:
    """Set deterministic seeds for reproducibility."""
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


# ---------------------------------------------------------------------------
# Signal Injection Suite across 9 Test Families (Phase C.2)
# ---------------------------------------------------------------------------
def generate_injected_test_suite(
    test_tiles: np.ndarray,
    test_prov: list[dict[str, Any]],
    n_per_family: int = 20,
    snr_levels: list[float] | None = None,
    seed: int = 42,
) -> tuple[np.ndarray, list[dict[str, Any]]]:
    """Inject controlled signals into copies of held-out real background tiles across 9 test families.

    Test Families:
      1. noise_control: Pure real background (SNR=0), negative control.
      2. stationary_tone: Persistent narrowband unmodulated tone.
      3. drifting_tone_pos: Positive frequency-drifting tone (chirp/drift).
      4. drifting_tone_neg: Negative frequency-drifting tone.
      5. drift_rate_sweep: Extreme drift rates (slow, fast, edge-of-window).
      6. burst: Short-duration and longer-duration localized transients.
      7. broadband: Wide-band emission spanning across channels.
      8. overlapping: Intersecting tones (stationary + drifting) and boundary tracks.
      9. rfi_comb: Multi-carrier periodic comb confounding interference.

    SNR Definition:
      Linear amplitude A = SNR * sigma_local, where background tiles have been
      standardized to unit local noise (sigma_local ~ 1.0).
    """
    if snr_levels is None:
        snr_levels = INJECTION_SNRS

    rng = np.random.default_rng(seed)
    n_bg = len(test_tiles)
    if n_bg == 0:
        return np.empty((0, TILE_H, TILE_W), dtype=np.float32), []

    injected_tiles: list[np.ndarray] = []
    injection_records: list[dict[str, Any]] = []

    family_definitions = [
        "noise_control",
        "stationary_tone",
        "drifting_tone_pos",
        "drifting_tone_neg",
        "drift_rate_sweep",
        "burst",
        "broadband",
        "overlapping",
        "rfi_comb",
    ]

    tile_idx_counter = 0

    for fam in family_definitions:
        for i in range(n_per_family):
            # Select independent held-out tile
            base_idx = tile_idx_counter % n_bg
            tile_idx_counter += 1

            tile_copy = test_tiles[base_idx].copy()
            prov = test_prov[base_idx] if base_idx < len(test_prov) else {}

            snr = 0.0 if fam == "noise_control" else float(snr_levels[i % len(snr_levels)])
            amp = float(snr)  # Since tile is standardized with sigma ~ 1.0

            th, tw = TILE_H, TILE_W
            meta_record: dict[str, Any] = {
                "signal_family": fam,
                "snr": snr,
                "amplitude": amp,
                "source_tile_idx": base_idx,
                "observation_id": prov.get("observation_id", "unknown"),
                "telescope": prov.get("telescope_name", "unknown"),
                "tsamp_s": prov.get("tsamp_s", 1.0),
                "channel_spacing_hz": prov.get("channel_spacing_hz", 1.0),
            }

            if fam == "noise_control":
                meta_record["description"] = "Noise-only negative control (no signal injected)"

            elif fam == "stationary_tone":
                c0 = int(rng.integers(4, tw - 4))
                tile_copy[:, c0] += amp
                meta_record["description"] = f"Stationary narrowband tone at channel {c0}"
                meta_record["drift_rate_hz_per_sec"] = 0.0

            elif fam == "drifting_tone_pos":
                c_start = int(rng.integers(2, tw // 2))
                c_end = int(rng.integers(tw // 2, tw - 2))
                for r in range(th):
                    c = int(c_start + (c_end - c_start) * (r / th))
                    c = min(max(c, 0), tw - 1)
                    tile_copy[r, c] += amp
                meta_record["description"] = (
                    f"Positive drifting tone from chan {c_start} to {c_end}"
                )
                meta_record["drift_rate_channels_per_step"] = (c_end - c_start) / th

            elif fam == "drifting_tone_neg":
                c_start = int(rng.integers(tw // 2, tw - 2))
                c_end = int(rng.integers(2, tw // 2))
                for r in range(th):
                    c = int(c_start + (c_end - c_start) * (r / th))
                    c = min(max(c, 0), tw - 1)
                    tile_copy[r, c] += amp
                meta_record["description"] = (
                    f"Negative drifting tone from chan {c_start} to {c_end}"
                )
                meta_record["drift_rate_channels_per_step"] = (c_end - c_start) / th

            elif fam == "drift_rate_sweep":
                mode = i % 3
                if mode == 0:
                    c0 = int(rng.integers(8, tw - 8))
                    for r in range(th):
                        c = int(c0 + (2.0 * r / th))
                        tile_copy[r, min(c, tw - 1)] += amp
                    meta_record["description"] = "Slow drift (2 channels total displacement)"
                elif mode == 1:
                    for r in range(th):
                        c = int(2 + (28.0 * r / th))
                        tile_copy[r, min(c, tw - 1)] += amp
                    meta_record["description"] = "Fast drift (28 channels across window)"
                else:
                    edge_c = 1 if (i % 2 == 0) else tw - 2
                    tile_copy[:, edge_c] += amp
                    meta_record["description"] = f"Edge-of-window track at channel {edge_c}"

            elif fam == "burst":
                duration = 3 if (i % 2 == 0) else 12
                r0 = int(rng.integers(4, th - duration - 4))
                c0 = int(rng.integers(6, tw - 8))
                tile_copy[r0 : r0 + duration, c0 : c0 + 4] += amp
                meta_record["description"] = (
                    f"Burst transient (duration {duration} samples, 4 channels)"
                )

            elif fam == "broadband":
                r0 = int(rng.integers(6, th - 6))
                tile_copy[r0 : r0 + 2, 8:24] += amp
                meta_record["description"] = (
                    f"Broadband emission spanning channels 8-24 at row {r0}"
                )

            elif fam == "overlapping":
                c_tone = 10
                tile_copy[:, c_tone] += amp * 0.7
                for r in range(th):
                    c_drift = int(4 + (24.0 * r / th))
                    tile_copy[r, min(c_drift, tw - 1)] += amp * 0.7
                meta_record["description"] = "Intersecting stationary tone and drifting tone"

            elif fam == "rfi_comb":
                comb_channels = [6, 12, 18, 24]
                for cc in comb_channels:
                    tile_copy[:, cc] += amp * 0.7
                meta_record["description"] = "Multi-carrier periodic comb RFI pattern"

            injected_tiles.append(tile_copy)
            injection_records.append(meta_record)

    return np.array(injected_tiles, dtype=np.float32), injection_records


# ---------------------------------------------------------------------------
# Training Loop for Autoencoder
# ---------------------------------------------------------------------------
def train_autoencoder(
    model: RadioAnomalyAutoencoder,
    train_tiles: np.ndarray,
    val_tiles: np.ndarray,
    norm_stats: NormalizationStats,
    config: AnomalyModelConfig,
) -> dict[str, Any]:
    """Train the convolutional autoencoder on background tiles with validation early stopping."""
    train_norm = norm_stats.normalize(train_tiles[:, np.newaxis, :, :])
    val_norm = norm_stats.normalize(val_tiles[:, np.newaxis, :, :])

    train_ds = TensorDataset(torch.from_numpy(train_norm).float())
    val_ds = TensorDataset(torch.from_numpy(val_norm).float())

    train_loader = DataLoader(train_ds, batch_size=config.batch_size, shuffle=True, drop_last=False)
    val_loader = DataLoader(val_ds, batch_size=config.batch_size, shuffle=False)

    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=config.learning_rate,
        weight_decay=config.weight_decay,
    )
    criterion = nn.MSELoss()

    history: dict[str, Any] = {
        "train_loss": [],
        "val_loss": [],
        "best_epoch": 0,
        "best_val_loss": float("inf"),
        "stopped_early": False,
    }

    best_weights = None
    patience_counter = 0
    t_start = time.time()

    print(f"  Training: {len(train_tiles)} train tiles, {len(val_tiles)} val tiles")
    print(f"  Model parameter count: {model.count_parameters():,}")
    print(f"  Max epochs: {config.max_epochs}, Patience: {config.patience}")

    for epoch in range(config.max_epochs):
        model.train()
        train_batch_losses: list[float] = []
        for (batch,) in train_loader:
            optimizer.zero_grad()
            recon = model(batch)
            loss = criterion(recon, batch)
            loss.backward()
            optimizer.step()
            train_batch_losses.append(loss.item())

        train_loss = float(np.mean(train_batch_losses))

        model.eval()
        val_batch_losses: list[float] = []
        with torch.no_grad():
            for (batch,) in val_loader:
                recon = model(batch)
                loss = criterion(recon, batch)
                val_batch_losses.append(loss.item())

        val_loss = float(np.mean(val_batch_losses))

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)

        if (epoch + 1) % 5 == 0 or epoch == 0:
            print(
                f"    Epoch {epoch + 1:2d}/{config.max_epochs}: "
                f"train_loss={train_loss:.6f}, val_loss={val_loss:.6f}"
            )

        if val_loss < history["best_val_loss"]:
            history["best_val_loss"] = val_loss
            history["best_epoch"] = epoch + 1
            best_weights = {k: v.clone() for k, v in model.state_dict().items()}
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= config.patience:
                print(f"    Early stopping triggered at epoch {epoch + 1}")
                history["stopped_early"] = True
                break

    if best_weights is not None:
        model.load_state_dict(best_weights)
    model.eval()

    history["training_time_seconds"] = round(time.time() - t_start, 2)
    history["total_epochs_run"] = len(history["train_loss"])
    print(
        f"  Best epoch: {history['best_epoch']} with val_loss={history['best_val_loss']:.6f} "
        f"({history['training_time_seconds']:.1f}s)"
    )

    return history


# ---------------------------------------------------------------------------
# Multi-Detector Benchmark Evaluation on Identical Held-Out Test Set
# ---------------------------------------------------------------------------
def run_model_comparison(
    train_tiles: np.ndarray,
    cal_tiles: np.ndarray,
    test_bg_tiles: np.ndarray,
    injected_tiles: np.ndarray,
    injection_records: list[dict[str, Any]],
    ae_model: RadioAnomalyAutoencoder,
    norm_stats: NormalizationStats,
    target_fpr: float = 0.01,
) -> dict[str, Any]:
    """Evaluate Autoencoder, Statistical Baseline, and Isolation Forest on identical held-out test data."""
    n_bg = len(test_bg_tiles)
    n_inj = len(injected_tiles)
    all_test_tiles = np.concatenate([test_bg_tiles, injected_tiles], axis=0)
    labels = np.array([0] * n_bg + [1] * n_inj, dtype=int)

    report: dict[str, Any] = {}

    print("\n--- Running Multi-Detector Benchmark on Held-Out Test Set ---")
    print(f"  Test background tiles: {n_bg}, Injected tiles: {n_inj}, Total: {len(labels)}")

    # 1. Real-Radio Autoencoder
    print("  1. Evaluating RadioAnomalyAutoencoder...")
    t0 = time.time()
    cal_ae_scores = compute_anomaly_scores(ae_model, cal_tiles, norm_stats, batch_size=64)
    ae_thresh = calibrate_threshold(cal_ae_scores, target_fpr=target_fpr)

    ae_test_scores = compute_anomaly_scores(ae_model, all_test_tiles, norm_stats, batch_size=64)
    ae_latency = time.time() - t0
    ae_preds = (ae_test_scores >= ae_thresh).astype(int)

    report["autoencoder"] = _compile_detector_metrics(
        labels=labels,
        scores=ae_test_scores,
        predictions=ae_preds,
        threshold=ae_thresh,
        latency_sec=ae_latency,
        injection_records=injection_records,
        n_bg=n_bg,
        n_inj=n_inj,
    )

    # Extract features for Statistical Baseline & Isolation Forest
    print("  Extracting features for Statistical Baseline & Isolation Forest...")
    train_sample_idx = np.random.choice(
        len(train_tiles), size=min(2000, len(train_tiles)), replace=False
    )
    train_feat_list = [extract_window_features(train_tiles[i]) for i in train_sample_idx]

    cal_sample_idx = np.random.choice(len(cal_tiles), size=min(1500, len(cal_tiles)), replace=False)
    cal_feat_list = [extract_window_features(cal_tiles[i]) for i in cal_sample_idx]

    t_feat_start = time.time()
    test_feat_list = [extract_window_features(tile) for tile in all_test_tiles]
    feat_time_sec = time.time() - t_feat_start

    # 2. Statistical Baseline Detector
    print("  2. Evaluating StatisticalBaselineDetector...")
    t0 = time.time()
    baseline_det = StatisticalBaselineDetector()
    baseline_det.fit(train_feat_list)

    cal_base_evidence = baseline_det.score_features(cal_feat_list)
    cal_base_scores = np.array([e.anomaly_score for e in cal_base_evidence])
    base_thresh = float(np.percentile(cal_base_scores, (1.0 - target_fpr) * 100.0))

    test_base_evidence = baseline_det.score_features(test_feat_list)
    test_base_scores = np.array([e.anomaly_score for e in test_base_evidence])
    base_latency = (time.time() - t0) + feat_time_sec
    base_preds = (test_base_scores >= base_thresh).astype(int)

    report["statistical_baseline"] = _compile_detector_metrics(
        labels=labels,
        scores=test_base_scores,
        predictions=base_preds,
        threshold=base_thresh,
        latency_sec=base_latency,
        injection_records=injection_records,
        n_bg=n_bg,
        n_inj=n_inj,
    )

    # 3. Isolation Forest Detector
    print("  3. Evaluating IsolationForestDetector...")
    t0 = time.time()
    if_det = IsolationForestDetector()
    if_det.fit(train_feat_list)

    cal_if_evidence = if_det.score_features(cal_feat_list)
    cal_if_scores = np.array([e.anomaly_score for e in cal_if_evidence])
    if_thresh = float(np.percentile(cal_if_scores, (1.0 - target_fpr) * 100.0))

    test_if_evidence = if_det.score_features(test_feat_list)
    test_if_scores = np.array([e.anomaly_score for e in test_if_evidence])
    if_latency = (time.time() - t0) + feat_time_sec
    if_preds = (test_if_scores >= if_thresh).astype(int)

    report["isolation_forest"] = _compile_detector_metrics(
        labels=labels,
        scores=test_if_scores,
        predictions=if_preds,
        threshold=if_thresh,
        latency_sec=if_latency,
        injection_records=injection_records,
        n_bg=n_bg,
        n_inj=n_inj,
    )

    return report


def _compile_detector_metrics(
    labels: np.ndarray,
    scores: np.ndarray,
    predictions: np.ndarray,
    threshold: float,
    latency_sec: float,
    injection_records: list[dict[str, Any]],
    n_bg: int,
    n_inj: int,
) -> dict[str, Any]:
    """Compile standard metrics for one detector."""
    from sklearn.metrics import (
        average_precision_score,
        precision_recall_fscore_support,
        roc_auc_score,
    )

    try:
        roc_auc = float(roc_auc_score(labels, scores))
    except Exception:
        roc_auc = None

    try:
        pr_auc = float(average_precision_score(labels, scores))
    except Exception:
        pr_auc = None

    prec, rec, f1, _ = precision_recall_fscore_support(
        labels, predictions, average="binary", zero_division=0
    )

    bg_scores = scores[:n_bg]
    inj_scores = scores[n_bg:]

    fp_on_bg = int(np.sum(bg_scores >= threshold))
    fpr_bg = float(fp_on_bg / n_bg) if n_bg > 0 else 0.0
    false_alarms_per_1000 = round(fpr_bg * 1000.0, 2)

    recall_by_family: dict[str, dict[str, Any]] = {}
    recall_by_snr: dict[str, dict[str, Any]] = {}

    for i, rec_dict in enumerate(injection_records):
        fam = rec_dict["signal_family"]
        snr = rec_dict["snr"]
        detected = bool(inj_scores[i] >= threshold)

        if fam not in recall_by_family:
            recall_by_family[fam] = {"detected": 0, "total": 0, "recall": 0.0}
        recall_by_family[fam]["total"] += 1
        if detected:
            recall_by_family[fam]["detected"] += 1

        snr_key = f"SNR_{snr:.1f}"
        if snr_key not in recall_by_snr:
            recall_by_snr[snr_key] = {"detected": 0, "total": 0, "recall": 0.0}
        recall_by_snr[snr_key]["total"] += 1
        if detected:
            recall_by_snr[snr_key]["detected"] += 1

    for _fam, stats in recall_by_family.items():
        stats["recall"] = (
            round(stats["detected"] / stats["total"], 4) if stats["total"] > 0 else 0.0
        )

    for _snr_k, stats in recall_by_snr.items():
        stats["recall"] = (
            round(stats["detected"] / stats["total"], 4) if stats["total"] > 0 else 0.0
        )

    throughput = round(len(labels) / max(1e-4, latency_sec), 1)

    return {
        "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
        "pr_auc": round(pr_auc, 4) if pr_auc is not None else None,
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1": round(float(f1), 4),
        "threshold_used": float(threshold),
        "fpr_on_held_out_bg": round(fpr_bg, 4),
        "false_alarms_per_1000_bg": false_alarms_per_1000,
        "fp_count_on_bg": fp_on_bg,
        "n_background_test": n_bg,
        "n_injected_test": n_inj,
        "recall_by_family": recall_by_family,
        "recall_by_snr": recall_by_snr,
        "inference_latency_seconds": round(latency_sec, 3),
        "throughput_tiles_per_sec": throughput,
    }


# ---------------------------------------------------------------------------
# Main Workflow
# ---------------------------------------------------------------------------
def main() -> None:
    print("=" * 80)
    print("AETHON Real-Radio Model Training, Model Selection & Evaluation")
    print("=" * 80)

    config = AnomalyModelConfig(
        tile_h=TILE_H,
        tile_w=TILE_W,
        latent_dim=64,
        enc_channels=(16, 32, 32),
        batch_size=64,
        max_epochs=40,
        patience=8,
        seed=42,
        target_fpr=0.01,
    )
    set_seeds(config.seed)

    # 1. Discover Observations
    print("\n[Phase A/B] Discovering Real Observational Filterbank Files...")
    obs_files = sorted(RAW_DIR.glob("*.fil"))
    if not obs_files:
        print(f"ERROR: No observation files found in {RAW_DIR}")
        sys.exit(1)

    obs_metadata: dict[str, Any] = {}
    for p in obs_files:
        meta = inspect_observation_file(p)
        obs_metadata[meta.observation_id] = meta
        print(
            f"  Observation: {meta.observation_id} | Telescope: {meta.telescope_name} | "
            f"Source: {meta.source_name} | Chans: {meta.nchans} | Bits: {meta.nbits} | "
            f"Size: {meta.file_size_bytes:,} B"
        )

    # 2. Partition Strategy (Phase A.2)
    print("\n[Phase A.2] Loading Bounded Observation Tiles into 4-Way Grouped Partitions...")

    gbt_meta = obs_metadata.get("blc04_guppi_57563_69862_HIP35136_0011.gpuspec.0002")
    gmrt_meta = obs_metadata.get("gmrt_your_28")
    parkes1_meta = obs_metadata.get("parkes_8bit_1")
    parkes2_meta = obs_metadata.get("parkes_8bit_2")

    if not (gbt_meta and gmrt_meta and parkes1_meta and parkes2_meta):
        print("ERROR: Required real observational files missing in raw directory.")
        sys.exit(1)

    # Training Split
    print("  Loading Training Partition (GBT subbands 0..49152 + GMRT)...")
    gbt_train_tiles, _gbt_train_prov = load_observation_tiles(
        gbt_meta.filepath,
        obs_id=gbt_meta.observation_id,
        subband_f_range=(0, 49152),
    )
    gmrt_train_tiles, _gmrt_train_prov = load_observation_tiles(
        gmrt_meta.filepath,
        obs_id=gmrt_meta.observation_id,
    )

    train_tiles = np.concatenate([gbt_train_tiles, gmrt_train_tiles], axis=0)
    print(
        f"    Train tiles: {len(train_tiles)} ({len(gbt_train_tiles)} GBT + {len(gmrt_train_tiles)} GMRT)"
    )

    # Validation Split
    print("  Loading Validation Partition (Parkes 1 / Crab Pulsar)...")
    val_tiles, _val_prov = load_observation_tiles(
        parkes1_meta.filepath,
        obs_id=parkes1_meta.observation_id,
    )
    print(f"    Val tiles: {len(val_tiles)} (Parkes 1)")

    # Calibration Split
    print("  Loading Calibration Partition (Parkes 2 / Crab Pulsar Subband 2)...")
    cal_tiles, _cal_prov = load_observation_tiles(
        parkes2_meta.filepath,
        obs_id=parkes2_meta.observation_id,
    )
    print(f"    Calibration tiles: {len(cal_tiles)} (Parkes 2)")

    # Locked Held-Out Test Split
    print(
        f"  Loading Locked Held-Out Test Partition (GBT subbands 49664..65536, guard gap {GUARD_CHANNELS} chans)..."
    )
    test_tiles, test_prov = load_observation_tiles(
        gbt_meta.filepath,
        obs_id=gbt_meta.observation_id,
        subband_f_range=(49152 + GUARD_CHANNELS, 65536),
    )
    print(f"    Held-out Test background tiles: {len(test_tiles)} (GBT held-out)")

    # 3. Fit Training-Only Normalization Statistics (Phase A.3)
    print("\n[Phase A.3] Computing Training-Only Normalization Statistics...")
    norm_stats = NormalizationStats.compute(train_tiles, p_lo=1.0, p_hi=99.0)
    print(f"  Training p1: {norm_stats.train_min:.4f}, p99: {norm_stats.train_max:.4f}")

    # 4. Train Autoencoder
    print("\n[Phase D.1] Training Convolutional Autoencoder...")
    ae_model = RadioAnomalyAutoencoder(config=config)
    training_history = train_autoencoder(ae_model, train_tiles, val_tiles, norm_stats, config)

    # 5. Injected Signal Suite (Phase C.2)
    print("\n[Phase C.2] Generating 9-Family Signal Injections on Held-Out Test Background...")
    injected_tiles, injection_records = generate_injected_test_suite(
        test_tiles=test_tiles,
        test_prov=test_prov,
        n_per_family=20,
        snr_levels=INJECTION_SNRS,
        seed=config.seed,
    )
    print(f"  Generated {len(injected_tiles)} controlled injected test tiles across 9 families.")

    # 6. Model Selection & Benchmark (Phase D & E)
    benchmark_report = run_model_comparison(
        train_tiles=train_tiles,
        cal_tiles=cal_tiles,
        test_bg_tiles=test_tiles,
        injected_tiles=injected_tiles,
        injection_records=injection_records,
        ae_model=ae_model,
        norm_stats=norm_stats,
        target_fpr=config.target_fpr,
    )

    # 7. Checkpoint Lifecycle & Reload Parity (Phase F)
    print("\n[Phase F] Saving Checkpoint & Verifying Reload Parity...")
    cal_scores = compute_anomaly_scores(ae_model, cal_tiles, norm_stats, batch_size=64)
    calibrated_ae_threshold = calibrate_threshold(cal_scores, target_fpr=config.target_fpr)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    ckpt_path = save_checkpoint(
        model=ae_model,
        config=config,
        norm_stats=norm_stats,
        threshold=calibrated_ae_threshold,
        output_dir=MODEL_DIR,
        extra_metadata={
            "training_commit": "0564cb7",
            "observation_count": len(obs_metadata),
            "total_usable_tiles": len(train_tiles)
            + len(val_tiles)
            + len(cal_tiles)
            + len(test_tiles),
            "target_fpr": config.target_fpr,
            "observations_used": list(obs_metadata.keys()),
        },
    )
    print(f"  Saved model checkpoint to: {ckpt_path}")

    # Reload parity check
    reloaded_model, _reloaded_cfg, reloaded_norm, _reloaded_thresh = load_checkpoint(ckpt_path)
    sample_eval = test_tiles[:20]
    orig_scores = compute_anomaly_scores(ae_model, sample_eval, norm_stats)
    reloaded_scores = compute_anomaly_scores(reloaded_model, sample_eval, reloaded_norm)
    score_diff = float(np.max(np.abs(orig_scores - reloaded_scores)))
    reload_passed = score_diff < 1e-5
    print(
        f"  Reload numerical parity verification: max_abs_diff={score_diff:.2e} -> Passed: {reload_passed}"
    )

    # 8. Save Machine-Readable Manifests and Reports
    print("\n[Phase 11] Generating Comprehensive Manifests and Evaluation Reports...")
    manifest_data = {
        "dataset_id": "aethon_real_radio_training_v2",
        "created_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "observations": {k: v.to_dict() for k, v in obs_metadata.items()},
        "total_usable_tiles": len(train_tiles) + len(val_tiles) + len(cal_tiles) + len(test_tiles),
        "splits": {
            "train_tiles": len(train_tiles),
            "val_tiles": len(val_tiles),
            "calibration_tiles": len(cal_tiles),
            "test_bg_tiles": len(test_tiles),
            "injected_tiles": len(injected_tiles),
            "guard_channels": GUARD_CHANNELS,
        },
        "normalization": norm_stats.to_dict(),
    }
    with open(OUTPUT_DIR / "dataset_manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2, default=str)

    evaluation_report_data = {
        "experiment": "AETHON Real-Radio Model Training & Selection",
        "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "platform": {
            "python": sys.version,
            "torch": torch.__version__,
            "numpy": np.__version__,
            "device": "cpu",
        },
        "dataset_summary": {
            "observation_count": len(obs_metadata),
            "total_bytes": sum(m.file_size_bytes for m in obs_metadata.values()),
            "total_tiles": manifest_data["total_usable_tiles"],
            "splits": manifest_data["splits"],
        },
        "training_history": training_history,
        "calibration": {
            "target_fpr": config.target_fpr,
            "calibrated_threshold": calibrated_ae_threshold,
            "calibration_partition_size": len(cal_tiles),
        },
        "benchmark_comparison": benchmark_report,
        "reload_parity": {
            "verified": reload_passed,
            "max_difference": score_diff,
        },
        "scientific_disclaimers": [
            "Intensity filterbank spectrograms discard phase information; arbitrary communication decoding is unsupported without IQ voltage data.",
            "Anomalies indicate statistical or reconstruction deviations from learned observational background, NOT evidence of extraterrestrial technology.",
        ],
    }
    with open(OUTPUT_DIR / "evaluation_report.json", "w", encoding="utf-8") as f:
        json.dump(evaluation_report_data, f, indent=2, default=str)

    with open(OUTPUT_DIR / "training_history.json", "w", encoding="utf-8") as f:
        json.dump(training_history, f, indent=2)

    # Print Summary Table
    print("\n" + "=" * 80)
    print("MODEL COMPARISON SUMMARY ON HELD-OUT TEST DATA")
    print("=" * 80)
    print(
        f"{'Detector':<24} | {'ROC-AUC':<8} | {'PR-AUC':<8} | {'Recall':<8} | {'FPR (bg)':<9} | {'FA/1000':<8} | {'Latency':<8}"
    )
    print("-" * 80)
    for det_key, det_res in benchmark_report.items():
        print(
            f"{det_key:<24} | "
            f"{det_res.get('roc_auc')!s:<8} | "
            f"{det_res.get('pr_auc')!s:<8} | "
            f"{det_res.get('recall')!s:<8} | "
            f"{det_res.get('fpr_on_held_out_bg')!s:<9} | "
            f"{det_res.get('false_alarms_per_1000_bg')!s:<8} | "
            f"{str(det_res.get('inference_latency_seconds')) + 's':<8}"
        )
    print("=" * 80)
    print("Training and evaluation run completed successfully.")


if __name__ == "__main__":
    main()
