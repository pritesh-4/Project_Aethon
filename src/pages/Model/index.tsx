import { useState } from 'react';
import { PageTransition } from '@/components/ui/motion.tsx';
import { ModelHeader } from './components/ModelHeader.tsx';
import { FalsePositiveReality } from './components/FalsePositiveReality.tsx';
import { ModelCta } from './components/ModelCta.tsx';
import {
  Layers,
  Cpu,
  Binary,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronRight,
  Database,
  ShieldCheck,
  FileCode2,
} from 'lucide-react';

interface ClassSpec {
  index: number;
  name: string;
  label: string;
  description: string;
  morphology: string;
  testSupport: number;
  testCorrect: number;
  precision: number;
  recall: number;
  f1: number;
}

const MORPHOLOGY_CLASSES: ClassSpec[] = [
  {
    index: 0,
    name: 'noise',
    label: 'Noise',
    description: 'Astrophysical thermal background noise floor with Gaussian statistics.',
    morphology: 'Zero continuous carrier; stochastic Rayleigh-distributed power spectral density.',
    testSupport: 15,
    testCorrect: 15,
    precision: 1.0,
    recall: 1.0,
    f1: 1.0,
  },
  {
    index: 1,
    name: 'stationary_tone',
    label: 'Stationary tone',
    description: 'Continuous unmodulated narrowband emission without frequency drift.',
    morphology: 'Persistent spectral peak constrained to a single frequency bin (df/dt ≈ 0 Hz/s).',
    testSupport: 15,
    testCorrect: 15,
    precision: 1.0,
    recall: 1.0,
    f1: 1.0,
  },
  {
    index: 2,
    name: 'drifting_tone',
    label: 'Drifting tone',
    description: 'Narrowband tone drifting linearly in frequency across observation time.',
    morphology: 'Linear spectrotemporal slope modeling topocentric planetary orbital acceleration.',
    testSupport: 15,
    testCorrect: 15,
    precision: 1.0,
    recall: 1.0,
    f1: 1.0,
  },
  {
    index: 3,
    name: 'burst',
    label: 'Burst',
    description: 'Transient pulse localized tightly in both time and frequency axes.',
    morphology: 'Brief Gaussian envelope transient modeling impulsive non-repeating events.',
    testSupport: 15,
    testCorrect: 15,
    precision: 1.0,
    recall: 1.0,
    f1: 1.0,
  },
  {
    index: 4,
    name: 'broadband',
    label: 'Broadband emission',
    description: 'Wide-band emission spanning multiple adjacent spectral channels.',
    morphology: 'Broad frequency dispersion profile modeling continuum emissions.',
    testSupport: 15,
    testCorrect: 15,
    precision: 1.0,
    recall: 1.0,
    f1: 1.0,
  },
];

// 5x5 confusion matrix from the verified training report (15 test samples per class)
const CONFUSION_MATRIX: number[][] = [
  [15, 0, 0, 0, 0],
  [0, 15, 0, 0, 0],
  [0, 0, 15, 0, 0],
  [0, 0, 0, 15, 0],
  [0, 0, 0, 0, 15],
];

