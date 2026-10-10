"""AETHON Experimental Spectrogram 2D CNN Classifier.

Lightweight PyTorch convolutional network for 5-class radio spectrogram classification.

Classes (in canonical order):
  0: noise              - Gaussian background noise
  1: stationary_tone    - Unmodulated narrowband tone
  2: drifting_tone      - Narrowband tone drifting linearly in frequency
  3: burst              - Transient pulse localized in time and frequency
  4: broadband          - Wide-band emission spanning multiple channels

Input format:
  Spectrogram matrices of shape (batch, 1, 32, 32), float32.

Design principles:
- Compact architecture (<50k parameters) optimized for fast CPU training and inference.
- Direct output of raw logits during training; explicit softmax for probability inference.
- Safe, training-derived normalization utilities.
- Strictly an offline experimental prototype; does not replace production baseline detectors.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import torch
import torch.nn as nn

CLASS_NAMES: list[str] = [
    "noise",
    "stationary_tone",
    "drifting_tone",
    "burst",
    "broadband",
]
CLASS_TO_IDX: dict[str, int] = {name: i for i, name in enumerate(CLASS_NAMES)}
NUM_CLASSES: int = len(CLASS_NAMES)


class SpectrogramCNN(nn.Module):
    """Compact 2D Convolutional Neural Network for 32x32 spectrogram classification."""

    def __init__(self, num_classes: int = NUM_CLASSES, dropout_rate: float = 0.2) -> None:
        super().__init__()
        self.num_classes = num_classes

        # Feature Extractor: 3 convolutional stages with BatchNorm and pooling
        # Input: (batch, 1, 32, 32)
        self.features = nn.Sequential(
            # Stage 1: Conv 1 -> 16 channels, downsample to 16x16
            nn.Conv2d(in_channels=1, out_channels=16, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(16),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            # Stage 2: Conv 16 -> 32 channels, downsample to 8x8
            nn.Conv2d(in_channels=16, out_channels=32, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            # Stage 3: Conv 32 -> 32 channels, spatial refinement
            nn.Conv2d(in_channels=32, out_channels=32, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d((4, 4)),  # Output: (batch, 32, 4, 4) -> 512 features
        )

        # Classification Head: Compact MLP
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(p=dropout_rate),
            nn.Linear(32 * 4 * 4, 64),
            nn.ReLU(inplace=True),
            nn.Linear(64, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass computing unnormalized class logits.

        Args:
            x: Input tensor of shape (batch, 1, 32, 32) or (batch, 32, 32).

        Returns:
            Raw logits tensor of shape (batch, num_classes).
        """
        if x.dim() == 3:
            x = x.unsqueeze(1)
        elif x.dim() == 2:
            x = x.unsqueeze(0).unsqueeze(0)

        feats = self.features(x)
        logits = self.classifier(feats)
        return logits


def count_parameters(model: nn.Module) -> int:
    """Count total trainable parameters in a PyTorch module."""
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


def normalize_spectrogram(
    matrix: np.ndarray,
    mean: float,
    std: float,
) -> np.ndarray:
    """Normalize a spectrogram using training-derived statistics.

    Args:
        matrix: 2D or 3D numpy array of float values.
        mean: Training set scalar mean.
        std: Training set scalar standard deviation.

    Returns:
        Z-score normalized float32 numpy array.
    """
    safe_std = max(float(std), 1e-8)
    normalized = (matrix - float(mean)) / safe_std
    return normalized.astype(np.float32)


def prepare_spectrogram_tensor(
    spectrogram: np.ndarray | torch.Tensor,
    mean: float | None = None,
    std: float | None = None,
) -> torch.Tensor:
    """Prepare a numpy or torch spectrogram for model inference.

    Args:
        spectrogram: Spectrogram matrix of shape (32, 32) or batch (N, 32, 32).
        mean: Optional normalization mean.
        std: Optional normalization standard deviation.

    Returns:
        torch.FloatTensor of shape (batch, 1, 32, 32).
    """
    if isinstance(spectrogram, torch.Tensor):
        arr = spectrogram.detach().cpu().numpy()
    else:
        arr = np.asarray(spectrogram, dtype=np.float32)

    if mean is not None and std is not None:
        arr = normalize_spectrogram(arr, mean=mean, std=std)

    tensor = torch.from_numpy(arr).float()

    if tensor.dim() == 2:
        # (32, 32) -> (1, 1, 32, 32)
        tensor = tensor.unsqueeze(0).unsqueeze(0)
    elif tensor.dim() == 3:
        # (N, 32, 32) -> (N, 1, 32, 32)
        tensor = tensor.unsqueeze(1)

    return tensor


def predict_spectrogram(
    model: nn.Module,
    spectrogram: np.ndarray,
    mean: float | None = None,
    std: float | None = None,
) -> dict[str, Any]:
    """Execute forward inference on a single spectrogram, returning probabilities.

    Args:
        model: Trained SpectrogramCNN instance.
        spectrogram: 2D numpy array of shape (32, 32).
        mean: Training-derived scalar mean for input normalization.
        std: Training-derived scalar std for input normalization.

    Returns:
        Dictionary containing predicted class, index, probabilities, and logits.
    """
    model.eval()
    tensor = prepare_spectrogram_tensor(spectrogram, mean=mean, std=std)

    with torch.no_grad():
        logits = model(tensor).squeeze(0)
        probs = torch.softmax(logits, dim=-1)

    probs_np = probs.cpu().numpy()
    pred_idx = int(np.argmax(probs_np))

    return {
        "predicted_class": CLASS_NAMES[pred_idx],
        "predicted_index": pred_idx,
        "confidence": float(probs_np[pred_idx]),
        "probabilities": {name: float(probs_np[i]) for i, name in enumerate(CLASS_NAMES)},
        "logits": {name: float(logits[i].item()) for i, name in enumerate(CLASS_NAMES)},
    }
