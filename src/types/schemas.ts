import { z } from 'zod';

/**
 * ============================================================================
 * 1. API ERROR PAYLOAD CONTRACT
 * ============================================================================
 */
export const ApiErrorPayloadSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  status: z.number().int().optional(),
  timestamp: z.string().optional(),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
});
export type ApiErrorPayload = z.infer<typeof ApiErrorPayloadSchema>;

/**
 * ============================================================================
 * 2. HEALTH CHECK CONTRACT
 * ============================================================================
 */
export const HealthStatusSchema = z.object({
  status: z.string(),
  service: z.string(),
  version: z.string(),
  environment: z.string(),
  timestamp: z.string(),
});
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

/**
 * ============================================================================
 * 3. OBSERVATION INGESTION & METADATA SCHEMAS
 * ============================================================================
 */
export const ScientificMetadataSchema = z.object({
  channel_count: z.number().int().nullable().optional(),
  frequency_reference_mhz: z.number().nullable().optional(),
  channel_spacing_mhz: z.number().nullable().optional(),
  frequency_unit: z.string().default('MHz'),
  frequency_min_mhz: z.number().nullable().optional(),
  frequency_max_mhz: z.number().nullable().optional(),
  bandwidth_mhz: z.number().nullable().optional(),
  time_sample_count: z.number().int().nullable().optional(),
  time_step_seconds: z.number().nullable().optional(),
  time_unit: z.string().default('s'),
  start_mjd: z.number().nullable().optional(),
  start_time_utc: z.string().nullable().optional(),
  telescope_name: z.string().nullable().optional(),
  source_name: z.string().nullable().optional(),
  ra_deg: z.number().nullable().optional(),
  dec_deg: z.number().nullable().optional(),
  ra_str: z.string().nullable().optional(),
  dec_str: z.string().nullable().optional(),
  data_dimensions: z.array(z.any()).nullable().optional(),
  bits_per_sample: z.number().int().nullable().optional(),
  polarization_count: z.number().int().nullable().optional(),
  raw_header: z.record(z.string(), z.unknown()).default({}),
});
export type ScientificMetadata = z.infer<typeof ScientificMetadataSchema>;

