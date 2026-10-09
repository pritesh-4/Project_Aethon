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
- **Phase 3 (Synthetic Signal Laboratory and Benchmark Framework):**
  - Reproducible, deterministic synthetic signal generator and noise background models.
  - Four canonical signal families: stationary tone, drifting tone ($\pm \dot{f}$ with clipping), burst, and broadband emission.
  - Exact Peak SNR definition ($\text{SNR}_{\text{peak}} = A_{\text{peak}} / \sigma_{\text{noise}}$) and non-destructive additive injection.
  - Complete separation between detector-facing observations and ground-truth manifests.
  - Negative controls (noise-only observations) for measuring false alarm rates.
  - `setigen` library adapter mapping frames into canonical AETHON time-frequency slices.
  - Benchmark packaging with SHA-256 checksums and automated loading verification.
  - Quantitative benchmark evaluator: 1-to-1 IoU matching, precision, recall, F1, per-family breakdown, and Doppler drift error.
  - Validation baseline (`ToyThresholdBaselineDetector`) verifying benchmark machinery.
  - Strict scope boundary: no production anomaly detector, RFI classifier, Doppler estimator, or ML training.
- **Phase 4 (Signal Processing and RFI Assessment):**
  - Robust distribution-free statistical characterization without assuming Gaussian noise: median, MAD, robust sigma ($1.4826 \times \text{MAD}$), modified z-scores, channel and time integrations.
  - Multi-condition quality flagger and container (`QualityMask`) maintaining a primary boolean exclusion mask alongside independent reason masks (`FlagReason.NON_FINITE`, `FlagReason.SUSPICIOUS_CHANNEL`, `FlagReason.SUSPICIOUS_TIME_SAMPLE`, `FlagReason.LOCAL_OUTLIER`).
  - Transparent statistical RFI indicators:
    - Frequency channel assessment (modified z-score > 4.5, sample outlier fraction > 0.4).
    - Time sample assessment (broadband integration modified z-score > 4.5, elevated channel fraction > 0.4).
    - Local time-frequency assessment (2D moving-median window, local MAD outlier threshold > 5.0).
  - Strict preservation of raw source observations: raw NumPy matrices and stored files are bit-for-bit immutable.
  - Explainable evidence report (`RfiAssessmentReport`, `IndicatorEvidence`) detailing threshold crossings, affected indices, and clear scientific disclaimers separating evidence from source classifications.
  - Optional, reproducible transformations: per-channel background subtraction, 2D moving-median baseline, robust standardization, and output masking with complete audit history (`TransformationRecord`).
  - Synthetic evaluation framework (`PreprocessingEvaluator`, `SyntheticContaminationInjector`): quantifies contamination flag rate, clean background false alarms, and target signal retention without ground-truth leakage.
  - Public REST API endpoint: `POST /api/observations/{id}/process`.
  - Strict scope boundary: no production anomaly detection, Isolation Forest, CNN training, Doppler drift estimation, or candidate ranking.
- **Phase 5 (Scientific Anomaly Detection Engine):**
  - Partitioning observations into bounded time-frequency analysis windows without massive full-array memory copying.
  - 11 interpretable, distribution-free numerical features (intensity, frequency-distribution, temporal moments) under schema v1.0.0.
  - Transparent statistical baseline detector scoring modified z-scores ($Z_{i, j} = |X_{i, j} - M_j| / \sigma_j$) against in-situ or external reference window ensembles.
  - Unsupervised Isolation Forest detector (`scikit-learn>=1.4.0`) with robust scaling fitted strictly on reference data, inverted score direction ($\text{anomaly\_score} = -\text{decision\_function}(X)$), deterministic `random_state`, and verified `.joblib` model artifact serialization.
  - Deterministic spatial grouping and connected-component bounding box merging (`merge_anomalous_windows`).
  - Strict evaluation framework (`DetectionBenchmarkEvaluator`) measuring precision, recall, F1, observation detection rate, and noise false alarms against Phase 3 synthetic ground truth with strict train/test split isolation.
  - Public REST API endpoint: `POST /api/observations/{id}/detect`.
  - Strict scope boundary: no production Doppler drift estimation, de-Doppler correction, candidate ranking, CNNs, or claims of extraterrestrial intelligence.
