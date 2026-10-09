# AETHON — Python Backend Service

A specialized Python + FastAPI backend service for the AETHON radio-astronomy discovery workspace. The backend serves high-cadence REST APIs, coordinates scientific observation ingestion, processes time-frequency telemetry, executes Doppler drift estimation, and manages anomaly detection pipelines.

---

## Architectural Boundary

- **Phase 0 (Foundation):** Base HTTP service, configuration management via Pydantic Settings, structured logging, CORS for local Vite development, unified error formatting, and health verification probes.
- **Phase 1 (Scientific Observation Ingestion Engine):**
  - Streaming ingestion and header validation of Breakthrough Listen & astronomical observation files.
  - Supported formats: **SIGPROC Filterbank (`.fil`)** via `blimpy` and recognized **Radio FITS (`.fits`, `.fit`)** via `astropy.io.fits`.
  - Memory-efficient header inspection without loading full spectral data arrays into RAM.
  - Persistent SQLite observation metadata repository and safe internal raw file preservation.
  - Canonical observation schemas conforming to scientific radio standards.
- **Phase 2 (Canonical Scientific Data Representation & Bounded Slicing):**
  - Authoritative canonical 2D matrix contract: `values[time_index][frequency_index]` with Axis 0 = Time (increasing chronologically) and Axis 1 = Frequency (strictly ascending in Hz).
  - Memory-conscious bounded array extraction via memory-mapping (`np.memmap` for `.fil` and `astropy.fits.section` for `.fits`) without loading entire raw files into RAM.
  - Frequency axis reversal on descending source files to enforce strictly ascending canonical columns.
  - Strict bounded access protecting the server via `MAX_SLICE_CELLS` volume limits.
  - Standardized physical coordinates: channel centers in Hz, relative time in seconds from observation start.
  - JSON-compliant non-finite sample encoding (NaN/Inf serialized as `null` with explicit quality flags).
  - Strict scope boundary: no signal detection, RFI filtering, Doppler drift, or ML training.
- **Frontend Boundary:** The backend runs independently on port `8000` and communicates with the React + Vite frontend (`http://localhost:5173`) through the `/api` route prefix.

---

## Prerequisites & Supported Python Version

- **Python Version:** Python `3.11+` (tested and validated on Python `3.14.6` on Windows x64).
- **Virtual Environment Tool:** Python's built-in `venv` module.

---

## Installation & Setup

### 1. Create Virtual Environment

Navigate to the `backend/` directory:

```powershell
# Windows (PowerShell)
cd backend
python -m venv .venv
```

```bash
# macOS / Linux (bash/zsh)
cd backend
python3 -m venv .venv
```

### 2. Activate the Virtual Environment

```powershell
# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1
```

> **Note for PowerShell execution policy:** If script execution is restricted, run:
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`

```bash
# macOS / Linux
source .venv/bin/activate
```

### 3. Install Dependencies

Install using `requirements.txt` or standard `pyproject.toml`:

```powershell
# Windows / Unix (with activated venv)
# Option A: Using requirements files
pip install -r requirements-dev.txt

# Option B: Editable package install with dev dependencies
pip install -e ".[dev]"

