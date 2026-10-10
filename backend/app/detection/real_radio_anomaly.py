"""AETHON Real-Radio Anomaly Detector — Convolutional Autoencoder.

A compact normality-learning model trained on real radio-telescope observations.
It learns to reconstruct typical observational background tiles; tiles that differ
from the learned background produce higher reconstruction error, which serves as
the raw anomaly score.

Architecture:
  Encoder:  Conv2d(1→16) → BN → ReLU → Pool → Conv2d(16→32) → BN → ReLU → Pool
            → Conv2d(32→32) → BN → ReLU → AdaptiveAvgPool(4,4) → Flatten → Linear(512→64)
  Decoder:  Linear(64→512) → Reshape(32,4,4) → Upsample → ConvT(32→32) → BN → ReLU
            → Upsample → ConvT(32→16) → BN → ReLU → ConvT(16→1) → Sigmoid

Input: (batch, 1, TILE_H, TILE_W), float32, normalised to [0,1] using training statistics.
Output: Reconstruction of same shape; anomaly_score = MSE(input, reconstruction).

This module does NOT detect extraterrestrial intelligence. It flags tiles whose
reconstruction error exceeds a calibrated threshold relative to learned observational
background structure.
"""

from __future__ import annotations

import gc
import hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast

import numpy as np
import torch
import torch.nn as nn

# Default tile dimensions — must match preparation
TILE_H: int = 32
TILE_W: int = 32
LATENT_DIM: int = 64

SIGPROC_TELESCOPES: dict[int, str] = {
    0: "Fake/Simulated",
    1: "Arecibo",
    2: "Ooty",
    3: "Nancay",
    4: "Parkes (Murriyang)",
    5: "Jodrell Bank",
    6: "Green Bank Telescope (GBT)",
    7: "Giant Metrewave Radio Telescope (GMRT)",
    8: "Effelsberg",
}


