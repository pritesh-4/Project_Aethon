"""Reader abstractions for bounded scientific data extraction."""

from app.representation.readers.base import BaseSliceReader
from app.representation.readers.filterbank import FilterbankSliceReader
from app.representation.readers.fits import FitsSliceReader

__all__ = [
    "BaseSliceReader",
    "FilterbankSliceReader",
    "FitsSliceReader",
]
