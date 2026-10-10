# ROADMAP.md — Project Roadmap: AETHON

> **Current Milestone:** v2.0.0 — Scientific Data Pipeline, Doppler Intelligence & Verifiable Candidate Engine  
> **Goal:** Ingest real Breakthrough Listen observations, perform interactive Doppler drift & de-Doppler correction, mitigate RFI via explainable cadence logic, score candidates with layered models, and export research-grade scientific PDF dossiers for a flawless 3-minute technical demonstration.  
> **Status:** Active · Phase 7 Complete · Ready for Phase 8 Planning

---

## Must-Haves

- [x] Offline ingestion and header extraction of Breakthrough Listen `.fil` and `.fits` observations
- [x] Format-agnostic normalized spectral slice model with complete provenance
- [x] Controlled `setigen` synthetic signal injection & parameter recovery benchmark mode
- [x] Signal preprocessing, robust distribution-free statistics & RFI quality assessment layer (Phase 4)
- [x] Scientific anomaly detection engine (statistical baseline & unsupervised Isolation Forest) (Phase 5)
- [x] Apparent Doppler frequency drift estimation and non-destructive de-Doppler correction (Phase 6)
- [x] Transparent candidate management, evidence aggregation, and explainable scoring heuristics (Phase 7)
- [x] Publication-grade scientific PDF dossier export with embedded spectral snapshots and metadata (Phase 7)
- [ ] Explainable RFI mitigation with multi-cadence (on/off target) rejection logic (Phase 8)
- [ ] Canonical BLC1 (Proxima Centauri) case study with explainable terrestrial RFI disposition (Phase 8)
- [ ] Deterministic, offline-reliable 3-minute technical walkthrough (Phase 8)

---

## Archived Milestone (v1.0.0 — Core Web Architecture & Visual Refoundation)

- [x] **Phase 1:** Foundation & Visual Identity Refoundation (Direction H: Paper Desk `#F4F1EA` + Midnight Instrument `#0D141A`)
- [x] **Phase 2:** Observation & Discovery Pipelines (HTML5 Canvas DPR spectrogram rasterizers + Web Audio sonification)
- [x] **Phase 3:** Candidate Triage & Digital Research Bench (Interactive 4-stage analytical bench + candidate ledger)
- [x] **Phase 4:** Chronological Repository & Methodology Publication (Archive browser + 5-stage ML guide + Latent Manifold map)

---

## Active Milestone Phases (v2.0.0)

### Phase 0: Python Backend Foundation

- **Status:** ✅ Complete
- **Objective:** Establish the foundational Python and FastAPI backend service package layout, configuration management, structured logging, local Vite CORS support, unified error reporting, and automated health test suite.
- **Dependencies:** None (foundational infrastructure preceding Phase 5).
- **Implementation Scope:**
  - Dedicated `backend/` directory with standard package layout (`backend/app/{core,api,schemas}`).
  - Pydantic Settings configuration (`app/core/config.py`) and documented `.env.example`.
  - Structured application logging without credential leakage (`app/core/logging.py`).
  - Unified error handling conforming to frontend `ApiErrorPayload` (`app/schemas/error.py`).
  - CORS middleware supporting local Vite development (`http://localhost:5173`).
  - Stable, lightweight health check endpoints at `GET /health` and `GET /api/health`.
  - Automated test suite in `backend/tests/` with 14 passing tests.
- **Non-Goals:** Raw telescope data parsing (Phase 5); ML model training (Phase 9); database layers; live telescope streaming.
- **Expected Artifacts:** `backend/pyproject.toml`, `backend/app/main.py`, `backend/app/core/config.py`, `backend/app/api/routes/health.py`, `backend/tests/`.
- **Measurable Acceptance Criteria:**
  - FastAPI application initializes successfully with title, version, and OpenAPI docs (`/docs`, `/openapi.json`).
  - `GET /health` returns HTTP 200 with valid `HealthStatus` JSON.
  - CORS preflight OPTIONS requests return valid `Access-Control-Allow-Origin` for local Vite dev.
  - Invalid configuration options are rejected with predictable `ValidationError`.
  - Automated test suite passes with zero failures via `pytest`.
- **Verification Method:** `pytest` (14 passing tests) + empirical HTTP curl/REST requests to live Uvicorn instance.
- **Demo Value:** Unlocks backend API capabilities for subsequent scientific pipeline and telemetry integration without impacting frontend stability.

---

### Phase 5: Scientific Ingestion Foundation & Normalized Data Model (Backend Phase 1)