- **Phase 6 (Doppler Drift and Temporal Analysis Engine):**
  - Reproducible scientific frequency trajectory extraction (per-time maximum ridge and centroid refinement) respecting Phase 4 quality masks.
  - Linear apparent drift estimation via OLS regression over time-centered coordinates:
    $$\dot{f} = \frac{\Delta f}{\Delta t} \quad [\text{Hz/s}]$$
  - Explicit analytical uncertainty estimation:
    $$\text{SE}(\dot{f}) = \sqrt{\frac{SS_{\text{res}}}{(N - 2)\sum_{i=1}^N (t_i - \bar{t})^2}}$$
  - Deterministic index-space slope fallback (channels/step) when physical Hz/s coordinates are unavailable.
  - Bounded coherent linear drift hypothesis grid search measuring integrated carrier SNR with safety limits and boundary-winner detection.
  - Pure-functional, non-destructive linear de-drift transformation shearing spectral rows by $-\dot{f}\Delta t$ into vertical columns with edge padding and zero circular wraparound.
  - Temporal characterization quantifying active duration, valid sample coverage, max consecutive gaps, persistence, and power variability.
  - Conservative multi-observation recurrence comparison requiring verified frequency tolerances, epoch tracking (MJD/UTC), and astronomical target matching.
  - Scientific evaluation framework (`DriftAnalysisEvaluator`) measuring absolute/signed drift rate errors and target recovery rates against Phase 3 ground truth with zero data leakage.
  - Public REST API endpoint: `POST /api/observations/{id}/analyze-drift`.
  - Mandatory scientific disclaimer: apparent drift rate is topocentric and does not imply an extraterrestrial source or complete physical barycentric Doppler velocity.
  - Strict scope boundary: no candidate ranking, no candidate dossier generation, no CNNs, no automatic ET classification.
- **Phase 7 (Candidate Engine, Evidence Aggregation, and Scientific Case Files):**
  - Unified candidate management system converting detections into traceable, reviewable records.
  - Strict separation of Observation, Processing Run, Detection, Analysis Result, Candidate, Candidate Assessment, Review Record, and Candidate Dossier.
  - Conservative 2D bounding-box grouping via IoU ($\ge 0.20$) or spatial proximity ($\le 4$ steps, $\le 4$ channels) preventing duplicate fragmentation.
  - Configurable, transparent, versioned scoring heuristic ($[0.0, 100.0]$) with bounded contributions: 35% anomaly, 25% drift coherence, 20% temporal continuity, 20% data quality, +10% recurrence bonus.
  - Explicit missing-evidence and detector-disagreement tracking; never invents arbitrary default values.
  - Human review lifecycle state machine (`unreviewed`, `under_review`, `needs_more_data`, `interesting`, `likely_interference`, `dismissed`) with persistent audit trails.
  - Structured JSON dossier snapshots and publication-grade 2-page vector PDF reports via `matplotlib.backends.backend_pdf.PdfPages` with selectable text and disclaimers.
  - Public REST API endpoints: `GET /api/candidates`, `POST /api/candidates`, `GET /api/candidates/{id}`, `POST /api/candidates/{id}/assess`, `GET /api/candidates/{id}/dossier`, `GET /api/candidates/{id}/dossier.pdf`, `POST /api/candidates/{id}/review`.
  - Strict scope boundary: scores are operational triage heuristics; no claims of extraterrestrial origin or automatic discovery.
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

## Synthetic Signal Laboratory & Benchmark Framework (Phase 3)

Phase 3 introduces a controlled, reproducible scientific environment for generating synthetic time-frequency observations, injecting signals with known properties, preserving exact ground truth, packaging benchmark suites, and computing quantitative evaluation metrics for subsequent signal-processing and anomaly-detection phases.

### 1. Reproducible Background Noise Generation

Configurable noise-background generators with explicit statistical assumptions using isolated `numpy.random.default_rng(seed)` (PCG64 bit generator):

- **Gaussian Noise:** Stationary zero-mean or DC-biased normal noise $\mathcal{N}(\mu, \sigma^2)$ with validated positive $\sigma$.
- **Flat / Slanted Baseline:** Additive DC baseline power offset with optional linear spectral tilt across frequency channels.
- **Time-Varying Noise:** Temporal variance modulation $\sigma(t) = \sigma_0 \cdot (1 + A_t \sin(2\pi t / T))$ simulating receiver gain or system-temperature drift.
- **Negative Controls:** Background-only realizations without target injections, enabling empirical measurement of false-positive rates.
- **Scientific Caveat:** Idealized noise models do not simulate real telescope RFI, bandpass ripple, or 1/f instrumental noise.

