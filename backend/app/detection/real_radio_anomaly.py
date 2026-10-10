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

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import torch
import torch.nn as nn

# Default tile dimensions — must match preparation
TILE_H: int = 32
TILE_W: int = 32
LATENT_DIM: int = 64


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
        return z

    def decode(self, z: torch.Tensor) -> torch.Tensor:
        """Decode latent representation to reconstruction."""
        c3 = self.config.enc_channels[2]
        h = self.dec_linear(z)
        h = h.view(-1, c3, 4, 4)
        out = self.decoder(h)
        return out

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