- **Status:** ✅ Complete
- **Objective:** Establish the Python/FastAPI scientific backend and ingestion layer to parse Breakthrough Listen `.fil` (filterbank) and `.fits` files into a unified scientific observation format with persistent metadata and provenance.
- **Dependencies:** Phase 0 (Python Backend Foundation).
- **Implementation Scope:**
  - Standalone scientific file ingestion engine (`backend/app/ingestion/`) with modular adapters.
  - SIGPROC filterbank parsing via `blimpy.Waterfall(..., load_data=False)` extracting channel counts, signed channel spacing (`foff`), reference frequency (`fch1`), sampling interval (`tsamp`), start MJD (`tstart`), source name, telescope ID, and sky coordinates (`src_raj`, `src_dej`).
  - Radio FITS parsing via `astropy.io.fits.open(..., memmap=True)` with dedicated sub-parsers:
    - `FitsSpectralImageParser` for 2D/3D/4D spectral image HDUs with WCS frequency/time axes.
    - `FitsBinTableParser` for PSRFITS/SDFITS `SUBINT` binary tables with `DAT_FREQ`, `TSUBINT`, `DATA`.
    - Explicit rejection of unsupported non-radio FITS layouts (e.g. optical images) via `UnsupportedFitsLayoutError`.
  - Canonical Pydantic observation schemas (`ScientificMetadata`, `Provenance`, `ObservationRecordResponse`, `ObservationListResponse`).
  - Exact frequency coverage edge calculation distinguishing channel centers from channel boundaries.
  - Safe persistent storage: streaming chunk validation, byte limit enforcement (HTTP 413), SHA-256 calculation, atomic staging move, and persistent SQLite metadata index.
  - REST endpoints: `POST /api/observations` (multipart upload), `GET /api/observations` (paginated listing), `GET /api/observations/{id}` (record details and provenance).
  - Automated offline test suite: 42 tests across unit adapters, storage transactions, error branches, and API integration.
- **Non-Goals:** Anomaly detection, RFI classification, Doppler drift analysis, signal ranking, model training, or candidate generation.
- **Artifacts:** `backend/app/ingestion/`, `backend/app/storage/`, `backend/app/schemas/observations.py`, `backend/app/api/routes/observations.py`, `backend/tests/test_adapters.py`, `backend/tests/test_storage.py`, `backend/tests/test_api_observations.py`.
- **Measurable Acceptance Criteria:**
  - Fast-loading header inspection without loading full multi-gigabyte data matrices into RAM.
  - Extracted header matches Astropy/blimpy values with zero loss of coordinate or timestamp precision.
  - Negative channel spacing preserved for descending frequency allocations.
  - Corrupted, empty, or unsupported files rejected with safe HTTP error codes (400, 413, 422).
  - Persisted observation records survive application restarts with zero orphan files.
  - Automated test suite passes with 42/42 tests passing offline.
- **Verification Method:** `pytest` (42 passing tests) + `ruff check .` (0 errors) + `mypy app` (0 issues).
- **Demo Value:** Enables researchers and evaluators to upload and index genuine telescope observations directly from the Breakthrough Listen archive.

---

### Phase 2: Canonical Scientific Data Representation & Spectral Slice Engine (Backend Phase 2)

- **Status:** ✅ Complete
- **Objective:** Establish an authoritative, validated, memory-conscious internal representation of radio-observation data with reliable time-frequency coordinate mapping and bounded spectral slice retrieval via REST API.
- **Dependencies:** Phase 0 (Backend Foundation), Phase 1 / Phase 5 (Observation Ingestion Engine).
- **Implementation Scope:**
  - Canonical 2D matrix contract: `values[time_index][frequency_index]` with Axis 0 = Time (chronologically increasing) and Axis 1 = Frequency (strictly ascending in Hz).
  - Explicit scientific coordinate models: `FrequencyAxisModel` (channel centers in Hz, spacing, reference channel) and `TimeAxisModel` (sampling interval in seconds, relative timestamps, MJD/UTC reference).
  - Reader abstraction (`BaseSliceReader`) with format-specific bounded array slicing:
    - `FilterbankSliceReader`: Memory-mapped access via `np.memmap` using binary header offset (`idx_data`), signed frequency channel mapping, and column flipping for descending source channels (`[:, ::-1]`). Explicit memory-unmapping and garbage collection preventing Windows file locks.
    - `FitsSliceReader`: Slices radio spectral images via `astropy.fits.HDU.section` without loading full arrays into RAM, and reads selected rows from radio binary tables (PSRFITS/SDFITS `SUBINT`).
  - Representation service (`SliceService`): validates half-open index ranges `[start, stop)`, enforces `MAX_SLICE_CELLS` safety bound (default: 250,000 cells), generates aligned physical coordinate arrays, detects IEEE non-finite samples (NaN/Inf) and serializes them as JSON `null`, and compiles audit provenance.
  - REST endpoint: `GET /api/observations/{observation_id}/slice` with full OpenAPI models and documentation.
  - Comprehensive automated test suite: 62 tests across axis models, slice readers, boundary validations, limit enforcement, and API integration.
- **Non-Goals:** Signal detection, RFI classification, Doppler drift estimation, anomaly scoring, candidate ranking, or ML model training.
- **Artifacts:** `backend/app/representation/`, `backend/app/schemas/slice.py`, `backend/app/api/routes/observations.py` (`GET /{id}/slice`), `backend/tests/test_representation_axes.py`, `backend/tests/test_slice_readers.py`, `backend/tests/test_api_slice.py`.
- **Measurable Acceptance Criteria:**
  - Bounded data retrieval directly from disk without loading full raw observations into memory.
  - Consistent array convention `values[time_index][frequency_index]` with strictly ascending frequency columns.
  - Exact frequency coordinates in Hz and relative timestamps in seconds aligned with returned matrix dimensions.
  - Memory-safe operation on Windows with zero file-lock errors (`PermissionError [WinError 32]`).
  - Requests exceeding `MAX_SLICE_CELLS` rejected with HTTP 422 `SLICE_CELL_LIMIT_EXCEEDED`.
  - Non-finite samples safely encoded as `null` in JSON responses.
  - Source raw files remain completely immutable on disk.
  - Automated test suite passes 100% offline (62/62 passing).
