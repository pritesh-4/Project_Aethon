# ROADMAP.md — Project Roadmap: AETHON

> **Current Milestone:** v2.0.0 — Scientific Data Pipeline, Doppler Intelligence & Verifiable Candidate Engine  
> **Goal:** Ingest real Breakthrough Listen observations, perform interactive Doppler drift & de-Doppler correction, mitigate RFI via explainable cadence logic, score candidates with layered models, and export research-grade scientific PDF dossiers for a flawless 3-minute technical demonstration.  
> **Status:** Active · Ready for Phase 5 Planning

---

## Must-Haves

- [ ] Offline ingestion and header extraction of Breakthrough Listen `.fil` and `.fits` observations
- [ ] Format-agnostic normalized spectral slice model with complete provenance
- [ ] Interactive Doppler drift rate estimation and real-time de-Doppler correction bench
- [ ] Explainable RFI mitigation with multi-cadence (on/off target) rejection logic
- [ ] Canonical BLC1 (Proxima Centauri) case study with explainable terrestrial RFI disposition
- [ ] Controlled `setigen` synthetic signal injection & parameter recovery benchmark mode
- [ ] Layered candidate scoring (Physics metrics + Isolation Forest + lightweight CNN)
- [ ] Publication-grade scientific PDF dossier export with embedded spectral snapshots and metadata
- [ ] Deterministic, offline-reliable 3-minute technical walkthrough

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

### Phase 5: Scientific Ingestion Foundation & Normalized Data Model

- **Status:** ⬜ Not Started
- **Objective:** Establish the Python/FastAPI scientific backend and ingestion layer to parse Breakthrough Listen `.fil` (filterbank) and `.fits` files into a unified spectral format without frontend format dependencies.
- **Dependencies:** None (foundation of v2.0.0).
- **Implementation Scope:**
  - Fast-loading Python backend service (`backend/`) using FastAPI, `blimpy`, and `astropy.io.fits`.
  - Binary header parser extracting RA, Dec, center frequency, bandwidth, time stamps, and channel resolution.
  - Normalized spectral slice generator producing JSON telemetry + 2D float arrays for spectrogram/waterfall visualization.
  - Local dataset index with cached sample slices (including Green Bank Telescope recordings).
- **Non-Goals:** Live telescope streaming; ingesting multi-gigabyte files at runtime without slicing.
- **Expected Artifacts:** `backend/ingestion/filterbank.py`, `backend/ingestion/fits.py`, `backend/models/observation.py`, test suite with reference `.fil`.
- **Measurable Acceptance Criteria:**
  - Python tests parse reference `.fil` file in $<150\text{ ms}$.
  - Extracted header matches Astropy/blimpy reference values with zero loss of coordinate or timestamp precision.
  - API endpoint `GET /api/observations/{id}/slice` serves normalized float array and metadata.
- **Verification Method:** `pytest tests/test_ingestion.py` + HTTP curl validation.
- **Demo Value:** Proves to judges that AETHON operates on real telescope data directly from the Breakthrough Listen archive.

---

### Phase 6: Signal Detection & Candidate Extraction Engine

- **Status:** ⬜ Not Started
- **Objective:** Detect anomalous narrowband signals within normalized spectrograms and extract structured candidate objects with physical measurements.
- **Dependencies:** Phase 5 (Normalized Ingestion).
- **Implementation Scope:**
  - Baseline peak detection and continuous thresholding across spectral channels (SciPy `find_peaks`, STFT power analysis).
  - Narrowband signal isolation algorithm calculating signal bandwidth, SNR, peak intensity, and persistence across time bins.
  - Candidate extraction pipeline outputting structured candidates with unique IDs and observation references.
- **Non-Goals:** Complex neural network inference (handled in Phase 9); live telescope control.
- **Expected Artifacts:** `backend/analysis/detection.py`, `backend/models/candidate.py`, unit test suite.
- **Measurable Acceptance Criteria:**
  - Automatic detection of signals with $\text{SNR} \ge 10\text{ dB}$ across real and simulated noise backgrounds.
  - Correctly outputs physical properties: center frequency ($MHz$), bandwidth ($Hz$), SNR ($dB$), duration ($s$).