### 2. Supported Target Signal Families

Implemented through an extensible generator interface (`BaseSignalGenerator`):

1. **Narrowband Stationary Tone (`stationary_tone`):** Localized carrier fixed at frequency channel $k(f_0)$, persisting over active interval $[t_{\text{start}}, t_{\text{stop}})$.
2. **Drifting Narrowband Tone (`drifting_tone`):** Linear frequency trajectory $f(t) = f_{\text{start}} + \dot{f} \cdot (t - t_{\text{start}})$ supporting positive and negative drift rates ($\text{Hz/s}$). Boundary clipping is strictly tracked without opposite-edge wrap-around.
3. **Finite-Duration Burst (`burst`):** Temporally bounded emission spanning duration $\Delta t$, centered at $f_0$ with bandwidth $B$.
4. **Finite-Bandwidth Emission (`broadband_emission`):** Contiguous spectral feature spanning bandwidth $B$ (multiple channels) with boxcar or peak-normalized Gaussian profile.

### 3. Signal Injection & Exact SNR Definition

- **Mathematical Model:**
  $$V_{\text{combined}}[t, f] = V_{\text{background}}[t, f] + \sum_i S_i[t, f]$$
- **Peak SNR Convention:**
  $$\text{SNR}_{\text{peak}} = \frac{A_{\text{peak}}}{\sigma_{\text{noise}}}$$
  where $\sigma_{\text{noise}}$ is the theoretical standard deviation of the background noise.
- **Non-Destructive Guarantee:** Pristine background array is preserved untouched; injection alters only the mathematical signal support.
- **Strict Ground-Truth Isolation:** Ground-truth records are decoupled entirely from the detector-facing `values` matrix. No labels or targets are ever embedded into scientific arrays.

### 4. `setigen` Library Integration

- Isolated `SetigenAdapter` (`app/synthetic/setigen_adapter.py`) wrapping `setigen.Frame`.
- Maps frames directly into AETHON's canonical `values[time_index][frequency_index]` representation.
- Provides scientific synthetic frame generation alongside internal pure-NumPy fixtures.

### 5. Benchmark Suite Generation & Manifest Format

Benchmark datasets are packaged deterministically into a destination directory containing observation arrays (`.npy`), cryptographic SHA-256 hashes, and `manifest.json`:

```bash
# Generate reproducible demonstration benchmark
python scripts/generate_synthetic_benchmark.py --output-dir ./data/synthetic_benchmark --seed 42
```

The benchmark manifest (`BenchmarkManifest`) records:

- `dataset_id`, `version`, `generator_name`, `created_at_utc`, `seed`
- Observation counts: total, positive, negative controls, total injected targets
- Per-observation records: `is_negative_control`, `sha256`, `shape`, `ground_truth`
- Cryptographic verification via `load_benchmark_dataset(..., verify_checksums=True)`

### 6. Benchmark Evaluation Framework

Evaluates algorithm predictions (`CandidatePrediction`) against exact ground truth (`ObservationGroundTruth`):

- **1-to-1 Greedy IoU Matching:** Bounding boxes matched above configurable threshold (`min_iou_threshold`, default 0.05). Unmatched predictions = False Positives (FP); unmatched targets = False Negatives (FN).
- **Core Metrics:** Precision, Recall, F1 score, mean IoU, false-positive count, false-negative count.
- **Negative Control Assessment:** Explicitly counts false alarms on uncontaminated noise controls.
- **Per-Family Breakdown:** Granular recall and mean IoU reported per signal family.
- **Doppler Drift Error Metric:** Evaluates $|\dot{f}_{\text{pred}} - \dot{f}_{\text{gt}}|$ for matched drifting tones.
- **Validation Baseline (`ToyThresholdBaselineDetector`):** Simple threshold-crossing detector used strictly to verify benchmark and evaluator functionality (not a production detector).

---

## Phase 5: Scientific Anomaly Detection Engine