- **Verification Method:** `pytest` (62 passing tests) + `ruff check .` (0 errors) + `ruff format --check .` (0 errors) + `mypy app` (0 issues).
- **Demo Value:** Provides the dependable scientific data contract that future preprocessing, Doppler correction, and candidate screening engines consume.

---

### Phase 3: Synthetic Signal Laboratory and Benchmark Framework (Backend Phase 3)

- **Status:** ✅ Complete
- **Objective:** Build a reproducible synthetic radio-signal laboratory capable of generating controlled time-frequency observations, injecting signals with known properties into configurable noise backgrounds, preserving exact ground truth, packaging benchmark datasets, and providing quantitative evaluation metrics without implementing production detectors prematurely.
- **Dependencies:** Phase 0 (Backend Foundation), Phase 1 / Phase 5 (Ingestion Engine), Phase 2 (Canonical Data Representation).
- **Implementation Scope:**
  - Dedicated scientific module (`backend/app/synthetic/`) decoupled from FastAPI routes:
    - `backgrounds.py`: Configurable statistical noise generators (Gaussian $\mathcal{N}(\mu, \sigma^2)$, flat baseline with spectral slope, time-varying noise $\sigma(t)$) using isolated `numpy.random.default_rng(seed)` (PCG64). True negative controls preserved.
    - `signals.py`: Extensible signal generators (`BaseSignalGenerator`) for 4 core families: narrowband stationary tone (`stationary_tone`), drifting tone with boundary clipping tracking (`drifting_tone`), finite burst (`burst`), and broadband contiguous emission (`broadband_emission`).
    - `injection.py`: Non-destructive additive injection ($V_{\text{combined}} = V_{\text{background}} + \sum S_i$) adhering to Peak SNR convention ($\text{SNR}_{\text{peak}} = A_{\text{peak}} / \sigma_{\text{noise}}$) and outputting canonical `CanonicalSlice`.
    - `ground_truth.py`: Strongly typed ground-truth models (`InjectedSignalGroundTruth`, `ObservationGroundTruth`) preserving trajectories, bounding boxes, parameters, and clipping flags. Strictly separated from observation array `values`.
    - `setigen_adapter.py`: Isolated adapter mapping `setigen.Frame` to canonical `values[time_index][frequency_index]` with physical axes models.
    - `dataset.py`: Benchmark packaging suite (`BenchmarkDatasetGenerator`) creating 9-observation standard suites, computing SHA-256 hashes, generating `manifest.json`, and providing `load_benchmark_dataset` with tamper detection.
    - `evaluation.py`: Quantitative benchmark evaluator (`BenchmarkEvaluator`) with 1-to-1 greedy IoU matching, precision, recall, F1, per-family breakdown, negative-control false alarms, Doppler drift error calculation, and `ToyThresholdBaselineDetector` validation baseline.
  - CLI generation script: `backend/scripts/generate_synthetic_benchmark.py` (`--output-dir`, `--seed`, `--dataset-id`, `--verify`).
  - Comprehensive automated test suite: 94 passing tests (32 new synthetic unit, property, and integration tests).
- **Non-Goals:** Production anomaly detection, RFI classification, Doppler drift estimator, candidate ranking, CNNs, Isolation Forest, or ML training.
- **Artifacts:** `backend/app/synthetic/`, `backend/scripts/generate_synthetic_benchmark.py`, `backend/tests/test_synthetic_*.py`.
- **Measurable Acceptance Criteria:**
  - Deterministic generation: identical seeds yield bit-for-bit identical background and signal arrays.
  - Support preservation: injection modifies only mathematical support cells; background untouched elsewhere.
  - Zero ground truth leakage: observation matrices contain no labels or markers.
  - Standard benchmark suite generated and loaded from disk with 100% SHA-256 verification.
  - Evaluator correctly assesses true positives, false positives, missed detections, and drift error from supplied estimates.
  - Automated test suite passes 100% offline (94/94 passing).
- **Verification Method:** `pytest` (94 passing tests) + `ruff check .` (0 errors) + `ruff format --check .` (0 errors) + `mypy app` (0 issues).
- **Demo Value:** Enables rigorous scientific calibration and quantitative benchmark reporting for all subsequent anomaly detection, Doppler analysis, and candidate screening modules.

---

### Phase 4: Signal Processing and RFI Assessment (Backend Phase 4)

