# AETHON — Master Development Roadmap

## From Current Research Prototype to a Trustworthy Scientific Demonstration

> **Repository:** `pritesh-4/Project_Aethon`  
> **Starting Point:** `main` at commit `f0d35ec4` (10 October 2026)  
> **Primary Objective:** Build a reproducible, scientifically defensible system that discovers unusual radio-signal candidates, evaluates evidence, and presents results for human investigation.  
> **Active Milestone:** Authoritative Master Roadmap (Phases 0–13)  
> **Status:** Phase 0 Active · Baseline Connectivity & Quality Gates Verified

---

## 1. The Governing Principle

AETHON must not merely produce candidate signals. It must be able to explain:

- Which observation was analyzed and where it came from.
- Which scientific operations were applied.
- What the detector actually measured.
- Why a signal was selected as a candidate.
- Which evidence supports or weakens that candidate.
- What remains unknown.
- Whether the result can be reproduced from the same input and configuration.

An anomaly is not automatically an astronomical discovery, and an astronomical anomaly is not proof of extraterrestrial intelligence.

**Development rule:** Prioritize truthful scientific outputs, reproducibility, and measurable detection quality over additional UI features or more sophisticated-looking AI models.

---

## 2. Current Starting Position

### Implemented Foundations to Preserve

The current repository already includes:

- **Backend Foundation:** FastAPI application, settings, logging, health checks (`/health`, `/api/health`), and standardized error handling.
- **Ingestion & Data Model:** SIGPROC Filterbank (`.fil`) and supported radio FITS (`.fits`, `.fit`) ingestion via `blimpy` and `astropy`.
- **Persistent Storage & Slices:** Persistent observation metadata in SQLite WAL database and bounded spectral-slice retrieval via REST API.
- **Canonical Representation:** Canonical 2D time-frequency representation (`values[time_index][frequency_index]`, Axis 0 = chronologically ascending time, Axis 1 = ascending frequency in Hz) with full provenance.
- **Synthetic Signal Lab:** Synthetic signal generators (`setigen` & NumPy), signal injection, and ground-truth manifests.
- **Signal Preprocessing:** Distribution-free robust statistics, RFI indicators, quality masks, and controlled transformations with audit manifests.
- **Anomaly Detection Engine:** Statistical baseline and unsupervised Isolation Forest anomaly scoring over spectral feature vectors.
- **Doppler & Temporal Analysis:** Apparent frequency-drift analysis, trajectory ridge extraction, OLS regression with analytical standard error, and pure-functional de-drift routines.
- **Candidate Engine:** SQLite candidate persistence, explainable scoring heuristics, triage review history, and publication-grade vector PDF dossier generation.
- **Full-Stack Connectivity:** React + TypeScript + Vite frontend connected to genuine FastAPI endpoints across all operational pages (`Observatory`, `Discover`, `Candidates`, `Analysis`, `Archive`).
- **CI Quality Gates:** Frontend CI (`npm run check`), Backend CI (Ruff, Mypy, 197 Pytest tests), and Integration CI (`.github/workflows/integration.yml`) passing cleanly.

GitHub reports that all three CI workflows passed on the starting commit (`f0d35ec4`). Keep these quality gates in place.

### Known Gaps That Take Priority

1. **Frontend Adornments:** Some frontend adapters invent plausible scientific values when backend evidence is missing.
2. **Error Masking:** Some discovery operations suppress errors and continue as though the pipeline succeeded.
3. **Static Master Verification Gate:** The master verification script uses hardcoded test results rather than deriving all results from fresh dynamic executions.
4. **Benchmark Scale & False Positives:** The benchmark contains only nine evaluation observations and reports a 50% noise-only observation false-positive rate for Isolation Forest.
5. **Benchmark Localization:** Localization is weak, with a reported mean region IoU of approximately 0.144 for Isolation Forest.
6. **Pending Requirements:** Offline astronomy data, the BLC1 case study, and several RFI requirements remain marked pending.
7. **Document Drift:** The roadmap, state, and TODO documents disagree about current phase numbering and status.
8. **Storage Hygiene:** Runtime databases, observations, and generated reports need a clear policy separating them from curated fixtures.