# Or core dependencies only
pip install -r requirements.txt
```

---

## Environment Configuration

Copy `.env.example` to create your local `.env`:

```powershell
# Windows (PowerShell)
Copy-Item .env.example .env
```

```bash
# macOS / Linux
cp .env.example .env
```

### Configuration Variables

| Variable                | Type          | Default                                              | Description                                       |
| :---------------------- | :------------ | :--------------------------------------------------- | :------------------------------------------------ |
| `APP_NAME`              | string        | `"AETHON Radio Signal Discovery API"`                | Application title for documentation               |
| `APP_VERSION`           | string        | `"0.1.0"`                                            | Semantic service version                          |
| `ENVIRONMENT`           | string        | `"development"`                                      | Environment (`development`, `test`, `production`) |
| `DEBUG`                 | boolean       | `true`                                               | Enables detailed debug traces                     |
| `HOST`                  | string        | `"127.0.0.1"`                                        | Bind host interface                               |
| `PORT`                  | integer       | `8000`                                               | Bind port number                                  |
| `API_PREFIX`            | string        | `"/api"`                                             | Base path for all application routes              |
| `CORS_ORIGINS`          | list / string | `["http://localhost:5173", "http://127.0.0.1:5173"]` | Allowed web frontend origins                      |
| `LOG_LEVEL`             | string        | `"INFO"`                                             | Log level (`DEBUG`, `INFO`, `WARNING`, `ERROR`)   |
| `DATA_DIR`              | string        | `"data"`                                             | Root storage directory                            |
| `OBSERVATIONS_DIR`      | string        | `"data/observations"`                                | Preserved raw astronomical files directory        |
| `TEMP_UPLOAD_DIR`       | string        | `"data/tmp"`                                         | Staging directory for in-flight uploads           |
| `DB_PATH`               | string        | `"data/aethon.db"`                                   | SQLite persistent metadata database               |
| `MAX_UPLOAD_SIZE_BYTES` | integer       | `104857600` (100MB)                                  | Maximum permissible upload size limit             |
| `MAX_SLICE_CELLS`       | integer       | `250000`                                             | Maximum permissible matrix cells per slice query  |

---

## Supported Observation Formats

AETHON does not blindly accept arbitrary files based on extensions. Every upload undergoes streaming validation and header structure inspection:

### 1. SIGPROC Filterbank (`.fil`)

- **Parser Engine:** `blimpy.Waterfall(..., load_data=False)`
- **Header Inspection:** Validates SIGPROC magic markers, extracts channel counts, reference frequency (`fch1`), signed channel bandwidth (`foff`), sampling rate (`tsamp`), start MJD (`tstart`), source name, telescope ID, and celestial coordinates (`src_raj`, `src_dej`).
- **Memory Conservation:** Parses binary headers without loading multi-gigabyte 2D waterfall matrices into memory.
- **Signed Frequency Handling:** Accommodates both increasing (`foff > 0`) and descending (`foff < 0`) frequency channels.

### 2. Radio FITS (`.fits`, `.fit`)

- **Parser Engine:** `astropy.io.fits.open(..., memmap=True)`
- **Supported Layout A — Radio Spectral Image:** Primary or Image HDU with `NAXIS >= 2` having WCS spectral axes (`CTYPE` containing `FREQ`/`OBSFREQ` and `TIME`/`UTC`) or radio spectrogram headers (`FCH1`/`FOFF`, `TSAMP`).
- **Supported Layout B — Radio Binary Table:** `BinTableHDU` matching radio standards (PSRFITS `SUBINT` or SDFITS `SINGLE DISH`) containing frequency arrays (`DAT_FREQ`), subintegration durations (`TSUBINT`), and spectral payloads (`DATA`).
- **Explicit Layout Rejection:** Optical spatial images (`RA---TAN`/`DEC--TAN` without spectral axes) or generic non-radio tables are rejected with HTTP 422 `UNSUPPORTED_FITS_LAYOUT`.

---

## Scientific Correctness & Coordinate Standards

1. **Channel Centers vs. Channel Edges:** The physical frequency range is calculated using channel edge boundaries:
   $$\nu_{\text{last}} = \nu_{\text{ref}} + (N_{\text{chans}} - 1) \cdot \Delta\nu$$
   $$\nu_{\text{min}} = \min(\nu_{\text{ref}}, \nu_{\text{last}}) - \frac{|\Delta\nu|}{2}$$
   $$\nu_{\text{max}} = \max(\nu_{\text{ref}}, \nu_{\text{last}}) + \frac{|\Delta\nu|}{2}$$
   $$\text{Bandwidth} = |\Delta\nu| \cdot N_{\text{chans}}$$
2. **Signed Channel Spacing:** Preserves negative $\Delta\nu$ to faithfully record channel order.
3. **Honest Unknowns:** Missing header fields remain `null` and generate non-fatal `warnings` rather than fabricating coordinates or synthetic timestamps.
4. **Data Isolation:** Raw observation files are stored using internal UUID identifiers (`<uuid>.<ext>`) outside public web directories. Internal server filesystem paths are never exposed in API responses.

---

## Observation Ingestion API

All endpoints are mounted under the configured `API_PREFIX` (default `/api`):

### `POST /api/observations`

Multipart upload of an astronomical observation file.

- **Request:** `multipart/form-data` with field `file`.
- **Enforced Constraints:**
  - Extensions: `.fil`, `.fits`, `.fit` (HTTP 400 if unsupported).
  - Empty files (0 bytes) rejected (HTTP 400 `EMPTY_FILE`).
  - Upload size limit enforced on streaming chunks (HTTP 413 `FILE_SIZE_EXCEEDED`).
  - Malformed or non-radio content rejected (HTTP 422 `INVALID_FILE_CONTENT` / `UNSUPPORTED_FITS_LAYOUT`).
- **Response:** HTTP 201 Created with canonical `ObservationRecordResponse`.

```bash
curl -X POST "http://localhost:8000/api/observations" \
  -F "file=@voyager_observation.fil"