export const ProvenanceSchema = z.object({
  parser_name: z.string(),
  parser_version: z.string(),
  parsed_at: z.string(),
  source_format: z.string(),
  layout: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const ObservationRecordResponseSchema = z.object({
  id: z.string(),
  original_filename: z.string(),
  format: z.string(),
  file_size_bytes: z.number().int(),
  sha256: z.string(),
  ingested_at: z.string(),
  status: z.string().default('ingested'),
  metadata: ScientificMetadataSchema,
  provenance: ProvenanceSchema,
  warnings: z.array(z.string()).default([]),
});
export type ObservationRecordResponse = z.infer<typeof ObservationRecordResponseSchema>;

export const ObservationListResponseSchema = z.object({
  items: z.array(ObservationRecordResponseSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});
export type ObservationListResponse = z.infer<typeof ObservationListResponseSchema>;

/**
 * ============================================================================
 * 3b. PUBLIC DATASETS CATALOGUE & IMPORT SCHEMAS (Breakthrough Listen Open Data)
 * ============================================================================
 */
export const PublicDatasetStatusResponseSchema = z.object({
  configured: z.boolean(),
  archive_url: z.string(),
  available: z.boolean(),
  max_import_bytes: z.number().int(),
  supported_file_types: z.array(z.string()).default(['filterbank', '.fil', 'FITS', '.fits']),
  message: z.string().nullable().optional(),
});
export type PublicDatasetStatusResponse = z.infer<typeof PublicDatasetStatusResponseSchema>;

export const PublicDatasetItemSchema = z.object({
  id: z.string(),
  target: z.string(),
  telescope: z.string(),
  utc: z.string().nullable().optional(),
  mjd: z.number().nullable().optional(),
  ra_deg: z.number().nullable().optional(),
  dec_deg: z.number().nullable().optional(),
  center_freq_mhz: z.number().nullable().optional(),
  file_type: z.string(),
  size_bytes: z.number().int(),
  quality: z.string().nullable().optional(),
  md5sum: z.string().nullable().optional(),
  url: z.string(),
  is_compatible: z.boolean(),
  compatibility_reason: z.string().nullable().optional(),
  is_within_size_limit: z.boolean(),
  size_reason: z.string().nullable().optional(),
});
export type PublicDatasetItem = z.infer<typeof PublicDatasetItemSchema>;

export const PublicDatasetQueryResponseSchema = z.object({
  items: z.array(PublicDatasetItemSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
  has_more: z.boolean(),
  provider_status: z.string(),
  cached: z.boolean().default(false),
  query_target: z.string().nullable().optional(),
});
export type PublicDatasetQueryResponse = z.infer<typeof PublicDatasetQueryResponseSchema>;

export const PublicDatasetImportRequestSchema = z.object({
  url: z.string(),
  target: z.string().nullable().optional(),
  telescope: z.string().nullable().optional(),
  expected_md5sum: z.string().nullable().optional(),
  expected_size_bytes: z.number().int().nullable().optional(),
});
export type PublicDatasetImportRequest = z.infer<typeof PublicDatasetImportRequestSchema>;

export const PublicDatasetImportResponseSchema = z.object({
  observation: ObservationRecordResponseSchema,
  import_source_url: z.string(),
  bytes_downloaded: z.number().int(),
  is_duplicate: z.boolean(),
  duration_seconds: z.number(),
  message: z.string(),
});
export type PublicDatasetImportResponse = z.infer<typeof PublicDatasetImportResponseSchema>;

/**
 * ============================================================================
 * 4. CANONICAL SPECTRAL SLICE SCHEMAS
 * ============================================================================
 */
export const SliceIndexRangeSchema = z.object({
  time_start: z.number().int().nonnegative(),
  time_stop: z.number().int().nonnegative(),
  frequency_start: z.number().int().nonnegative(),
  frequency_stop: z.number().int().nonnegative(),
});
export type SliceIndexRange = z.infer<typeof SliceIndexRangeSchema>;

export const DataQualityInfoSchema = z.object({
  total_samples: z.number().int().nonnegative(),
  non_finite_sample_count: z.number().int().nonnegative(),
  has_non_finite_samples: z.boolean(),
  null_representation: z.string(),
});
export type DataQualityInfo = z.infer<typeof DataQualityInfoSchema>;

export const SliceProvenanceSchema = z.object({
  source_channel_order: z.string(),
  frequency_axis_reversed: z.boolean(),
  reader_backend: z.string(),
  source_sha256: z.string(),
});
export type SliceProvenance = z.infer<typeof SliceProvenanceSchema>;

export const SpectralSliceResponseSchema = z.object({
  observation_id: z.string(),
  source_format: z.string(),
  matrix_shape: z.array(z.number().int()),
  canonical_axis_convention: z.string(),
  requested_range: SliceIndexRangeSchema,
  actual_range: SliceIndexRangeSchema,
  values: z.array(z.array(z.number().nullable())),
  frequency_coordinates_hz: z.array(z.number()).nullable().optional(),
  time_coordinates_seconds: z.array(z.number()).nullable().optional(),
  start_time_utc: z.string().nullable().optional(),
  start_mjd: z.number().nullable().optional(),
  frequency_unit: z.string(),
  time_unit: z.string(),
  sample_value_semantics: z.string(),
  sample_value_unit: z.string().nullable().optional(),
  data_quality: DataQualityInfoSchema,
  provenance: SliceProvenanceSchema,
  warnings: z.array(z.string()),
});
export type SpectralSliceResponse = z.infer<typeof SpectralSliceResponseSchema>;

/**
 * ============================================================================
 * 5. SIGNAL PROCESSING & RFI QUALITY ASSESSMENT SCHEMAS
 * ============================================================================
 */
export const GlobalStatisticsSchema = z.object({
  sample_count: z.number().int(),
  finite_sample_count: z.number().int(),
  non_finite_sample_count: z.number().int(),
  mean: z.number().nullable().optional(),
  std: z.number().nullable().optional(),
  median: z.number(),
  mad: z.number(),
  robust_sigma: z.number(),
  q25: z.number().nullable().optional(),
  q75: z.number().nullable().optional(),
  min: z.number().nullable().optional(),
  max: z.number().nullable().optional(),
});
export type GlobalStatistics = z.infer<typeof GlobalStatisticsSchema>;

export const IndicatorEvidenceSchema = z.object({
  indicator_name: z.string(),
  threshold_used: z.number(),
  flagged_indices_count: z.number().int(),
  flagged_fraction: z.number(),
  summary: z.string(),
  parameters: z.record(z.string(), z.unknown()).default({}),
});
export type IndicatorEvidence = z.infer<typeof IndicatorEvidenceSchema>;

export const RfiAssessmentReportSchema = z.object({
  channel_indicators: z.array(IndicatorEvidenceSchema).default([]),
  time_indicators: z.array(IndicatorEvidenceSchema).default([]),
  local_indicators: z.array(IndicatorEvidenceSchema).default([]),
  summary_disclaimer: z.string(),
  overall_rfi_impact: z.enum(['negligible', 'mild', 'moderate', 'severe']).default('negligible'),
});
export type RfiAssessmentReport = z.infer<typeof RfiAssessmentReportSchema>;

export const TransformationRecordSchema = z.object({
  transformation_type: z.string(),
  applied_at_utc: z.string(),
  parameters: z.record(z.string(), z.unknown()).default({}),
  description: z.string(),
});
export type TransformationRecord = z.infer<typeof TransformationRecordSchema>;

export const ProcessedObservationResponseSchema = z.object({
  observation_id: z.string(),
  matrix_shape: z.array(z.number().int()),
  statistics: GlobalStatisticsSchema,
  rfi_report: RfiAssessmentReportSchema,
  primary_mask_flagged_count: z.number().int(),
  primary_mask_flagged_fraction: z.number(),
  reason_flag_counts: z.record(z.string(), z.number().int()).default({}),
  sample_value_semantics: z.string().default('uncalibrated_detector_power'),
  sample_value_unit: z.string().nullable().optional(),
  has_transformed_values: z.boolean().default(false),
  transformed_values: z.array(z.array(z.number().nullable())).nullable().optional(),
  transformation_history: z.array(TransformationRecordSchema).default([]),
  pipeline_version: z.string().default('1.0.0'),
  warnings: z.array(z.string()).default([]),
});
export type ProcessedObservationResponse = z.infer<typeof ProcessedObservationResponseSchema>;

/**
 * ============================================================================
 * 6. SCIENTIFIC ANOMALY DETECTION SCHEMAS
 * ============================================================================
 */
export const AnalysisWindowSchema = z.object({
  window_id: z.string(),
  time_start: z.number().int(),
  time_stop: z.number().int(),
  freq_start: z.number().int(),
  freq_stop: z.number().int(),
  time_center_s: z.number().nullable().optional(),
  time_span_s: z.number().nullable().optional(),
  freq_center_hz: z.number().nullable().optional(),
  bandwidth_hz: z.number().nullable().optional(),
  valid_sample_count: z.number().int(),
  flagged_sample_fraction: z.number(),
  quality_warning: z.string().nullable().optional(),
});
export type AnalysisWindow = z.infer<typeof AnalysisWindowSchema>;

export const DetectionEvidenceSchema = z.object({
  detector_name: z.string(),
  anomaly_score: z.number(),
  threshold_used: z.number(),
  is_anomalous: z.boolean(),
  score_semantics: z.string().default('higher_indicates_more_anomalous'),
  decision_rationale: z.string(),
  parameters: z.record(z.string(), z.unknown()).default({}),
});
export type DetectionEvidence = z.infer<typeof DetectionEvidenceSchema>;

export const AnomalousRegionSchema = z.object({
  detection_id: z.string(),
  window: AnalysisWindowSchema,
  features: z.record(z.string(), z.number()),
  baseline_evidence: DetectionEvidenceSchema.nullable().optional(),
  isolation_forest_evidence: DetectionEvidenceSchema.nullable().optional(),
  is_anomalous: z.boolean().default(true),
});
export type AnomalousRegion = z.infer<typeof AnomalousRegionSchema>;

export const MergedRegionSchema = z.object({
  merged_id: z.string(),
  time_start: z.number().int(),
  time_stop: z.number().int(),
  freq_start: z.number().int(),
  freq_stop: z.number().int(),
  time_center_s: z.number().nullable().optional(),
  freq_center_hz: z.number().nullable().optional(),
  bandwidth_hz: z.number().nullable().optional(),
  contributing_window_ids: z.array(z.string()).default([]),
  max_anomaly_score: z.number(),
  mean_anomaly_score: z.number(),
});
export type MergedRegion = z.infer<typeof MergedRegionSchema>;

export const DetectionResponseSchema = z.object({
  observation_id: z.string(),
  analysis_run_id: z.string(),
  matrix_shape: z.array(z.number().int()),
  total_windows_evaluated: z.number().int(),
  anomalous_regions: z.array(AnomalousRegionSchema).default([]),
  merged_regions: z.array(MergedRegionSchema).nullable().optional(),
  anomalous_fraction: z.number(),
  pipeline_config: z.record(z.string(), z.unknown()),
  provenance: z.record(z.string(), z.unknown()).default({}),
  scientific_disclaimer: z.string(),
});
export type DetectionResponse = z.infer<typeof DetectionResponseSchema>;

/**
 * ============================================================================
 * 7. DOPPLER DRIFT & TEMPORAL ANALYSIS SCHEMAS
 * ============================================================================
 */
export const TrajectoryPointSchema = z.object({
  time_index: z.number().int(),
  freq_index: z.number().int(),
  time_s: z.number().nullable().optional(),
  freq_hz: z.number().nullable().optional(),
  amplitude: z.number(),
  snr: z.number(),
  is_valid: z.boolean().default(true),
});
export type TrajectoryPoint = z.infer<typeof TrajectoryPointSchema>;

export const FrequencyTrajectorySchema = z.object({
  points: z.array(TrajectoryPointSchema).default([]),
  total_points: z.number().int(),
  valid_points: z.number().int(),
  extraction_method: z.string(),
  extraction_notes: z.string().default(''),
  time_span_s: z.number().nullable().optional(),
  frequency_span_hz: z.number().nullable().optional(),
});
export type FrequencyTrajectory = z.infer<typeof FrequencyTrajectorySchema>;

export const DriftFitResultSchema = z.object({
  drift_rate_hz_per_s: z.number().nullable().optional(),
  drift_rate_index_slope: z.number(),
  reference_frequency_hz: z.number().nullable().optional(),
  reference_time_s: z.number().nullable().optional(),
  uncertainty_hz_per_s: z.number().nullable().optional(),
  r_squared: z.number().nullable().optional(),
  residual_std_hz: z.number().nullable().optional(),
  is_physical: z.boolean().default(true),
  sample_count: z.number().int(),
  fitted_trajectory_points: z.array(z.tuple([z.number(), z.number()])).default([]),
  quality_warning: z.string().nullable().optional(),
  drift_convention: z.string().default('df_over_dt_canonical_ascending'),
});
export type DriftFitResult = z.infer<typeof DriftFitResultSchema>;

export const DriftHypothesisSchema = z.object({
  drift_rate_hz_per_s: z.number(),
  score: z.number(),
  integrated_snr: z.number(),
  peak_channel_index: z.number().int(),
});
export type DriftHypothesis = z.infer<typeof DriftHypothesisSchema>;

export const DriftSearchResultSchema = z.object({
  hypotheses_evaluated: z.number().int(),
  best_drift_rate_hz_per_s: z.number(),
  best_score: z.number(),
  is_on_boundary: z.boolean(),
  grid_step_hz_per_s: z.number(),
  search_metric: z.string(),
  top_hypotheses: z.array(DriftHypothesisSchema).default([]),
  provenance: z.record(z.string(), z.unknown()).default({}),
});
export type DriftSearchResult = z.infer<typeof DriftSearchResultSchema>;

export const DeDriftResultSchema = z.object({
  applied_drift_rate_hz_per_s: z.number(),
  reference_time_s: z.number(),
  matrix_shape: z.array(z.number().int()),
  clipped_energy_fraction: z.number(),
  de_drifted_values: z.array(z.array(z.number())).nullable().optional(),
  provenance: z.record(z.string(), z.unknown()).default({}),
});
export type DeDriftResult = z.infer<typeof DeDriftResultSchema>;

export const TemporalCharacterizationSchema = z.object({
  first_active_time_s: z.number().nullable().optional(),
  last_active_time_s: z.number().nullable().optional(),
  observed_duration_s: z.number().nullable().optional(),
  valid_time_fraction: z.number(),
  max_consecutive_gap_s: z.number().nullable().optional(),
  temporal_persistence: z.number(),
  temporal_variability: z.number(),
  temporal_profile_snr: z.number(),
  temporal_notes: z.string().default(''),
});
export type TemporalCharacterization = z.infer<typeof TemporalCharacterizationSchema>;

export const RecurrenceComparisonRecordSchema = z.object({
  observation_a_id: z.string(),
  observation_b_id: z.string(),
  is_compatible: z.boolean(),
  frequency_delta_hz: z.number().nullable().optional(),
  time_delta_days: z.number().nullable().optional(),
  compatibility_score: z.number(),
  criteria_evaluated: z.record(z.string(), z.unknown()).default({}),
  notes: z.string().default(''),
  warnings: z.array(z.string()).default([]),
});
export type RecurrenceComparisonRecord = z.infer<typeof RecurrenceComparisonRecordSchema>;

export const AnalysisResponseSchema = z.object({
  observation_id: z.string(),
  analysis_run_id: z.string(),
  target_region: z.record(z.string(), z.unknown()).nullable().optional(),
  trajectory: FrequencyTrajectorySchema,
  drift_estimate: DriftFitResultSchema,
  drift_search: DriftSearchResultSchema.nullable().optional(),
  dedrift: DeDriftResultSchema.nullable().optional(),
  temporal: TemporalCharacterizationSchema,
  recurrence: z.array(RecurrenceComparisonRecordSchema).nullable().optional(),
  pipeline_config: z.record(z.string(), z.unknown()),
  provenance: z.record(z.string(), z.unknown()).default({}),
  scientific_disclaimer: z.string(),
});
export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;

/**
 * ============================================================================
 * 8. CANDIDATE MANAGEMENT & EVIDENCE DOSSIER SCHEMAS
 * ============================================================================
 */
export const CandidateStatusSchema = z.enum([
  'unreviewed',
  'under_review',
  'needs_more_data',
  'likely_interference',
  'interesting',
  'dismissed',
]);
export type CandidateStatus = z.infer<typeof CandidateStatusSchema>;

export const PriorityBandSchema = z.enum(['low', 'moderate', 'high', 'exceptional']);
export type PriorityBand = z.infer<typeof PriorityBandSchema>;

export const EvidenceTypeSchema = z.enum([
  'detection',
  'quality',
  'drift',
  'temporal',
  'recurrence',
]);
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;

export const EvidenceItemSchema = z.object({
  evidence_id: z.string(),
  evidence_type: EvidenceTypeSchema,
  source_observation_id: z.string(),
  producing_module: z.string(),
  run_id: z.string().nullable().optional(),
  method_and_version: z.string(),
  scores_or_parameters: z.record(z.string(), z.unknown()).default({}),
  time_frequency_bounds: z.record(z.string(), z.unknown()).nullable().optional(),
  is_supportive: z.boolean().default(true),
  quality_or_limitations: z.string().nullable().optional(),
  created_at_utc: z.string(),
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export const CandidateAssessmentSchema = z.object({
  assessment_id: z.string(),
  candidate_id: z.string(),
  version: z.number().int(),
  created_at_utc: z.string(),
  policy_name: z.string(),
  policy_version: z.string(),
  overall_score: z.number().min(0.0).max(100.0),
  priority_band: PriorityBandSchema,
  component_contributions: z.record(z.string(), z.number()),
  contributing_evidence_ids: z.array(z.string()).default([]),
  missing_evidence: z.array(z.string()).default([]),
  detector_disagreement: z.boolean().default(false),
  explanation: z.string(),
  warnings: z.array(z.string()).default([]),
});
export type CandidateAssessment = z.infer<typeof CandidateAssessmentSchema>;

export const ReviewRecordSchema = z.object({
  review_id: z.string(),
  candidate_id: z.string(),
  created_at_utc: z.string(),
  action: z.string(),
  previous_status: CandidateStatusSchema,
  new_status: CandidateStatusSchema,
  reviewer_id: z.string(),
  notes: z.string().default(''),
  evidence_references: z.array(z.string()).default([]),
});
export type ReviewRecord = z.infer<typeof ReviewRecordSchema>;

export const CandidateSchema = z.object({
  candidate_id: z.string(),
  created_at_utc: z.string(),
  updated_at_utc: z.string(),
  status: CandidateStatusSchema.default('unreviewed'),
  source_observation_ids: z.array(z.string()),
  associated_detection_ids: z.array(z.string()).default([]),
  processing_run_ids: z.array(z.string()).default([]),
  analysis_run_ids: z.array(z.string()).default([]),
  target_region: z.object({
    time_start: z.number().int(),
    time_stop: z.number().int(),
    freq_start: z.number().int(),
    freq_stop: z.number().int(),
  }),
  physical_coordinates: z.record(z.string(), z.unknown()).default({}),
  current_assessment: CandidateAssessmentSchema.nullable().optional(),
  evidence_items: z.array(EvidenceItemSchema).default([]),
  review_history: z.array(ReviewRecordSchema).default([]),
  schema_version: z.string().default('1.0.0'),
  is_synthetic: z.boolean().default(false),
  provenance: z.record(z.string(), z.unknown()).default({}),
  warnings: z.array(z.string()).default([]),
  scientific_disclaimer: z.string(),
});
export type Candidate = z.infer<typeof CandidateSchema>;

export const CandidateResponseSchema = CandidateSchema;
export type CandidateResponse = z.infer<typeof CandidateResponseSchema>;

export const CandidateListResponseSchema = z.object({
  items: z.array(CandidateSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});
export type CandidateListResponse = z.infer<typeof CandidateListResponseSchema>;

export const CandidateDossierSchema = z.object({
  dossier_id: z.string(),
  generated_at_utc: z.string(),
  candidate_id: z.string(),
  assessment_version: z.number().int(),
  candidate: CandidateSchema,
  assessment: CandidateAssessmentSchema,
  executive_summary: z.string(),
  reproducibility_appendix: z.record(z.string(), z.unknown()),
  scientific_disclaimer: z.string(),
});
export type CandidateDossier = z.infer<typeof CandidateDossierSchema>;

export const CreateCandidateRequestSchema = z.object({
  observation_id: z.string(),
  target_region: z.object({
    time_start: z.number().int(),
    time_stop: z.number().int(),
    freq_start: z.number().int(),
    freq_stop: z.number().int(),
  }),
  detection_id: z.string().nullable().optional(),
  physical_coordinates: z.record(z.string(), z.unknown()).nullable().optional(),
  scoring_config: z.record(z.string(), z.unknown()).nullable().optional(),
  is_synthetic: z.boolean().default(false).optional(),
});
export type CreateCandidateRequest = z.infer<typeof CreateCandidateRequestSchema>;

export const ReviewCandidateRequestSchema = z.object({
  new_status: CandidateStatusSchema,
  reviewer_id: z.string().default('analyst').optional(),
  notes: z.string().default('').optional(),
  action: z.string().default('status_transition').optional(),
  evidence_references: z.array(z.string()).nullable().optional(),
});
export type ReviewCandidateRequest = z.infer<typeof ReviewCandidateRequestSchema>;

export const ReviewCandidateResponseSchema = z.object({
  candidate: CandidateSchema,
  review: ReviewRecordSchema,
});
export type ReviewCandidateResponse = z.infer<typeof ReviewCandidateResponseSchema>;

/**
 * ============================================================================
 * 9. LEGACY DOMAIN COMPATIBILITY (for UI widgets / offline demo mapping)
 * ============================================================================
 */
export const CelestialCoordinatesSchema = z.object({
  ra: z.string(),
  dec: z.string(),
  constellation: z.string().optional(),
});
export type CelestialCoordinates = z.infer<typeof CelestialCoordinatesSchema>;

export const SignalStatusSchema = z.enum(['raw', 'candidate', 'verified', 'rfi_noise', 'anomaly']);
export type SignalStatus = z.infer<typeof SignalStatusSchema>;

export const SignalSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  frequencyMHz: z.number().positive(),
  bandwidthKHz: z.number().positive(),
  snrDb: z.number(),
  driftRateHzPerSec: z.number(),
  timestamp: z.string(),
  coordinates: CelestialCoordinatesSchema,
  telescope: z.string(),
  status: SignalStatusSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type Signal = z.infer<typeof SignalSchema>;

export const SpectrumDataPointSchema = z.object({
  frequencyMHz: z.number(),
  amplitudeDb: z.number(),
  phaseRad: z.number().optional(),
});
export type SpectrumDataPoint = z.infer<typeof SpectrumDataPointSchema>;
