# TODO.md — AETHON Active Engineering & Scientific Backlog

> **Milestone:** Authoritative Master Development Roadmap (Phases 0–13)  
> **Status:** Phase 0 Active · Reconciled against commit `f0d35ec4`  
> **Governing Principle:** Prioritize truthful scientific outputs, reproducibility, and measurable detection quality over additional UI features or premature deep-learning models.

---

## Phase 0 — Project State Reconciliation (P0 · Active)

- [x] Create canonical execution roadmap in `.gsd/ROADMAP.md` establishing the Phase 0–13 sequence.
- [x] Synchronize `.gsd/STATE.md` with current checkout position (`f0d35ec4`) and active phase.
- [x] Reconcile `.gsd/TODO.md` backlog with authoritative roadmap and verifiable implementation evidence.
- [ ] Align `.gsd/REQUIREMENTS.md` traceability table phase references with canonical roadmap phases.

---

## Phase 1 — Repository Hygiene, Configuration, and Data Safety (P0)

- [x] **Dependencies:** Explicitly declare all direct dependencies in `backend/pyproject.toml`, `backend/requirements.txt`, and `backend/requirements-dev.txt`; keep optional PyTorch/CNN dependencies isolated under `[project.optional-dependencies] cnn`.
- [x] **Configuration:** Align Integration CI environment variable in `.github/workflows/integration.yml` to `CORS_ORIGINS` to match `backend/app/core/config.py`.
- [x] **Storage Safety:** Untrack committed SQLite database files from Git, enforce `.gitignore` boundary.
- [x] **Data Safety:** Classified 11 tracked observation files in `data/observations/` as runtime artifacts; untracked from Git index without deleting local user files.
- [x] **Report Hygiene:** Consolidate duplicate report locations (removed duplicate `backend/reports/` tracking in favor of canonical `reports/`).
- [x] **Remote Archive Security:** Hardened `archive_client.py` and `import_service.py` against SSRF, redirect loops, private IP traversal, oversize streaming, and truncated downloads; backed by 15 security tests in `test_remote_import_security.py`.

---

## Phase 2 — Scientific Truthfulness in the Frontend (P0)

- [x] **UI Integrity (`Analysis`):** Removed hardcoded scientific fallbacks in `src/pages/Analysis/index.tsx` (SNR, drift, coordinates, ATNF catalog match, power); displayed explicit "Unavailable" indicators when evidence is missing.
- [x] **UI Integrity (`Discover`):** Removed fabricated latent residual sigma and spatial rejection score in `src/pages/Discover/index.tsx` candidate cards.
- [x] **Copy Truthfulness:** Removed unsupported `.h5` (HDF5) and `.csv` ingestion claims from `README.md`, `src/pages/About/`, and UI route descriptions.
- [x] **Copy Truthfulness:** Removed dead WebSocket configuration claims from `README.md`.
- [x] **Conceptual Clarity:** Audited Model and About pages ensuring planned deep-learning architectures are unmistakably labeled as conceptual future work.

---

## Phase 3 — Correct Scientific Pipeline Orchestration and Error Handling (P0)

- [x] **Error Handling:** Explicit error state transitions implemented; failed requests never display success notifications.
- [x] **Slice Safety:** Dynamically bounded spectral slice requests in `src/pages/Observatory/index.tsx` to actual observation dimensions.
- [x] **State Clarity:** Distinct loading, empty, partial failure, and success states verified across all operational pages.

---

## Phase 4 — Deterministic Full-Stack Integration Tests (P0)

- [x] **Test Hardening:** Hardened `tests/connectivity.test.ts` to eliminate silent skips (`t.skip()`); enforce backend requirement in integration CI (`REQUIRE_BACKEND=true`).
- [x] **Deterministic Fixture:** Added deterministic seeding of guaranteed demo observation (`synthetic-drifting-beacon`) via REST endpoint before slicing or analysis assertions execute.
- [x] **Assertion Completeness:** Require live candidate, dossier JSON, and vector PDF endpoints to execute real assertions against seeded fixtures rather than conditionally skipping when empty.

---

## Phase 5 — Replace the Hardcoded Master Verification Gate (P0)

- [x] **Dynamic Execution:** Refactored `backend/scripts/run_overall_verification.py` to execute live subprocesses for Pytest, Ruff, Mypy, and npm test rather than emitting hardcoded dictionary totals.
- [x] **Gate Enforcement:** Parse dynamic exit codes, durations, and test counts; fail the overall verification gate if any required check fails or cannot run.
- [x] **Verification:** Added automated tests (`backend/tests/test_overall_verification.py`) proving failure propagation, missing tool rejection (127), dynamic test count parsing, commit/timestamp freshness, and rejection of stale or reused reports.

---

## Phase 6 — Strengthen the Scientific Benchmark (P1)

- [x] **Benchmark Scale:** Substantially expanded benchmark suite from 9 to 25 observations (10 pure negative controls, 15 positive observations covering low/med/high SNR, boundary clipping, broadband, and short bursts).
- [x] **Localization Evaluation:** Improved spatial bounding and evaluated greedy 1-to-1 IoU matching against synthetic ground truth (`backend/app/detection/evaluation.py`).
- [x] **Calibration Protocol:** Extracted 900 reference background windows across non-overlapping segments for robust background parameter estimation without test-target leakage (`REQ-BENCH-02`).

---

## Phase 7 — Curated Offline Astronomy Sample Bundle (P1)

- [x] **`REQ-ING-03` [Complete]:** Packaged compact, legally usable offline astronomy sample bundle (including real GBT HIP 35136 sample and synthetic drifting beacon) in `data/demo_observations/` requiring zero external downloads.
- [x] **Provenance Manifest:** Provided machine-readable manifest (`data/demo_observations/manifest.json`) verifying SHA-256 hashes, telescope metadata, and licensing for bundled assets.

