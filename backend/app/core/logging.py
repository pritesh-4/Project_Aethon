"""Structured application logging configuration without secret leakage."""

import logging
import sys
from typing import Any

# Sensitive key patterns that must never be leaked into logs
REDACTED_KEYS = {"password", "secret", "token", "key", "authorization", "api_key"}
REDACTED_PLACEHOLDER = "[REDACTED]"


class SafeFormatter(logging.Formatter):
    """Custom log formatter ensuring ISO timestamps and secret masking."""

    def format(self, record: logging.LogRecord) -> str:
        # Mask sensitive attributes if attached in extra/args
        if isinstance(record.args, dict):
            sanitized_args: dict[str, Any] = {}
            for k, v in record.args.items():
                if any(sec in str(k).lower() for sec in REDACTED_KEYS):
                    sanitized_args[k] = REDACTED_PLACEHOLDER
                else:
                    sanitized_args[k] = v
            record.args = sanitized_args
        return super().format(record)


def setup_logging(log_level: str = "INFO") -> None:
    """Configure structured logging for the application."""
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    log_format = "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
    formatter = SafeFormatter(fmt=log_format, datefmt="%Y-%m-%dT%H:%M:%S%z")

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(numeric_level)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Avoid duplicate handlers if setup_logging is called multiple times
    root_logger.handlers.clear()
    root_logger.addHandler(handler)

    # Configure uvicorn and fastapi loggers
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):
        lib_logger = logging.getLogger(logger_name)
        lib_logger.handlers.clear()
        lib_logger.addHandler(handler)
        lib_logger.setLevel(numeric_level)
        lib_logger.propagate = False


def get_logger(name: str) -> logging.Logger:
    """Obtain a logger instance configured with the application hierarchy."""
    return logging.getLogger(f"aethon.{name}")