---

## 3. Authoritative Master Roadmap (Phases 0–13)

### PHASE 0 — Establish the Authoritative Project State

- **Priority:** P0 (Foundational)
- **Objective:** Ensure every future coding task follows one accurate source of truth.
- **Tasks:**
  1. Review `.gsd/ROADMAP.md`, `.gsd/REQUIREMENTS.md`, `.gsd/STATE.md`, `.gsd/TODO.md`, `PROJECT_RULES.md`, and root/backend READMEs.
  2. Create one canonical execution roadmap using the phases in this document.
  3. Reconcile inconsistent historical phase numbers without rewriting or deleting useful implementation history.
  4. Mark each capability as one of:
     - `Implemented`
     - `Automated-test verified`
     - `Scientifically evaluated`
     - `Partially implemented`
     - `Pending`
     - `Deferred`
  5. Record the current commit (`f0d35ec4`), CI workflow results, benchmark metrics, unresolved issues, and next task.
  6. Treat existing verification reports as historical evidence until regenerated on current code.
- **Acceptance Criteria:**
  - All planning documents agree about the current milestone and next task.
  - The same phase number is never used for two unrelated implementations.
  - No completed requirement is marked pending merely because its original file path changed.
  - No pending scientific requirement is marked complete merely because a corresponding endpoint exists.
- **Deliverable:** Reconciled project state and one authoritative roadmap in `.gsd/ROADMAP.md`.
- **Exit Gate:** A developer or coding agent can identify the next task without interpreting contradictory planning files.

---

### PHASE 1 — Repository Hygiene, Configuration, and Data Safety

- **Priority:** P0 (Foundational)
- **Objective:** Make the existing project safe and reproducible before further scientific development.
- **Tasks:**
  1. Inspect the tracked root database, observations, reports, generated files, and all environment examples.
  2. Classify every tracked observation as an intentional fixture, documented sample, or runtime artifact.
  3. Preserve valid fixtures. Do not delete scientific data until its purpose and provenance have been established.
  4. Move generated reports to one canonical report directory (`reports/`) and remove redundant copies only after confirming they can be regenerated.
  5. Ensure local `.env` files, databases, temporary uploads, virtual environments, and generated outputs are excluded from Git where appropriate.
  6. Retain `.env.example` files containing placeholders, never real secrets.
  7. Keep private server credentials outside Vite-exposed `VITE_*` variables.
  8. Align Integration CI's CORS environment variable with the actual backend setting, `CORS_ORIGINS`.
  9. Decide whether Prettier remains part of the frontend toolchain. If removed, remove it consistently from dependencies, scripts, hooks, and CI.
  10. Establish a reproducible backend installation and dependency-resolution strategy.
- **Acceptance Criteria:**
  - Fresh installation instructions work from a clean checkout.
  - CORS configuration is demonstrably loaded from the intended environment variable.
  - Private configuration and runtime data are not accidentally tracked.
  - All retained scientific assets have documented origin and status.
  - Formatter, lint, type-check, and test commands are internally consistent.
- **Deliverable:** Clean repository policies and reproducible development configuration.
- **Exit Gate:** A fresh environment can run the application without relying on undocumented local files.

---

### PHASE 2 — Scientific Truthfulness in the Frontend

- **Priority:** P0 (Integrity)
- **Objective:** Remove invented measurements from every live-data screen.
- **Scope:**
  - `src/pages/Observatory/index.tsx`
  - `src/pages/Discover/index.tsx`
  - `src/pages/Candidates/index.tsx`
  - `src/pages/Analysis/index.tsx`
  - `src/pages/Archive/index.tsx`
  - Relevant visualization components and frontend schemas.
