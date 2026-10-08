# SPEC.md — Project Specification: AETHON

> **Milestone:** v2.0.0 — Scientific Data Pipeline, Doppler Intelligence & Verifiable Candidate Engine  
> **Status:** `FINALIZED`  
> **Date:** 2026-10-09

---

## 1. Vision

**AETHON** is an instrument-grade radio astronomy analysis console and neural candidate discovery system. Built for rigorous SETI (Search for Extraterrestrial Intelligence) investigation, it bridges the gap between raw gigabyte-scale telescope filterbank data and actionable scientific intelligence. AETHON ingests real observations from the Breakthrough Listen Open Data Archive (Green Bank and Parkes telescopes), isolates anomalous narrowband drifting signals, performs interactive Doppler drift-rate estimation and de-Doppler correction, mitigates Radio Frequency Interference (RFI) via explainable multi-cadence logic, scores candidates through layered physical, statistical, and neural models, and generates publication-grade scientific dossiers—all while maintaining uncompromising scientific honesty and the disciplined _Direction H_ (Paper Research Desk + Midnight Instrument) aesthetic.

---

## 2. Goals

1. **Real Radio Astronomy Ingestion & Normalization:**
   - Ingest offline Breakthrough Listen `.fil` (filterbank) and `.fits` observations from the Green Bank Telescope (GBT) and Parkes Observatory.
   - Decouple raw file formats from the UI via a normalized backend representation preserving observation ID, target coordinates (RA/Dec), telescope metadata, channel resolution, frequency bounds, and raw data provenance.

2. **Flagship Case Study (BLC1 Proxima Centauri):**
   - Provide an end-to-end case study of the Breakthrough Listen Candidate 1 (BLC1) signal detected toward Proxima Centauri.
   - Walk evaluators through initial anomaly detection, drifting tone isolation, cadence/off-target comparison, RFI characterization, and explainable disposition as terrestrial interference.

3. **Controlled Synthetic Benchmark Mode (`setigen`):**
   - Support controlled signal injection using `setigen` (custom center frequency, drift rate, SNR, chirp, and modulation) into real telescope background noise.
   - Quantifiably measure and report detection sensitivity, candidate recovery rate, drift-rate error, and SNR limits against known ground truth.

4. **Interactive Doppler & Spectral Analysis:**
   - Detect and estimate carrier drift rates ($Hz/s$) across time-frequency waterfalls.
   - Provide interactive client-side and backend de-Doppler drift correction controls, allowing researchers to adjust drift slope in real time and inspect uncorrected vs. corrected signal profiles.

5. **Explainable RFI Mitigation & Cadence Verification:**
   - Implement deterministic and probabilistic RFI mitigation distinguishing persistent local transmitters, broadband RFI, moving satellite signatures, and on/off target cadence behavior (ABACAD observing patterns).
   - Downgrade candidates with plain-language, audit-traceable scientific rationale (e.g., recurrence in off-target beam, zero drift rate, matches local terrestrial band).

6. **Layered Intelligence & Transparent Scoring:**
   - Implement a modular 3-tier scoring architecture:
     - **Tier 1:** Deterministic physics & signal-processing metrics (SNR, narrowbandness, drift consistency, temporal persistence).
     - **Tier 2:** Statistical anomaly scoring (Isolation Forest / robust outlier scoring).
     - **Tier 3:** Lightweight neural spectrogram classification (PyTorch CNN confidence).
   - Combine into a transparent, documented composite formula where neural networks never have sole authority over scientific disposition.

7. **Structured Candidate Triage & Scientific PDF Dossier:**
   - Elevate detections into structured scientific case files (Identity, Physical Properties, Observational Context, Multi-Factor Intelligence, Spectrogram Evidence, and Disposition).
   - Generate exportable, high-fidelity PDF scientific research dossiers containing raw provenance, calibration metadata, and high-resolution spectral plots.

8. **Deterministic, Offline-Reliable Technical Demo:**
   - Package a curated offline demo bundle containing real GBT/BLC1 slices and controlled synthetic benchmarks.
   - Ensure the entire 3-minute technical narrative is deterministic, fast (<1s load times), and immune to network outages.

---

## 3. Non-Goals (Scope Edges)

- **No User Auth / Accounts:** No login walls, OAuth, user registration, multi-tenancy, or team permissions.
- **No Commercial SaaS Infrastructure:** No billing, Stripe, subscription tiers, analytics trackers, or enterprise RBAC.
- **No Cloud Cluster Orchestration:** No Kubernetes, Celery clusters, AWS/GCP provisioning, or distributed object store complexity.
- **No Real-Time Telescope Hardware Control:** AETHON is a post-acquisition signal processing and analysis console, not a telescope mount or receiver controller.
- **No Unscientific Claims:** No "Aliens Detected" banners or clickbait alerts. Every finding must be described with probabilistic terms (`anomalous candidate`, `high-confidence candidate`, `likely RFI`, `unresolved`).
- **No Premature GPU/WASM Optimization:** Build a clean, profile-driven CPU Python/NumPy pipeline first. Client-side WASM or WebGPU will only be introduced if measured profiling reveals a critical bottleneck.
- **No Direct LaTeX Toolchain Dependency:** PDF dossier generation must use headless Chromium / PDFKit / ReportLab rather than requiring users to install a heavy TeX Live distribution.

---

## 4. Target Users & Evaluation Context

