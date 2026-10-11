"""Unit tests for the experimental spectrogram 2D CNN classifier."""

from __future__ import annotations

import numpy as np
import pytest
import torch

from app.detection.cnn_classifier import (
    CLASS_NAMES,
    NUM_CLASSES,
    SpectrogramCNN,
    count_parameters,
    normalize_spectrogram,
    predict_spectrogram,
    prepare_spectrogram_tensor,
)


def test_spectrogram_cnn_initialization_and_parameter_count() -> None:
    """CNN model initializes with correct number of classes and reasonable parameter budget."""
    model = SpectrogramCNN(num_classes=NUM_CLASSES, dropout_rate=0.2)
    n_params = count_parameters(model)
    assert n_params > 0
    # Architectural design constraint: compact architecture (<50k parameters)
    assert n_params < 50_000


def test_spectrogram_cnn_forward_shapes() -> None:
    """CNN forward pass produces correct logits for 4D, 3D, and 2D inputs."""
    model = SpectrogramCNN(num_classes=NUM_CLASSES)
    model.eval()

    # 4D input: (batch, 1, 32, 32)
    x4 = torch.randn(4, 1, 32, 32)
    with torch.no_grad():
        out4 = model(x4)
    assert out4.shape == (4, NUM_CLASSES)
    assert not torch.isnan(out4).any()

    # 3D input: (batch, 32, 32)
    x3 = torch.randn(3, 32, 32)
    with torch.no_grad():
        out3 = model(x3)
    assert out3.shape == (3, NUM_CLASSES)

    # 2D input: (32, 32)
    x2 = torch.randn(32, 32)
    with torch.no_grad():
        out2 = model(x2)
    assert out2.shape == (1, NUM_CLASSES)


def test_normalize_spectrogram_statistics() -> None:
    """Spectrogram normalization scales values using training statistics safely."""
    arr = np.array([[10.0, 20.0], [30.0, 40.0]], dtype=np.float32)
    norm = normalize_spectrogram(arr, mean=25.0, std=10.0)
    assert norm.shape == arr.shape
    assert np.isclose(norm[0, 0], -1.5)
    assert np.isclose(norm[1, 1], 1.5)

    # Zero std should not cause ZeroDivisionError
    norm_zero_std = normalize_spectrogram(arr, mean=25.0, std=0.0)
    assert not np.isnan(norm_zero_std).any()
    assert not np.isinf(norm_zero_std).any()


def test_prepare_spectrogram_tensor() -> None:
    """Tensor preparation produces correct 4D float tensor from numpy and torch inputs."""
    np_mat = np.random.randn(32, 32).astype(np.float32)
    tensor_from_np = prepare_spectrogram_tensor(np_mat, mean=0.0, std=1.0)
    assert tensor_from_np.shape == (1, 1, 32, 32)
    assert isinstance(tensor_from_np, torch.Tensor)

    # Batch of numpy slices (N, 32, 32)
    np_batch = np.random.randn(5, 32, 32).astype(np.float32)
    tensor_batch = prepare_spectrogram_tensor(np_batch)
    assert tensor_batch.shape == (5, 1, 32, 32)

    # Torch tensor input
    t_in = torch.randn(32, 32)
    t_out = prepare_spectrogram_tensor(t_in)
    assert t_out.shape == (1, 1, 32, 32)


def test_predict_spectrogram_inference() -> None:
    """Inference returns valid predicted class, confidence, probabilities, and logits."""
    model = SpectrogramCNN(num_classes=NUM_CLASSES)
    model.eval()

    mat = np.random.randn(32, 32).astype(np.float32)
    res = predict_spectrogram(model, mat, mean=0.0, std=1.0)

    assert "predicted_class" in res
    assert res["predicted_class"] in CLASS_NAMES
    assert 0 <= res["predicted_index"] < NUM_CLASSES
    assert 0.0 <= res["confidence"] <= 1.0

    # Probabilities must sum to ~1.0
    prob_sum = sum(res["probabilities"].values())
    assert pytest.approx(prob_sum, abs=1e-4) == 1.0

    # Number of probabilities and logits must equal NUM_CLASSES
    assert len(res["probabilities"]) == NUM_CLASSES
    assert len(res["logits"]) == NUM_CLASSES