The anomaly detection engine (`app.detection`) discovers unusual time-frequency regions without assuming prior templates or labelled signal classes.

### 1. Analysis Window Geometry & Coordinates

Observations are partitioned into bounded 2D analysis windows (`AnalysisWindow`):

- Canonical shape: `values[time_index, freq_index]`.
- Configurable window dimensions: `time_size` (default 16), `freq_size` (default 16).
- Strides: `time_stride` (default 8), `freq_stride` (default 8) ensuring $50\%$ overlap.
- Zero-copy views: sub-matrices are sliced directly without full-array allocations.
- Physical coordinates computed using `TimeAxisModel` and `FrequencyAxisModel`:
  - `time_center_s`: physical midpoint timestamp in seconds from observation start.
  - `freq_center_hz`: physical channel center frequency in Hz.
  - `bandwidth_hz`: window physical bandwidth span in Hz.
- Quality filtering: windows falling below `min_valid_sample_fraction` (default 0.5) receive explicit warnings.

### 2. Numerical Feature Extraction (Schema v1.0.0)

For each analysis window, 11 distribution-free numerical features are extracted:

| Feature Name               | Category  | Mathematical Definition / Meaning                                                           |
| :------------------------- | :-------- | :------------------------------------------------------------------------------------------ |
| `median_level`             | Intensity | $\text{median}(V_{\text{valid}})$                                                           |
| `mad_dispersion`           | Intensity | $\text{median}(\|V_{\text{valid}} - \text{median}(V_{\text{valid}})\|)$                     |
| `robust_sigma`             | Intensity | $1.4826 \times \text{MAD}$ (normal-consistent dispersion)                                   |
| `iqr_range`                | Intensity | $P_{75} - P_{25}$ (interquartile range)                                                     |
| `upper_quantile_contrast`  | Intensity | $(P_{95} - \text{median}) / \max(10^{-12}, \sigma_{\text{robust}})$                         |
| `peak_snr`                 | Intensity | $(V_{\max} - \text{median}) / \max(10^{-12}, \sigma_{\text{robust}})$                       |
| `elevated_sample_fraction` | Intensity | Fraction of samples exceeding $\text{median} + 3\sigma_{\text{robust}}$                     |
| `channel_peak_contrast`    | Spectral  | $(\max_f \text{median}_t(V_{t, f}) - \text{median}) / \sigma_{\text{robust}}$               |
| `narrowband_concentration` | Spectral  | Power in peak channel divided by total positive energy in window                            |
| `temporal_persistence`     | Temporal  | In peak channel, fraction of time steps exceeding $\text{median} + 2\sigma_{\text{robust}}$ |
| `temporal_variability`     | Temporal  | MAD of channel-integrated time series divided by median level                               |

### 3. Statistical Baseline Detector

Identifies windows exhibiting significant deviation from reference feature distributions:

- Modified robust z-scores per feature $j$:
  $$Z_{i, j} = \frac{|X_{i, j} - M_j|}{\max(10^{-12}, 1.4826 \cdot \text{MAD}_j)}$$
- Aggregation methods:
  - `robust_mean`: Composite score $S_i = \frac{1}{D} \sum_{j=1}^D Z_{i, j}$.
  - `max`: Composite score $S_i = \max_j Z_{i, j}$.
- Decision rule: $\text{is\_anomalous} = (S_i \ge \text{mad\_threshold})$ (default 4.0).
- Evidence returned: `DetectionEvidence` documenting top contributing feature, rationale, and parameters.

### 4. Unsupervised Isolation Forest Detector

Tree-based outlier detector wrapping `sklearn.ensemble.IsolationForest`:

- **Score Inversion:** scikit-learn outputs negative values for outliers. To enforce our public convention where **higher score strictly indicates greater anomaly**, scores are transformed:
  $$\text{anomaly\_score} = - \text{decision\_function}(X)$$
- **Safe Thresholding:** Under default contamination calibration, decision boundary is $\text{threshold} = 0.0$.
- **Leakage Prevention:** Robust median/IQR scaling parameters are fitted strictly on the reference/training set and frozen. Evaluation features are scaled using reference parameters.
- **Persistence:** Models serialize to `.joblib` with verification envelope (`magic`, `feature_schema_version`, scikit-learn version). Unverified or corrupted files are rejected via `InvalidModelArtifactError`.

