# REQUIREMENTS.md — Project Requirements: AETHON

> **Milestone:** v2.0.0 — Scientific Data Pipeline, Doppler Intelligence & Verifiable Candidate Engine  
> **Status:** Active  
> **Last Updated:** 2026-10-09

---

## Traceability Matrix

| ID               | Requirement Statement                                                                                                                  | Source Goal | Status  | Verification Method                                                                                    |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------------------- | :---------- | :-----: | :----------------------------------------------------------------------------------------------------- |
| **REQ-ING-01**   | Support offline ingestion and header extraction of Breakthrough Listen `.fil` (filterbank) and `.fits` files.                          | Goal 1      | Pending | Unit test asserting RA, Dec, Freq start/end, and channel resolution extracted.                         |
| **REQ-ING-02**   | Normalize raw telescope data into a format-agnostic spectral slice model with provenance metadata.                                     | Goal 1      | Pending | Pipeline test verifying uniform JSON schema output across different input formats.                     |
| **REQ-ING-03**   | Provide a pre-packaged offline sample bundle (including GBT Proxima Centauri slices) requiring zero external network downloads.        | Goal 1, 8   | Pending | Integration test verifying all demo routes function with network disabled.                             |
| **REQ-CASE-01**  | Implement the canonical BLC1 case study demonstrating detection, drift isolation, cadence comparison, and terrestrial RFI downgrade.   | Goal 2, 5   | Pending | End-to-end flow test verifying BLC1 is triaged from anomalous candidate to confirmed RFI.              |
| **REQ-BENCH-01** | Integrate `setigen` for controlled synthetic narrowband signal injection (frequency, drift rate, SNR, chirp, modulation).              | Goal 3      | Pending | Unit test validating synthetic signal generation and injection into noise baselines.                   |
| **REQ-BENCH-02** | Provide automated parameter recovery benchmarking reporting detection rate, drift error, and SNR thresholds.                           | Goal 3      | Pending | Quantitative benchmark asserting $\ge 95\%$ recovery for SNR $\ge 15\text{ dB}$.                       |
| **REQ-DOP-01**   | Estimate carrier drift rate ($Hz/s$) across time-frequency waterfalls using line-fitting / Hough transform / turboSETI.                | Goal 4      | Pending | Numerical test validating drift rate estimate against simulated ground truth.                          |
| **REQ-DOP-02**   | Interactive client-side and backend de-Doppler drift correction allowing continuous slope adjustment and restacked profile comparison. | Goal 4      | Pending | Canvas visual and numerical test asserting signal peak power increases after correct de-Doppler shift. |
| **REQ-RFI-01**   | Multi-cadence on/off target comparison (ABACAD) to flag signals persisting in off-target pointings.                                    | Goal 5      | Pending | Cadence test verifying candidate score penalty when present in off-target beam.                        |
| **REQ-RFI-02**   | Classify known terrestrial interference patterns (zero drift, wideband, local airport/radar/clock harmonics).                          | Goal 5      | Pending | Rule evaluation test confirming matching frequency windows trigger RFI flags.                          |
| **REQ-RFI-03**   | Generate human-readable, explainable scientific disposition rationale for all downgraded candidates.                                   | Goal 5      | Pending | Assertion on candidate disposition object containing plain-language explanation array.                 |
| **REQ-ML-01**    | Calculate deterministic physical signal metrics (SNR, bandwidth, drift consistency, temporal persistence).                             | Goal 6      | Pending | Analytical test against known synthetic and real spectrogram slices.                                   |
| **REQ-ML-02**    | Implement an Isolation Forest / robust statistical anomaly scoring model over spectral features.                                       | Goal 6      | Pending | Model inference test confirming outlier scoring on anomalous vs. Gaussian noise slices.                |
| **REQ-ML-03**    | Implement a lightweight PyTorch CNN spectrogram classifier providing separate confidence scores.                                       | Goal 6      | Pending | Model test validating tensor input/output and inference latency <50ms.                                 |
| **REQ-ML-04**    | Combine physical metrics, anomaly scores, and ML confidence into a transparent, documented composite candidate score.                  | Goal 6      | Pending | Formula test validating deterministic score calculation with configurable weights.                     |
| **REQ-TRI-01**   | Structured candidate case file model with identity, physical metrics, observing context, evidence plots, and disposition.              | Goal 7      | Pending | Frontend state and API test asserting candidate schema completeness.                                   |
| **REQ-DOS-01**   | Export publication-ready scientific PDF dossiers with embedded high-resolution spectrograms, measurements, and provenance hashes.      | Goal 7      | Pending | PDF generation test verifying valid byte output and visual formatting integrity.                       |
| **REQ-DEMO-01**  | Deterministic 3-minute technical walkthrough with sub-second page transitions and offline immunity.                                    | Goal 8      | Pending | Rehearsed Playwright E2E test verifying full demonstration path.                                       |
