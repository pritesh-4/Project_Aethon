import type { SearchConfig, SearchMode } from '../types.ts';
import { Sliders, Shield, Zap } from 'lucide-react';

export interface SearchConfigurationProps {
  config: SearchConfig;
  onChange: (newConfig: SearchConfig) => void;
  disabled?: boolean;
}

export function SearchConfiguration({
  config,
  onChange,
  disabled = false,
}: SearchConfigurationProps) {
  const handleModeChange = (mode: SearchMode) => {
    onChange({ ...config, searchMode: mode });
  };

  const handlePersistenceChange = (val: number) => {
    onChange({ ...config, minPersistencePercent: val });
  };

  const handleToggleRfi = () => {
    onChange({ ...config, rfiFilterEnabled: !config.rfiFilterEnabled });
  };

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-4 font-mono select-none">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-3.5 w-3.5 text-[#66E3FF]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            ANALYSIS CONFIGURATION
          </h4>
        </div>
        <span className="text-[10px] text-[#84929C] uppercase">RESTRAINED PARAMETERS</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Mode Selection */}
        <div className="space-y-2">
          <span className="block text-[10px] uppercase tracking-wider text-[#84929C]">
            SEARCH MODE
          </span>

          <div className="grid grid-cols-2 gap-2">
            {/* Standard Mode */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleModeChange('standard')}
              className={`flex flex-col items-start p-2.5 rounded-[2px] border text-left transition-colors cursor-pointer ${
                config.searchMode === 'standard'
                  ? 'border-[#66E3FF] bg-[#06b6d4]/10 text-[#EAF4F7]'
                  : 'border-slate-800 bg-[#05070A]/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span
                  className={`h-2 w-2 rounded-full border ${
                    config.searchMode === 'standard'
                      ? 'border-[#66E3FF] bg-[#66E3FF]'
                      : 'border-slate-600 bg-transparent'
                  }`}
                />
                <span>STANDARD DISCOVERY</span>
              </div>
              <span className="mt-1 text-[10px] text-[#84929C] leading-normal font-sans">
                Balanced candidate generation tuned for survey exploration.
              </span>
            </button>

            {/* Deep Search Mode */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleModeChange('deep')}
              className={`flex flex-col items-start p-2.5 rounded-[2px] border text-left transition-colors cursor-pointer ${
                config.searchMode === 'deep'
                  ? 'border-amber-500 bg-amber-950/20 text-[#EAF4F7]'
                  : 'border-slate-800 bg-[#05070A]/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span
                  className={`h-2 w-2 rounded-full border ${
                    config.searchMode === 'deep'
                      ? 'border-amber-400 bg-amber-400'
                      : 'border-slate-600 bg-transparent'
                  }`}
                />
                <span className={config.searchMode === 'deep' ? 'text-amber-300' : ''}>
                  DEEP SEARCH
                </span>
              </div>
              <span className="mt-1 text-[10px] text-[#84929C] leading-normal font-sans">
                Higher sensitivity screening with broader anomaly envelope.
              </span>
            </button>
          </div>
        </div>

        {/* Optional Scientific Filters */}
        <div className="space-y-3">
          <span className="block text-[10px] uppercase tracking-wider text-[#84929C]">
            SCIENTIFIC SCREENING FILTERS
          </span>

          <div className="space-y-2.5 rounded-[2px] border border-slate-800 bg-[#05070A]/60 p-2.5 text-xs">
            {/* Minimum Persistence Slider */}
            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-cyan-400" />
                  MINIMUM PERSISTENCE THRESHOLD:
                </span>
                <span className="font-bold text-[#66E3FF]">{config.minPersistencePercent}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={config.minPersistencePercent}
                onChange={(e) => handlePersistenceChange(Number(e.target.value))}
                disabled={disabled}
                className="w-full mt-1.5 accent-[#66E3FF] cursor-pointer"
              />
              <span className="block text-[9px] text-slate-500">
                Reject transient signals present in fewer than 3 consecutive pointings
              </span>
            </div>

            {/* Terrestrial RFI Filter Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                <Shield className="h-3 w-3 text-emerald-400" />
                INTERFERENCE FILTER (RFI):
              </span>

              <button
                type="button"
                disabled={disabled}
                onClick={handleToggleRfi}
                className={`inline-flex items-center gap-1.5 rounded-[1px] border px-2 py-0.5 text-[10px] uppercase font-mono font-semibold transition-colors cursor-pointer ${
                  config.rfiFilterEnabled
                    ? 'border-emerald-600 bg-emerald-950/40 text-emerald-300'
                    : 'border-slate-700 bg-slate-900 text-slate-500'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-none ${
                    config.rfiFilterEnabled ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                {config.rfiFilterEnabled ? 'ENABLED' : 'BYPASSED'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
