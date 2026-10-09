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
  - Strict scope boundary: no signal detection, RFI filtering, Doppler drift, or ML training in this phase.
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

Run the full automated test suite (42 tests):

```powershell
# Windows (PowerShell)
.\.venv\Scripts\pytest.exe
```

```bash
# Unix
pytest -v
```

Tests run offline without requiring external network access or telemetry downloads:

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