def sha256_file(path: Path) -> str:
    """Compute SHA-256 hash of a file without loading it entirely into RAM."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1048576), b""):
            h.update(chunk)
    return h.hexdigest()


@dataclass
class ObservationMetadata:
    """Validated metadata for a genuine radio telescope observation."""

    observation_id: str
    filepath: Path
    telescope_id: int
    telescope_name: str
    source_name: str
    nchans: int
    nbits: int
    fch1_mhz: float
    foff_mhz: float
    tsamp_s: float
    n_ints: int
    file_size_bytes: int
    sha256: str
    is_frequency_descending: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "observation_id": self.observation_id,
            "filepath": str(self.filepath),
            "telescope_id": self.telescope_id,
            "telescope_name": self.telescope_name,
            "source_name": self.source_name,
            "nchans": self.nchans,
            "nbits": self.nbits,
            "fch1_mhz": self.fch1_mhz,
            "foff_mhz": self.foff_mhz,
            "tsamp_s": self.tsamp_s,
            "n_ints": self.n_ints,
            "file_size_bytes": self.file_size_bytes,
            "sha256": self.sha256,
            "is_frequency_descending": self.is_frequency_descending,
        }


def inspect_observation_file(filepath: Path, obs_id: str | None = None) -> ObservationMetadata:
    """Inspect and validate a genuine radio observation (.fil or .h5) header.

    Validates:
        - File exists and is non-empty.
        - nbits is in (8, 16, 32). Rejects unsupported formats (e.g. 2, 4-bit).
        - Dimensions (nchans, n_ints) and sampling metadata are positive and finite.
    """
    if not filepath.exists():
        raise FileNotFoundError(f"Observation file not found: {filepath}")
    file_size = filepath.stat().st_size
    if file_size == 0:
        raise ValueError(f"Observation file is empty (0 bytes): {filepath}")

    from blimpy import Waterfall

    try:
        wf = Waterfall(str(filepath.resolve()), load_data=False)
    except Exception as exc:
        msg = f"Failed to inspect observation header for {filepath.name}: {exc}"
        raise ValueError(msg) from exc

    h = wf.header
    nbits = int(h.get("nbits", 0))
    if nbits not in (8, 16, 32):
        raise ValueError(
            f"Unsupported bit depth nbits={nbits} in {filepath.name}. "
            f"Only 8, 16, and 32-bit observations are supported."
        )

    nchans = int(h.get("nchans", 0))
    if nchans <= 0:
        raise ValueError(f"Invalid channel count nchans={nchans} in {filepath.name}")

    foff = float(h.get("foff", 0.0))
    if foff == 0.0:
        raise ValueError(f"Invalid channel spacing foff=0.0 in {filepath.name}")

    tsamp = float(h.get("tsamp", 0.0))
    if tsamp <= 0.0:
        raise ValueError(f"Invalid sampling interval tsamp={tsamp} in {filepath.name}")

    fch1 = float(h.get("fch1", 0.0))
    tel_id = int(h.get("telescope_id", -1))
    tel_name = SIGPROC_TELESCOPES.get(tel_id, f"Telescope({tel_id})")
    src_name = str(h.get("source_name", "unknown"))

    n_ints = 0
    if hasattr(wf, "n_ints_in_file") and wf.n_ints_in_file is not None:
        n_ints = int(wf.n_ints_in_file)
    elif hasattr(wf, "container") and hasattr(wf.container, "n_ints_in_file"):
        n_ints = int(getattr(wf.container, "n_ints_in_file", 0))

    if n_ints <= 0:
        raise ValueError(f"Invalid integration count n_ints={n_ints} in {filepath.name}")

    checksum = sha256_file(filepath)
    identifier = obs_id or filepath.stem

    return ObservationMetadata(
        observation_id=identifier,
        filepath=filepath,
        telescope_id=tel_id,
        telescope_name=tel_name,
        source_name=src_name,
        nchans=nchans,
        nbits=nbits,
        fch1_mhz=fch1,
        foff_mhz=foff,
        tsamp_s=tsamp,
        n_ints=n_ints,
        file_size_bytes=file_size,
        sha256=checksum,
        is_frequency_descending=(foff < 0.0),
    )


def load_observation_tiles(
    filepath: Path,
    obs_id: str | None = None,
    tile_h: int = TILE_H,
    tile_w: int = TILE_W,
    max_tiles: int | None = None,
    chunk_t_size: int = 256,
    subband_f_range: tuple[int, int] | None = None,
    apply_standardization: bool = True,
) -> tuple[np.ndarray, list[dict[str, Any]]]:
    """Load observation data in bounded chunks and extract canonical 2D spectrogram tiles.

    Guarantees:
        - Memory bounded: only bounded chunks of the raw file are loaded at any time.
        - Canonical orientation: time increases along axis 0, frequency increases along axis 1.
          If raw foff < 0, frequency axis is reversed so frequency strictly increases.
        - Physical units preserved: frequencies in Hz, timestamps in seconds.
        - Non-finite handling: NaNs/Infs imputed with median; invalid tiles dropped.
        - Robust standardization: each chunk is standardized to (X - median) / (1.4826 * MAD).
    """
    meta = inspect_observation_file(filepath, obs_id)

    from blimpy import Waterfall

    wf = Waterfall(str(filepath.resolve()), load_data=False)
    data_offset = int(getattr(wf.container, "idx_data", 0))
    nifs = int(wf.header.get("nifs", 1))

    dtype: Any
    if meta.nbits == 32:
        dtype = np.float32
    elif meta.nbits == 16:
        dtype = np.uint16
    elif meta.nbits == 8:
        dtype = np.uint8
    else:
        raise ValueError(f"Unsupported nbits={meta.nbits}")

    f_start = 0
    f_stop = meta.nchans
    if subband_f_range is not None:
        f_start = max(0, subband_f_range[0])
        f_stop = min(meta.nchans, subband_f_range[1])

    shape = (meta.n_ints, nifs, meta.nchans)
    mm = np.memmap(
        str(filepath.resolve()),
        dtype=dtype,
        mode="r",
        offset=data_offset,
        shape=shape,
    )

    tiles_list: list[np.ndarray] = []
    prov_list: list[dict[str, Any]] = []

    n_t_chunks = int(np.ceil(meta.n_ints / chunk_t_size))

    for t_chunk_idx in range(n_t_chunks):
        if max_tiles is not None and len(tiles_list) >= max_tiles:
            break

        t0 = t_chunk_idx * chunk_t_size
        t1 = min(meta.n_ints, t0 + chunk_t_size)
        if (t1 - t0) < tile_h:
            continue

        # Bounded slice from memmap: shape (chunk_t, n_subchans)
        raw_slice = np.array(mm[t0:t1, 0, f_start:f_stop], dtype=np.float32, copy=True)

        # Canonical orientation: frequency must increase along axis 1
        if meta.is_frequency_descending:
            raw_slice = np.flip(raw_slice, axis=1)

        # Handle non-finite values
        finite_mask = np.isfinite(raw_slice)
        non_finite_count_total = int((~finite_mask).sum())
        if non_finite_count_total > 0:
            if finite_mask.any():
                fill_val = float(np.nanmedian(raw_slice[finite_mask]))
                raw_slice = np.where(finite_mask, raw_slice, fill_val)
            else:
                raw_slice = np.zeros_like(raw_slice, dtype=np.float32)

        # Robust per-observation standardization: (X - median) / sigma_mad
        if apply_standardization:
            med = float(np.nanmedian(raw_slice))
            mad = float(np.nanmedian(np.abs(raw_slice - med)))
            sigma = max(1e-12, mad * 1.4826022)
            raw_slice = (raw_slice - med) / sigma

        # Tile chunk
        chunk_nt, chunk_nf = raw_slice.shape
        n_rows = chunk_nt // tile_h
        n_cols = chunk_nf // tile_w

        # Compute physical frequency base in Hz
        if meta.is_frequency_descending:
            # fch1 is highest frequency, channel (meta.nchans - 1) is lowest
            # After flipping, channel 0 is lowest frequency
            lowest_f_mhz = meta.fch1_mhz + (meta.nchans - 1) * meta.foff_mhz
            subband_min_f_mhz = lowest_f_mhz + (meta.nchans - f_stop) * abs(meta.foff_mhz)
        else:
            subband_min_f_mhz = meta.fch1_mhz + f_start * meta.foff_mhz
        chan_bw_hz = abs(meta.foff_mhz) * 1e6

        for r in range(n_rows):
            for c in range(n_cols):
                if max_tiles is not None and len(tiles_list) >= max_tiles:
                    break

                tile = raw_slice[
                    r * tile_h : (r + 1) * tile_h, c * tile_w : (c + 1) * tile_w
                ].copy()
                tile_t0 = t0 + r * tile_h
                tile_t1 = tile_t0 + tile_h
                tile_f0 = f_start + c * tile_w
                tile_f1 = tile_f0 + tile_w

                t_min_s = float(tile_t0 * meta.tsamp_s)
                t_max_s = float(tile_t1 * meta.tsamp_s)
                f_min_hz = float((subband_min_f_mhz * 1e6) + c * tile_w * chan_bw_hz)
                f_max_hz = float(f_min_hz + tile_w * chan_bw_hz)

                tiles_list.append(tile)
                prov_list.append(
                    {
                        "observation_id": meta.observation_id,
                        "telescope_id": meta.telescope_id,
                        "telescope_name": meta.telescope_name,
                        "source_name": meta.source_name,
                        "time_start_idx": tile_t0,
                        "time_stop_idx": tile_t1,
                        "freq_start_idx": tile_f0,
                        "freq_stop_idx": tile_f1,
                        "t_min_s": t_min_s,
                        "t_max_s": t_max_s,
                        "f_min_hz": f_min_hz,
                        "f_max_hz": f_max_hz,
                        "tsamp_s": meta.tsamp_s,
                        "channel_spacing_hz": chan_bw_hz,
                        "non_finite_imputed": non_finite_count_total > 0,
                    }
                )

    del mm
    gc.collect()

    if not tiles_list:
        return np.empty((0, tile_h, tile_w), dtype=np.float32), []

    return np.array(tiles_list, dtype=np.float32), prov_list


@dataclass
class AnomalyModelConfig:
    """Documented configuration for the real-radio anomaly autoencoder."""

    tile_h: int = TILE_H
    tile_w: int = TILE_W
    latent_dim: int = LATENT_DIM
    enc_channels: tuple[int, ...] = (16, 32, 32)
    dropout_rate: float = 0.1
    learning_rate: float = 1e-3
    weight_decay: float = 1e-5
    batch_size: int = 64
    max_epochs: int = 80
    patience: int = 10
    seed: int = 42
    target_fpr: float = 0.01  # ~1% FPR on validation background for threshold selection

    def to_dict(self) -> dict[str, Any]:
        return {
            "tile_h": self.tile_h,
            "tile_w": self.tile_w,
            "latent_dim": self.latent_dim,
            "enc_channels": list(self.enc_channels),
            "dropout_rate": self.dropout_rate,
            "learning_rate": self.learning_rate,
            "weight_decay": self.weight_decay,
            "batch_size": self.batch_size,
            "max_epochs": self.max_epochs,
            "patience": self.patience,
            "seed": self.seed,
            "target_fpr": self.target_fpr,
        }


@dataclass
class NormalizationStats:
    """Training-partition normalization statistics for reproducible inference."""

    method: str = "min_max_clipped"
    train_min: float = 0.0
    train_max: float = 1.0
    clip_percentile_lo: float = 1.0
    clip_percentile_hi: float = 99.0
    description: str = (
        "Robust min-max normalization: clip to [p1, p99] from training partition, "
        "then scale to [0, 1]. Values outside this range are clamped."
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "method": self.method,
            "train_min": self.train_min,
            "train_max": self.train_max,
            "clip_percentile_lo": self.clip_percentile_lo,
            "clip_percentile_hi": self.clip_percentile_hi,
            "description": self.description,
        }

    @classmethod
    def compute(
        cls,
        data: np.ndarray,
        p_lo: float = 1.0,
        p_hi: float = 99.0,
    ) -> NormalizationStats:
        """Compute robust min-max normalization statistics from an array."""
        valid = data[np.isfinite(data)]
        if valid.size == 0:
            return cls()
        lo = float(np.percentile(valid, p_lo))
        hi = float(np.percentile(valid, p_hi))
        if hi <= lo:
            hi = lo + 1.0
        return cls(
            method="min_max_clipped",
            train_min=lo,
            train_max=hi,
            clip_percentile_lo=p_lo,
            clip_percentile_hi=p_hi,
        )

    def normalize(self, data: np.ndarray) -> np.ndarray:
        """Apply fitted normalization to data, returning float32 in [0, 1]."""
        denom = self.train_max - self.train_min
        if denom < 1e-12:
            return np.zeros_like(data, dtype=np.float32)
        result = (data.astype(np.float64) - self.train_min) / denom
        return np.clip(result, 0.0, 1.0).astype(np.float32)

    def unnormalize(self, data: np.ndarray) -> np.ndarray:
        """Invert normalization mapping [0, 1] back to original range."""
        denom = self.train_max - self.train_min
        return (data.astype(np.float64) * denom + self.train_min).astype(np.float32)


class RadioAnomalyAutoencoder(nn.Module):
    """Compact 2D convolutional autoencoder for radio spectrogram anomaly detection.

    Architecture is deliberately simple (~30k parameters) for CPU training feasibility.
    """

    def __init__(self, config: AnomalyModelConfig | None = None) -> None:
        super().__init__()
        self.config = config or AnomalyModelConfig()
        c1, c2, c3 = self.config.enc_channels

        # Encoder
        self.encoder = nn.Sequential(
            nn.Conv2d(1, c1, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(c1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(c1, c2, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(c2),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(c2, c3, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(c3),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d((4, 4)),
        )
        self.enc_flatten = nn.Flatten()
        self.enc_linear = nn.Linear(c3 * 4 * 4, self.config.latent_dim)
        self.enc_dropout = nn.Dropout(p=self.config.dropout_rate)

        # Decoder
        self.dec_linear = nn.Linear(self.config.latent_dim, c3 * 4 * 4)
        self.decoder = nn.Sequential(
            nn.Upsample(scale_factor=2, mode="nearest"),
            nn.ConvTranspose2d(c3, c2, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(c2),
            nn.ReLU(inplace=True),
            nn.Upsample(scale_factor=2, mode="nearest"),
            nn.ConvTranspose2d(c2, c1, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(c1),
            nn.ReLU(inplace=True),
            nn.Upsample(scale_factor=2, mode="nearest"),
            nn.ConvTranspose2d(c1, 1, kernel_size=3, padding=1),
            nn.Sigmoid(),
        )

    def encode(self, x: torch.Tensor) -> torch.Tensor:
        """Encode input to latent representation."""
        h = self.encoder(x)
        h = self.enc_flatten(h)
        h = self.enc_dropout(h)
        z = self.enc_linear(h)
        return cast(torch.Tensor, z)

    def decode(self, z: torch.Tensor) -> torch.Tensor:
        """Decode latent representation to reconstruction."""
        c3 = self.config.enc_channels[2]
        h = self.dec_linear(z)
        h = h.view(-1, c3, 4, 4)
        out = self.decoder(h)
        return cast(torch.Tensor, out)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Full forward pass: encode then decode."""
        z = self.encode(x)
        recon = self.decode(z)
        return recon

    def count_parameters(self) -> int:
        """Count total trainable parameters."""
        return sum(p.numel() for p in self.parameters() if p.requires_grad)