- **Tasks:**
  1. Replace fabricated default frequencies, coordinates, signal power, SNR, persistence, anomaly scores, and RFI probabilities with explicit unavailable states when no valid measurement exists.
  2. Remove unsupported fixed latent coordinates, catalog comparisons, signal classifications, processing times, and historical anomaly counts from live data.
  3. Distinguish a measured zero from missing evidence.
  4. Make every displayed metric traceable to:
     - A field in an API response.
     - A documented calculation derived from measured data.
     - An explicitly labelled synthetic demonstration.
  5. Align frontend schemas with actual backend response types, including nullable scientific measurements.
  6. Remove unsupported formats from UI copy. Do not advertise HDF5 or CSV ingestion until real parsers exist.
  7. Preserve mock data only inside an explicitly isolated demo mode (`VITE_DEMO_MODE=true`).
  8. Audit the Model and About pages so planned neural architectures are clearly labelled as conceptual or future work.
- **Acceptance Criteria:**
  - No fabricated scientific measurement is rendered as a real result.
  - Missing coordinates remain unavailable instead of displaying example coordinates.
  - A candidate without measured drift does not appear to have a verified zero drift rate.
  - Demo and live records are distinguishable throughout the UI.
  - README capability claims match actual parsers and implemented models.
- **Deliverable:** A frontend that faithfully represents the backend rather than embellishing missing data.
- **Exit Gate:** Tests confirm that empty, partial, and complete API responses all display honestly.

---

### PHASE 3 — Correct Scientific Pipeline Orchestration and Error Handling

- **Priority:** P0 (Reliability)
- **Objective:** Ensure every UI success state represents a successfully completed operation.
- **Tasks:**
  1. Audit the discovery pipeline's PREPARE → REPRESENT → SEARCH → RANK → COMPLETE sequence.
  2. Stop swallowing processing, detection, and drift-analysis errors and replacing them with `null`.
  3. Define explicit result states:
     - Completed with detections.
     - Completed with no qualifying detections.
     - Partially completed with a failed stage.
     - Failed.
     - Blocked by insufficient input data.
  4. Ensure a failed processing stage cannot silently lead to an apparently successful discovery result.
  5. Correct Observatory's fixed slice bounds so requests respect actual observation dimensions and maximum slice-cell limits.
  6. Preserve and display API error information safely.
  7. Ensure cancellation, navigation away from a page, and repeated analysis requests do not produce stale results.
  8. Check that every loading state eventually resolves to success, empty, or error.
- **Acceptance Criteria:**
  - No failed request is converted into a successful empty result.
  - A “no signals found” message appears only after detection actually completed.
  - Partial failure is visible and cannot be mistaken for completed scientific analysis.
  - Slice retrieval respects observation dimensions and configured safety bounds.
  - Loading states and error messages behave consistently.
- **Deliverable:** Reliable orchestration between the frontend and FastAPI.
- **Exit Gate:** Automated tests cover both normal execution and failed-stage transitions.

---

### PHASE 4 — Deterministic Full-Stack Integration Tests

- **Priority:** P0 (Verification)
- **Objective:** Make frontend-to-backend connectivity tests independent of pre-existing local databases.
- **Tasks:**
  1. Create a deterministic integration fixture generated specifically for testing.
  2. Generate a valid observation containing known background data and, where appropriate, a signal with known parameters.
  3. Start FastAPI with isolated temporary storage and a clean test database.
  4. Explicitly ingest or seed the observation before testing downstream endpoints.
  5. Verify:
     - Health checks.
     - Observation ingestion and listing.
     - Observation metadata.
     - Bounded spectral-slice retrieval.
     - Processing and RFI assessment.
     - Detection.
     - Drift analysis.
     - Candidate creation and scoring.
     - Candidate review.
     - JSON and PDF dossiers.
     - Invalid input and expected error responses.
  6. Keep API contract tests separate from scientific-recovery tests.
  7. Make the integration CI fail when a mandatory test is skipped because no observation or candidate exists.
  8. Ensure temporary databases and uploads are removed after the test run.
  9. Correct environment variable mismatches and verify both approved and unapproved CORS origins.
- **Acceptance Criteria:**
  - The integration workflow passes from a clean checkout.
  - Every mandatory route is exercised using known test data.
  - Core tests cannot silently skip because a database is empty.
  - The workflow does not depend on committed runtime state.
  - Normal and failure paths have asserted responses.
- **Deliverable:** A deterministic API integration suite with independently controlled fixtures.
- **Exit Gate:** A green integration run proves that the intended endpoints actually executed.