1. **Technical Evaluators & Peer Reviewers:**
   - Needs: Rapid comprehension of the scientific problem, unmistakable evidence that algorithms operate on real radio astronomy data, clear visual proof of Doppler de-dispersion, and an engaging 3-minute rehearsable walkthrough.
2. **Astrophysicists & Signal Processing Researchers:**
   - Needs: Methodological credibility, preservation of FITS/filterbank headers, scientifically meaningful physical units ($MHz$, $Hz/s$, $Jy$, $dB$), explainable RFI rejection logic, and reproducible data provenance.

---

## 5. Technical Architecture & Stack

### Frontend (Existing Workspace — Enhanced)

- **Framework:** React 19, TypeScript, Vite 8, React Router 7.
- **Aesthetic:** Direction H (Paper Research Desk `#F4F1EA`, Midnight Instrument Viewports `#0D141A`).
- **Typography:** Source Sans 3 (UI), Newsreader (Editorial & Scientific Inquiries), IBM Plex Mono (Telemetry & Coordinates).
- **Visualization:** HTML5 2D Canvas with device-pixel-ratio (DPR) scaling for dynamic waterfalls and spectrum traces; Lucide React icons; Web Audio API Doppler sonification.

### Scientific Backend (Python / FastAPI)

- **Runtime:** Python 3.10+ with FastAPI and Uvicorn.
- **Core Numerics:** NumPy, SciPy (using modern `ShortTimeFFT` and STFT APIs), Pandas.
- **Astronomy & FITS:** Astropy (`astropy.io.fits`, `astropy.coordinates`, `astropy.time`, `astropy.units`).
- **Filterbank & SETI:** `blimpy` (Breakthrough Listen filterbank `.fil` / `.h5` reader), `turboSETI` algorithm integration.
- **Synthetic Signals:** `setigen` for controlled signal injection and ground-truth validation.
- **Machine Learning:** PyTorch for lightweight CNN spectrogram classification; Scikit-learn for Isolation Forest anomaly scoring.
- **PDF Generation:** WeasyPrint / ReportLab / headless rendering for research-grade candidate dossiers.

---

## 6. Three-Minute Technical Demonstration Script

```
0:00–0:20  [The Problem]
           "Modern radio telescopes capture petabytes of time-frequency data.
           Astronomers are looking for needles in a cosmic haystack while drowned in
           human satellite interference. AETHON extracts, triages, and validates those needles."

0:20–0:45  [Real Data Ingestion]
           Load real Breakthrough Listen GBT observation of Proxima Centauri.
           Display RA/Dec, telescope receiver, observation cadence (ON/OFF), and
           raw filterbank provenance.

0:45–1:15  [Discovery Pipeline & Candidate Detection]
           Execute automated screening. Observe raw waterfall processing, thresholding,
           and candidate extraction.
           Highlight Candidate BLC1 drifting at ~-0.24 Hz/s.

1:15–1:40  [Interactive Doppler Analysis]
           Engage the Doppler Analysis bench.
           Showcase live time-frequency drift slope, engage de-Doppler correction,
           and show the carrier straighten into a coherent vertical line with SNR gain.

1:40–2:05  [Explainable RFI Mitigation]
           Run cadence analysis.
           Show the signal reappearing in the OFF-target pointing and matching
           local oscillator harmonics.
           System downgrades candidate confidence: "Likely Terrestrial RFI."

2:05–2:30  [Synthetic Benchmark Validation]
           Switch to Benchmark Mode: Injected setigen signal with known ground truth
           (+0.15 Hz/s drift, SNR 18 dB).
           Show successful recovery and quantitative parameter error metrics.

2:30–2:55  [Scientific Dossier Export]
           Generate and preview the exportable PDF scientific dossier complete with
           spectrogram snapshots, FITS metadata, RFI audit log, and cryptographically hashed provenance.

2:55–3:00  [Conclusion]
           "AETHON doesn't claim alien contact. It filters the noise, preserves the physics,
           and gives scientists the evidence to decide."
```

---

## 7. Success Criteria & Verification Matrix

| #         | Measurable Criterion                                                                                               | Verification Method                                                                 |
| :-------- | :----------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| **SC-01** | Offline ingestion of GBT `.fil` filterbank files with accurate metadata extraction (RA, Dec, Freq, Time)           | Automated Python parser test with reference `.fil` file                             |
| **SC-02** | Flagship BLC1 case study end-to-end workflow (Ingest → Detect → Doppler → RFI → Downgrade)                         | Interactive UI verification on `/analysis/blc1`                                     |
| **SC-03** | Controlled `setigen` synthetic signal injection with verifiable recovery rate ($\ge 95\%$ for SNR $>15\text{ dB}$) | Backend unit test suite comparing recovered drift/frequency against ground truth    |
| **SC-04** | Interactive client-side/backend Doppler drift correction with real-time time-frequency restacking                  | Visual inspection of de-Dopplerized waterfall alignment in browser                  |
| **SC-05** | Multi-observation on/off target cadence analysis with explainable RFI disposition rationale                        | RFI mitigation test asserting off-target detection downgrades candidate score       |
| **SC-06** | Layered candidate scoring formula combining physics metrics, Isolation Forest, and CNN confidence                  | Backend scoring test asserting deterministic weights and explainable breakdown      |
| **SC-07** | Exportable, high-resolution scientific PDF dossier containing observation metadata and spectral plots              | Headless PDF generation test asserting valid PDF byte stream with expected sections |
| **SC-08** | Full 3-minute demo workflow executable in complete offline mode with sub-second page transitions                   | Automated Playwright / browser test without external internet connectivity          |