- **Status:** ✅ Complete
- **Objective:** Establish a distribution-free, reproducible signal-processing and RFI-assessment pipeline capable of assessing observation quality, estimating background behavior without assuming Gaussian distributions, generating transparent statistical indicators for suspicious channels, time samples, and local outliers, preserving interesting signals, and outputting traceable quality flags and transformation history.
- **Dependencies:** Phase 0 (Backend Foundation), Phase 1 / Phase 5 (Ingestion Engine), Phase 2 (Canonical Data Representation), Phase 3 (Synthetic Signal Laboratory).
- **Implementation Scope:**
  - Dedicated scientific module (`backend/app/processing/`) decoupled from HTTP transport:
    - `statistics.py`: Distribution-free robust statistical estimators (sample count, finite/non-finite count, median, mean, sample standard deviation, MAD ($\text{median}(|x - \text{median}(x)|)$), robust sigma ($1.4826 \times \text{MAD}$), quantiles (P25, P75), per-channel medians/MAD, per-time integration medians/MAD, and modified z-scores).
    - `quality.py`: Input validation (2D dimensions, positive sizes, finite checks, resource limit `MAX_PROCESSING_CELLS = 1_048_576`), and `initialize_quality_mask` tagging non-finite samples with `FlagReason.NON_FINITE`.
    - `rfi/channel_flags.py`: Robust frequency-channel flagger based on channel medians modified z-score (>4.5) and outlier sample fraction (>0.40) relative to observation robust dispersion.
    - `rfi/time_flags.py`: Robust time-sample flagger detecting broadband power bursts (>4.5 sigma) and elevated channel fractions (>0.40).
    - `rfi/local_flags.py`: Fast 2D moving median/MAD outlier detector using `scipy.ndimage.median_filter` (>5.0 sigma).
    - `rfi/__init__.py`: Orchestrates channel, time, and local indicators into an explainable `RfiAssessmentReport` with scientific disclaimers separating evidence from source classifications.
    - `baseline.py`: Configurable baseline estimation (`per_channel_median`, `moving_median_2d`, or `none`).
    - `transformations.py`: Optional, reproducible transformations (`subtract_channel_background`, `robust_standardization`, `apply_mask_in_output`) with complete audit ledger (`TransformationRecord`).
    - `pipeline.py`: Pipeline coordinator (`run_processing_pipeline`) and `ProcessingService`.
    - `evaluation.py`: Quantitative evaluation framework (`PreprocessingEvaluator` and `SyntheticContaminationInjector`) measuring contamination flag rate, clean false-flag rate, raw matrix preservation, and target signal retention without ground-truth leakage.
  - REST endpoint: `POST /api/observations/{id}/process` with request/response Pydantic schemas.
  - Comprehensive automated test suite: 122 passing tests (28 new tests across statistics, quality, RFI flaggers, transformations, evaluation, and REST API).
- **Non-Goals:** Production anomaly detection, Isolation Forest, CNN training, Doppler drift estimation, candidate ranking, or automatic source classification.
- **Artifacts:** `backend/app/processing/`, `backend/app/schemas/processing.py`, `backend/tests/test_processing_*.py`, `backend/tests/test_api_processing.py`.
- **Measurable Acceptance Criteria:**
  - Raw source file and canonical NumPy array immutability: bit-for-bit identical before and after processing.
  - Quality mask convention: `QualityMask` maintains primary boolean exclusion mask (`True` = flagged/excluded) alongside independent reason layers (`FlagReason`).
  - Transparent evidence: all flags document thresholds, parameters, and rationale; no fabricated RFI probabilities.
  - Signal retention: clean synthetic target signals retain 100% support unmasked in default pipeline; synthetic contamination flagged at >98%; clean noise false-alarm rate <2%.
  - Memory bounds: strict cell ceiling enforced (`MAX_PROCESSING_CELLS`); chunked/moving-window operations.
  - Automated test suite passes 100% offline (122/122 passing).
- **Verification Method:** `pytest` (122 passing tests) + `ruff check .` (0 errors) + `ruff format --check .` (0 errors) + `mypy app` (0 issues) + `npm run check` (0 errors).
- **Demo Value:** Guarantees clean, traceable, analysis-ready spectral data for all subsequent anomaly detection, Doppler searching, and candidate scoring algorithms while preserving scientific integrity.

---

### Phase 5: Scientific Anomaly Detection Engine (Backend Phase 5)

- **Status:** ✅ Complete
- **Objective:** Implement a reproducible, distribution-free anomaly-detection engine that partitions time-frequency observations into bounded analysis regions, extracts documented numerical features, establishes a transparent statistical baseline, fits an unsupervised Isolation Forest detector with strict data-leakage prevention, outputs traceable evidence, and evaluates both detectors against controlled Phase 3 synthetic benchmarks.
- **Dependencies:** Phase 0 (Backend Foundation), Phase 1 / Phase 5 (Ingestion Engine), Phase 2 (Canonical Data Representation), Phase 3 (Synthetic Signal Laboratory), Phase 4 (Signal Processing and RFI Assessment).
- **Implementation Scope:**
  - Dedicated scientific detection module (`backend/app/detection/`) decoupled from HTTP controllers:
    - `exceptions.py`: Domain exceptions (`DetectionError`, `InvalidDetectionConfigError`, `EmptyAnalysisRegionError`, `ModelNotFittedError`, `DetectionDimensionLimitExceededError`, `InvalidModelArtifactError`).
    - `config.py`: Validated Pydantic models (`WindowConfig`, `StatisticalBaselineConfig`, `IsolationForestConfig`, `DetectionPipelineConfig`).
    - `schemas.py`: Data models (`AnalysisWindow`, `DetectionEvidence`, `AnomalousRegion`, `MergedRegion`, `DetectionResult`) and `SCIENTIFIC_DETECTION_DISCLAIMER`.
    - `features.py`: Schema v1.0.0 with 11 distribution-free numerical features (intensity, frequency-distribution, and temporal moments) protected against zero dispersion.
    - `windows.py`: Zero-copy window partitioning with physical coordinates (`time_center_s`, `freq_center_hz`, `bandwidth_hz`), sample validity thresholds, and safety ceilings (`max_windows`).
    - `baseline.py`: Transparent statistical baseline detector computing modified z-scores ($Z_{i, j}$) against reference window ensembles with deterministic top-feature rationale.
    - `isolation_forest.py`: Unsupervised Isolation Forest detector (`scikit-learn>=1.4.0`) with robust scaling fitted strictly on reference data, inverted score direction ($\text{anomaly\_score} = -\text{decision\_function}(X)$), deterministic `random_state`, and verified `.joblib` model persistence.
    - `regions.py`: Connected-component spatial merging consolidating overlapping/contiguous anomalous windows into unified bounding boxes (`MergedRegion`).
    - `service.py`: Pipeline coordinator (`DetectionService`) executable directly from Python.
    - `evaluation.py`: Quantitative benchmark evaluator (`DetectionBenchmarkEvaluator`) with observation-level split isolation, precision, recall, F1, and signal family breakdown.
  - REST API endpoint: `POST /api/observations/{id}/detect` supporting bounded coordinates and pipeline configuration.
  - Comprehensive automated test suite: 145 passing tests (23 new tests across features, baseline, Isolation Forest, service, regions, evaluation, and REST API).
