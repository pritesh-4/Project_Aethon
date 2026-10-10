"""Internal anomaly detection service orchestrating windowing, feature extraction, and scoring."""

import uuid
from datetime import UTC, datetime
from typing import Any

import numpy as np
import sklearn

from app.detection.baseline import StatisticalBaselineDetector
from app.detection.config import DetectionPipelineConfig
from app.detection.exceptions import (
    EmptyAnalysisRegionError,
    InvalidDetectionConfigError,
)
from app.detection.features import FEATURE_NAMES, FEATURE_SCHEMA_VERSION, extract_window_features
from app.detection.isolation_forest import IsolationForestDetector
from app.detection.regions import merge_anomalous_windows
from app.detection.schemas import (
    AnalysisWindow,
    AnomalousRegion,
    DetectionEvidence,
    DetectionResult,
)
from app.detection.windows import generate_analysis_windows
from app.processing.models import QualityMask
from app.representation.axes import FrequencyAxisModel, TimeAxisModel
from app.representation.models import CanonicalSlice


class DetectionService:
    """Scientific anomaly detection service executing baseline and Isolation Forest pipelines.

    Callable directly from Python without requiring FastAPI or HTTP middleware.
    Operates strictly on bounded numpy arrays and canonical slice models.
    """

    def analyze_array(
        self,
        values: np.ndarray,
        observation_id: str,
        quality_mask: QualityMask | None = None,
        time_axis: TimeAxisModel | None = None,
        frequency_axis: FrequencyAxisModel | None = None,
        config: DetectionPipelineConfig | None = None,
        trained_iforest: IsolationForestDetector | None = None,
        reference_features: list[dict[str, float]] | None = None,
    ) -> DetectionResult:
        """Run complete anomaly detection pipeline on a 2D time-frequency matrix.

        Args:
            values: 2D numpy array with canonical axis ordering [time_index, freq_index].
            observation_id: Identifier of the source observation.
            quality_mask: Optional QualityMask; if None, unfinite cells are flagged automatically.
            time_axis: Optional TimeAxisModel for physical time calculations.
            frequency_axis: Optional FrequencyAxisModel for physical frequency calculations.
            config: DetectionPipelineConfig specifying window geometry, detectors, and limits.
            trained_iforest: Optional pre-fitted IsolationForestDetector.
            reference_features: Optional external reference features for baseline/IF fitting.

        Returns:
            DetectionResult: Structured detection output with traceable evidence.
        """
        if values.ndim != 2:
            raise InvalidDetectionConfigError(
                f"Array must be 2D [time, freq], received shape {values.shape}"
            )

        cfg = config or DetectionPipelineConfig()
        analysis_run_id = str(uuid.uuid4())
        n_t, n_f = values.shape

        # Establish default quality mask if omitted
        if quality_mask is None:
            non_finite = ~np.isfinite(values)
            quality_mask = QualityMask(primary_mask=non_finite)

        # 1. Partition into bounded windows
        window_tuples = generate_analysis_windows(
            values=values,
            quality_mask=quality_mask,
            time_axis=time_axis,
            frequency_axis=frequency_axis,
            config=cfg.window,
            max_windows_limit=cfg.max_windows,
        )

        total_windows = len(window_tuples)
        if total_windows == 0:
            return DetectionResult(
                observation_id=observation_id,
                analysis_run_id=analysis_run_id,
                matrix_shape=[n_t, n_f],
                total_windows_evaluated=0,
                anomalous_regions=[],
                merged_regions=[] if cfg.merge_overlapping_regions else None,
                anomalous_fraction=0.0,
                pipeline_config=cfg,
                provenance={
                    "timestamp_utc": datetime.now(UTC).isoformat(),
                    "feature_schema_version": FEATURE_SCHEMA_VERSION,
                    "numpy_version": np.__version__,
                    "sklearn_version": sklearn.__version__,
                },
            )

        # 2. Extract features across windows
        evaluated_windows: list[AnalysisWindow] = []
        feature_dicts: list[dict[str, float]] = []

        for win_meta, w_vals, w_mask in window_tuples:
            if win_meta.valid_sample_count == 0:
                continue

            try:
                f_dict = extract_window_features(window_data=w_vals, window_mask=w_mask)
                evaluated_windows.append(win_meta)
                feature_dicts.append(f_dict)
            except EmptyAnalysisRegionError:
                continue

        evaluated_count = len(evaluated_windows)
        if evaluated_count == 0:
            return DetectionResult(
                observation_id=observation_id,
                analysis_run_id=analysis_run_id,
                matrix_shape=[n_t, n_f],
                total_windows_evaluated=0,
                anomalous_regions=[],
                merged_regions=[] if cfg.merge_overlapping_regions else None,
                anomalous_fraction=0.0,
                pipeline_config=cfg,
                provenance={
                    "timestamp_utc": datetime.now(UTC).isoformat(),
                    "feature_schema_version": FEATURE_SCHEMA_VERSION,
                    "numpy_version": np.__version__,
                    "sklearn_version": sklearn.__version__,
                },
            )

        # 3. Statistical Baseline Scoring
        baseline_evidences: list[DetectionEvidence | None] = [None] * evaluated_count
        if cfg.baseline.enabled:
            baseline_detector = StatisticalBaselineDetector(config=cfg.baseline)
            if cfg.baseline.reference_mode == "external" and reference_features:
                baseline_detector.fit(reference_features)
                ev_list = baseline_detector.score_features(feature_dicts)
            else:
                ev_list = baseline_detector.fit_and_score(feature_dicts)
            baseline_evidences = [ev for ev in ev_list]

        # 4. Isolation Forest Scoring
        iforest_evidences: list[DetectionEvidence | None] = [None] * evaluated_count
        if cfg.isolation_forest.enabled:
            if trained_iforest is not None and trained_iforest.is_fitted:
                if_list = trained_iforest.score_features(feature_dicts)
                iforest_evidences = [ev for ev in if_list]
            elif reference_features and len(reference_features) >= 10:
                if_det = IsolationForestDetector(config=cfg.isolation_forest)
                if_det.fit(reference_features)
                if_list = if_det.score_features(feature_dicts)
                iforest_evidences = [ev for ev in if_list]
            elif evaluated_count >= 10:
                # In-situ fitting on current window ensemble
                if_det = IsolationForestDetector(config=cfg.isolation_forest)
                if_list = if_det.fit_and_score(feature_dicts)
                iforest_evidences = [ev for ev in if_list]
            else:
                # Insufficient windows (<10) to train Isolation Forest; skip scoring
                iforest_evidences = [None] * evaluated_count

        # 4b. Optional Real-Radio Autoencoder Scoring (Phase H)
        autoencoder_evidences: list[DetectionEvidence | None] = [None] * evaluated_count
        ae_model_info: dict[str, Any] = {}
        if cfg.real_radio_autoencoder.enabled:
            from pathlib import Path

            from app.detection.real_radio_anomaly import compute_anomaly_scores, load_checkpoint

            if cfg.real_radio_autoencoder.checkpoint_path:
                ckpt_p = Path(cfg.real_radio_autoencoder.checkpoint_path)
            else:
                ckpt_p = Path(
                    "backend/data/real_radio_training/model/real_radio_anomaly_checkpoint.pt"
                )
                if not ckpt_p.exists():
                    alt_p = (
                        Path(__file__).resolve().parent.parent.parent
                        / "data"
                        / "real_radio_training"
                        / "model"
                        / "real_radio_anomaly_checkpoint.pt"
                    )
                    if alt_p.exists():
                        ckpt_p = alt_p

            if ckpt_p.exists():
                try:
                    ae_model, _ae_cfg, ae_norm, ae_thresh = load_checkpoint(ckpt_p)
                    eff_thresh = (
                        cfg.real_radio_autoencoder.score_threshold
                        if cfg.real_radio_autoencoder.score_threshold is not None
                        else ae_thresh
                    )
                    ae_tiles: list[np.ndarray] = []
                    for win_meta, w_vals, _ in window_tuples:
                        if win_meta.valid_sample_count == 0:
                            continue
                        tile_32 = np.zeros((32, 32), dtype=np.float32)
                        h = min(32, w_vals.shape[0])
                        w = min(32, w_vals.shape[1])
                        tile_32[:h, :w] = w_vals[:h, :w]
                        ae_tiles.append(tile_32)

                    if ae_tiles:
                        tile_arr = np.array(ae_tiles, dtype=np.float32)
                        scores = compute_anomaly_scores(ae_model, tile_arr, ae_norm)
                        for idx, sc in enumerate(scores):
                            is_anom = bool(sc >= eff_thresh)
                            autoencoder_evidences[idx] = DetectionEvidence(
                                detector_name="real_radio_autoencoder",
                                anomaly_score=round(float(sc), 6),
                                threshold_used=round(float(eff_thresh), 6),
                                is_anomalous=is_anom,
                                score_semantics="higher_indicates_higher_reconstruction_error",
                                decision_rationale=(
                                    f"MSE {sc:.6f} "
                                    f"{'>=' if is_anom else '<'} threshold {eff_thresh:.6f}"
                                ),
                                parameters={"checkpoint": str(ckpt_p)},
                            )
                    ae_model_info = {"checkpoint": str(ckpt_p), "status": "active"}
                except Exception as exc:
                    ae_model_info = {"checkpoint": str(ckpt_p), "error": str(exc)}
            else:
                ae_model_info = {"checkpoint": str(ckpt_p), "error": "checkpoint_not_found"}

        # 5. Assemble Anomalous Regions
        anomalous_regions: list[AnomalousRegion] = []
        for idx in range(evaluated_count):
            win = evaluated_windows[idx]
            feats = feature_dicts[idx]
            b_ev = baseline_evidences[idx]
            if_ev = iforest_evidences[idx]
            ae_ev = autoencoder_evidences[idx]

            is_b_anom = b_ev.is_anomalous if b_ev is not None else False
            is_if_anom = if_ev.is_anomalous if if_ev is not None else False
            is_ae_anom = ae_ev.is_anomalous if ae_ev is not None else False

            if is_b_anom or is_if_anom or is_ae_anom:
                det_id = f"det_{analysis_run_id[:8]}_{win.window_id}"
                region = AnomalousRegion(
                    detection_id=det_id,
                    window=win,
                    features=feats,
                    baseline_evidence=b_ev,
                    isolation_forest_evidence=if_ev,
                    autoencoder_evidence=ae_ev,
                    is_anomalous=True,
                )
                anomalous_regions.append(region)

        # 6. Optional Region Merging
        merged_regions = None
        if cfg.merge_overlapping_regions:
            merged_regions = merge_anomalous_windows(
                anomalous_regions=anomalous_regions,
                time_axis=time_axis,
                frequency_axis=frequency_axis,
            )

        anom_frac = float(len(anomalous_regions) / evaluated_count) if evaluated_count > 0 else 0.0

        provenance: dict[str, Any] = {
            "timestamp_utc": datetime.now(UTC).isoformat(),
            "feature_schema_version": FEATURE_SCHEMA_VERSION,
            "feature_names": list(FEATURE_NAMES),
            "numpy_version": np.__version__,
            "sklearn_version": sklearn.__version__,
            "baseline_enabled": cfg.baseline.enabled,
            "isolation_forest_enabled": cfg.isolation_forest.enabled,
            "real_radio_autoencoder_enabled": cfg.real_radio_autoencoder.enabled,
            "real_radio_autoencoder_info": ae_model_info,
            "merged_regions_generated": merged_regions is not None,
        }

        return DetectionResult(
            observation_id=observation_id,
            analysis_run_id=analysis_run_id,
            matrix_shape=[n_t, n_f],
            total_windows_evaluated=evaluated_count,
            anomalous_regions=anomalous_regions,
            merged_regions=merged_regions,
            anomalous_fraction=round(anom_frac, 6),
            pipeline_config=cfg,
            provenance=provenance,
        )

    def analyze_canonical_slice(
        self,
        slice_obj: CanonicalSlice,
        quality_mask: QualityMask | None = None,
        config: DetectionPipelineConfig | None = None,
        trained_iforest: IsolationForestDetector | None = None,
        reference_features: list[dict[str, float]] | None = None,
    ) -> DetectionResult:
        """Analyze a Phase 2 CanonicalSlice object."""
        return self.analyze_array(
            values=slice_obj.values,
            observation_id=slice_obj.observation_id,
            quality_mask=quality_mask,
            time_axis=slice_obj.time_axis,
            frequency_axis=slice_obj.frequency_axis,
            config=config,
            trained_iforest=trained_iforest,
            reference_features=reference_features,
        )