- **Verification Method:** Unit test asserting detection of simulated carrier tones inserted into telescope noise.
- **Demo Value:** Demonstrates the automated discovery workflow from raw observation to isolated candidate.

---

### Phase 7: Interactive Doppler Drift & De-Doppler Correction Bench

- **Status:** ⬜ Not Started
- **Objective:** Estimate carrier Doppler drift rates ($Hz/s$) and provide an interactive de-Doppler transformation bench allowing continuous slope adjustment and restacked profile comparison.
- **Dependencies:** Phase 6 (Candidate Extraction).
- **Implementation Scope:**
  - Linear drift rate estimation across time-frequency bins (Hough transform / line fitting / turboSETI drift searching).
  - De-Doppler shift algorithm that shears/restacks the 2D waterfall matrix by $\Delta f = \dot{f} \cdot \Delta t$.
  - Interactive UI controls on the Analysis bench (`/analysis/:signalId`): continuous drift slider, uncorrected vs. corrected waterfall side-by-side, and restacked integrated power spectrum.
- **Non-Goals:** Non-linear relativistic orbital acceleration models.
- **Expected Artifacts:** `backend/analysis/doppler.py`, `src/pages/Analysis/components/DopplerCorrectionBench.tsx`, `src/lib/doppler-transform.ts`.
- **Measurable Acceptance Criteria:**
  - Drift rate estimate matches ground truth within $\pm 0.02\text{ Hz/s}$.
  - Correcting drift visibly straightens the signal into a vertical column on the Canvas waterfall and increases peak integrated SNR by $\ge 3\text{ dB}$.
  - Client-side slider updates waterfall in $<16\text{ ms}$ (60 FPS).
- **Verification Method:** Benchmark script asserting SNR gain after de-Doppler; manual inspection of restacked Canvas visual.
- **Demo Value:** **Major "Wow" Moment** in the 3-minute demo—judges witness the tilted carrier straighten in real time as the drift is mathematically neutralized.

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

| Phase        | Title                                                            |   Status    | Target Completion |
| :----------- | :--------------------------------------------------------------- | :---------: | :---------------- |
| **Phase 1**  | Foundation & Visual Identity Refoundation                        | ✅ Complete | Milestone 1       |
| **Phase 2**  | Observation & Discovery Pipelines                                | ✅ Complete | Milestone 1       |
| **Phase 3**  | Candidate Triage & Digital Research Bench                        | ✅ Complete | Milestone 1       |
| **Phase 4**  | Chronological Repository & Methodology Publication               | ✅ Complete | Milestone 1       |
| **Phase 0**  | Python Backend Foundation                                        | ✅ Complete | Milestone 2       |
| **Phase 5**  | Scientific Ingestion Foundation & Normalized Data Model          | ⬜ Planned  | Milestone 2       |
| **Phase 6**  | Signal Detection & Candidate Extraction Engine                   | ⬜ Planned  | Milestone 2       |
| **Phase 7**  | Interactive Doppler Drift & De-Doppler Correction Bench          | ⬜ Planned  | Milestone 2       |
| **Phase 8**  | Explainable RFI Mitigation & Multi-Cadence Logic                 | ⬜ Planned  | Milestone 2       |
| **Phase 9**  | Layered ML Anomaly Scoring & Ground-Truth Benchmarks (`setigen`) | ⬜ Planned  | Milestone 2       |
| **Phase 10** | Cross-Observation Verification & Canonical BLC1 Case Study       | ⬜ Planned  | Milestone 2       |
| **Phase 11** | Scientific Candidate Dossier & Research PDF Generator            | ⬜ Planned  | Milestone 2       |
| **Phase 12** | Performance Profiling, Offline Demo Cache & Rehearsed Flow       | ⬜ Planned  | Milestone 2       |

---

_Last updated: 2026-10-09_
