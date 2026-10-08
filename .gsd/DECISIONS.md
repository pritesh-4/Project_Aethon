# DECISIONS.md — Architecture & Product Decision Log: AETHON

> This file logs all architectural, scientific, and design decisions made for AETHON.

---

## ADR-001: Visual Identity Refoundation (Direction H)

- **Date:** 2026-10-08
- **Context:** Previous interface felt generic, robotic, and over-stylized with neon copper/graphite accents.
- **Decision:** Adopted Direction H (_Hybrid Scientific Editorial + Observatory Instrument_). Warm Paper Research Desk (`#F4F1EA`) with deep Midnight Instrument Viewports (`#0D141A`) for high-contrast astronomical visualizations.
- **Consequences:** Restored human scientific feel, zero copper tokens, 3-tier typography (Source Sans 3, Newsreader, IBM Plex Mono).

---

## ADR-002: Python/FastAPI Backend for Scientific Computation

- **Date:** 2026-10-09
- **Context:** Real astronomical filterbanks (`.fil`) and FITS files require specialized numerical libraries (`blimpy`, `astropy`, `scipy`).
- **Decision:** Introduce a lightweight Python/FastAPI backend service for data ingestion, STFT generation, Doppler estimation, and `setigen` benchmarks.
- **Consequences:** Frontend remains completely format-agnostic, receiving normalized spectral slices and JSON metadata.

---

## ADR-003: Flagship BLC1 Case Study with Terrestrial RFI Disposition

- **Date:** 2026-10-09
- **Context:** Need a realistic astronomical demonstration that avoids sensationalism or fake "aliens found" claims.
- **Decision:** Feature the Breakthrough Listen Candidate 1 (BLC1) Proxima Centauri dataset as the flagship case study, demonstrating that AETHON properly triages it down to terrestrial interference via on/off cadence analysis.
- **Consequences:** Establishes deep scientific honesty and builds evaluator trust.

---

## ADR-004: Layered 3-Tier Candidate Scoring Architecture

- **Date:** 2026-10-09
- **Context:** Pure black-box deep learning models are uninterpretable and prone to false positives on out-of-distribution noise.
- **Decision:** Separate scoring into:
  1. Deterministic physical measurements (SNR, bandwidth, persistence, drift)
  2. Statistical anomaly score (Isolation Forest)
  3. Lightweight CNN spectrogram confidence
     Never allow neural network output alone to determine scientific disposition.
- **Consequences:** Full explainability and defensible scoring metrics during live demonstrations.

---

## ADR-005: Offline-Reliable Demo Packaging

- **Date:** 2026-10-09
- **Context:** Live technical evaluations and peer demonstrations cannot tolerate external API timeouts or slow multi-gigabyte downloads.
- **Decision:** Bundle and cache sample GBT/Parkes filterbank slices and precomputed results locally, enabling 100% offline execution of the 3-minute rehearsed presentation.
- **Consequences:** Guaranteed sub-second responsiveness and zero presentation failure risk.