### 5. Deterministic Region Merging

When `merge_overlapping_regions=True`, contiguous or intersecting anomalous windows are consolidated via connected-component analysis into bounding boxes (`MergedRegion`):

- All contributing `window_id`s preserved.
- Max and mean anomaly scores computed.
- Physical coordinates and bandwidth calculated for merged bounding box.

### 6. Synthetic Benchmark Evaluation

`DetectionBenchmarkEvaluator` compares detector outputs against Phase 3 `ObservationGroundTruth`:

- Strict observation-level splits: Reference set (negative controls) for fitting; separate held-out set (positives + negative controls) for evaluation.
- No ground-truth leakage: models never see injection coordinates or labels during fitting.
- Metrics reported:
  - Target recall, window precision, window recall, window F1.
  - Observation-level detection rate on positive observations.
  - Noise false-alarm rate on negative control observations.
  - Granular breakdown by signal family (`stationary_tone`, `drifting_tone`, `burst`, `broadband`) and SNR range.

### 7. REST API Endpoint

`POST /api/observations/{id}/detect` accepts bounded coordinate ranges and configuration:

```json
{
  "time_start": 0,
  "time_stop": 64,
  "frequency_start": 100,
  "frequency_stop": 228,
  "config": {
    "window": {
      "time_size": 16,
      "freq_size": 16,
      "time_stride": 8,
      "freq_stride": 8
    },
    "baseline": {
      "enabled": true,
      "mad_threshold": 4.0,
      "aggregation": "robust_mean"
    },
    "isolation_forest": {
      "enabled": true,
      "contamination": 0.05,
      "random_state": 42
    },
    "merge_overlapping_regions": true
  }
}
```

---

## Phase 6: Doppler Drift & Temporal Analysis Engine

The Doppler analysis engine (`app.analysis`) isolates frequency trajectories, estimates linear drift rates with analytical standard errors, evaluates coherent drift search grids, performs pure-functional de-drift array transformations, characterizes temporal continuity, and assesses cross-observation recurrence.

- Apparent drift convention: $\dot{f} = \frac{\Delta f}{\Delta t}$ in $\text{Hz/s}$.
- Analytical regression standard error: $\text{SE}(\dot{f}) = \sqrt{\frac{SS_{\text{res}}}{(N - 2)\sum_i (t_i - \bar{t})^2}}$.
- Pure-functional de-drift: non-destructive row shearing by $-\dot{f}\Delta t$ with edge padding and zero circular wraparound.
- Cross-observation recurrence: verified frequency, temporal, and target matching.
- Public endpoint: `POST /api/observations/{id}/analyze-drift`.

---

## Phase 7: Candidate Engine, Evidence Aggregation & Scientific Case Files

The candidate engine (`app.candidates`) converts anomalous detections into verifiable, persistent candidate records, aggregates multi-stage scientific evidence, ranks candidates via transparent scoring heuristics, prevents duplicate fragmentation, manages human triage reviews, and exports publication-grade scientific PDF dossiers.

### 1. Domain Separation

| Concept                  | Meaning                                                                     |
| :----------------------- | :-------------------------------------------------------------------------- |
| **Observation**          | Raw scientific radio dataset and metadata.                                  |
| **Processing Run**       | Applied mathematical transformation and statistical RFI assessment.         |
| **Detection**            | Anomalous time-frequency window flagged by a detector.                      |
| **Analysis Result**      | Frequency trajectory, drift rate estimate, and temporal profile.            |
| **Candidate**            | Aggregated entity grouping related detections for scientific investigation. |
| **Candidate Assessment** | Versioned application of a documented scoring policy.                       |
| **Review Record**        | Immutable audit entry documenting human/system triage actions.              |
| **Candidate Dossier**    | Frozen snapshot case file with reproducibility appendix.                    |

### 2. Candidate Eligibility Policy

Detections are evaluated before candidate instantiation:

- Requires non-empty `source_observation_id`.
- Valid non-negative coordinate boundaries ($t_{\text{stop}} > t_{\text{start}}$, $f_{\text{stop}} > f_{\text{start}}$).
- Non-zero valid samples.
- Flagged cell fraction cannot exceed $95\%$ (partially contaminated regions are allowed with advisory warnings).