```

### `GET /api/observations`

Paginated listing of ingested observations ordered newest first.

- **Parameters:**
  - `limit`: integer, 1 to 100 (default: 20).
  - `offset`: integer, >= 0 (default: 0).
- **Response:** HTTP 200 OK with `ObservationListResponse` (`items`, `total`, `limit`, `offset`).

### `GET /api/observations/{observation_id}`

Retrieve complete metadata, coordinates, and parser provenance for a single observation.

- **Parameters:** `observation_id` (UUID string).
- **Response:** HTTP 200 OK or HTTP 404 Not Found (`NOT_FOUND`).

### `GET /api/observations/{observation_id}/slice`

Extract a bounded 2D numerical spectral data matrix from an ingested observation adhering to AETHON's canonical scientific data representation.

- **Query Parameters:**
  - `time_start`: integer, >= 0. Inclusive 0-based time index start (default: 0).
  - `time_stop`: integer, >= 0. Exclusive 0-based time index stop (default: `min(time_samples, 64)`).
  - `frequency_start`: integer, >= 0. Inclusive 0-based canonical frequency index start (default: 0).
  - `frequency_stop`: integer, >= 0. Exclusive 0-based canonical frequency index stop (default: `min(channel_count, 256)`).
- **Responses:**
  - `200 OK`: `SpectralSliceResponse` containing canonical 2D matrix, physical coordinate arrays, provenance, and data quality metrics.
  - `404 Not Found`: Observation record or underlying source file not found on disk.
  - `422 Unprocessable Entity`: Out-of-bounds ranges, inverted bounds, or cell count exceeding `MAX_SLICE_CELLS`.

#### Example Request

```bash
curl -G "http://localhost:8000/api/observations/550e8400-e29b-41d4-a716-446655440000/slice" \
  --data-urlencode "time_start=0" \
  --data-urlencode "time_stop=2" \
  --data-urlencode "frequency_start=0" \
  --data-urlencode "frequency_stop=4"