---

### PHASE 5 — Replace the Hardcoded Master Verification Gate

- **Priority:** P0 (Governance)
- **Objective:** Make verification reports trustworthy and reproducible.
- **Tasks:**
  1. Update `backend/scripts/run_overall_verification.py`.
  2. Execute actual backend tests, Ruff, Mypy, frontend checks, integration verification, benchmark evaluation, and offline-demo checks.
  3. Capture the actual exit code and relevant output for each operation.
  4. Derive test totals and pass/fail/skipped counts from real execution results.
  5. Record actual current Git commit, environment, configuration, and generation timestamp.
  6. Fail the master verification gate when a required check fails, cannot run, or is missing.
  7. Separate:
     - Historical report aggregation.
     - Current automated quality gates.
     - Scientific benchmark evaluation.
     - End-to-end verification.
  8. Generate all reports into one canonical location (`reports/`).
  9. Avoid committing reports that contain misleading machine-specific paths or stale status claims.
  10. Add a test that deliberately introduces a failing command or missing result and confirms that the overall gate fails.
- **Acceptance Criteria:**
  - There are no fabricated test counts or hardcoded successful quality-gate results.
  - A failed test causes a failed master report.
  - Report provenance identifies source commit and current run.
  - The current report is clearly distinguishable from a prior run's output.
- **Deliverable:** A genuine verification gate, not simply a success-report generator.
- **Exit Gate:** The master gate has demonstrated both a passing run and a deliberately failing run.

---

### PHASE 6 — Strengthen the Scientific Benchmark

- **Priority:** P1 (Scientific Rigor)
- **Objective:** Measure whether the detectors find signals accurately without overwhelming investigators with false positives.
- **Current Baseline:**
  - Evaluates only 9 observations: 7 positive, 2 negative controls, 9 injected targets.
  - Isolation Forest reports: Recall 100%, Window Precision ~86.49%, Window F1 ~92.75%, Noise False-Positive Rate 50%, Mean IoU ~0.144.
  - Preliminary synthetic results—not established real-world performance.
- **Tasks:**
  1. Expand the number and diversity of noise-only observations substantially.
  2. Generate independent observation sets across multiple random seeds.
  3. Include:
     - Noise-only observations.
     - Stationary tones.
     - Positive and negative drifting tones.
     - Weak and strong signals.
     - Short bursts.
     - Broadband events.
     - Edge-of-window signals.
     - Overlapping signals.
     - RFI-like signals that can confuse the detector.
  4. Maintain strict separation between detector-visible inputs and ground-truth labels.
  5. Use separate reference, calibration, validation, and final held-out evaluation data.
  6. Calibrate thresholds using calibration split rather than final test set.
  7. Report observation-level detection rates, false alarms, window precision and recall, F1, localization IoU, drift error, and signal-family breakdowns.
  8. Report uncertainty or variation across repeated runs.
  9. Compare trivial control, statistical baseline, and Isolation Forest using identical evaluation cases.
  10. Document limitations of simulated data compared with real radio observations.
- **Acceptance Criteria:**
  - Evaluation uses enough negative controls to make false-positive measurements meaningful.
  - Detector performance is reproducible across independent runs.
  - High recall is not achieved by indiscriminately flagging noise.
  - Candidate localization and drift estimates are evaluated, not merely response-field presence.
  - Benchmark report is generated from current code and current measurements.
- **Deliverable:** A credible, repeatable evaluation framework with transparent failure metrics.
- **Exit Gate:** The detector's useful operating range and limitations are quantified on unseen synthetic data.

---

### PHASE 7 — Build the Curated Offline Astronomy Sample Bundle

