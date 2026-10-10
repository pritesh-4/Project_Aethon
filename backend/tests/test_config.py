import logging

import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.core.logging import SafeFormatter


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
    cfg = Settings(cors_origins="http://localhost:5173, http://127.0.0.1:5173")  # type: ignore[arg-type]
    assert cfg.cors_origins == ["http://localhost:5173", "http://127.0.0.1:5173"]


def test_cors_origins_json_array_parsing() -> None:
    """Verify that JSON-encoded origin arrays are parsed correctly."""
    cfg = Settings(cors_origins='["http://localhost:5173", "http://example.com"]')  # type: ignore[arg-type]
    assert cfg.cors_origins == ["http://localhost:5173", "http://example.com"]


def test_sensitive_fields_excluded_from_repr() -> None:
    """Verify confidential fields with repr=False are never exposed in string reprs."""
    test_secret_val = "sensitive_production_signing_key_998877"
    test_api_key_val = "secret_breakthrough_archive_key_112233"
    cfg = Settings(
        secret_key=test_secret_val,
        breakthrough_listen_api_key=test_api_key_val,
    )
    repr_str = repr(cfg)
    assert test_secret_val not in repr_str
    assert test_api_key_val not in repr_str
    assert "secret_key" not in repr_str
    assert "breakthrough_listen_api_key" not in repr_str


def test_optional_roadmap_placeholders_default_none() -> None:
    """Verify that optional integration placeholders default to None and do not impede startup."""
    cfg = Settings()
    assert cfg.secret_key is None
    assert cfg.astropy_cache_dir is None
    assert cfg.breakthrough_listen_archive_url is None
    assert cfg.breakthrough_listen_api_key is None


def test_environment_variable_override(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify that external environment variables predictably override defaults."""
    monkeypatch.setenv("PORT", "9090")
    monkeypatch.setenv("LOG_LEVEL", "WARNING")
    monkeypatch.setenv("ENVIRONMENT", "test")
    monkeypatch.setenv("ASTROPY_CACHE_DIR", "/custom/cache/dir")

    cfg = Settings()
    assert cfg.port == 9090
    assert cfg.log_level == "WARNING"
    assert cfg.environment == "test"
    assert cfg.astropy_cache_dir == "/custom/cache/dir"


def test_logger_secret_redaction() -> None:
    """Verify SafeFormatter masks secret dictionary keys attached to log records."""
    formatter = SafeFormatter(fmt="%(message)s")
    record = logging.LogRecord(
        name="aethon.test",
        level=logging.INFO,
        pathname="test.py",
        lineno=10,
        msg="Processing credentials",
        args={"api_key": "raw_exposed_secret", "normal_field": "safe_value"},
        exc_info=None,
    )
    _ = formatter.format(record)
    assert isinstance(record.args, dict)
    assert record.args["api_key"] == "[REDACTED]"
    assert record.args["normal_field"] == "safe_value"
