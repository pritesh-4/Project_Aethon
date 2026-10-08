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
      className="flex items-stretch select-none overflow-x-auto bg-[#FAF8F5]"
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
            className={`group relative flex items-center gap-3 px-5 py-3 text-left transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#376A9B] border-b-2 ${
              isSelected
                ? 'border-[#376A9B] bg-[#FAF8F5]'
                : isPast
                  ? 'border-transparent bg-transparent hover:bg-[#EAE7E0]/50'
                  : 'border-transparent bg-transparent hover:bg-[#EAE7E0]/30'
            }`}
          >
            {/* Step number indicator */}
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-mono font-semibold shrink-0 transition-colors ${
                isSelected
                  ? 'bg-[#376A9B] text-[#FFFFFF]'
                  : isPast
                    ? 'bg-[#EAE7E0] text-[#376A9B] ring-1 ring-[#376A9B]/40'
                    : 'bg-[#EAE7E0] text-[#76828D]'
              }`}
            >
              {st.num}
            </span>

            {/* Label + question */}
            <div className="flex flex-col min-w-0">
              <span
                className={`text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected ? 'text-[#17202A]' : 'text-[#56616A] group-hover:text-[#17202A]'
                }`}
              >
                {st.label}
              </span>
              <span
                className={`text-[11px] whitespace-nowrap transition-colors italic ${
                  isSelected ? 'text-[#56616A]' : 'text-[#76828D]'
                }`}
              >
                {st.shortQuestion}
              </span>
            </div>

            {/* Connecting line to next step */}
            {idx < stages.length - 1 && (
              <span
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-px h-5 ${
                  isPast ? 'bg-[#376A9B]/25' : 'bg-[#D6D2C9]'
                }`}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