- **Priority:** P1 (Astronomical Grounding)
- **Objective:** Provide a real-data workflow that runs without downloading data at demonstration time.
- **Tasks:**
  1. Resolve pending offline sample requirement in `.gsd/REQUIREMENTS.md` (`REQ-ING-03`).
  2. Select a small, legally usable, documented set of real astronomical observations, including specified GBT Proxima Centauri slices where appropriate.
  3. Record source URLs, licensing, original filenames, checksums, acquisition details, and known metadata limitations.
  4. Separate real astronomical observations from synthetic signals and fixtures.
  5. Provide a reproducible manifest describing every bundled asset.
  6. Verify each observation can be ingested, queried, sliced, processed, and analyzed without network access.
  7. Keep bundle size appropriate for repository and demonstration (<50MB).
  8. Do not commit large raw datasets; provide an explicit acquisition procedure where necessary.
  9. Make offline demonstration use isolated temporary storage instead of developer's active database.
- **Acceptance Criteria:**
  - A fresh checkout can execute the documented offline workflow with no external network access at demonstration time.
  - Every bundled record has provenance.
  - Real and simulated observations are unmistakably labelled.
  - Checksums and expected metadata are verified automatically.
- **Deliverable:** A compact, reproducible astronomy sample pack and its manifest.
- **Exit Gate:** Offline ingestion and analysis succeed from documented setup on a clean environment.

---

### PHASE 8 — Implement Explainable RFI Reasoning and Cadence Verification

- **Priority:** P1 (Scientific Discrimination)
- **Objective:** Improve candidate rejection using explicit evidence rather than simple assumptions about frequency drift.
- **Tasks:**
  1. Implement pending multi-cadence ON/OFF pointing comparison requirement (`REQ-RFI-01`, `REQ-RFI-02`, `REQ-RFI-03`).
  2. Define supported cadence representation and data contract.
  3. Compare candidate evidence across on-target and off-target observations when such data are available.
  4. Add explicit rules for known interference patterns, including stationary emissions and supported interference-like frequency structures.
  5. Treat zero drift as evidence that may inform RFI assessment, not proof of terrestrial origin.
  6. Maintain separate masks and evidence records for suspected RFI; preserve original observation.
  7. Build human-readable scientific disposition explaining each downgrade.
  8. Record which rules fired, relevant thresholds, supporting observations, and missing evidence.
  9. Add synthetic tests for:
     - Signals appearing in on-target observations only.
     - Signals recurring in both on-target and off-target observations.
     - Stationary interference.
     - Broadband interference.
     - Ambiguous or insufficient evidence.
  10. Ensure unknown cadence information is not treated as negative evidence.
- **Acceptance Criteria:**
  - Multi-cadence decisions are based on actual cadence records.
  - RFI rules have independently tested thresholds and documented limitations.
  - Candidate downgrades include readable explanations and traceable evidence.
  - Raw source data remain unchanged.
- **Deliverable:** An explainable RFI assessment layer with tested cadence-based evidence.
- **Exit Gate:** The system can distinguish a supported RFI downgrade from an inconclusive observation without overstating confidence.

---

### PHASE 9 — Build the Canonical BLC1 Investigation Case Study

- **Priority:** P1 (Scientific Demonstration)
- **Objective:** Demonstrate AETHON's scientific reasoning through a traceable case study.
- **Tasks:**
  1. Obtain and document public source data and provenance appropriate for a BLC1 reproduction (`REQ-CASE-01`).
  2. Preserve distinction between original observations and analysis dataset.
  3. Implement necessary observation relationships and on/off cadence metadata.
  4. Run ingestion, preprocessing, anomaly detection, drift analysis, and cadence comparison.
  5. Link every candidate to its original observations, time-frequency region, analysis runs, and evidence.
  6. Demonstrate how evidence changes candidate operational priority and disposition.
  7. Compare result with published interpretation using explicitly documented assumptions.
  8. Avoid claiming exact reproduction if required observations, cadence metadata, or processing context are unavailable.
  9. Generate a case dossier that contains results, provenance, supporting evidence, limitations, and final human-readable explanation.
  10. Automate case-study verification so regressions are detected in CI where feasible.
- **Acceptance Criteria:**
  - Case can be reproduced using documented inputs and configuration.
  - Every displayed conclusion is supported by retrievable data or explicitly labelled assumptions.
  - Case demonstrates both candidate discovery and the importance of false-positive rejection.
  - Dossier distinguishes reproduced facts from AETHON-derived interpretations.