### 3. Duplicate Prevention & 2D Bounding-Box Grouping

Repeated detections within the same observation are merged to prevent candidate fragmentation:

- 2D Bounding-box $\text{IoU} \ge 0.20$.
- Spatial index proximity: $\Delta t \le 4$ time steps and $\Delta f \le 4$ frequency channels.
- Merging updates the bounding box to the spatial union, appends contributing detection IDs, ingests new evidence items, and increments assessment version.

### 4. Transparent Scoring Policy & Priority Bands

The candidate priority score is an operational engineering heuristic $[0.0, 100.0]$:

$$\text{Priority Score} = S_{\text{anomaly}} (35\%) + S_{\text{drift}} (25\%) + S_{\text{temporal}} (20\%) + S_{\text{quality}} (20\%) + \text{Bonus}_{\text{recurrence}} (+10\%)$$

- **Anomaly Evidence (35 pts):** Combines normalized baseline and Isolation Forest scores. Divergence ($|\Delta| > 0.40$) flags `detector_disagreement=True`.
- **Doppler Drift Coherence (25 pts):** $R^2$ goodness-of-fit weighted by analytical uncertainty ratio $\max(0, 1 - \text{SE} / |\dot{f}|)$. Missing drift awards $0.0$ pts and records missing evidence.
- **Temporal Continuity (20 pts):** Evaluates signal persistence fraction and active duration.
- **Data Quality (20 pts):** Clean background ($1.0 - \text{flagged\_fraction}$) awards full points; elevated RFI incurs documented penalties.
- **Recurrence Bonus (+10 pts):** Awarded for verified cross-observation recurrence compatibility.

Operational Priority Bands:

- `low`: Score $< 35.0$
- `moderate`: $35.0 \le \text{Score} < 60.0$
- `high`: $60.0 \le \text{Score} < 80.0$
- `exceptional`: $\text{Score} \ge 80.0$

### 5. Human Review Lifecycle

Explicit lifecycle state machine:
`unreviewed` $\rightarrow$ `under_review` $\rightarrow$ `needs_more_data` $\rightarrow$ `interesting` $\rightarrow$ `likely_interference` $\rightarrow$ `dismissed`.

Every transition records an immutable `ReviewRecord` preserving:

- Reviewer identifier (`reviewer_id`).
- Timestamps (`created_at_utc`).
- Previous and new statuses.
- Scientific rationale and cited evidence references.

### 6. Scientific Case Files & Vector PDF Dossiers

- **JSON Dossier (`CandidateDossier`):** Machine-readable snapshot capturing candidate summary, observation provenance, detection ledger, coordinates, measurements, scoring breakdown, review history, and a software reproducibility appendix (`numpy` version, schema version).
- **Vector PDF Dossier (`matplotlib.backends.backend_pdf.PdfPages`):** Clean, 2-page publication-grade PDF report:
  - Page 1: Header, Executive Summary, Score Breakdown Table, Observation Parameters, Mandatory Scientific Disclaimers.
  - Page 2: Aggregated Evidence Ledger, Human Review Audit Log, Missing Evidence, Reproducibility Appendix.
  - Fully selectable text, strict page boundaries, and 100% offline generation with zero external binary dependencies.

### 7. Candidate REST API Endpoints

- `GET /api/candidates`: List candidates with pagination and filtering (`observation_id`, `status`, `min_score`, `max_score`).
- `POST /api/candidates`: Create candidate or merge into existing candidate via spatial IoU/proximity grouping.
- `GET /api/candidates/{id}`: Retrieve single candidate record, evidence ledger, and current assessment.
- `POST /api/candidates/{id}/assess`: Re-evaluate candidate under a scoring policy and record new version.
- `GET /api/candidates/{id}/dossier`: Generate machine-readable JSON case file snapshot.
- `GET /api/candidates/{id}/dossier.pdf`: Download publication-grade 2-page vector PDF dossier.
- `POST /api/candidates/{id}/review`: Record a validated lifecycle review transition and persist audit log.

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

Run the full automated test suite (193 tests):

```powershell
# Windows (PowerShell)
.\.venv\Scripts\pytest.exe
```

```bash
# Unix
pytest -v
```

Tests run offline without requiring external network access or telemetry downloads:

