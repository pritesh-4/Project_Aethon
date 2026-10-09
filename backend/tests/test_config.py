"""Automated tests for configuration validation and environment loading."""

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_default_configuration() -> None:
    """Verify default configuration has expected safe development defaults."""
    cfg = Settings(
        app_name="AETHON Radio Signal Discovery API",
        app_version="0.1.0",
        environment="development",
        cors_origins=["http://localhost:5173"],
    )
    assert cfg.app_name == "AETHON Radio Signal Discovery API"
    assert cfg.api_prefix == "/api"
    assert cfg.port == 8000
    assert not cfg.is_production


def test_production_environment_flag() -> None:
    """Verify is_production evaluates accurately based on environment setting."""
    prod_cfg = Settings(environment="production")
    assert prod_cfg.is_production is True

    dev_cfg = Settings(environment="development")
    assert dev_cfg.is_production is False


def test_invalid_log_level_rejected() -> None:
    """Verify that an invalid log level raises a ValidationError."""
    with pytest.raises(ValidationError):
        Settings(log_level="SUPER_DEBUG")  # type: ignore[arg-type]


def test_invalid_environment_rejected() -> None:
    """Verify that an invalid environment raises a ValidationError."""
    with pytest.raises(ValidationError):
        Settings(environment="staging_unknown")  # type: ignore[arg-type]


def test_cors_origins_comma_separated_parsing() -> None:
    """Verify that comma-separated origin strings are parsed into clean lists."""
    cfg = Settings(cors_origins="http://localhost:5173, http://127.0.0.1:5173")
    assert cfg.cors_origins == ["http://localhost:5173", "http://127.0.0.1:5173"]


def test_cors_origins_json_array_parsing() -> None:
    """Verify that JSON-encoded origin arrays are parsed correctly."""
    cfg = Settings(cors_origins='["http://localhost:5173", "http://example.com"]')
    assert cfg.cors_origins == ["http://localhost:5173", "http://example.com"]
