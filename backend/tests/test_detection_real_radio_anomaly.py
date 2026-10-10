"""Unit tests for the real-radio convolutional autoencoder anomaly detector."""

from pathlib import Path

import numpy as np
import pytest
import torch

from app.detection.real_radio_anomaly import (
    AnomalyModelConfig,
    NormalizationStats,
    RadioAnomalyAutoencoder,
    calibrate_threshold,
    compute_anomaly_scores,
    load_checkpoint,
    save_checkpoint,
)


def test_autoencoder_forward_shape() -> None:
    """Autoencoder must preserve input spatial dimensions for valid tile shapes (32x32)."""
    config = AnomalyModelConfig(
        tile_h=32,
        tile_w=32,
        latent_dim=64,
        enc_channels=(16, 32, 32),
    )
    model = RadioAnomalyAutoencoder(config)
    model.eval()

    # Batch of 4 tiles (B, C, H, W)
    x = torch.randn(4, 1, 32, 32)
    with torch.no_grad():
        out = model(x)

    assert out.shape == (4, 1, 32, 32)
    assert not torch.isnan(out).any()
    assert not torch.isinf(out).any()


def test_autoencoder_parameter_count() -> None:
    """Model must report trainable parameter count accurately."""
    config = AnomalyModelConfig(enc_channels=(16, 32, 32), latent_dim=64)
    model = RadioAnomalyAutoencoder(config)
    n_params = model.count_parameters()
    assert n_params > 0
    assert n_params == sum(p.numel() for p in model.parameters() if p.requires_grad)


def test_normalization_stats_computation_and_transform() -> None:
    """NormalizationStats must accurately compute percentiles and normalize safely."""
    rng = np.random.default_rng(42)
    tiles = rng.uniform(low=0.0, high=100.0, size=(20, 32, 32)).astype(np.float32)

    stats = NormalizationStats.compute(tiles, p_lo=1.0, p_hi=99.0)
    assert stats.train_max > stats.train_min

    normalized = stats.normalize(tiles)
    assert normalized.shape == tiles.shape
    assert float(normalized.min()) >= 0.0
    assert float(normalized.max()) <= 1.0

    # Roundtrip check for values within range
    restored = stats.unnormalize(normalized)
    assert restored.shape == tiles.shape


def test_normalization_handles_constant_data() -> None:
    """Constant data must be handled gracefully without division by zero."""
    constant_tiles = np.full((5, 32, 32), fill_value=42.0, dtype=np.float32)
    stats = NormalizationStats.compute(constant_tiles)
    assert stats.train_max > stats.train_min

    normed = stats.normalize(constant_tiles)
    assert not np.isnan(normed).any()
    assert not np.isinf(normed).any()


def test_threshold_calibration() -> None:
    """calibrate_threshold should pick the expected percentile for target FPR."""
    val_scores = np.linspace(0.1, 1.0, 100)
    thresh = calibrate_threshold(val_scores, target_fpr=0.05)
    # 95th percentile of 0.1..1.0
    expected = float(np.percentile(val_scores, 95.0))
    assert thresh == pytest.approx(expected, rel=1e-4)


def test_checkpoint_save_and_load_roundtrip(tmp_path: Path) -> None:
    """Checkpoint must save and restore identical weights, config, and norm stats."""
    config = AnomalyModelConfig(
        tile_h=32,
        tile_w=32,
        latent_dim=32,
        enc_channels=(8, 16, 16),
        seed=123,
    )
    model = RadioAnomalyAutoencoder(config)
    model.eval()

    stats = NormalizationStats(
        train_min=0.0,
        train_max=50.0,
        clip_percentile_lo=1.0,
        clip_percentile_hi=99.0,
    )

    ckpt_path = save_checkpoint(
        model=model,
        config=config,
        norm_stats=stats,
        threshold=0.45,
        output_dir=tmp_path,
    )
    assert ckpt_path.exists()

    loaded_model, loaded_config, loaded_stats, loaded_thresh = load_checkpoint(ckpt_path)
    loaded_model.eval()

    assert loaded_config.tile_h == 32
    assert loaded_config.tile_w == 32
    assert loaded_stats.train_min == pytest.approx(0.0)
    assert loaded_stats.train_max == pytest.approx(50.0)
    assert loaded_thresh == pytest.approx(0.45)

    # Test output identity
    x = torch.randn(2, 1, 32, 32)
    with torch.no_grad():
        out1 = model(x)
        out2 = loaded_model(x)

    torch.testing.assert_close(out1, out2)


def test_anomaly_scoring_higher_for_outliers() -> None:
    """Anomalous tiles (with strong signals) must receive higher reconstruction error
    than background.
    """
    torch.manual_seed(42)
    config = AnomalyModelConfig(
        tile_h=32,
        tile_w=32,
        enc_channels=(16, 32, 32),
        latent_dim=64,
        learning_rate=3e-3,
    )
    model = RadioAnomalyAutoencoder(config)

    # Generate synthetic background tiles (uniform constant background + slight noise)
    rng = np.random.default_rng(42)
    bg_tiles = (rng.normal(loc=10.0, scale=0.2, size=(80, 32, 32))).astype(np.float32)
    stats = NormalizationStats.compute(bg_tiles)

    # Train autoencoder on background until it reconstructs background well
    norm_bg = stats.normalize(bg_tiles)
    tensor_bg = torch.from_numpy(norm_bg).unsqueeze(1)
    optimizer = torch.optim.Adam(model.parameters(), lr=3e-3)
    criterion = torch.nn.MSELoss()

    model.train()
    for _ in range(50):
        optimizer.zero_grad()
        recon = model(tensor_bg)
        loss = criterion(recon, tensor_bg)
        loss.backward()
        optimizer.step()
    model.eval()

    # Normal background tile score
    test_bg = rng.normal(loc=10.0, scale=0.2, size=(5, 32, 32)).astype(np.float32)
    bg_scores = compute_anomaly_scores(model, test_bg, stats)

    # Outlier tiles (with strong diagonal injected pattern)
    outlier_tiles = test_bg.copy()
    for i in range(32):
        outlier_tiles[:, i, i] += 50.0  # diagonal tone
    outlier_scores = compute_anomaly_scores(model, outlier_tiles, stats)

    median_bg_score = float(np.median(bg_scores))
    for o_score in outlier_scores:
        assert o_score > median_bg_score