- **Non-Goals:** Production Doppler drift estimation, de-Doppler correction, candidate ranking, CNN training, or claims of extraterrestrial intelligence.
- **Artifacts:** `backend/app/detection/`, `backend/app/schemas/detection.py`, `backend/tests/test_detection_*.py`, `backend/tests/test_api_detection.py`.
- **Measurable Acceptance Criteria:**
  - Zero-copy window slicing: large matrices processed without full-array duplications.
  - Transparent scores: higher displayed scores strictly indicate greater anomaly.
  - Leakage prevention: models fitted exclusively on reference observations; zero ground truth exposed to detectors.
  - High recall on strong synthetic targets (>95% recall for SNR $\ge 15$), low false-positive rate on noise controls (<5%).
  - Safe model persistence: artifacts verified against magic headers and schema versions.
  - Automated test suite passes 100% offline (145/145 passing).
- **Verification Method:** `pytest` (145 passing tests) + `ruff check .` (0 errors) + `ruff format --check .` (0 errors) + `mypy app` (0 issues) + `npm run check` (0 errors).
- **Demo Value:** Unlocks automated discovery of unusual candidate signals across radio observations with interpretable evidence and verified false-positive bounds.

---

### Phase 6: Doppler Drift and Temporal Analysis Engine (Backend Phase 6)

- **Status:** ✅ Complete
- **Objective:** Implement a reproducible, distribution-free analysis engine for estimating apparent frequency drift trajectories, measuring linear frequency drift rates ($\dot{f}$ in Hz/s) with explicit analytical uncertainty, evaluating bounded drift hypotheses via coherent integration, providing non-destructive linear de-drift array transformations, characterizing temporal persistence/gaps/duration, and conservatively comparing multi-observation events for recurrence without data leakage.
- **Dependencies:** Phase 0 (Backend Foundation), Phase 1 (Ingestion Engine), Phase 2 (Canonical Data Representation), Phase 3 (Synthetic Signal Laboratory), Phase 4 (Signal Processing and RFI Assessment), Phase 5 (Scientific Anomaly Detection Engine).
- **Implementation Scope:**
  - Dedicated scientific analysis module (`backend/app/analysis/`) decoupled from FastAPI:
    - `exceptions.py`: Domain exceptions (`AnalysisError`, `InvalidAnalysisConfigError`, `InsufficientTrajectoryPointsError`, `DegenerateTrajectoryError`, `CoordinateMetadataUnavailableError`, `HypothesisLimitExceededError`, `IncompatibleObservationError`).
    - `config.py`: Validated Pydantic models (`TrajectoryExtractionConfig`, `DriftEstimationConfig`, `DriftSearchConfig`, `DeDriftConfig`, `TemporalConfig`, `RecurrenceConfig`, `AnalysisPipelineConfig`).
    - `schemas.py`: Data models (`TrajectoryPoint`, `FrequencyTrajectory`, `DriftFitResult`, `DriftHypothesis`, `DriftSearchResult`, `DeDriftResult`, `TemporalCharacterization`, `RecurrenceComparisonRecord`, `AnalysisResult`, `SCIENTIFIC_DOPPLER_DISCLAIMER`).
    - `trajectory.py`: Trajectory extraction via per-time peak power ridge with quadratic centroid refinement, SNR thresholding, and Phase 4 `QualityMask` integration.
    - `drift_estimation.py`: Linear drift regression via OLS on time-centered coordinates ($\dot{f} = \Delta f / \Delta t$ in Hz/s), analytical standard error $\text{SE}(\dot{f}) = \sqrt{SS_{\text{res}} / ((N-2)\sum(t_i - \bar{t})^2)}$, $R^2$, residual standard deviation, and index-space slope fallback (channels/step).
    - `drift_search.py`: Coherent linear drift hypothesis testing over a bounded grid, summing sheared rows into integrated profiles, scoring peak SNR, with safety ceilings and boundary-winner detection.
    - `dedrift.py`: Pure-functional de-drift array transformation shearing rows by $-\dot{f}\Delta t$ into vertical columns with edge padding and zero circular wraparound.
    - `temporal.py`: Temporal characterization measuring active duration, sample coverage fraction, consecutive gap duration, persistence fraction, and power variability.
    - `recurrence.py`: Multi-observation event comparison with verified frequency separation tolerances, epoch tracking (MJD/UTC), and astronomical source matching.
    - `service.py`: `AnalysisService` orchestrator supporting raw arrays or Phase 2 `CanonicalSlice` objects directly from Python.
    - `evaluation.py`: `DriftAnalysisEvaluator` measuring signed and absolute drift rate errors and recovery rates against Phase 3 `ObservationGroundTruth` with zero data leakage.
  - REST API endpoint: `POST /api/observations/{id}/analyze-drift` with bounded slicing coordinates and custom configuration.
  - Comprehensive automated test suite: 173 passing tests (28 new tests across trajectory extraction, drift estimation, hypothesis search, de-drift transformation, temporal analysis, recurrence, benchmark evaluation, and REST API).