- **Deliverable:** A complete, evidence-backed investigation case study.
- **Exit Gate:** Another developer can run the documented case and understand why the system reached its disposition.

---

### PHASE 10 — Audit Candidate Scoring, Persistence, and Scientific Dossiers

- **Priority:** P1 (Auditability)
- **Objective:** Ensure candidate ranking reflects evidence quality rather than missing-field defaults or arbitrary confidence.
- **Tasks:**
  1. Review `backend/app/candidates/scoring.py`, candidate eligibility, evidence aggregation, grouping, and review lifecycle (`REQ-ML-04`, `REQ-TRI-01`, `REQ-DOS-01`).
  2. Verify that every score component has a definition, valid range, documented weight, and explicit missing-evidence behaviour.
  3. Ensure missing evidence does not silently receive a favourable default score.
  4. Distinguish candidate priority from scientific confidence and source classification.
  5. Re-evaluate ranking against held-out synthetic benchmark cases.
  6. Check candidate grouping, bounding-region overlap, and identity stability.
  7. Test repeated requests and database restarts for persistence correctness.
  8. Verify review lifecycle cannot make invalid status transitions.
  9. Confirm dossiers preserve assessment version, provenance, and exact supporting evidence used to compute the displayed score.
  10. Check JSON/PDF consistency and verify downloadable reports remain valid.
- **Acceptance Criteria:**
  - Scores can be reproduced from contributing evidence and policy version.
  - Missing evidence is visible and handled deterministically.
  - Candidate identity and review history remain stable.
  - PDF and JSON dossiers agree with persisted candidate state.
  - No score is presented as a probability of extraterrestrial intelligence.
- **Deliverable:** An auditable candidate ledger and evidence-based scoring policy.
- **Exit Gate:** Synthetic test cases demonstrate understandable and reproducible changes in priority when evidence changes.

---

### PHASE 11 — Operational Security, Performance, and Browser Acceptance

- **Priority:** P2 (Hardening)
- **Objective:** Prepare the integrated application for a dependable technical demonstration.
- **Tasks:**
  1. Verify production settings disable debug-oriented behaviour and use explicitly configured CORS origins.
  2. Recheck upload size limits, temporary-file cleanup, malformed-file handling, path safety, and maximum slice dimensions.
  3. Confirm external credentials remain server-side and no real credentials have been committed.
  4. Establish a reproducible environment and document supported Python and Node versions.
  5. Profile expensive processing operations using realistic observation sizes.
  6. Measure memory usage, processing latency, and API response payload sizes.
  7. Only optimize code when measurements demonstrate a bottleneck.
  8. Add browser-based end-to-end tests for upload, observation selection, analysis, candidate review, and dossier export.
  9. Check small-screen usability, empty states, backend outage states, and accessible error feedback.
  10. Run the actual three-minute demonstration workflow from a fresh, clean setup.
  11. Configure GitHub branch protection and require intended CI checks before merging.
- **Acceptance Criteria:**
  - Upload and analysis operations respect resource limits.
  - UI handles unavailable backend services without presenting false success states.
  - Core user workflows pass browser-based tests.
  - Application can be started from documented instructions on a clean machine.
  - Required quality gates are enforced on protected development paths.
- **Deliverable:** An operationally reliable research demonstration.
- **Exit Gate:** Complete user journey works reliably using documented, reproducible inputs.

---

### PHASE 12 — Make the Deep-Learning Decision Using Evidence

- **Priority:** P2 / Research Decision
- **Objective:** Decide whether the pending PyTorch CNN requirement (`REQ-ML-03`) improves the detector enough to justify additional complexity.
- **Guiding Rule:** Do not begin by training a CNN merely because it is on the conceptual architecture page. First complete the scientific benchmark and error analysis.
- **Tasks:**
  1. Identify where statistical baseline and Isolation Forest fail.
  2. Determine whether failure is caused by feature representation, interference contamination, weak signals, localization, or thresholding.
  3. Establish an explicit hypothesis for what a CNN should improve.
  4. Compare a CNN against existing baselines on the same train/validation/test protocol.
  5. Keep observations—not overlapping patches from the same observation—as primary separation units where appropriate.
  6. Check for ground-truth leakage through preprocessing, patch generation, normalization, and dataset splitting.
  7. Evaluate detection quality, noise false alarms, localization, calibration, inference latency, and memory requirements.
  8. Save exact model configuration, training-data manifest, seeds, evaluation metrics, and artifact version.
  9. Add a model-loading and inference test only after a real trained artifact exists.
  10. If the CNN does not provide a meaningful, reproducible improvement, defer it and document why.