export default function ModelPage() {
  const [showArchitectureDetails, setShowArchitectureDetails] = useState(false);
  const [showConfusionMatrix, setShowConfusionMatrix] = useState(false);

  return (
    <PageTransition className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-12 select-none font-sans">
      {/* 1. Header with Philosophy, Live Telemetry, & Core Intelligence Question */}
      <section aria-label="Core Philosophy and Intelligence Question">
        <ModelHeader />
      </section>

      {/* 2. Operational Pipeline Distinction: Production vs. Experimental CNN */}
      <section
        aria-label="Pipeline Architecture and Operational Scope"
        className="border-t border-[#D6D2C9] pt-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D6D2C9] pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#17202A]">
                Operational Architecture & Model Scope
              </h2>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D]">
                Pipeline Roles
              </span>
            </div>
            <p className="text-xs text-[#56616A] mt-0.5">
              Clear scientific distinction between production anomaly discovery and offline
              experimental morphology classification
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#376A9B] font-semibold">Dual-Track System</span>
          </div>
        </div>

        {/* Dual-Track Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#D6D2C9] border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] overflow-hidden shadow-xs">
          {/* Track 1: Production Detection Pipeline */}
          <div className="p-4 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[#3D7D54]" />
                  <span className="text-xs font-semibold text-[#17202A]">
                    Production Detection Pipeline
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#3D7D54]/10 border border-[#3D7D54]/30 text-[#2B573A] text-[10px] font-mono uppercase tracking-wider font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  Live In-Service
                </span>
              </div>

              <p className="text-xs text-[#56616A] leading-relaxed">
                The primary automated discovery engine deployed within the live FastAPI backend.
                Performs unsupervised statistical anomaly screening across incoming radio
                observations without relying on predefined class templates.
              </p>

              <div className="space-y-1.5 pt-1 text-xs">
                <div className="border-l-2 border-[#376A9B] pl-2.5">
                  <span className="text-[#17202A] font-semibold font-mono text-[11px]">
                    Statistical Baseline:
                  </span>{' '}
                  <span className="text-[#56616A]">
                    Robust Median Absolute Deviation (MAD) + 3σ spectral thresholding
                  </span>
                </div>
                <div className="border-l-2 border-[#376A9B] pl-2.5">
                  <span className="text-[#17202A] font-semibold font-mono text-[11px]">
                    Isolation Forest:
                  </span>{' '}
                  <span className="text-[#56616A]">
                    100 ensemble estimators evaluated over 5-D spectrotemporal features
                  </span>
                </div>
                <div className="border-l-2 border-[#3D7D54] pl-2.5">
                  <span className="text-[#17202A] font-semibold font-mono text-[11px]">
                    Kinematic Estimator:
                  </span>{' '}
                  <span className="text-[#56616A]">
                    Ordinary Least Squares (OLS) drift regression with analytical variance
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-[#D6D2C9] pt-2 text-[11px] font-mono text-[#56616A]">
              <span className="text-[#17202A] font-semibold">Live API Route:</span> Invoked during
              observation analysis and candidate triage
            </div>
          </div>

          {/* Track 2: Experimental Spectrogram CNN */}
          <div className="p-4 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#376A9B]" />
                  <span className="text-xs font-semibold text-[#17202A]">
                    Experimental Spectrogram CNN
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#376A9B]/10 border border-[#376A9B]/30 text-[#2B5278] text-[10px] font-mono uppercase tracking-wider font-semibold">
                  <ShieldCheck className="h-3 w-3" />
                  Offline Prototype
                </span>
              </div>

              <p className="text-xs text-[#56616A] leading-relaxed">
                A lightweight 2D convolutional neural network developed and verified offline for
                morphological categorization of pre-sliced time-frequency spectrogram tiles.
                Designed for controlled morphology research.
              </p>

              <div className="space-y-1.5 pt-1 text-xs">
                <div className="border-l-2 border-[#376A9B] pl-2.5">
                  <span className="text-[#17202A] font-semibold font-mono text-[11px]">
                    Architecture:
                  </span>{' '}
                  <span className="text-[#56616A]">
                    3-stage Conv2D + BatchNorm + AdaptiveAvgPool + MLP Head (47,285 params)
                  </span>
                </div>
                <div className="border-l-2 border-[#376A9B] pl-2.5">
                  <span className="text-[#17202A] font-semibold font-mono text-[11px]">
                    Input Specification:
                  </span>{' '}
                  <span className="text-[#56616A]">
                    32 × 32 normalized time-frequency spectrogram patches
                  </span>
                </div>
                <div className="border-l-2 border-[#C19348] pl-2.5">
                  <span className="text-[#17202A] font-semibold font-mono text-[11px]">
                    Inference Status:
                  </span>{' '}
                  <span className="text-[#8C621E] font-medium">
                    Not connected to live FastAPI inference (strictly offline)
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-[#D6D2C9] pt-2 text-[11px] font-mono text-[#56616A]">
              <span className="text-[#17202A] font-semibold">Deployment Boundary:</span> Research
              model; uploading an observation does not invoke the CNN
            </div>
          </div>
        </div>

        {/* Conceptual Supersession Notice Banner */}
        <div className="border-l-2 border-[#376A9B] pl-3 py-2 text-xs text-[#56616A] leading-relaxed flex items-start gap-2.5 bg-[#FAF8F5] p-3 rounded-r-[2px] border-y border-r border-[#D6D2C9]">
          <Info className="h-4 w-4 text-[#376A9B] shrink-0 mt-0.5" />
          <span>
            <strong className="text-[#17202A] font-semibold font-mono text-[11px] uppercase tracking-wider block mb-0.5">
              Architectural Clarification & Supersession Note
            </strong>
            Earlier conceptual documentation referenced an unverified 768-dimensional unsupervised
            latent embedding space and self-attention patch tokenizer. That theoretical concept is
            superseded by the concrete, empirically trained 47,285-parameter 2D CNN detailed below.
            The live AETHON service relies strictly on the statistical baseline and Isolation Forest
            for candidate discovery.
          </span>
        </div>
      </section>

      {/* 3. The Implemented Model Architecture */}
      <section
        aria-label="Implemented CNN Architecture"
        className="border-t border-[#D6D2C9] pt-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D6D2C9] pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#17202A]">
                Implemented Model Architecture: SpectrogramCNN
              </h2>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D]">
                PyTorch 2.14 / CPU
              </span>
            </div>
            <p className="text-xs text-[#56616A] mt-0.5">
              Lightweight 2D convolutional neural network for synthetic spectrogram tile morphology
              classification
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded-[2px] bg-[#EAE7E0] text-[#17202A] border border-[#D6D2C9] font-semibold">
              47,285 Trainable Parameters
            </span>
          </div>
        </div>

        {/* High-Level Architecture Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D6D2C9] border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] overflow-hidden text-center">
          <div className="p-3.5 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block">
              Input Tile
            </span>
            <span className="text-base sm:text-lg font-mono font-semibold text-[#17202A] block">
              32 × 32
            </span>
            <span className="text-[11px] text-[#56616A] block font-mono">Time × Frequency</span>
          </div>
          <div className="p-3.5 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block">
              Parameters
            </span>
            <span className="text-base sm:text-lg font-mono font-semibold text-[#376A9B] block">
              47,285
            </span>
            <span className="text-[11px] text-[#56616A] block font-mono">100% Trainable</span>
          </div>
          <div className="p-3.5 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block">
              Conv Stages
            </span>
            <span className="text-base sm:text-lg font-mono font-semibold text-[#17202A] block">
              3 Stages
            </span>
            <span className="text-[11px] text-[#56616A] block font-mono">BatchNorm + Pool</span>
          </div>
          <div className="p-3.5 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block">
              Target Classes
            </span>
            <span className="text-base sm:text-lg font-mono font-semibold text-[#17202A] block">
              5 Classes
            </span>
            <span className="text-[11px] text-[#56616A] block font-mono">Morphology Types</span>
          </div>
        </div>

        {/* Architecture Technical Breakdown Accordion */}
        <div className="border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowArchitectureDetails(!showArchitectureDetails)}
            aria-expanded={showArchitectureDetails}
            aria-controls="cnn-architecture-details"
            className="w-full flex items-center justify-between p-3.5 text-left text-xs font-mono text-[#17202A] hover:bg-[#F4F1EA] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Binary className="h-4 w-4 text-[#376A9B]" />
              <span className="font-semibold">LAYER-BY-LAYER STRUCTURAL SPECIFICATIONS</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#56616A]">
              <span>{showArchitectureDetails ? 'COLLAPSE DETAILS' : 'EXPAND SPECIFICATIONS'}</span>
              {showArchitectureDetails ? (
                <ChevronDown className="h-3.5 w-3.5 text-[#376A9B]" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-[#76828D]" />
              )}
            </div>
          </button>

          {showArchitectureDetails && (
            <div
              id="cnn-architecture-details"
              className="border-t border-[#D6D2C9] divide-y divide-[#D6D2C9] text-xs bg-[#FAF8F5]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D6D2C9] p-3 gap-2 sm:gap-3 bg-[#EAE7E0]/50 font-mono text-[11px]">
                <div>
                  <span className="text-[#76828D] block uppercase">Feature Extractor:</span>
                  <span className="text-[#17202A] font-semibold">3-Stage Conv2D + BatchNorm</span>
                </div>
                <div>
                  <span className="text-[#76828D] block uppercase">Pooling Strategy:</span>
                  <span className="text-[#17202A] font-semibold">
                    MaxPool(2×2) + AdaptiveAvgPool(4×4)
                  </span>
                </div>
                <div>
                  <span className="text-[#76828D] block uppercase">Dense Classification Head:</span>
                  <span className="text-[#17202A] font-semibold">
                    Linear(512→64) → ReLU → Linear(64→5)
                  </span>
                </div>
                <div>
                  <span className="text-[#76828D] block uppercase">Regularization:</span>
                  <span className="text-[#17202A] font-semibold">
                    Dropout(p=0.2) + Weight Decay (1e-4)
                  </span>
                </div>
              </div>

              <div className="p-3.5 space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block font-semibold">
                  Forward Pass Stage Sequence
                </span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="border border-[#D6D2C9] bg-white p-2.5 rounded-[2px] space-y-1">
                    <span className="text-[#376A9B] font-semibold block">Stage 1 · Conv2D</span>
                    <span className="text-[#56616A] text-[11px] block">Conv(1→16, 3×3, pad 1)</span>
                    <span className="text-[#56616A] text-[11px] block">BatchNorm2d + ReLU</span>
                    <span className="text-[#17202A] text-[11px] block">
                      MaxPool(2×2) → (16, 16, 16)
                    </span>
                  </div>
                  <div className="border border-[#D6D2C9] bg-white p-2.5 rounded-[2px] space-y-1">
                    <span className="text-[#376A9B] font-semibold block">Stage 2 · Conv2D</span>
                    <span className="text-[#56616A] text-[11px] block">
                      Conv(16→32, 3×3, pad 1)
                    </span>
                    <span className="text-[#56616A] text-[11px] block">BatchNorm2d + ReLU</span>
                    <span className="text-[#17202A] text-[11px] block">
                      MaxPool(2×2) → (32, 8, 8)
                    </span>
                  </div>
                  <div className="border border-[#D6D2C9] bg-white p-2.5 rounded-[2px] space-y-1">
                    <span className="text-[#376A9B] font-semibold block">Stage 3 · Refinement</span>
                    <span className="text-[#56616A] text-[11px] block">
                      Conv(32→32, 3×3, pad 1)
                    </span>
                    <span className="text-[#56616A] text-[11px] block">BatchNorm2d + ReLU</span>
                    <span className="text-[#17202A] text-[11px] block">
                      AdaptiveAvgPool(4,4) → (32, 4, 4)
                    </span>
                  </div>
                  <div className="border border-[#D6D2C9] bg-white p-2.5 rounded-[2px] space-y-1">
                    <span className="text-[#3D7D54] font-semibold block">Stage 4 · Head</span>
                    <span className="text-[#56616A] text-[11px] block">
                      Flatten (512) + Dropout(0.2)
                    </span>
                    <span className="text-[#56616A] text-[11px] block">Linear(512→64) + ReLU</span>
                    <span className="text-[#17202A] text-[11px] block">
                      Linear(64→5) → Class Logits
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5 Morphology Output Classes (Actual Canonical Order) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#17202A]">
              Synthetic Signal Morphology Target Classes
            </span>
            <span className="text-[11px] font-mono text-[#76828D]">
              5 Canonical Classes (Indexed 0 to 4)
            </span>
          </div>

          <div className="divide-y divide-[#D6D2C9] border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] overflow-hidden">
            {MORPHOLOGY_CLASSES.map((cls) => (
              <div
                key={cls.name}
                className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="space-y-0.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#376A9B] px-1.5 py-0.2 rounded-[2px] bg-[#376A9B]/10">
                      Class 0{cls.index + 1}
                    </span>
                    <h3 className="text-xs font-semibold text-[#17202A]">{cls.label}</h3>
                    <span className="font-mono text-[11px] text-[#76828D]">({cls.name})</span>
                  </div>
                  <p className="text-xs text-[#56616A] leading-relaxed">{cls.description}</p>
                </div>
                <div className="sm:text-right shrink-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#76828D] block">
                    Morphological Signature
                  </span>
                  <span className="text-xs font-mono text-[#17202A]">{cls.morphology}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Morphology Disclaimer */}
          <div className="p-3 rounded-[2px] border border-[#D6D2C9] bg-[#FAF8F5] text-xs text-[#56616A] leading-relaxed flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-[#C19348] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#17202A] font-semibold font-mono text-[11px] uppercase tracking-wider">
                Scientific Morphology Scope:
              </strong>{' '}
              These output classes represent simplified synthetic signal morphology categories
              generated for controlled machine learning experimentation. They are not physical
              source-identification labels (such as pulsars, masers, or planetary transmitters) and
              do not constitute proof of extraterrestrial technological origin.
            </span>
          </div>
        </div>
      </section>

      {/* 4. Actual Experimental Evaluation & Synthetic Benchmark Results */}
      <section
        aria-label="Actual Experimental Evaluation"
        className="border-t border-[#D6D2C9] pt-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D6D2C9] pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#17202A]">
                Experimental Evaluation: Synthetic Benchmark
              </h2>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#3D7D54] font-semibold">
                Verified Run
              </span>
            </div>
            <p className="text-xs text-[#56616A] mt-0.5">
              Empirical evaluation results measured on an independently split controlled synthetic
              spectrogram dataset
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#76828D]">Seed: 42</span>
            <span className="text-[#D6D2C9]">·</span>
            <span className="text-[#76828D]">Adam (lr=1e-3)</span>
          </div>
        </div>

        {/* Primary Evaluation Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D6D2C9] border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] overflow-hidden text-center shadow-xs">
          <div className="p-4 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block">
              Test Accuracy
            </span>
            <span className="text-2xl font-mono font-semibold text-[#3D7D54] block">100%</span>
            <span className="text-xs text-[#56616A] block font-mono">
              75 / 75 correctly classified
            </span>
          </div>
          <div className="p-4 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block">
              Test Macro-F1
            </span>
            <span className="text-2xl font-mono font-semibold text-[#17202A] block">1.000</span>
            <span className="text-xs text-[#56616A] block font-mono">
              Balanced across 5 classes
            </span>
          </div>
          <div className="p-4 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block">
              Test Loss
            </span>
            <span className="text-2xl font-mono font-semibold text-[#17202A] block">0.0046</span>
            <span className="text-xs text-[#56616A] block font-mono">Cross-entropy loss</span>
          </div>
          <div className="p-4 space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block">
              Test Support
            </span>
            <span className="text-2xl font-mono font-semibold text-[#376A9B] block">
              15 / class
            </span>
            <span className="text-xs text-[#56616A] block font-mono">75 total held-out tiles</span>
          </div>
        </div>

        {/* Dataset Partitioning Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#D6D2C9] border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] p-3 text-xs font-mono">
          <div className="p-2 space-y-0.5">
            <span className="text-[11px] text-[#76828D] uppercase tracking-wider block">
              Training Split
            </span>
            <span className="text-[#17202A] font-semibold text-sm">350 examples</span>
            <span className="text-[#56616A] text-[11px] block">
              70 examples per class (balanced)
            </span>
          </div>
          <div className="p-2 space-y-0.5 sm:pl-4">
            <span className="text-[11px] text-[#76828D] uppercase tracking-wider block">
              Validation Split
            </span>
            <span className="text-[#17202A] font-semibold text-sm">75 examples</span>
            <span className="text-[#56616A] text-[11px] block">
              15 examples per class (early stopping)
            </span>
          </div>
          <div className="p-2 space-y-0.5 sm:pl-4">
            <span className="text-[11px] text-[#76828D] uppercase tracking-wider block">
              Held-Out Test Split
            </span>
            <span className="text-[#376A9B] font-semibold text-sm">75 examples</span>
            <span className="text-[#56616A] text-[11px] block">
              15 examples per class (unseen during tuning)
            </span>
          </div>
        </div>

        {/* Per-Class Evaluation Table */}
        <div className="border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] overflow-hidden">
          <div className="p-3 border-b border-[#D6D2C9] bg-[#EAE7E0]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#376A9B]" />
              <span className="text-xs font-semibold text-[#17202A] font-mono uppercase tracking-wider">
                Held-Out Test Set Performance Breakdown
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#56616A]">
              Batch Size: 32 · Epochs Trained: 29
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#D6D2C9] bg-[#FAF8F5] text-[11px] text-[#76828D] uppercase tracking-wider">
                  <th scope="col" className="p-3">
                    Class
                  </th>
                  <th scope="col" className="p-3">
                    Family Name
                  </th>
                  <th scope="col" className="p-3 text-right">
                    Precision
                  </th>
                  <th scope="col" className="p-3 text-right">
                    Recall
                  </th>
                  <th scope="col" className="p-3 text-right">
                    F1-Score
                  </th>
                  <th scope="col" className="p-3 text-right">
                    Test Support
                  </th>
                  <th scope="col" className="p-3 text-right">
                    Correct
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6D2C9] text-[#17202A]">
                {MORPHOLOGY_CLASSES.map((cls) => (
                  <tr key={cls.name} className="hover:bg-[#F4F1EA]/60 transition-colors">
                    <td className="p-3 font-semibold text-[#376A9B]">0{cls.index + 1}</td>
                    <td className="p-3 font-sans font-medium text-[#17202A]">{cls.label}</td>
                    <td className="p-3 text-right">{cls.precision.toFixed(2)}</td>
                    <td className="p-3 text-right">{cls.recall.toFixed(2)}</td>
                    <td className="p-3 text-right font-semibold text-[#3D7D54]">
                      {cls.f1.toFixed(3)}
                    </td>
                    <td className="p-3 text-right text-[#56616A]">{cls.testSupport}</td>
                    <td className="p-3 text-right font-semibold text-[#3D7D54]">
                      {cls.testCorrect} / {cls.testSupport}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Collapsible 5x5 Confusion Matrix */}
        <div className="border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowConfusionMatrix(!showConfusionMatrix)}
            aria-expanded={showConfusionMatrix}
            aria-controls="confusion-matrix-view"
            className="w-full flex items-center justify-between p-3 text-left text-xs font-mono text-[#17202A] hover:bg-[#F4F1EA] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#76828D]" />
              <span className="font-semibold uppercase">INSPECT 5 × 5 CONFUSION MATRIX</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#56616A]">
              <span>{showConfusionMatrix ? 'HIDE MATRIX' : 'SHOW MATRIX'}</span>
              {showConfusionMatrix ? (
                <ChevronDown className="h-3.5 w-3.5 text-[#376A9B]" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-[#76828D]" />
              )}
            </div>
          </button>

          {showConfusionMatrix && (
            <div
              id="confusion-matrix-view"
              className="border-t border-[#D6D2C9] p-4 bg-[#FAF8F5] space-y-3"
            >
              <div className="text-[11px] font-mono text-[#56616A]">
                Rows represent true ground-truth classes; columns represent predicted classes.
                Diagonal entries confirm perfect isolation across the 75 held-out synthetic test
                instances.
              </div>

              <div className="overflow-x-auto">
                <table className="border border-[#D6D2C9] text-xs font-mono text-center mx-auto">
                  <thead>
                    <tr className="border-b border-[#D6D2C9] bg-[#EAE7E0] text-[10px] text-[#76828D] uppercase tracking-wider">
                      <th scope="col" className="p-2 border-r border-[#D6D2C9] text-left">
                        True \ Pred
                      </th>
                      {MORPHOLOGY_CLASSES.map((cls) => (
                        <th
                          key={cls.name}
                          scope="col"
                          className="p-2 border-r last:border-r-0 border-[#D6D2C9] min-w-[70px]"
                        >
                          {cls.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6D2C9]">
                    {CONFUSION_MATRIX.map((row, rIdx) => (
                      <tr key={MORPHOLOGY_CLASSES[rIdx].name} className="hover:bg-[#F4F1EA]">
                        <td className="p-2 border-r border-[#D6D2C9] text-left font-semibold text-[#17202A] bg-[#FAF8F5]">
                          {MORPHOLOGY_CLASSES[rIdx].label}
                        </td>
                        {row.map((val, cIdx) => (
                          <td
                            key={`${rIdx}-${cIdx}`}
                            className={`p-2 border-r last:border-r-0 border-[#D6D2C9] font-mono font-semibold ${
                              val > 0 ? 'bg-[#3D7D54]/15 text-[#2B573A]' : 'text-[#76828D]'
                            }`}
                          >
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Mandatory Explicit Experimental Limitation Statement */}
        <div className="border-l-4 border-[#C19348] border-y border-r border-[#D6D2C9] bg-[#FAF8F5] p-4 rounded-r-[3px] space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#C19348] shrink-0" />
            <h4 className="text-xs font-semibold text-[#17202A] font-mono uppercase tracking-wider">
              Empirical Scope & Mandatory Scientific Limitation Notice
            </h4>
          </div>
          <p className="text-xs text-[#17202A] leading-relaxed font-medium pl-6">
            “These results were measured on a small, independently split synthetic dataset with five
            generated signal families. They do not establish generalization to real telescope
            recordings, detection performance on astronomical observations, or reliable rejection of
            real radio-frequency interference.”
          </p>
          <p className="text-[11px] text-[#56616A] leading-relaxed pl-6">
            These figures represent benchmark metrics on synthetic tiles and do not reflect
            production discovery rates, real-world observational accuracy, or astronomical candidate
            validation. In accordance with AETHON's scientific integrity principles, no unmeasured
            inference latency, noise robustness thresholds, deployment availability, or
            astrophysical confidence scores are claimed.
          </p>
        </div>

        {/* Reproducibility Artifacts Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[2px] border border-[#D6D2C9] bg-[#FAF8F5] text-xs font-mono text-[#56616A]">
          <div className="flex items-center gap-2">
            <FileCode2 className="h-3.5 w-3.5 text-[#376A9B]" />
            <span>
              Dataset:{' '}
              <code className="text-[#17202A] font-semibold">
                backend/scripts/prepare_cnn_dataset.py
              </code>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-[#376A9B]" />
            <span>
              Training CLI:{' '}
              <code className="text-[#17202A] font-semibold">
                backend/scripts/train_cnn_classifier.py
              </code>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#3D7D54]" />
            <span>
              Report:{' '}
              <code className="text-[#17202A] font-semibold">
                backend/data/cnn_models/training_report.json
              </code>
            </span>
          </div>
        </div>
      </section>

      {/* 5. The Reality of False Positives & Human-in-the-Loop Verification */}
      <section aria-label="False Positives and Scientific Investigation">
        <FalsePositiveReality />
      </section>

      {/* 6. Closing Scientific Instrument Navigation */}
      <section aria-label="Triage Navigation">
        <ModelCta />
      </section>
    </PageTransition>
  );
}