---

## Phase 8 — Explainable RFI Reasoning and Cadence Verification (P1)

- [x] **`REQ-RFI-01` [Complete]:** Implemented multi-cadence on/off-target comparison (ABACAD pointing sequences) with 0.15 score penalty multiplier in `backend/app/analysis/cadence.py`.
- [x] **`REQ-RFI-02` [Complete]:** Implemented rule classifiers for digital clock harmonics (10/19.2/20/25/38.4/100/125/250 MHz), radar/aeronautical bands, and corroborating near-zero topocentric drift in `backend/app/analysis/rfi_rules.py`.
- [x] **`REQ-RFI-03` [Complete]:** Generated human-readable, explainable scientific disposition rationale array for all evaluated candidates in `backend/app/candidates/schemas.py` and `scoring.py`.

---

## Phase 9 — Canonical BLC1 Investigation Case Study (P1)

- [x] **`REQ-CASE-01` [Complete]:** Built the canonical BLC1 investigation case study (`backend/app/analysis/case_study.py`) using authentic published metadata from Sheikh et al. (2021) Nature Astronomy, demonstrating detection, drift isolation (+0.0154 Hz/s), cadence comparison, and clock harmonic RFI downgrade.
- [x] **Case Verification:** Automated case study reproduction in `backend/tests/test_blc1_case_study.py` ensuring candidate triage regressions are caught in CI.

---

## Phase 10 — Audit Candidate Scoring, Persistence, and Scientific Dossiers (P1)

- [x] **Scoring Policy:** Audited `backend/app/candidates/scoring.py` heuristic weights, eliminated 10 free points for missing data quality evidence, and added cadence/RFI multiplier scaling (`REQ-ML-04`).
- [x] **Persistence:** Verified candidate grouping, review status transitions, and SQLite WAL durability across process restarts (`REQ-TRI-01`).
- [x] **Dossier Audit:** Verified consistency between JSON candidate dossiers and publication-grade vector PDF export (`REQ-DOS-01`).

---

## Phase 11 — Operational Security, Performance, and Browser Acceptance (P2)

- [x] **Performance Profiling:** Bounded memory consumption and latency across FFT, slicing, and de-Doppler routines on representative observation inputs.
- [x] **Browser Acceptance:** Built Playwright browser acceptance suite (`tests/browser_e2e_acceptance.test.ts`) executing 6 automated journeys (A through F) with 100% pass rate.
- [x] **Walkthrough Verification:** Automated complete technical walkthrough journeys against running Vite + FastAPI stack.

---

## Phase 12 — Make the Deep-Learning Decision Using Evidence (P2 · Research Decision)

- [x] **`REQ-ML-03` [Completed · Empirically Evaluated]:** Performed model selection on real radio observations (`aethon_real_radio_training_v2`) comparing `RadioAnomalyAutoencoder`, `StatisticalBaselineDetector`, and `IsolationForestDetector` across 9 signal families and 5 SNR tiers. Evidence shows `IsolationForestDetector` achieves highest operational recall (25.0% at calibrated 1.06% FPR, recovering 100% of overlapping signals and 60% of stationary tones). The autoencoder (ROC-AUC 0.9001, PR-AUC 0.8947, 2,421 tiles/s) has been integrated into `DetectionService` as an opt-in experimental engine (`enabled=False` default) without displacing the production baseline.

---

## Phase 13 — Freeze Scope and Release the Research Prototype (Final Release Milestone)

- [x] **Final Gate:** Ran authoritative dynamic master verification gate (`run_overall_verification.py`) with 14/14 gates passing (exit code 0).
- [x] **Offline Execution:** Verified 100% offline demonstration run without internet access (`scripts/run_offline_demo.py`).
- [x] **Release Packaging:** Validated documentation, environment examples, dataset manifests, and finalized release candidate verdict: RELEASE CANDIDATE ACCEPTED.

---

## Completed Foundational Work Archive

For audit traceability, foundational components implemented in earlier milestones are recorded below:

- [x] **Filterbank Header Parser:** Implemented via `blimpy` in `backend/app/ingestion/adapters/filterbank.py` (`REQ-ING-01`).
- [x] **Bounded Spectral Slice Engine:** Implemented in `backend/app/representation/service.py` and `GET /api/observations/{id}/slice` (`REQ-ING-02`).
- [x] **Synthetic Signal Laboratory:** Implemented in `backend/app/synthetic/generators.py`, `injection.py`, and `setigen_compat.py` (`REQ-BENCH-01`).
- [x] **Vector PDF Scientific Dossier Generator:** Implemented via `matplotlib.backends.backend_pdf` in `backend/app/candidates/pdf.py` (`REQ-DOS-01`).
- [x] **FastAPI Backend Foundation:** Core application, Pydantic settings, health probes, CORS, and logging in `backend/app/` (`REQ-FOUND-01`).
- [x] **Initial Frontend–Backend Connectivity:** The React API client is integrated with the FastAPI backend (`REQ-INT-01`). Complete end-to-end workflow verification remains pending under Phase 4, while known frontend correctness gaps remain tracked under Phases 2 and 3.

---

## Future Explorations & Enhancements (Deferred)

Backlog items deferred until core scientific reliability and evaluation gates are completed:

- [ ] **WebGPU/WASM:** Evaluate client-side hardware acceleration only if CPU profiling reveals bottlenecks.
- [ ] **Celestial Navigation:** Interactive 3D celestial sky-map sphere in Observatory view.
- [ ] **Audio Sonification:** Pitch tracking linked to interactive Doppler drift rate.
- [ ] **Batch Export:** Consolidated ZIP archive export of multiple candidate dossiers.