```

#### Example Response

```json
{
  "observation_id": "550e8400-e29b-41d4-a716-446655440000",
  "source_format": "fil",
  "matrix_shape": [2, 4],
  "canonical_axis_convention": "values[time_index][frequency_index]",
  "requested_range": {
    "time_start": 0,
    "time_stop": 2,
    "frequency_start": 0,
    "frequency_stop": 4
  },
  "actual_range": {
    "time_start": 0,
    "time_stop": 2,
    "frequency_start": 0,
    "frequency_stop": 4
  },
  "values": [
    [105.2, 107.1, 108.4, 106.9],
    [104.8, 106.9, 109.1, 107.3]
  ],
  "frequency_coordinates_hz": [1419950000.0, 1420000000.0, 1420050000.0, 1420100000.0],
  "time_coordinates_seconds": [0.0, 0.5],
  "start_time_utc": "2020-05-31T00:00:00.000",
  "start_mjd": 59000.0,
  "frequency_unit": "Hz",
  "time_unit": "s",
  "sample_value_semantics": "uncalibrated_detector_power",
  "sample_value_unit": null,
  "data_quality": {
    "total_samples": 8,
    "non_finite_sample_count": 0,
    "has_non_finite_samples": false,
    "null_representation": "null represents non-finite sample (NaN or Inf)"
  },
  "provenance": {
    "source_channel_order": "descending",
    "frequency_axis_reversed": true,
    "reader_backend": "np.memmap.fil",
    "source_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  "warnings": []
}
```

---

## Canonical Scientific Data Representation

To ensure downstream scientific algorithms (preprocessing, anomaly detection, Doppler analysis) operate consistently across disparate source instruments, Phase 2 establishes an authoritative internal data contract:

### 1. Canonical Matrix Orientation: `values[time_index][frequency_index]`

- **Axis 0 (Rows):** Time dimension. Indices increase chronologically with observation elapsed time. Row $t$ corresponds to `time_coordinates_seconds[t]`.
- **Axis 1 (Columns):** Frequency dimension. Columns strictly increase from lower to higher frequency ($f_0 < f_1 < \dots < f_N$) in **Hertz (Hz)**. Column $c$ corresponds to `frequency_coordinates_hz[c]`.
- **Row Mapping Example:**
  ```text
  values[t][c] -> detector power sample at time_coordinates_seconds[t] and frequency_coordinates_hz[c]

  Row values[0]       = [ f_0,  f_1,  f_2, ..., f_N ] (at t = 0.0s)
  Row values[1]       = [ f_0,  f_1,  f_2, ..., f_N ] (at t = 0.5s)
  ```

### 2. Frequency & Time Coordinate Semantics

- **Frequency Axis:** Coordinates are in **Hz** and represent channel center frequencies. In canonical orientation, channel 0 is always the lowest frequency:
  $$\nu_{\text{canonical}, k} = \nu_{\text{min\_center}} + k \cdot |\Delta\nu|$$
- **Time Axis:** Relative time coordinates are in **seconds (s)** relative to observation start ($t_{\text{rel}} = k \cdot \Delta t$). Absolute epoch is preserved via UTC ISO-8601 notation (`start_time_utc`) and Modified Julian Date (`start_mjd`).
- **Missing Coordinates:** When metadata lacks adequate physical axes, `frequency_coordinates_hz` or `time_coordinates_seconds` remain `null` with explicit diagnostic warnings. Synthetic or fabricated physical coordinates are never produced.

### 3. Source Metadata vs. Canonical Metadata

- **Descending Source Channels:** Radio instruments and SIGPROC filterbank files commonly write channels with negative channel spacing ($\Delta\nu < 0$, high frequency to low frequency).
- **Consistent Reordering:** AETHON detects descending source channels, extracts the corresponding source channel range $[N_{\text{chans}} - f_{\text{stop}}, N_{\text{chans}} - f_{\text{start}})$, and reverses the column order (`raw_matrix[:, ::-1]`). The returned matrix columns and `frequency_coordinates_hz` remain in lockstep ascending order.
- **Traceability:** Provenance explicitly records `source_channel_order="descending"` and `frequency_axis_reversed=true`. The original raw observation file on disk remains completely immutable.

### 4. Memory-Conscious Bounded Access

- **Bounded Reading:** Never loads full multi-gigabyte observations into memory.
  - `.fil` files: Sliced directly via `np.memmap` using binary header byte offsets (`idx_data`). OS memory maps are explicitly unmapped and closed after array copy.
  - `.fits` files: Sliced directly via `astropy.fits.HDU.section` without creating full-array memory mappings, preventing Windows file-lock errors.
- **Safety Limits:** Protected by `MAX_SLICE_CELLS` (default: 250,000 cells). Requests exceeding this limit are rejected with HTTP 422 `SLICE_CELL_LIMIT_EXCEEDED` before attempting disk reads.
- **JSON Compliance for Non-Finite Samples:** IEEE 754 `NaN`, `Infinity`, and `-Infinity` cannot be serialized in standard JSON. Any non-finite samples detected are encoded as `null` in the `values` matrix, with exact counts reported in `data_quality.non_finite_sample_count`.

### 5. Format Support & Limitations

| Format                   | Supported Layouts                             | Reader Backend          | Known Limitations                                                                                       |
| :----------------------- | :-------------------------------------------- | :---------------------- | :------------------------------------------------------------------------------------------------------ |
| **Filterbank (`.fil`)**  | SIGPROC standard 8, 16, 32-bit waterfalls     | `np.memmap.fil`         | Slices single polarization (Stokes I / pol 0). Sub-byte bit depths (1, 2, 4-bit) require preprocessing. |
| **Radio FITS (`.fits`)** | Radio Spectral Images (`CTYPE` WCS freq/time) | `astropy.fits.section`  | 2D images or 3D cubes (Stokes I selected). Optical spatial images (`RA---TAN`/`DEC--TAN`) rejected.     |
| **Radio FITS (`.fits`)** | Radio Binary Tables (PSRFITS/SDFITS `SUBINT`) | `astropy.fits.bintable` | Reads `DATA` column across selected rows. Pulsar folded profiles select bin 0.                          |

---

## Running the Development Server

```powershell
# Windows (PowerShell)
.\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
```

```bash
# With activated virtual environment
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive documentation:

- **Swagger UI:** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`
- **OpenAPI Schema:** `http://127.0.0.1:8000/openapi.json`

---

## Running Automated Tests

Run the full automated test suite (62 tests):

```powershell
# Windows (PowerShell)
.\.venv\Scripts\pytest.exe
```

```bash
# Unix
pytest -v
```

Tests run offline without requiring external network access or telemetry downloads:

- `test_representation_axes.py`: Coordinate axis modeling, ascending Hz calculations, relative seconds, incomplete metadata handling.
- `test_slice_readers.py`: Filterbank memory-mapped bounded reads, FITS section/bintable readers, negative spacing inversion, optical rejection.
- `test_api_slice.py`: Spectral slice API endpoint, matrix dimensions, coordinate alignment, `MAX_SLICE_CELLS` limits, non-finite NaN/Inf serialization to `null`, source immutability.
- `test_adapters.py`: Format adapters, signed channel bounds, missing metadata handling, format rejection.
- `test_storage.py`: SQLite transactions, atomic staging move, collision immunity, persistence across restarts.
- `test_api_observations.py`: Multipart uploads, size bounds, traversal sanitization, pagination, 404s.
- `test_config.py`, `test_cors.py`, `test_errors.py`, `test_health.py`: Phase 0 foundation tests.

---

## Code Quality & Linting

```powershell
# Format checking
ruff format --check .

# Static linting
ruff check .

# Static type verification
mypy app
```
