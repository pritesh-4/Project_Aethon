import { useState } from 'react';
import { PageTransition } from '@/components/ui/motion.tsx';
import { Layers, Network, ShieldCheck, Binary } from 'lucide-react';
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

type ModelViewTab = 'architecture' | 'manifold' | 'screening' | 'technical';

export default function ModelPage() {
  const [activeTab, setActiveTab] = useState<ModelViewTab>('architecture');
  const [activeStageId, setActiveStageId] = useState<ModelStageId>('observation');

  const tabs: { id: ModelViewTab; label: string; icon: typeof Layers }[] = [
    { id: 'architecture', label: 'Architecture & pipeline', icon: Layers },
    { id: 'manifold', label: 'Representation space', icon: Network },
    { id: 'screening', label: 'Interference screening', icon: ShieldCheck },
    { id: 'technical', label: 'Technical specifications', icon: Binary },
  ];

  return (
    <PageTransition className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Header */}
      <section aria-label="Model Intelligence Header">
        <ModelHeader />
      </section>

      {/* 2. Model View Tabs */}
      <section aria-label="Model Exploration Views" className="space-y-6">
        <div className="flex items-center gap-2 border-b border-[#1C2630] pb-2 font-sans text-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#10161D] text-[#5BD8F5] border border-[#1C2630]'
                    : 'text-[#7F8B95] hover:text-[#E6EDF2] border border-transparent'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Architecture & Pipeline */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <ArchitectureMap
              activeStageId={activeStageId}
              onSelectStage={(id) => setActiveStageId(id)}
            />
            <ModelFlowVisualizer />
            <ModelStrategyComparison />
          </div>
        )}

        {/* Tab 2: Representation Space */}
        {activeTab === 'manifold' && (
          <div className="space-y-6">
            <LearnedSignalSpace />
            <AnomalyScoringPanel />
          </div>
        )}

        {/* Tab 3: Interference Screening */}
        {activeTab === 'screening' && (
          <div className="space-y-6">
            <FalsePositivePanel />
            <HumanInTheLoopFlow />
          </div>
        )}

        {/* Tab 4: Technical Specifications */}
        {activeTab === 'technical' && (
          <div className="space-y-6">
            <TechnicalDetails />
            <AlgorithmArchitecture />
            <EvaluationPanel />
          </div>
        )}
      </section>

      {/* 3. Closing Philosophy Statement */}
      <section aria-label="Explore Discovery Call to Action">
        <ModelCta />
      </section>
    </PageTransition>
  );
}
