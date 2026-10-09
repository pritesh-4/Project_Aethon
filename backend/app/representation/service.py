from typing import Literal

import numpy as np

from app.core.config import Settings, get_settings
from app.ingestion.exceptions import ObservationNotFoundError
from app.representation.axes import FrequencyAxisModel, TimeAxisModel
from app.representation.exceptions import (
    InvalidSliceBoundsError,
    ObservationFileNotFoundError,
    SliceCellLimitExceededError,
    UnsupportedSliceLayoutError,
)
from app.representation.models import CanonicalSlice
from app.representation.readers.base import BaseSliceReader
from app.representation.readers.filterbank import FilterbankSliceReader
from app.representation.readers.fits import FitsSliceReader
from app.schemas.slice import (
    DataQualityInfo,
    SliceIndexRange,
    SliceProvenance,
    SpectralSliceResponse,
)
from app.storage.repository import ObservationRepository


class SliceService:
    """Scientific representation service producing canonical bounded spectral slices."""

    def __init__(
        self,
        repository: ObservationRepository,
        settings: Settings | None = None,
    ) -> None:
        self.repository = repository
        self.settings = settings or get_settings()
        self._filterbank_reader = FilterbankSliceReader()
        self._fits_reader = FitsSliceReader()

    def get_slice(
        self,
        observation_id: str,
        time_start: int | None = None,
        time_stop: int | None = None,
        frequency_start: int | None = None,
        frequency_stop: int | None = None,
    ) -> SpectralSliceResponse:
        """Retrieve bounded canonical spectral slice for an ingested observation.

        Args:
            observation_id: Identifier of the persisted observation.
            time_start: Inclusive 0-based time index. Defaults to 0.
            time_stop: Exclusive 0-based time index. Defaults to min(time_samples, 64).
            frequency_start: Inclusive 0-based canonical frequency index. Defaults to 0.
            frequency_stop: Exclusive 0-based canonical frequency index.
                Defaults to min(channel_count, 256).

        Returns:
            SpectralSliceResponse conforming to AETHON canonical scientific contract.
        """
        # 1. Fetch internal observation record
        internal_record = self.repository.get_internal_record(observation_id)
        if internal_record is None:
            raise ObservationNotFoundError(observation_id=observation_id)

        metadata = internal_record.metadata
        n_time = metadata.time_sample_count or 0
        n_freq = metadata.channel_count or 0

        if n_time <= 0 or n_freq <= 0:
            raise UnsupportedSliceLayoutError(
                f"Observation '{observation_id}' has invalid dimensions "
                f"(time={n_time}, freq={n_freq})."
            )

        # 2. Resolve default index bounds
        t_start = 0 if time_start is None else time_start
        t_stop = min(n_time, 64) if time_stop is None else time_stop
        f_start = 0 if frequency_start is None else frequency_start
        f_stop = min(n_freq, 256) if frequency_stop is None else frequency_stop

        # 3. Validate index boundaries
        if t_start < 0:
            raise InvalidSliceBoundsError(f"Requested time_start ({t_start}) cannot be negative.")
        if t_stop < t_start:
            raise InvalidSliceBoundsError(
                f"Requested time_stop ({t_stop}) must be >= time_start ({t_start})."
            )
        if t_stop > n_time:
            raise InvalidSliceBoundsError(
                f"Requested time_stop ({t_stop}) exceeds observation time length ({n_time})."
            )

        if f_start < 0:
            raise InvalidSliceBoundsError(
                f"Requested frequency_start ({f_start}) cannot be negative."
            )
        if f_stop < f_start:
            raise InvalidSliceBoundsError(
                f"Requested frequency_stop ({f_stop}) must be >= frequency_start ({f_start})."
            )
        if f_stop > n_freq:
            raise InvalidSliceBoundsError(
                f"Requested frequency_stop ({f_stop}) exceeds channel count ({n_freq})."
            )

        # 4. Enforce cell volume limits
        req_cells = (t_stop - t_start) * (f_stop - f_start)
        if req_cells > self.settings.max_slice_cells:
            raise SliceCellLimitExceededError(
                requested_cells=req_cells,
                max_cells=self.settings.max_slice_cells,
            )

        # 5. Locate source file on server
        file_path = self.repository.get_source_file_path(observation_id)
        if file_path is None or not file_path.exists():
            raise ObservationFileNotFoundError(observation_id=observation_id)

        # 6. Delegate to format-specific reader
        fmt = internal_record.format.lower()
        reader: BaseSliceReader
        if fmt == "fil":
            reader = self._filterbank_reader
        elif fmt in ("fits", "fit"):
            reader = self._fits_reader
        else:
            raise UnsupportedSliceLayoutError(
                f"Unsupported source format '{fmt}' for scientific slice extraction."
            )

        matrix, freq_reversed, reader_backend, reader_warnings = reader.read_slice(
            file_path=file_path,
            metadata=metadata,
            time_start=t_start,
            time_stop=t_stop,
            frequency_start=f_start,
            frequency_stop=f_stop,
        )

        warnings: list[str] = list(reader_warnings)

        # 7. Model physical frequency axis in Hz
        freq_coords: list[float] | None = None
        f_ref_mhz = metadata.frequency_reference_mhz
        df_mhz = metadata.channel_spacing_mhz

        if f_ref_mhz is not None and df_mhz is not None:
            f_ref_hz = f_ref_mhz * 1e6
            df_hz = df_mhz * 1e6
            is_descending = df_hz < 0

            src_ordering: Literal["ascending", "descending", "unknown"]
            if is_descending:
                canonical_f0_hz = f_ref_hz + (n_freq - 1) * df_hz
                canonical_df_hz = abs(df_hz)
                src_ordering = "descending"
            else:
                canonical_f0_hz = f_ref_hz
                canonical_df_hz = df_hz
                src_ordering = "ascending"

            freq_axis = FrequencyAxisModel(
                channel_count=n_freq,
                reference_frequency_hz=canonical_f0_hz,
                channel_spacing_hz=canonical_df_hz,
                reference_channel_index=0,
                unit="Hz",
                source_ordering=src_ordering,
                is_valid=True,
            )
            freq_coords = freq_axis.compute_channel_centers_hz(f_start, f_stop)
        else:
            warnings.append(
                "Physical frequency axis coordinates are incomplete or unavailable in metadata."
            )

        # 8. Model physical time axis in seconds
        time_coords: list[float] | None = None
        dt_sec = metadata.time_step_seconds
        if dt_sec is not None and dt_sec > 0:
            time_axis = TimeAxisModel(
                sample_count=n_time,
                sampling_interval_seconds=dt_sec,
                reference_time_seconds=0.0,
                start_mjd=metadata.start_mjd,
                start_time_utc=metadata.start_time_utc,
                unit="s",
                is_valid=True,
            )
            time_coords = time_axis.compute_relative_times_seconds(t_start, t_stop)
        else:
            warnings.append(
                "Physical time axis coordinates are incomplete or unavailable in metadata."
            )

        # 9. Handle non-finite samples (NaN/Inf) for JSON compliance
        total_samples = int(matrix.size)
        if total_samples > 0:
            non_finite_mask = ~np.isfinite(matrix)
            non_finite_count = int(np.sum(non_finite_mask))
            has_non_finite = non_finite_count > 0

            if has_non_finite:
                warnings.append(
                    f"Detected {non_finite_count} non-finite samples (NaN/Inf) in slice; "
                    "encoded as null for JSON compliance."
                )
                values: list[list[float | None]] = [
                    [float(v) if np.isfinite(v) else None for v in row] for row in matrix
                ]
            else:
                values = [[float(v) for v in row] for row in matrix]
        else:
            non_finite_count = 0
            has_non_finite = False
            values = [] if matrix.shape[0] == 0 else [[] for _ in range(matrix.shape[0])]

        data_quality = DataQualityInfo(
            total_samples=total_samples,
            non_finite_sample_count=non_finite_count,
            has_non_finite_samples=has_non_finite,
            null_representation="null represents non-finite sample (NaN or Inf)",
        )

        provenance = SliceProvenance(
            source_channel_order="descending" if (df_mhz or 0) < 0 else "ascending",
            frequency_axis_reversed=freq_reversed,
            reader_backend=reader_backend,
            source_sha256=internal_record.sha256,
        )

        actual_range = SliceIndexRange(
            time_start=t_start,
            time_stop=t_stop,
            frequency_start=f_start,
            frequency_stop=f_stop,
        )
        requested_range = SliceIndexRange(
            time_start=t_start if time_start is not None else 0,
            time_stop=t_stop if time_stop is not None else n_time,
            frequency_start=f_start if frequency_start is not None else 0,
            frequency_stop=f_stop if frequency_stop is not None else n_freq,
        )

        return SpectralSliceResponse(
            observation_id=observation_id,
            source_format=internal_record.format,
            matrix_shape=[int(matrix.shape[0]), int(matrix.shape[1])],
            canonical_axis_convention="values[time_index][frequency_index]",
            requested_range=requested_range,
            actual_range=actual_range,
            values=values,
            frequency_coordinates_hz=freq_coords,
            time_coordinates_seconds=time_coords,
            start_time_utc=metadata.start_time_utc,
            start_mjd=metadata.start_mjd,
            frequency_unit="Hz",
            time_unit="s",
            sample_value_semantics="uncalibrated_detector_power",
            sample_value_unit=None,
            data_quality=data_quality,
            provenance=provenance,
            warnings=warnings,
        )

    def get_canonical_slice(
        self,
        observation_id: str,
        time_start: int | None = None,
        time_stop: int | None = None,
        frequency_start: int | None = None,
        frequency_stop: int | None = None,
    ) -> CanonicalSlice:
        """Retrieve bounded canonical spectral slice containing raw 2D numpy matrix."""
        internal_record = self.repository.get_internal_record(observation_id)
        if internal_record is None:
            raise ObservationNotFoundError(observation_id=observation_id)

        metadata = internal_record.metadata
        n_time = metadata.time_sample_count or 0
        n_freq = metadata.channel_count or 0

        if n_time <= 0 or n_freq <= 0:
            raise UnsupportedSliceLayoutError(
                f"Observation '{observation_id}' invalid dimensions (t={n_time}, f={n_freq})."
            )

        t_start = 0 if time_start is None else time_start
        t_stop = min(n_time, 64) if time_stop is None else time_stop
        f_start = 0 if frequency_start is None else frequency_start
        f_stop = min(n_freq, 256) if frequency_stop is None else frequency_stop

        if t_start < 0 or t_stop < t_start or t_stop > n_time:
            raise InvalidSliceBoundsError(
                f"Invalid time bounds [{t_start}, {t_stop}) for total time {n_time}."
            )
        if f_start < 0 or f_stop < f_start or f_stop > n_freq:
            raise InvalidSliceBoundsError(
                f"Invalid frequency bounds [{f_start}, {f_stop}) for channels {n_freq}."
            )

        req_cells = (t_stop - t_start) * (f_stop - f_start)
        if req_cells > self.settings.max_slice_cells:
            raise SliceCellLimitExceededError(
                requested_cells=req_cells,
                max_cells=self.settings.max_slice_cells,
            )

        file_path = self.repository.get_source_file_path(observation_id)
        if file_path is None or not file_path.exists():
            raise ObservationFileNotFoundError(observation_id=observation_id)

        fmt = internal_record.format.lower()
        if fmt == "fil":
            reader: BaseSliceReader = self._filterbank_reader
        elif fmt in ("fits", "fit"):
            reader = self._fits_reader
        else:
            raise UnsupportedSliceLayoutError(f"Unsupported format '{fmt}' for slice extraction.")

        matrix, freq_reversed, reader_backend, reader_warnings = reader.read_slice(
            file_path=file_path,
            metadata=metadata,
            time_start=t_start,
            time_stop=t_stop,
            frequency_start=f_start,
            frequency_stop=f_stop,
        )

        f_ref_mhz = metadata.frequency_reference_mhz
        df_mhz = metadata.channel_spacing_mhz
        if f_ref_mhz is not None and df_mhz is not None:
            f_ref_hz = f_ref_mhz * 1e6
            df_hz = df_mhz * 1e6
            canonical_f0_hz = min(f_ref_hz, f_ref_hz + (n_freq - 1) * df_hz)
            freq_axis = FrequencyAxisModel(
                channel_count=n_freq,
                reference_frequency_hz=canonical_f0_hz,
                channel_spacing_hz=abs(df_hz),
                reference_channel_index=0,
                unit="Hz",
                source_ordering="descending" if df_hz < 0 else "ascending",
                is_valid=True,
            )
        else:
            freq_axis = FrequencyAxisModel(channel_count=n_freq, is_valid=False)

        dt_sec = metadata.time_step_seconds
        if dt_sec is not None and dt_sec > 0:
            time_axis = TimeAxisModel(
                sample_count=n_time,
                sampling_interval_seconds=dt_sec,
                reference_time_seconds=0.0,
                start_mjd=metadata.start_mjd,
                start_time_utc=metadata.start_time_utc,
                unit="s",
                is_valid=True,
            )
        else:
            time_axis = TimeAxisModel(sample_count=n_time, is_valid=False)

        return CanonicalSlice(
            observation_id=observation_id,
            source_format=internal_record.format,
            values=matrix,
            time_axis=time_axis,
            frequency_axis=freq_axis,
            time_start=t_start,
            time_stop=t_stop,
            frequency_start=f_start,
            frequency_stop=f_stop,
            sample_value_semantics="uncalibrated_detector_power",
            sample_value_unit=None,
            frequency_axis_reversed=freq_reversed,
            reader_backend=reader_backend,
            source_sha256=internal_record.sha256,
            warnings=list(reader_warnings),
        )