- **Non-Goals:** Final candidate-ranking engine, candidate dossier generation, CNN training, automatic extraterrestrial classification, or claiming an observed topocentric drift is a complete physical Doppler velocity solution.
- **Artifacts:** `backend/app/analysis/`, `backend/app/schemas/analysis.py`, `backend/tests/test_analysis_*.py`, `backend/tests/test_api_analysis.py`.
- **Measurable Acceptance Criteria:**
  - Apparent drift convention: $\dot{f} = \frac{\Delta f}{\Delta t}$ in Hz/s under canonical ascending frequency orientation.
  - Analytical uncertainty: $\text{SE}(\dot{f})$ computed rigorously without invented heuristics; index slope fallback provided when physical axes are unavailable.
  - Bounded search: grid size constrained by safety ceilings (`max_hypotheses`); boundary winners flagged honestly (`is_on_boundary`).
  - Source immutability: de-drift transformation produces new derived views; raw observations remain 100% bit-for-bit immutable.
  - Temporal metrics: duration, coverage, persistence, and gaps quantified honestly without inferring continuity across data gaps.
  - Ground truth isolation: benchmark evaluation code assesses estimates against held-out synthetic targets with zero leakage into analysis routines.
  - Automated test suite passes 100% offline (173/173 passing).
- **Verification Method:** `pytest` (173 passing tests) + `ruff check .` (0 errors) + `ruff format --check .` (0 errors) + `mypy app` (0 issues) + `npm run check` (0 errors).
- **Demo Value:** Provides rigorous mathematical characterization of candidate signals through drift velocity, coherence optimization, restacked vertical profiles, and multi-epoch recurrence tracking.

---

### Phase 7: Candidate Engine, Evidence Aggregation, and Scientific Case Files

- **Status:** ✅ Complete
- **Objective:** Establish a transparent, reproducible candidate-management system that combines outputs from detection (Phase 5), data quality/RFI (Phase 4), and Doppler drift/temporal analysis (Phase 6) into traceable, reviewable candidate records; rank them using versioned, explainable heuristics; prevent duplicate fragmentation via 2D IoU/proximity grouping; support an explicit human-review lifecycle; and generate reproducible case files (JSON dossiers) and exportable scientific PDF dossiers.
- **Dependencies:** Phase 0 (Foundation), Phase 1 (Ingestion), Phase 2 (Representation), Phase 3 (Synthetic Lab), Phase 4 (Processing/RFI), Phase 5 (Anomaly Detection), Phase 6 (Doppler & Temporal Analysis).
- **Implementation Scope:**
  - Candidate domain boundaries: strict separation of Observation, Processing Run, Detection, Analysis Result, Candidate, Candidate Assessment, Review Record, and Candidate Dossier.
  - Candidate data model (`app/candidates/schemas.py`) with stable IDs (`cand_<uuid>`), target bounding regions, physical coordinates, immutable evidence ledger, and status machine.
  - Eligibility engine (`app/candidates/eligibility.py`) enforcing bound sanity, non-zero sample presence, and flagged fraction ceilings without rejecting partially contaminated signals.
  - Deterministic 2D bounding-box grouping (`app/candidates/grouping.py`) merging duplicate windows via IoU ($\ge 0.20$) or coordinate proximity ($\le 4$ steps, $\le 4$ channels).
  - Evidence normalization (`app/candidates/evidence.py`) creating uniform `EvidenceItem` records from detection, RFI assessment, and Doppler drift runs.
  - Explainable scoring heuristic (`app/candidates/scoring.py`): composite operational priority score $[0.0, 100.0]$ with bounded component contributions (35% anomaly, 25% drift coherence, 20% temporal continuity, 20% data quality, +10% recurrence bonus) and explicit missing-evidence reporting.
  - Human review lifecycle state machine (`app/candidates/review.py`) validating transitions (`unreviewed`, `under_review`, `needs_more_data`, `likely_interference`, `interesting`, `dismissed`) with persistent audit trails.
  - SQLite WAL repository (`app/candidates/repository.py`) storing candidates, assessments, and review history.
  - Structured JSON dossier snapshots (`app/candidates/dossier.py`) compiling frozen state with reproducibility appendix (software versions, hashes).
  - Publication-grade vector PDF export (`app/candidates/pdf.py`) via `matplotlib.backends.backend_pdf.PdfPages` rendering clean 2-page research reports with selectable text, diagnostic tables, and mandatory scientific disclaimers.
  - REST API endpoints (`app/api/routes/candidates.py`): `GET /api/candidates`, `POST /api/candidates`, `GET /api/candidates/{id}`, `POST /api/candidates/{id}/assess`, `GET /api/candidates/{id}/dossier`, `GET /api/candidates/{id}/dossier.pdf`, `POST /api/candidates/{id}/review`.