- **Acceptance Criteria:**
  - CNN is evaluated against strong, reproducible baselines.
  - Performance is reported on data not used for training or threshold selection.
  - Model has a defined operational role and measurable benefit.
  - Frontend does not describe conceptual neural inference as implemented functionality.
- **Deliverable:** An evidence-backed decision to implement or defer deep learning.
- **Exit Gate:** Additional model complexity is justified by a measured improvement, not by appearance or architecture diagrams.

---

### PHASE 13 — Freeze Scope and Release the Research-Prototype Demonstration

- **Priority:** Final Release Milestone
- **Objective:** Package the work into a stable, reproducible technical demonstration.
- **Tasks:**
  1. Run the dynamic master verification gate on the final candidate commit.
  2. Run all required tests with their actual pass, failure, and skip counts.
  3. Regenerate benchmark and pipeline reports from current version.
  4. Execute complete offline demonstration.
  5. Recheck scientific capability claims in README, Model page, About dossier, and roadmap.
  6. Document supported input formats, limitations, required installation steps, and expected resource usage.
  7. Prepare a concise technical walkthrough covering:
     - Observation ingestion.
     - Time-frequency representation.
     - Processing and RFI assessment.
     - Anomaly detection.
     - Drift and candidate evidence.
     - Human verification and dossier generation.
  8. Ensure every demonstration result identifies whether it is real observational data or a synthetic example.
  9. Record known limitations rather than hiding them.
  10. Tag a release only after required gates are successful.
- **Acceptance Criteria:**
  - A clean environment can reproduce the demonstration.
  - Final reports match released code and configuration.
  - No pending requirement is falsely marked complete.
  - Workflow shows scientifically meaningful operations and limitations, not just attractive visualizations.
  - Project can be evaluated without depending on personal local files or an internet connection during offline demonstration.
- **Deliverable:** A reproducible AETHON research-prototype release with clear scientific limitations and a defensible technical story.

---

## 4. Recommended Execution Sequence

Implement these phases in this exact order unless a blocker requires revisiting an earlier one:

| Order  | Phase        | Title                            | Priority | Main Outcome                                             |
| :----: | :----------- | :------------------------------- | :------: | :------------------------------------------------------- |
| **0**  | **PHASE 0**  | Project State Reconciliation     |    P0    | One authoritative roadmap & reconciled state             |
| **1**  | **PHASE 1**  | Repository & Environment Hygiene |    P0    | Safe, reproducible setup without tracked artifacts       |
| **2**  | **PHASE 2**  | Frontend Scientific Truthfulness |    P0    | No invented live measurements on any screen              |
| **3**  | **PHASE 3**  | Pipeline Failure Handling        |    P0    | Honest success, empty, and partial error states          |
| **4**  | **PHASE 4**  | Full-Stack Integration Tests     |    P0    | Deterministic endpoint coverage with isolated fixtures   |
| **5**  | **PHASE 5**  | Dynamic Verification Gate        |    P0    | Reports generated dynamically from actual checks         |
| **6**  | **PHASE 6**  | Scientific Benchmark Improvement |    P1    | Meaningful detector evaluation & low false-positive rate |
| **7**  | **PHASE 7**  | Offline Astronomy Data Bundle    |    P1    | Reproducible real-data workflow (<50MB)                  |
| **8**  | **PHASE 8**  | RFI & Cadence Verification       |    P1    | Explainable multi-cadence interference screening         |
| **9**  | **PHASE 9**  | BLC1 Case Study                  |    P1    | Traceable scientific investigation & disposition         |
| **10** | **PHASE 10** | Candidate & Dossier Audit        |    P1    | Evidence-backed, reproducible scores & valid PDFs        |
| **11** | **PHASE 11** | Operational & Browser Hardening  |    P2    | Dependable integrated workflow & E2E tests               |
| **12** | **PHASE 12** | Deep-Learning Go/No-Go Decision  |    P2    | Evidence-based model decision (CNN vs. baselines)        |
| **13** | **PHASE 13** | Release & Demonstration Freeze   | Release  | Reproducible research prototype package                  |

