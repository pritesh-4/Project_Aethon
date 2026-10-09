"""Scientific PDF dossier generator producing publication-ready case files."""

from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

from app.candidates.exceptions import DossierGenerationError
from app.candidates.schemas import CandidateDossier


def generate_candidate_pdf(
    dossier: CandidateDossier,
    output_path: Path,
) -> Path:
    """Render a structured CandidateDossier into a publication-grade scientific PDF document.

    Generates a 2-page vector PDF containing executive findings, quantitative score breakdowns,
    observational coordinates, Doppler drift measurements, RFI quality diagnostics,
    review history, and reproducibility provenance.

    Args:
        dossier: Structured CandidateDossier snapshot.
        output_path: Destination path for the generated PDF.

    Returns:
        Path: Absolute path to the generated PDF.

    Raises:
        DossierGenerationError: If rendering fails.
    """
    dest = Path(output_path).resolve()
    dest.parent.mkdir(parents=True, exist_ok=True)

    cand = dossier.candidate
    assess = dossier.assessment

    try:
        with PdfPages(str(dest)) as pdf:
            # ---------------- PAGE 1: Executive Overview & Score Breakdown ----------------
            fig1 = plt.figure(figsize=(8.5, 11), dpi=150)
            fig1.patch.set_facecolor("#FAF8F5")

            # Top Header Bar
            plt.text(
                0.05,
                0.95,
                "AETHON RADIO-FREQUENCY ANOMALY DISCOVERY",
                fontsize=11,
                fontweight="bold",
                color="#1B2A32",
                transform=fig1.transFigure,
            )
            plt.text(
                0.05,
                0.93,
                "SCIENTIFIC CANDIDATE CASE FILE & EVIDENCE DOSSIER",
                fontsize=8,
                color="#5A6D7C",
                transform=fig1.transFigure,
            )

            # Metadata Box
            plt.text(
                0.05,
                0.88,
                f"Candidate ID: {cand.candidate_id}",
                fontsize=10,
                fontweight="bold",
                color="#0D141A",
                transform=fig1.transFigure,
            )
            plt.text(
                0.05,
                0.86,
                f"Status: {cand.status.value.upper()}  |  Assessment v{assess.version}  |  "
                f"Generated: {dossier.generated_at_utc[:19]} UTC",
                fontsize=8.5,
                color="#2C4251",
                transform=fig1.transFigure,
            )

            # Horizontal rule
            line1 = plt.Line2D(
                [0.05, 0.95], [0.84, 0.84], transform=fig1.transFigure, color="#D6D2C9", lw=1.5
            )
            fig1.add_artist(line1)

            # Executive Summary Section
            plt.text(
                0.05,
                0.81,
                "1. EXECUTIVE ASSESSMENT SUMMARY",
                fontsize=9.5,
                fontweight="bold",
                color="#1F3A52",
                transform=fig1.transFigure,
            )
            # Wrap summary text
            summary_wrapped = _wrap_text(dossier.executive_summary, max_chars=95)
            plt.text(
                0.05,
                0.78,
                summary_wrapped,
                fontsize=8,
                color="#1A202C",
                transform=fig1.transFigure,
                verticalalignment="top",
            )

            # Score Card & Priority Band
            score_box_y = 0.63
            score_val = assess.overall_score
            band_str = assess.priority_band.value.upper()
            plt.text(
                0.05,
                score_box_y,
                "2. INVESTIGATION PRIORITY SCORE BREAKDOWN",
                fontsize=9.5,
                fontweight="bold",
                color="#1F3A52",
                transform=fig1.transFigure,
            )
            plt.text(
                0.05,
                score_box_y - 0.03,
                f"Priority Score: {score_val:.1f} / 100.0   [{band_str} PRIORITY]",
                fontsize=11,
                fontweight="bold",
                color="#8C5E1E" if score_val >= 60 else "#376A9B",
                transform=fig1.transFigure,
            )

            # Component table
            comp_table_data = [
                ["Evidence Category", "Contribution", "Weight Ceiling", "Status"],
                [
                    "Anomaly Deviation",
                    f"{assess.component_contributions.get('anomaly_evidence', 0.0):.1f} pts",
                    "35.0 pts",
                    "Computed",
                ],
                [
                    "Doppler Linearity",
                    f"{assess.component_contributions.get('doppler_drift', 0.0):.1f} pts",
                    "25.0 pts",
                    "Computed"
                    if "doppler_drift_analysis" not in assess.missing_evidence
                    else "Missing",
                ],
                [
                    "Temporal Persistence",
                    f"{assess.component_contributions.get('temporal_persistence', 0.0):.1f} pts",
                    "20.0 pts",
                    "Computed"
                    if "temporal_characterization" not in assess.missing_evidence
                    else "Missing",
                ],
                [
                    "RFI Cleanliness",
                    f"{assess.component_contributions.get('data_quality', 0.0):.1f} pts",
                    "20.0 pts",
                    "Computed"
                    if "rfi_quality_assessment" not in assess.missing_evidence
                    else "Default",
                ],
                [
                    "Recurrence Bonus",
                    f"{assess.component_contributions.get('recurrence_bonus', 0.0):.1f} pts",
                    "10.0 pts",
                    "Evaluated",
                ],
            ]

            ax_table = fig1.add_axes((0.05, 0.40, 0.90, 0.17))
            ax_table.axis("off")
            tbl = ax_table.table(
                cellText=comp_table_data[1:],
                colLabels=comp_table_data[0],
                loc="center",
                cellLoc="left",
                colColours=["#EAE7E0"] * 4,
            )
            tbl.auto_set_font_size(False)
            tbl.set_fontsize(7.5)
            tbl.scale(1.0, 1.4)

            # Section 3: Observation & Coordinates
            plt.text(
                0.05,
                0.36,
                "3. OBSERVATION PROVENANCE & LOCALIZATION",
                fontsize=9.5,
                fontweight="bold",
                color="#1F3A52",
                transform=fig1.transFigure,
            )

            reg = cand.target_region
            coords = cand.physical_coordinates
            synthetic_label = (
                "YES (Benchmark Ground Truth)" if cand.is_synthetic else "NO (Telescope Ingest)"
            )
            obs_info = (
                f"Source Observation(s): {', '.join(cand.source_observation_ids)}\n"
                f"Matrix Bounding Indices: Time [{reg.get('time_start')}:{reg.get('time_stop')}], "
                f"Frequency [{reg.get('freq_start')}:{reg.get('freq_stop')}]\n"
                f"Center Frequency: {coords.get('freq_center_hz', 'N/A')} Hz   |   "
                f"Bandwidth: {coords.get('bandwidth_hz', 'N/A')} Hz\n"
                f"Observation Duration Span: {coords.get('duration_s', 'N/A')} s\n"
                f"Synthetic Laboratory Injection: {synthetic_label}"
            )
            plt.text(
                0.05,
                0.33,
                obs_info,
                fontsize=8,
                color="#1A202C",
                transform=fig1.transFigure,
                verticalalignment="top",
            )

            # Page 1 Footer Disclaimer
            plt.text(
                0.05,
                0.05,
                _wrap_text(dossier.scientific_disclaimer, max_chars=110),
                fontsize=6.5,
                color="#718096",
                transform=fig1.transFigure,
                style="italic",
            )
            plt.text(
                0.90, 0.03, "Page 1 of 2", fontsize=7, color="#718096", transform=fig1.transFigure
            )

            pdf.savefig(fig1)
            plt.close(fig1)

            # ---------------- PAGE 2: Evidence Audit, Quality & Reproducibility ----------------
            fig2 = plt.figure(figsize=(8.5, 11), dpi=150)
            fig2.patch.set_facecolor("#FAF8F5")

            plt.text(
                0.05,
                0.95,
                f"CANDIDATE CASE FILE: {cand.candidate_id} (Page 2)",
                fontsize=10,
                fontweight="bold",
                color="#1B2A32",
                transform=fig2.transFigure,
            )

            line2 = plt.Line2D(
                [0.05, 0.95], [0.93, 0.93], transform=fig2.transFigure, color="#D6D2C9", lw=1.5
            )
            fig2.add_artist(line2)

            # Section 4: Detailed Evidence Ledger
            plt.text(
                0.05,
                0.90,
                "4. MULTI-PHASE SCIENTIFIC EVIDENCE LEDGER",
                fontsize=9.5,
                fontweight="bold",
                color="#1F3A52",
                transform=fig2.transFigure,
            )

            ev_rows = []
            for ev in cand.evidence_items[:6]:  # Show top 6 items
                ev_rows.append(
                    [
                        ev.evidence_type.value.upper(),
                        ev.method_and_version,
                        "Supportive" if ev.is_supportive else "Flagged",
                        ev.quality_or_limitations[:35] if ev.quality_or_limitations else "Nominal",
                    ]
                )

            if not ev_rows:
                ev_rows = [["None", "No evidence ingested", "-", "-"]]

            ax_ev_tbl = fig2.add_axes((0.05, 0.70, 0.90, 0.18))
            ax_ev_tbl.axis("off")
            tbl2 = ax_ev_tbl.table(
                cellText=ev_rows,
                colLabels=["Category", "Method / Algorithm", "Support Status", "Diagnostic Notes"],
                loc="center",
                cellLoc="left",
                colColours=["#EAE7E0"] * 4,
            )
            tbl2.auto_set_font_size(False)
            tbl2.set_fontsize(7.5)
            tbl2.scale(1.0, 1.3)

            # Section 5: Review & Audit History
            plt.text(
                0.05,
                0.66,
                "5. HUMAN / SYSTEM TRIAGE REVIEW HISTORY",
                fontsize=9.5,
                fontweight="bold",
                color="#1F3A52",
                transform=fig2.transFigure,
            )

            rev_rows = []
            for rev in cand.review_history[:5]:
                rev_rows.append(
                    [
                        rev.created_at_utc[:16],
                        rev.action,
                        f"{rev.previous_status.value} -> {rev.new_status.value}",
                        rev.reviewer_id,
                        rev.notes[:30] if rev.notes else "-",
                    ]
                )

            if not rev_rows:
                rev_rows = [["-", "Pending Initial Triage", "-", "system", "Unreviewed candidate"]]

            ax_rev_tbl = fig2.add_axes((0.05, 0.48, 0.90, 0.15))
            ax_rev_tbl.axis("off")
            tbl3 = ax_rev_tbl.table(
                cellText=rev_rows,
                colLabels=["Timestamp", "Action", "Transition", "Reviewer", "Notes"],
                loc="center",
                cellLoc="left",
                colColours=["#EAE7E0"] * 5,
            )
            tbl3.auto_set_font_size(False)
            tbl3.set_fontsize(7.5)
            tbl3.scale(1.0, 1.3)

            # Section 6: Limitations, Warnings & Reproducibility
            plt.text(
                0.05,
                0.43,
                "6. SCIENTIFIC LIMITATIONS & REPRODUCIBILITY APPENDIX",
                fontsize=9.5,
                fontweight="bold",
                color="#1F3A52",
                transform=fig2.transFigure,
            )

            all_warns = cand.warnings + assess.warnings
            warn_str = "\n".join(f"- {w}" for w in all_warns) if all_warns else "- None reported."
            disagree_lbl = (
                "YES (Baseline vs Isolation Forest diverged)"
                if assess.detector_disagreement
                else "NO"
            )
            np_ver = dossier.reproducibility_appendix.get("numpy_version")
            schema_ver = dossier.reproducibility_appendix.get("dossier_schema_version")
            repro_info = (
                f"Missing Evidence: {', '.join(assess.missing_evidence) or 'None'}\n"
                f"Detector Disagreement: {disagree_lbl}\n"
                f"Warnings & Limitations:\n{warn_str}\n\n"
                f"Reproducibility Parameters:\n"
                f"- Scoring Policy: {assess.policy_name} v{assess.policy_version}\n"
                f"- Assessment Version: {assess.version}\n"
                f"- Assessment ID: {assess.assessment_id}\n"
                f"- Frozen Environment: NumPy v{np_ver}\n"
                f"- Dossier Schema: v{schema_ver}"
            )
            plt.text(
                0.05,
                0.40,
                repro_info,
                fontsize=7.5,
                color="#2D3748",
                transform=fig2.transFigure,
                verticalalignment="top",
            )

            # Page 2 Footer
            plt.text(
                0.90, 0.03, "Page 2 of 2", fontsize=7, color="#718096", transform=fig2.transFigure
            )

            pdf.savefig(fig2)
            plt.close(fig2)

            # Set PDF document properties
            pdf.infodict()["Title"] = f"AETHON Candidate Dossier - {cand.candidate_id}"
            pdf.infodict()["Author"] = "AETHON Autonomous Radio Signal Discovery System"
            pdf.infodict()["Subject"] = "Scientific Candidate Case File"

        return dest
    except Exception as exc:
        raise DossierGenerationError(f"Failed to generate PDF dossier at '{dest}': {exc}") from exc


def _wrap_text(text: str, max_chars: int = 90) -> str:
    """Helper to wrap words into multi-line string for matplotlib."""
    words = text.split()
    lines: list[str] = []
    current_line: list[str] = []
    current_len = 0

    for word in words:
        if current_len + len(word) + 1 <= max_chars:
            current_line.append(word)
            current_len += len(word) + 1
        else:
            lines.append(" ".join(current_line))
            current_line = [word]
            current_len = len(word)
    if current_line:
        lines.append(" ".join(current_line))

    return "\n".join(lines)
