import { z } from 'zod'

/**
 * Telescope Target Celestial Coordinates (Equatorial coordinate system)
 */
export const CelestialCoordinatesSchema = z.object({
  ra: z.string().describe('Right Ascension (e.g., 19h 50m 47s)'),
  dec: z.string().describe('Declination (e.g., +08° 52′ 06″)'),
  constellation: z.string().optional(),
})
export type CelestialCoordinates = z.infer<typeof CelestialCoordinatesSchema>

/**
 * Radio Signal Domain Schema
 */
export const SignalStatusSchema = z.enum([
  'raw',
  'candidate',
  'verified',
  'rfi_noise',
  'anomaly',
])
export type SignalStatus = z.infer<typeof SignalStatusSchema>

export const SignalSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  frequencyMHz: z.number().positive(),
  bandwidthKHz: z.number().positive(),
  snrDb: z.number(),
  driftRateHzPerSec: z.number(),
  timestamp: z.string().datetime(),
  coordinates: CelestialCoordinatesSchema,
  telescope: z.string(),
  status: SignalStatusSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
})
export type Signal = z.infer<typeof SignalSchema>

/**
 * Astronomical Observation Session Schema
 */
export const ObservationSchema = z.object({
  id: z.string().min(1),
  targetName: z.string(),
  telescope: z.string(),
  startTime: z.string().datetime(),
  durationSeconds: z.number().positive(),
  frequencyRangeMHz: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
  }),
  polarization: z.enum(['linear', 'circular', 'dual']),
  dataQualityScore: z.number().min(0).max(100),
  channelCount: z.number().int().positive().optional(),
  fileSizeBytes: z.number().int().positive().optional(),
})
export type Observation = z.infer<typeof ObservationSchema>

/**
 * Deep Space Anomaly Detection Schema
 */
export const AnomalyClassificationSchema = z.enum([
  'technosignature_candidate',
  'fast_radio_burst',
  'pulsar',
  'rfi_terrestrial',
  'instrumental_glitch',
  'ambient_noise',
])
export type AnomalyClassification = z.infer<typeof AnomalyClassificationSchema>

export const AnomalyResultSchema = z.object({
  signalId: z.string(),
  anomalyScore: z.number().min(0).max(1),
  classification: AnomalyClassificationSchema,
  confidence: z.number().min(0).max(1),
  detectedFeatures: z.array(z.string()),
  driftConsistency: z.number().min(0).max(1),
  entropyScore: z.number().optional(),
})
export type AnomalyResult = z.infer<typeof AnomalyResultSchema>

/**
 * Candidate Signal Priority Item
 */
export const CandidateSignalSchema = SignalSchema.extend({
  anomalyScore: z.number().min(0).max(1),
  verificationStatus: z.enum(['unreviewed', 'flagged', 'confirmed', 'rejected']),
  priorityRank: z.enum(['low', 'medium', 'high', 'critical']),
  mlModelVersion: z.string(),
  flaggedBy: z.string().optional(),
})
export type CandidateSignal = z.infer<typeof CandidateSignalSchema>

/**
 * ML Model Inference & Architecture Prediction
 */
export const ModelPredictionSchema = z.object({
  modelId: z.string(),
  modelVersion: z.string(),
  inferenceLatencyMs: z.number().positive(),
  predictedClass: AnomalyClassificationSchema,
  probabilities: z.record(z.string(), z.number()),
  featureImportance: z.record(z.string(), z.number()).optional(),
  embeddingVector: z.array(z.number()).optional(),
})
export type ModelPrediction = z.infer<typeof ModelPredictionSchema>

/**
 * Detailed Signal Spectral Analysis Data Point
 */
export const SpectrumDataPointSchema = z.object({
  frequencyMHz: z.number(),
  amplitudeDb: z.number(),
  phaseRad: z.number().optional(),
})
export type SpectrumDataPoint = z.infer<typeof SpectrumDataPointSchema>

/**
 * Full Signal Deep Analysis Result
 */
export const AnalysisResultSchema = z.object({
  id: z.string(),
  signalId: z.string(),
  timestamp: z.string().datetime(),
  prediction: ModelPredictionSchema,
  anomaly: AnomalyResultSchema,
  spectrumSeries: z.array(SpectrumDataPointSchema),
  driftHistory: z.array(
    z.object({
      timeOffsetSec: z.number(),
      frequencyOffsetHz: z.number(),
      snr: z.number(),
    })
  ),
  scientificNotes: z.string().optional(),
})
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>
