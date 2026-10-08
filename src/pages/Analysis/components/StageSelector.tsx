import type { AnalysisStageId } from '../types.ts';

export interface StageSelectorProps {
  activeStage: AnalysisStageId;
  onSelectStage: (stage: AnalysisStageId) => void;
}

const stages: {
  id: AnalysisStageId;
  num: string;
  label: string;
  shortQuestion: string;
}[] = [
  { id: 'observation', num: '01', label: 'Observation', shortQuestion: 'What was observed?' },
  { id: 'representation', num: '02', label: 'Representation', shortQuestion: 'How is it encoded?' },
  { id: 'comparison', num: '03', label: 'Comparison', shortQuestion: 'How does it compare?' },
  { id: 'anomaly', num: '04', label: 'Anomaly', shortQuestion: 'Why is it anomalous?' },
];

export function StageSelector({ activeStage, onSelectStage }: StageSelectorProps) {
  return (
    <nav
      className="flex items-stretch select-none overflow-x-auto"
      role="tablist"
      aria-label="Investigation stages"
    >
      {stages.map((st, idx) => {
        const isSelected = activeStage === st.id;
        const isPast = stages.findIndex((s) => s.id === activeStage) > idx;

        return (
          <button
            key={st.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelectStage(st.id)}
            className={`group relative flex items-center gap-2.5 px-5 py-2.5 text-left transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#D4864A] border-b-2 ${
              isSelected
                ? 'border-[#D4864A] bg-[#141715]'
                : isPast
                  ? 'border-transparent bg-transparent hover:bg-[#141715]/60'
                  : 'border-transparent bg-transparent hover:bg-[#141715]/40'
            }`}
          >
            {/* Step number indicator */}
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-mono font-medium shrink-0 transition-colors ${
                isSelected
                  ? 'bg-[#D4864A] text-[#0F1110]'
                  : isPast
                    ? 'bg-[#1A1E1B] text-[#D4864A] ring-1 ring-[#D4864A]/30'
                    : 'bg-[#1A1E1B] text-[#666963]'
              }`}
            >
              {st.num}
            </span>

            {/* Label + question */}
            <div className="flex flex-col min-w-0">
              <span
                className={`text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected ? 'text-[#E6E4DD]' : 'text-[#9A9C96] group-hover:text-[#E6E4DD]'
                }`}
              >
                {st.label}
              </span>
              <span
                className={`text-[10px] whitespace-nowrap transition-colors ${
                  isSelected ? 'text-[#9A9C96]' : 'text-[#666963]'
                }`}
              >
                {st.shortQuestion}
              </span>
            </div>

            {/* Connecting line to next step */}
            {idx < stages.length - 1 && (
              <span
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 ${
                  isPast ? 'bg-[#D4864A]/20' : 'bg-[#242825]'
                }`}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