- `test_candidates_eligibility_and_grouping.py`: Region bounds validation, sample count limits, flagged fraction thresholds, 2D IoU calculation, candidate merge.
- `test_candidates_scoring_and_evidence.py`: Evidence extraction normalization, deterministic component weights, missing drift handling, detector disagreement flag.
- `test_candidates_review_lifecycle.py`: State machine valid transitions, illegal transition rejection, audit history serialization, repository persistence.
- `test_candidates_dossier_and_pdf.py`: Structured JSON dossier snapshots, 2-page publication-grade vector PDF compilation, sparse evidence safety.
- `test_api_candidates.py`: End-to-end REST candidate creation, grouping idempotency, listing filters, priority re-assessment, JSON dossier, vector PDF streaming, and review actions.
- `test_analysis_trajectory.py`: Stationary carriers, drifting carriers, quality mask respect, low-SNR point rejection.
- `test_analysis_drift_estimation.py`: Exact positive/negative slopes in Hz/s, analytical SE uncertainty, degrees of freedom, index-space slope fallback.
- `test_analysis_drift_search.py`: Linear drift grid search, boundary-winner detection, safety hypothesis limits, stationary signal search.
- `test_analysis_dedrift.py`: Pure-functional de-drift array transformation, source immutability, zero-drift identity, boundary edge padding without circular wraparound.
- `test_analysis_temporal_and_recurrence.py`: Observed duration, sample coverage, max consecutive gaps, persistence, cross-observation recurrence matching/rejection.
- `test_analysis_evaluation.py`: DriftAnalysisEvaluator accuracy and recovery rate against Phase 3 synthetic ground truth.
- `test_api_analysis.py`: End-to-end `POST /api/observations/{id}/analyze-drift`, custom search/dedrift configs, 404 validation.
- `test_detection_features.py`: 11-feature window extraction, mathematical moments, NaN sanitization.
- `test_detection_baseline.py`: Modified z-score thresholding, in-situ and reference window scoring.
- `test_detection_isolation_forest.py`: Isolation Forest training, serialization, score inversion, deterministic random seed.
- `test_detection_service_and_regions.py`: Spatial grouping, bounding box merging, service pipeline.
- `test_detection_evaluation.py`: Precision, recall, F1, false alarm rate against synthetic targets.
- `test_api_detection.py`: API endpoint `POST /api/observations/{id}/detect`, custom thresholds, 404 validation.
- `test_processing_statistics.py`: Known median/MAD values, robust moments, channel/time distributions, zero dispersion.
- `test_processing_quality_and_rfi.py`: Quality mask initialization, channel flagger, time flagger, local flagger, clean control false alarms, multiple flag reasons coexistence.
- `test_processing_preservation_and_transformations.py`: Raw array immutability, baseline estimation, transformation history ledger, disabled transformations.
- `test_processing_evaluation.py`: Simulated contamination injection, evaluator metrics, synthetic target preservation.
- `test_api_processing.py`: End-to-end API processing endpoint, default options, custom transformations, disk immutability.
- `test_synthetic_generators.py`: Determinism, random seeds, noise statistics, signal placement, boundary clipping.
- `test_synthetic_injection.py`: Support preservation, untouched background, peak SNR convention.
- `test_synthetic_ground_truth.py`: Ground-truth schema serialization, negative control representation.
- `test_synthetic_evaluation.py`: IoU calculation, 1-to-1 matching, precision/recall, drift error.
- `test_synthetic_setigen.py`: Setigen frame generation, canonical slice conversion.
- `test_synthetic_benchmark.py`: Suite generation, manifest validity, SHA-256 integrity, tamper detection.
- `test_synthetic_pipeline.py`: End-to-end integration (generate -> serialize -> reload -> detect -> evaluate).
- `test_representation_axes.py`: Coordinate axis modeling, ascending Hz calculations, relative seconds.
- `test_slice_readers.py`: Filterbank memory-mapped bounded reads, FITS section/bintable readers.
- `test_api_slice.py`: Spectral slice API endpoint, matrix dimensions, coordinate alignment, `MAX_SLICE_CELLS` limits.
- `test_adapters.py`: Format adapters, signed channel bounds, missing metadata handling.
- `test_storage.py`: SQLite transactions, atomic staging move, collision immunity.
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
