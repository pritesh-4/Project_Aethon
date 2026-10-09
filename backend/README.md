# AETHON — Python Backend Service

A specialized Python + FastAPI backend service for the AETHON radio-astronomy discovery workspace. The backend serves high-cadence REST APIs, coordinates scientific observation ingestion, processes time-frequency telemetry, executes Doppler drift estimation, and manages anomaly detection pipelines.

---

## Architectural Boundary

- **Phase 0 Scope (Current):** Foundational HTTP service, configuration management via Pydantic Settings, structured logging, CORS for local Vite development, unified error formatting, and health verification probes.
- **Scientific Pipeline Boundary:** Heavy scientific libraries (`astropy`, `blimpy`, `setigen`, `scipy`, `torch`) and file ingestion engines are intentionally decoupled from Phase 0 and will be introduced starting in **Phase 5 (Scientific Ingestion Foundation & Normalized Data Model)**.
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

| Variable       | Type          | Default                                              | Description                                       |
| :------------- | :------------ | :--------------------------------------------------- | :------------------------------------------------ |
| `APP_NAME`     | string        | `"AETHON Radio Signal Discovery API"`                | Application title for documentation               |
| `APP_VERSION`  | string        | `"0.1.0"`                                            | Semantic service version                          |
| `ENVIRONMENT`  | string        | `"development"`                                      | Environment (`development`, `test`, `production`) |
| `DEBUG`        | boolean       | `true`                                               | Enables detailed debug traces                     |
| `HOST`         | string        | `"127.0.0.1"`                                        | Bind host interface                               |
| `PORT`         | integer       | `8000`                                               | Bind port number                                  |
| `API_PREFIX`   | string        | `"/api"`                                             | Base path for all application routes              |
| `CORS_ORIGINS` | list / string | `["http://localhost:5173", "http://127.0.0.1:5173"]` | Allowed web frontend origins                      |
| `LOG_LEVEL`    | string        | `"INFO"`                                             | Log level (`DEBUG`, `INFO`, `WARNING`, `ERROR`)   |

---

## Running the Development Server

Start the ASGI development server with auto-reload:

```powershell
# Windows (PowerShell)
.\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
```

```bash
# With activated virtual environment
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Server endpoints:

- **Root Health Probe:** `http://127.0.0.1:8000/health`
- **API Health Probe:** `http://127.0.0.1:8000/api/health`
- **Interactive Swagger UI:** `http://127.0.0.1:8000/docs`
- **ReDoc Documentation:** `http://127.0.0.1:8000/redoc`
- **OpenAPI Schema:** `http://127.0.0.1:8000/openapi.json`

### Expected Health Check Response

`GET http://127.0.0.1:8000/health` (HTTP 200 OK):

```json
{
  "status": "healthy",
  "service": "aethon-backend",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2026-10-09T11:10:36.144868Z"
}
```

---

## Running Tests

Execute the automated test suite with pytest:

```powershell
# Windows (PowerShell)
.\.venv\Scripts\pytest.exe
```

```bash
# With activated venv
pytest
```

Tests verify:

1. Application factory initialization and metadata schema.
2. Root and `/api` health probe responses adhering to `HealthStatus`.
3. OpenAPI and Swagger UI endpoint availability.
4. Pydantic Settings validation rules and rejected invalid inputs.
5. CORS policy preflight evaluation for local Vite dev origins.
6. Unified error handler formatting matching frontend `ApiErrorPayload`.

---

## Code Quality & Linting

Ruff is configured for fast linting, modern typing checks, and formatting:

```powershell
# Check code style and rules
ruff check .

# Automatically apply safe fixes
ruff check --fix .

# Format code
ruff format .
```

---

## Current Scope & Limitations (Phase 0)

- **No Scientific Datasets:** Does not ingest raw `.fil` or `.fits` files yet.
- **No Machine Learning Models:** PyTorch, scikit-learn, and `setigen` are not yet loaded.
- **No Database / Persistence:** State is currently stateless in preparation for observational pipelines.
- **No File Upload Endpoints:** Multipart file ingest will be introduced with streaming parsers in Phase 5.

---

## Next Milestone: Phase 5 (Scientific Ingestion Foundation)

The immediate next phase establishes:

- Breakthrough Listen `.fil` (SIGPROC filterbank) and `.fits` binary header decoders.
- Format-agnostic normalized spectral slice data models with provenance metadata.
- Fast slice generation serving 2D waterfall matrices over `GET /api/observations/{id}/slice`.
- Local cached reference observation bundle for deterministic offline exploration.
