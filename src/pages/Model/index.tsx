import { PageTransition } from '@/components/ui/motion.tsx';
import { ModelHeader } from './components/ModelHeader.tsx';
import { ModelArchitecturePipeline } from './components/ModelArchitecturePipeline.tsx';
import { ConceptualLatentSpace } from './components/ConceptualLatentSpace.tsx';
import { FalsePositiveReality } from './components/FalsePositiveReality.tsx';
import { ModelCta } from './components/ModelCta.tsx';

export default function ModelPage() {
  return (
    <PageTransition className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-12">
      {/* 1. Header with Core Question: “How does AETHON recognize that something does not fit?” */}
      <section aria-label="Core Philosophy and Intelligence Question">
        <ModelHeader />
      </section>

      {/* 2. Coherent 5-Stage Architecture Flow (Observation -> Representation -> Latent Space -> Anomaly Detection -> Candidate) */}
      <section aria-label="5-Stage Architecture Pipeline">
        <ModelArchitecturePipeline />
      </section>

      {/* 3. Conceptual Latent Representation Space (Clearly labeled demonstration) */}
      <section aria-label="Conceptual Representation Space">
        <ConceptualLatentSpace />
      </section>

      {/* 4. The Reality of False Positives & Human-in-the-Loop Verification */}
      <section aria-label="False Positives and Scientific Investigation">
        <FalsePositiveReality />
      </section>

      {/* 5. Closing Scientific Instrument Navigation */}
      <section aria-label="Triage Navigation">
        <ModelCta />
      </section>
    </PageTransition>
  );
}
