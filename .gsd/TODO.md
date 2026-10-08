# TODO.md — Pending Tasks & Ideas: AETHON

> Backlog of secondary items, exploratory research, and future ideas.

---

## High Priority (Active Milestone)

- [ ] Implement `backend/ingestion/filterbank.py` to parse GBT `.fil` headers using `blimpy`.
- [ ] Build normalized slice generator API endpoint (`/api/observations/{id}/slice`).
- [ ] Create interactive Doppler drift slope slider component in `src/pages/Analysis/`.
- [ ] Wire client-side de-Doppler matrix shear algorithm to Canvas waterfall.
- [ ] Implement multi-cadence (ABACAD) RFI rejection rules in `backend/analysis/cadence.py`.
- [ ] Package offline sample bundle for BLC1 (Proxima Centauri) with ON/OFF pointings.
- [ ] Build `setigen` synthetic signal injection & parameter recovery test suite.
- [ ] Create headless PDF scientific dossier generator with embedded high-DPI plots.

---

## Future Polish & Enhancements

- [ ] WebGPU/WASM evaluation (only after profiling CPU pipeline bottlenecks).
- [ ] Interactive 3D celestial sky-map sphere in Observatory view.
- [ ] Client-side audio sonification pitch tracking linked to interactive Doppler drift rate.
- [ ] Batch export of multiple candidate dossiers as a consolidated ZIP archive.
