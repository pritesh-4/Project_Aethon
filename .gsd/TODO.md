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

- [ ] **Dependencies:** Explicitly declare `matplotlib>=3.8.0` and `numpy>=1.26.0` in `backend/pyproject.toml` and `backend/requirements.txt` (currently relied upon transitively).
- [ ] **Configuration:** Align Integration CI environment variable in `.github/workflows/integration.yml` from `AETHON_ALLOW_ORIGINS` to `CORS_ORIGINS` to match `backend/app/core/config.py`.
- [ ] **Storage Safety:** Untrack committed SQLite database `data/aethon.db` from Git and enforce `.gitignore` boundary.
- [ ] **Data Safety:** Inventory and classify 11 tracked observation files in `data/observations/` into documented test fixtures or offline samples with explicit provenance manifests.
- [ ] **Report Hygiene:** Consolidate duplicate report locations (remove duplicate `backend/reports/` copies in favor of canonical `reports/`).

---

## Phase 2 — Scientific Truthfulness in the Frontend (P0)

- [ ] **UI Integrity (`Analysis`):** Remove hardcoded scientific fallbacks in `src/pages/Analysis/index.tsx` (SNR 14.5, drift 0, RA/Dec coordinates, ATNF catalog match, -92.4 dBm power); display explicit "Unavailable" indicators when evidence is missing.
- [ ] **UI Integrity (`Discover`):** Remove fabricated latent residual sigma (4.8) and spatial rejection score (0.94) in `src/pages/Discover/index.tsx` candidate cards.
- [ ] **Copy Truthfulness:** Remove unsupported `.h5` (HDF5) and `.csv` ingestion claims from `README.md`, `src/pages/About/`, and UI route descriptions until real parsers exist.
- [ ] **Copy Truthfulness:** Remove dead WebSocket configuration claim (`ws://localhost:8000/ws/telemetry`) from `README.md`.
- [ ] **Conceptual Clarity:** Audit Model and About pages to ensure planned deep-learning architectures are unmistakably labeled as conceptual future work.

---

## Phase 3 — Correct Scientific Pipeline Orchestration and Error Handling (P0)

- [ ] **Error Handling:** Stop catching detection and drift errors with `.catch(() => null)` in `src/pages/Discover/index.tsx`; implement explicit error state transitions so failed requests never display success notifications.
- [ ] **Slice Safety:** Dynamically bound spectral slice requests in `src/pages/Observatory/index.tsx` to actual observation dimensions instead of fixed 64×256 bounds.
- [ ] **State Clarity:** Verify distinct loading, empty, partial failure, and success states across all operational pages.

---

## Phase 4 — Deterministic Full-Stack Integration Tests (P0)

- [ ] **Test Hardening:** Harden `tests/connectivity.test.ts` to eliminate silent skips (`t.skip()`); fail explicitly if expected test fixtures are absent.
- [ ] **Deterministic Fixture:** Add automated generation of isolated test observations before integration runs in CI.
- [ ] **Assertion Completeness:** Require live candidate and dossier endpoints to execute real assertions against seeded fixtures rather than conditionally skipping when empty.

---

## Phase 5 — Replace the Hardcoded Master Verification Gate (P0)

- [ ] **Dynamic Execution:** Refactor `backend/scripts/run_overall_verification.py` to execute live subprocesses for Pytest, Ruff, Mypy, and npm test rather than emitting hardcoded dictionary totals.
- [ ] **Gate Enforcement:** Parse dynamic exit codes and test counts; fail the overall verification gate if any required check fails or cannot run.
- [ ] **Verification:** Add an automated test verifying that a failing command causes the master verification runner to exit with non-zero status.

---

## Phase 6 — Strengthen the Scientific Benchmark (P1)