def compute_anomaly_scores(
    model: RadioAnomalyAutoencoder,
    tiles: np.ndarray,
    norm_stats: NormalizationStats,
    batch_size: int = 64,
) -> np.ndarray:
    """Compute per-tile anomaly scores (MSE reconstruction error).

    Args:
        model: Trained autoencoder in eval mode.
        tiles: Array of shape (N, tile_h, tile_w) or (N, 1, tile_h, tile_w), float32/64.
        norm_stats: Training-derived normalization statistics.
        batch_size: Inference batch size.

    Returns:
        1D numpy array of anomaly scores (MSE), shape (N,).
    """
    model.eval()

    if tiles.ndim == 3:
        tiles = tiles[:, np.newaxis, :, :]  # Add channel dim
    assert tiles.ndim == 4 and tiles.shape[1] == 1

    # Normalize using training statistics
    tiles_norm = norm_stats.normalize(tiles)
    n = tiles_norm.shape[0]
    scores = np.empty(n, dtype=np.float64)

    with torch.no_grad():
        for start in range(0, n, batch_size):
            end = min(start + batch_size, n)
            batch = torch.from_numpy(tiles_norm[start:end]).float()
            recon = model(batch)
            # Per-tile MSE
            mse = torch.mean((batch - recon) ** 2, dim=(1, 2, 3))
            scores[start:end] = mse.numpy()

    return scores