---

## 5. Work Deliberately Deferred

Do not prioritize these until earlier phases are complete:

- Building additional frontend pages or another visual redesign.
- Adding more elaborate conceptual latent-space animations.
- Training a CNN before the detector's weaknesses are understood.
- Adding a large self-supervised transformer or massive training dataset.
- Introducing WebGPU/WASM before profiling the current CPU pipeline.
- Building multi-observatory coordination or external alert dispatch before evidence quality is established.
- Adding new scoring terms before auditing the existing score and its benchmark performance.

These are not necessarily bad ideas. They are simply not the highest-value next steps.

---

## 6. Definition of Project Success

AETHON is ready for a credible research-prototype demonstration when it can:

1. Ingest a documented observation and preserve provenance.
2. Produce a valid, bounded time-frequency representation.
3. Run preprocessing and anomaly detection reproducibly.
4. Recover known synthetic signal parameters within measured tolerances.
5. Quantify false-positive behaviour with meaningful negative controls.
6. Investigate a candidate using traceable drift, RFI, and temporal evidence.
7. Preserve review decisions and export consistent scientific dossiers.
8. Present unknowns and failures honestly in the frontend.
9. Pass dynamic automated checks on the current commit.
10. Reproduce the central demonstration from a documented clean setup.

**Final Principle:** AETHON should become more trustworthy before it becomes more complex. The next milestone is not “add more AI.” It is “make the existing science, evidence, and verification reliable enough that its results deserve to be investigated.”

---

## Appendix: Historical Milestone Archive

For traceability, earlier exploratory milestones are preserved below:

### Milestone 1 (v1.0.0 — Web Architecture & Visual Refoundation)

- **Phase 1:** Foundation & Visual Identity Refoundation (Direction H: Paper Desk `#F4F1EA` + Midnight Instrument `#0D141A`). Complete.
- **Phase 2:** Observation & Discovery Pipelines (HTML5 Canvas DPR spectrogram rasterizers + Web Audio sonification). Complete.
- **Phase 3:** Candidate Triage & Digital Research Bench (Interactive 4-stage analytical bench + candidate ledger). Complete.
- **Phase 4:** Chronological Repository & Methodology Publication (Archive browser + ML methodology + Latent Manifold map). Complete.

### Milestone 2 (v2.0.0 — Backend Pipeline & Initial Integration Prototype)

- **Phase 0:** Python Backend Foundation (FastAPI, settings, CORS, health probes). Complete.
- **Phase 5 (Legacy):** Scientific Ingestion Engine (`.fil` and `.fits` readers, SQLite index). Complete.
- **Phase 2 (Legacy BE):** Canonical Scientific Data Representation & Spectral Slices. Complete.
- **Phase 3 (Legacy BE):** Synthetic Signal Laboratory & Parameter Recovery. Complete.
- **Phase 4 (Legacy BE):** Signal Preprocessing, Robust Statistics & RFI Quality Masks. Complete.
- **Phase 5 (Legacy BE):** Scientific Anomaly Detection Engine (Baseline & Isolation Forest). Complete.
- **Phase 6 (Legacy BE):** Doppler Frequency Drift Estimation & Linear De-Doppler Engine. Complete.
- **Phase 7 (Legacy BE):** Candidate Engine, Scoring Heuristics & Scientific PDF Dossiers. Complete.
- **Phase 8 (Legacy BE):** Full-Stack React + FastAPI Integration. Complete.
- **Phase 9 (Legacy BE):** Scientific Validation, Reproducibility & Delivery Gate. Complete.
- **Master Prompts 01–03:** Environment Configuration, Repository Audit/Cleanup, and Full-Stack Connectivity Audit. Complete (`f0d35ec4`).