- [ ] **Benchmark Scale:** Substantially expand the number and diversity of noise-only observations in `backend/app/synthetic/benchmark.py` to evaluate true false-positive rates (addressing current 50% noise false alarm rate).
- [ ] **Localization Evaluation:** Improve spatial bounding and evaluate IoU matching against synthetic ground truth (addressing current low 0.144 mean IoU).
- [ ] **Calibration Protocol:** Implement separate calibration and evaluation splits to calibrate detection thresholds without held-out test set leakage (`REQ-BENCH-02`).

---

## Phase 7 — Curated Offline Astronomy Sample Bundle (P1)

- [ ] **`REQ-ING-03` [Pending]:** Package a compact, legally usable offline astronomy sample bundle (including real GBT Proxima Centauri slices) <50MB requiring zero external downloads.
- [ ] **Provenance Manifest:** Provide a machine-readable manifest (`manifest.json`) verifying SHA-256 hashes, telescope metadata, and licensing for all bundled assets.

---

## Phase 8 — Explainable RFI Reasoning and Cadence Verification (P1)

- [ ] **`REQ-RFI-01` [Pending]:** Implement multi-cadence on/off-target comparison (ABACAD pointing sequences) in `backend/app/analysis/cadence.py`.
- [ ] **`REQ-RFI-02` [Pending]:** Implement explicit rule classifiers for known terrestrial interference patterns (zero drift, local clock harmonics, wideband radar).
- [ ] **`REQ-RFI-03` [Pending]:** Generate human-readable, explainable scientific disposition rationale for all downgraded candidates.

---

## Phase 9 — Canonical BLC1 Investigation Case Study (P1)

- [ ] **`REQ-CASE-01` [Pending]:** Build the end-to-end BLC1 investigation case study demonstrating detection, drift isolation, cadence comparison, and final downgrade to terrestrial interference.
- [ ] **Case Verification:** Automate case study reproduction so regressions in candidate disposition are caught in CI.

---

## Phase 10 — Audit Candidate Scoring, Persistence, and Scientific Dossiers (P1)

- [ ] **Scoring Policy:** Audit `backend/app/candidates/scoring.py` heuristic weights, ranges, and missing-evidence penalties (`REQ-ML-04`).
- [ ] **Persistence:** Verify candidate grouping, review status transitions, and SQLite WAL durability across process restarts (`REQ-TRI-01`).
- [ ] **Dossier Audit:** Verify consistency between JSON candidate dossiers and vector PDF export (`REQ-DOS-01`).

---

## Phase 11 — Operational Security, Performance, and Browser Acceptance (P2)

- [ ] **Performance Profiling:** Measure memory consumption and latency across FFT, slicing, and de-Doppler routines on large observations.
- [ ] **Browser Acceptance:** Add browser-based end-to-end tests for upload, observation selection, analysis, candidate review, and dossier export.
- [ ] **Walkthrough Verification:** Rehearse and verify the complete 3-minute technical walkthrough from a clean checkout.

---

## Phase 12 — Make the Deep-Learning Decision Using Evidence (P2 · Research Decision)

- [x] **`REQ-ML-03` [Completed · Empirically Evaluated]:** Performed model selection on real radio observations (`aethon_real_radio_training_v2`) comparing `RadioAnomalyAutoencoder`, `StatisticalBaselineDetector`, and `IsolationForestDetector` across 9 signal families and 5 SNR tiers. Evidence shows `IsolationForestDetector` achieves highest operational recall (25.0% at calibrated 1.06% FPR, recovering 100% of overlapping signals and 60% of stationary tones). The autoencoder (ROC-AUC 0.9001, PR-AUC 0.8947, 2,421 tiles/s) has been integrated into `DetectionService` as an opt-in experimental engine (`enabled=False` default) without displacing the production baseline.

---

## Phase 13 — Freeze Scope and Release the Research Prototype (Final Release Milestone)

- [ ] **Final Gate:** Run the dynamic master verification gate on the final candidate commit.
- [ ] **Offline Execution:** Verify 100% offline demonstration run without internet access.
- [ ] **Release Packaging:** Tag release, verify documentation, and freeze scope.

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