def calibrate_threshold(
    val_scores: np.ndarray,
    target_fpr: float = 0.01,
) -> float:
    """Calibrate anomaly threshold from validation background scores.

    Args:
        val_scores: Anomaly scores on validation background tiles (no injections).
        target_fpr: Target false-positive rate (fraction of background flagged).

    Returns:
        Threshold value. Scores >= threshold are flagged as anomalous.
    """
    if val_scores.size == 0:
        return float("inf")
    percentile = (1.0 - target_fpr) * 100.0
    return float(np.percentile(val_scores, percentile))


def save_checkpoint(
    model: RadioAnomalyAutoencoder,
    config: AnomalyModelConfig,
    norm_stats: NormalizationStats,
    threshold: float,
    output_dir: Path,
    extra_metadata: dict[str, Any] | None = None,
) -> Path:
    """Save model checkpoint with all metadata needed for reproducible inference.

    Returns:
        Path to the saved checkpoint file.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    ckpt_path = output_dir / "real_radio_anomaly_checkpoint.pt"

    payload = {
        "model_state_dict": model.state_dict(),
        "config": config.to_dict(),
        "normalization": norm_stats.to_dict(),
        "calibrated_threshold": threshold,
        "parameter_count": model.count_parameters(),
        "model_class": "RadioAnomalyAutoencoder",
    }
    if extra_metadata:
        payload["extra_metadata"] = extra_metadata

    torch.save(payload, ckpt_path)
    return ckpt_path


def load_checkpoint(
    ckpt_path: Path,
) -> tuple[RadioAnomalyAutoencoder, AnomalyModelConfig, NormalizationStats, float]:
    """Load a saved checkpoint and reconstruct the model for inference.

    Returns:
        (model, config, norm_stats, threshold)
    """
    payload = torch.load(ckpt_path, map_location="cpu", weights_only=False)

    config_dict = payload["config"]
    config = AnomalyModelConfig(
        tile_h=config_dict["tile_h"],
        tile_w=config_dict["tile_w"],
        latent_dim=config_dict["latent_dim"],
        enc_channels=tuple(config_dict["enc_channels"]),
        dropout_rate=config_dict["dropout_rate"],
        learning_rate=config_dict["learning_rate"],
        weight_decay=config_dict["weight_decay"],
        batch_size=config_dict["batch_size"],
        max_epochs=config_dict["max_epochs"],
        patience=config_dict["patience"],
        seed=config_dict["seed"],
        target_fpr=config_dict.get("target_fpr", 0.01),
    )

    model = RadioAnomalyAutoencoder(config=config)
    model.load_state_dict(payload["model_state_dict"])
    model.eval()

    norm_dict = payload["normalization"]
    norm_stats = NormalizationStats(
        method=norm_dict["method"],
        train_min=norm_dict["train_min"],
        train_max=norm_dict["train_max"],
        clip_percentile_lo=norm_dict["clip_percentile_lo"],
        clip_percentile_hi=norm_dict["clip_percentile_hi"],
        description=norm_dict["description"],
    )

    threshold = float(payload["calibrated_threshold"])
    return model, config, norm_stats, threshold
