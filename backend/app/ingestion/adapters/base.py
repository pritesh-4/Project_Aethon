"""Base format adapter interface and shared metadata extraction utilities."""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

import numpy as np

from app.ingestion.models import ParsedObservation


def sanitize_header_value(val: Any) -> Any:
    """Sanitize header value to ensure clean JSON serialization without leaking objects."""
    if val is None:
        return None
    if isinstance(val, (bool, str, int)):
        return val
    if isinstance(val, float):
        if np.isnan(val) or np.isinf(val):
            return None
        return val
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        f_val = float(val)
        return None if np.isnan(f_val) or np.isinf(f_val) else f_val
    if isinstance(val, bytes):
        try:
            return val.decode("utf-8", errors="replace").strip()
        except Exception:
            return str(val)
    if hasattr(val, "deg"):
        # Astropy Angle or coordinate quantity
        return float(val.deg)
    if hasattr(val, "value"):
        # Astropy Quantity
        try:
            return float(val.value)
        except Exception:
            return str(val.value)
    if isinstance(val, (list, tuple)):
        if len(val) <= 64:
            return [sanitize_header_value(v) for v in val]
        return f"[Array with {len(val)} elements]"
    if isinstance(val, np.ndarray):
        if val.size <= 64:
            return [sanitize_header_value(v) for v in val.tolist()]
        return f"[Ndarray shape {list(val.shape)}]"
    if isinstance(val, dict):
        return {str(k): sanitize_header_value(v) for k, v in val.items()}
    return str(val)


class BaseFormatAdapter(ABC):
    """Abstract interface for astronomical file format adapters."""

    @abstractmethod
    def parse(self, file_path: Path) -> ParsedObservation:
        """Parse scientific file and extract validated metadata and provenance.

        Args:
            file_path: Local filesystem path to the observation file.

        Returns:
            ParsedObservation containing extracted metadata, provenance, and warnings.

        Raises:
            InvalidFileContentError: If file is malformed or invalid.
            UnsupportedFitsLayoutError: If FITS layout is not a recognized radio layout.
        """
        pass

    @staticmethod
    def compute_frequency_bounds(
        f_ref: float,
        df: float,
        n_chans: int,
    ) -> tuple[float, float, float]:
        """Compute exact physical frequency boundaries (channel edges) and bandwidth in MHz.

        Scientific correctness rules:
        1. Channel centers are not channel edges.
        2. Channel 0 center is f_ref; channel (n_chans - 1) center is f_ref + (n_chans - 1) * df.
        3. Channel width is |df|. The outer channel boundary extends |df| / 2 beyond each center.
        4. Lower channel boundary is min(f_ref, f_last) - |df| / 2.
        5. Upper channel boundary is max(f_ref, f_last) + |df| / 2.
        6. Total physical bandwidth is |df| * n_chans.
        7. Preserves signed channel spacing for channel ordering.
        """
        if n_chans <= 0 or abs(df) < 1e-15:
            return f_ref, f_ref, 0.0
        f_last = f_ref + (n_chans - 1) * df
        f_min = min(f_ref, f_last) - (abs(df) / 2.0)
        f_max = max(f_ref, f_last) + (abs(df) / 2.0)
        bandwidth = abs(df) * n_chans
        return round(f_min, 6), round(f_max, 6), round(bandwidth, 6)