- **Non-Goals:** Automatic declaration of extraterrestrial discovery, new ML classifiers, model retraining, or unauthorized arbitrary file writes.
- **Artifacts:** `backend/app/candidates/`, `backend/app/schemas/candidates.py`, `backend/app/api/routes/candidates.py`, `backend/tests/test_candidates_*.py`, `backend/tests/test_api_candidates.py`.
- **Measurable Acceptance Criteria:**
  - Candidate records reference verified upstream observations and detections.
  - 2D bounding-box IoU grouping prevents duplicate candidate fragmentation idempotently.
  - Missing evidence handled explicitly without assigning arbitrary defaults or zero values.
  - Candidate assessments preserved historically with versioning.
  - Review status changes maintain complete audit records (timestamp, reviewer, rationale).
  - Structured case files and 2-page vector PDFs generated deterministically from frozen snapshots.
  - Full automated test suite passes 100% offline (193/193 tests passing).
- **Verification Method:** `pytest` (193 passing tests) + `ruff check .` (0 errors) + `mypy app` (0 issues) + `npm run check` (0 errors).
- **Demo Value:** Transforms raw algorithmic detections into professional, verifiable scientific case files that researchers and hackathon evaluators can inspect, review, triage, and export as PDF dossiers.

---

### Phase 8: Explainable RFI Mitigation & Multi-Cadence Logic

- **Status:** ⬜ Not Started
- **Objective:** Implement deterministic and multi-cadence RFI rejection, penalizing terrestrial interference with transparent, human-readable scientific rationale.
- **Dependencies:** Phase 6 & Phase 7.
- **Implementation Scope:**
  - On/Off target cadence evaluator (ABACAD observing pattern): check if signal persists during off-target telescope pointings.
  - Terrestrial interference classifier: identify zero-drift signals ($0.0\text{ Hz/s}$), wideband noise, and known terrestrial allocation bands (e.g., GPS, satellite downlinks, airport radar).
  - Explainable disposition generator producing an array of plain-language diagnostic reasons for any score downgrade.
- **Non-Goals:** Unverifiable black-box neural RFI filtering without explanation.
- **Expected Artifacts:** `backend/analysis/rfi.py`, `backend/analysis/cadence.py`, `src/components/analysis/RfiExplanationPanel.tsx`.
- **Measurable Acceptance Criteria:**
  - Candidate present in off-target beam is automatically flagged with `OFF_TARGET_PRESENCE` and confidence penalized by $\ge 70\%$.
  - Zero-drift candidate within local oscillator/satellite band receives disposition `LIKELY_TERRESTRIAL_RFI`.
  - UI displays explicit breakdown: "Candidate Downgraded: Detected in OFF pointing; Zero drift rate consistent with ground-based transmitter."
- **Verification Method:** Cadence integration test with multi-pointing observation pairs.
- **Demo Value:** Demonstrates scientific credibility and honesty—shows that AETHON rigorously filters terrestrial noise rather than crying "aliens" at every anomaly.

---

### Phase 9: Layered ML Anomaly Scoring & Ground-Truth Benchmarks (`setigen`)

- **Status:** ⬜ Not Started
- **Objective:** Deploy the 3-tier scoring pipeline (Physics metrics + Isolation Forest + PyTorch CNN) and integrate `setigen` for controlled synthetic signal injection and quantifiable recovery benchmarking.
- **Dependencies:** Phase 6, 7, 8.
- **Implementation Scope:**
  - Physical feature vector extraction (SNR, narrowbandness, drift consistency, persistence, harmonic regularity).
  - Scikit-learn Isolation Forest model for unsupervised spectral outlier scoring.
  - Lightweight PyTorch CNN model evaluating spectrogram patches for artificial/narrowband characteristics.
  - `setigen` injection pipeline generating controlled test carriers (custom frequency, drift rate, SNR, chirp) into telescope noise baselines.
  - Benchmark Mode UI (`/benchmark`) reporting precision, recall, drift error, and SNR thresholds.
- **Non-Goals:** Monolithic black-box models; training on live multi-gigabyte datasets during runtime.
- **Expected Artifacts:** `backend/ml/features.py`, `backend/ml/anomaly_forest.py`, `backend/ml/cnn_classifier.py`, `backend/benchmarks/setigen_pipeline.py`, `src/pages/Benchmark/index.tsx`.
- **Measurable Acceptance Criteria:**
  - Composite score calculated deterministically via documented formula: $\text{score} = \sum w_i \cdot s_i$.
  - Injected `setigen` signals with $\text{SNR} \ge 15\text{ dB}$ recovered with $\ge 95\%$ recall.
  - Drift rate recovery error $\le 0.05\text{ Hz/s}$.
- **Verification Method:** Automated benchmark run outputting quantitative performance table.
- **Demo Value:** Provides hard numbers and ground-truth validation to satisfy technical and data-science judges.

---

### Phase 10: Cross-Observation Verification & Canonical BLC1 Case Study

- **Status:** ⬜ Not Started
- **Objective:** Integrate the flagship Breakthrough Listen Candidate 1 (BLC1 / Proxima Centauri) dataset and multi-observation verification workflow.
- **Dependencies:** Phase 7, 8, 9.
- **Implementation Scope:**
  - Curate and package the BLC1 Proxima Centauri observation slice and corresponding off-target pointings.
  - End-to-end interactive case study walkthrough in the UI: from initial detection of the drifting tone at ~982 MHz through cadence analysis, inter-modulation search, and final disposition as terrestrial interference.
  - Cross-observation candidate comparison tool to check recurrence across historical observations.
