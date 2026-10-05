import { useState } from 'react';
import { PageTransition } from '@/components/ui/motion.tsx';
import type { ModelStageId } from './types.ts';

import { ModelHeader } from './components/ModelHeader.tsx';
import { ArchitectureMap } from './components/ArchitectureMap.tsx';
import { LearnedSignalSpace } from './components/LearnedSignalSpace.tsx';
import { ModelFlowVisualizer } from './components/ModelFlowVisualizer.tsx';
import { ModelStrategyComparison } from './components/ModelStrategyComparison.tsx';
import { AnomalyScoringPanel } from './components/AnomalyScoringPanel.tsx';
import { FalsePositivePanel } from './components/FalsePositivePanel.tsx';
import { HumanInTheLoopFlow } from './components/HumanInTheLoopFlow.tsx';
import { AlgorithmArchitecture } from './components/AlgorithmArchitecture.tsx';
import { EvaluationPanel } from './components/EvaluationPanel.tsx';
import { TechnicalDetails } from './components/TechnicalDetails.tsx';
import { ModelCta } from './components/ModelCta.tsx';

export default function ModelPage() {
  const [activeStageId, setActiveStageId] = useState<ModelStageId>('observation');

  return (
    <PageTransition className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 2 & 3. PAGE HEADER & HERO PHILOSOPHY STATEMENTS */}
      <section aria-label="Model Intelligence Header">
        <ModelHeader />
      </section>

      {/* 4 & 5. PRIMARY LIVE COMPUTATIONAL ARCHITECTURE TOPOLOGY */}
      <section aria-label="Interactive Computational Architecture">
        <ArchitectureMap
          activeStageId={activeStageId}
          onSelectStage={(id) => setActiveStageId(id)}
        />
      </section>

      {/* 6. LEARNED SIGNAL SPACE & MANIFOLD DEVIATION */}
      <section aria-label="Conceptual Learned Signal Space">
        <LearnedSignalSpace />
      </section>

      {/* 10. STEP-BY-STEP DATA TRANSFORMATION FLOW */}
      <section aria-label="Signal Transformation Flow">
        <ModelFlowVisualizer />
      </section>

      {/* 8 & 11. MODEL STRATEGY: SUPERVISED VS OPEN-WORLD DISCOVERY */}
      <section aria-label="Model Strategy Comparison">
        <ModelStrategyComparison />
      </section>

      {/* 7 & 16. ANOMALY SCORING SPECTRUM & SIGNAL MANIFOLD GEOMETRY */}
      <section aria-label="Anomaly Index and Manifold Geometry">
        <AnomalyScoringPanel />
      </section>

      {/* 12. THE FALSE POSITIVE PROBLEM */}
      <section aria-label="False Positive Taxonomy and Mitigation">
        <FalsePositivePanel />
      </section>

      {/* 13. HUMAN-IN-THE-LOOP DISCOVERY GATEWAY */}
      <section aria-label="Human-In-The-Loop Flow">
        <HumanInTheLoopFlow />
      </section>

      {/* 9. ALGORITHM ARCHITECTURE: PRODUCTION VS RESEARCH EXTENSIONS */}
      <section aria-label="Algorithm Architecture Breakdown">
        <AlgorithmArchitecture />
      </section>

      {/* 14, 15, 17. EVALUATION METHODOLOGY & PIPELINE TELEMETRY */}
      <section aria-label="Evaluation Methodology and Pipeline Telemetry">
        <EvaluationPanel />
      </section>

      {/* 18. COLLAPSIBLE TECHNICAL SPECIFICATIONS & EQUATIONS */}
      <section aria-label="Technical Details and Formulations">
        <TechnicalDetails />
      </section>

      {/* 28. FINAL CANDIDATE PHILOSOPHY CALL TO ACTION */}
      <section aria-label="Explore Discovery Call to Action">
        <ModelCta />
      </section>
    </PageTransition>
  );
}