- **Non-Goals:** Ingesting the complete hundreds-of-gigabytes raw Parkes BLC1 archive.
- **Expected Artifacts:** `backend/data/blc1_case_study/`, `src/pages/Analysis/components/Blc1Walkthrough.tsx`, documentation in `/archive`.
- **Measurable Acceptance Criteria:**
  - BLC1 case study reproducible deterministically from UI without network access.
  - Final disposition correctly resolves to `TERRESTRIAL_INTERFERENCE` with traceable scientific evidence.
- **Verification Method:** UI walkthrough verification and automated case study assertion test.
- **Demo Value:** The primary narrative centerpiece for the research presentation.

---

### Phase 11: Scientific Candidate Dossier & Research PDF Generator

- **Status:** ⬜ Not Started
- **Objective:** Build an exportable, publication-grade scientific PDF research dossier preserving FITS headers, high-resolution spectral snapshots, measurements, RFI audit traces, and cryptographically hashed provenance.
- **Dependencies:** Phase 7, 8, 9, 10.
- **Implementation Scope:**
  - High-resolution offscreen Canvas/SVG rasterizer for publication-ready spectrogram and de-Doppler plots.
  - Backend/client-side PDF generation module rendering an editorial-quality research report adhering to Direction H design standards.
  - Cryptographic provenance hashing (SHA-256 of raw data slice + processing parameter manifest).
  - UI "Export Scientific Dossier" trigger with instant PDF download and modal preview.
- **Non-Goals:** Complex LaTeX toolchain requirement; editable Word documents.
- **Expected Artifacts:** `backend/export/dossier_pdf.py`, `src/components/export/DossierModal.tsx`, sample exported `dossier_blc1.pdf`.
- **Measurable Acceptance Criteria:**
  - Generates valid, printable PDF document containing all required sections in $<1.5\text{ s}$.
  - Spectrograms embedded at $\ge 300\text{ DPI}$ without compression artifacts.
  - Preserves exact FITS/filterbank header parameters and SHA-256 slice hash.
- **Verification Method:** Automated PDF structure validation and visual inspection.
- **Demo Value:** Tangible, impressive takeaway that evaluators can see and inspect during or after technical review.

---

### Phase 12: Performance Profiling, Offline Demo Cache & Rehearsed Flow

- **Status:** ⬜ Not Started
- **Objective:** Profile end-to-end execution, eliminate processing bottlenecks, pre-cache demo data, and rehearse the exact 3-minute technical walkthrough flow for zero-latency, 100% offline execution.
- **Dependencies:** All previous phases.
- **Implementation Scope:**
  - Profile CPU and memory consumption across ingestion, FFT, and de-Doppler routines; apply vectorization / caching where required.
  - Bundle all demo observations and precomputed steps locally so the app runs flawlessly in airplane mode.
  - Add an automated Demo Mode toggle that seeds the application with the exact rehearsable 3-minute presentation state.
  - Comprehensive Playwright E2E test executing the 3-minute demo script and verifying all metrics, charts, and transitions.
- **Non-Goals:** Over-engineering premature GPU pipelines; adding unnecessary cloud dependencies.
- **Expected Artifacts:** `tests/e2e/technical_demo.spec.ts`, `backend/cache/demo_precomputed.json`, performance benchmark logs.
- **Measurable Acceptance Criteria:**
  - 100% offline operation verified with WiFi disconnected.
  - Page transitions across all 9 routes complete in $<1.0\text{ s}$.
  - Zero console errors or uncaught exceptions during complete 3-minute scripted demo.
- **Verification Method:** E2E headless test run with mock network disabled.
- **Demo Value:** Guarantees zero demo failures or awkward loading spinners during live technical presentation.

---

## Progress Summary

| Phase        | Title                                                   |   Status    | Target Completion |
| :----------- | :------------------------------------------------------ | :---------: | :---------------- |
| **Phase 1**  | Foundation & Visual Identity Refoundation               | ✅ Complete | Milestone 1       |
| **Phase 2**  | Observation & Discovery Pipelines                       | ✅ Complete | Milestone 1       |
| **Phase 3**  | Candidate Triage & Digital Research Bench               | ✅ Complete | Milestone 1       |
| **Phase 4**  | Chronological Repository & Methodology Publication      | ✅ Complete | Milestone 1       |
| **Phase 0**  | Python Backend Foundation                               | ✅ Complete | Milestone 2       |
| **Phase 5**  | Scientific Ingestion Foundation & Normalized Data Model | ✅ Complete | Milestone 2       |
| **Phase 2**  | Canonical Data Representation & Spectral Slices (BE)    | ✅ Complete | Milestone 2       |
| **Phase 3**  | Synthetic Signal Laboratory & Benchmark Framework (BE)  | ✅ Complete | Milestone 2       |
| **Phase 4**  | Signal Processing & RFI Assessment (BE)                 | ✅ Complete | Milestone 2       |
| **Phase 5**  | Scientific Anomaly Detection Engine (BE)                | ✅ Complete | Milestone 2       |
| **Phase 6**  | Doppler Drift & Temporal Analysis Engine (BE)           | ✅ Complete | Milestone 2       |
| **Phase 7**  | Candidate Engine & Scientific Case Files (BE)           | ✅ Complete | Milestone 2       |
| **Phase 8**  | Frontend Integration & Cadence Workflow                 | ✅ Complete | Milestone 2       |
| **Phase 9**  | Canonical BLC1 Case Study & Cross-Verification          | ⬜ Planned  | Milestone 2       |
| **Phase 10** | Performance Profiling & 3-Minute Demo Cache             | ⬜ Planned  | Milestone 2       |

---

_Last updated: 2026-10-10_
