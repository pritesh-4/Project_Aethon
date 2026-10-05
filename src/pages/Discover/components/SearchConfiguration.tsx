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
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-4 select-none">
      <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-3.5 w-3.5 text-[#5BD8F5]" />
          <h4 className="text-xs font-semibold text-[#E6EDF2]">Search configuration</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Mode Selection */}
        <div className="space-y-2">
          <span className="block text-xs font-medium text-[#7F8B95]">Search mode</span>

          <div className="grid grid-cols-2 gap-2">
            {/* Standard Mode */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleModeChange('standard')}
              className={`flex flex-col items-start p-2.5 rounded border text-left transition-colors cursor-pointer ${
                config.searchMode === 'standard'
                  ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#E6EDF2]'
                  : 'border-[#1C2630] bg-[#06080B] text-[#7F8B95] hover:border-[#1C2630]/80 hover:text-[#E6EDF2]'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span
                  className={`h-2 w-2 rounded-full border ${
                    config.searchMode === 'standard'
                      ? 'border-[#5BD8F5] bg-[#5BD8F5]'
                      : 'border-[#7F8B95] bg-transparent'
                  }`}
                />
                <span>Standard</span>
              </div>
              <span className="mt-1 text-[11px] text-[#7F8B95] leading-normal">
                Balanced candidate generation for routine survey exploration.
              </span>
            </button>

            {/* Deep Search Mode */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleModeChange('deep')}
              className={`flex flex-col items-start p-2.5 rounded border text-left transition-colors cursor-pointer ${
                config.searchMode === 'deep'
                  ? 'border-[#E8AE50] bg-[#E8AE50]/10 text-[#E6EDF2]'
                  : 'border-[#1C2630] bg-[#06080B] text-[#7F8B95] hover:border-[#1C2630]/80 hover:text-[#E6EDF2]'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span
                  className={`h-2 w-2 rounded-full border ${
                    config.searchMode === 'deep'
                      ? 'border-[#E8AE50] bg-[#E8AE50]'
                      : 'border-[#7F8B95] bg-transparent'
                  }`}
                />
                <span className={config.searchMode === 'deep' ? 'text-[#E8AE50]' : ''}>
                  High sensitivity
                </span>
              </div>
              <span className="mt-1 text-[11px] text-[#7F8B95] leading-normal">
                Broader screening envelope for faint and transient anomalies.
              </span>
            </button>
          </div>
        </div>

        {/* Screening Filters */}
        <div className="space-y-2">
          <span className="block text-xs font-medium text-[#7F8B95]">Screening filters</span>

          <div className="space-y-2.5 rounded border border-[#1C2630] bg-[#06080B] p-2.5 text-xs">
            {/* Minimum Persistence Slider */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#7F8B95] flex items-center gap-1">
                  <Zap className="h-3 w-3 text-[#5BD8F5]" />
                  Minimum persistence threshold:
                </span>
                <span className="font-semibold text-[#5BD8F5] font-mono">
                  {config.minPersistencePercent}%
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={config.minPersistencePercent}
                onChange={(e) => handlePersistenceChange(Number(e.target.value))}
                disabled={disabled}
                className="w-full mt-1.5 accent-[#5BD8F5] cursor-pointer"
              />
              <span className="block text-[10px] text-[#7F8B95]">
                Rejects transient features present in fewer than 3 consecutive pointings
              </span>
            </div>

            {/* Terrestrial RFI Filter Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-[#1C2630]">
              <span className="text-[#7F8B95] flex items-center gap-1 text-xs">
                <Shield className="h-3 w-3 text-[#5BD8F5]" />
                Interference rejection filter:
              </span>

              <button
                type="button"
                disabled={disabled}
                onClick={handleToggleRfi}
                className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer ${
                  config.rfiFilterEnabled
                    ? 'border-[#5BD8F5]/40 bg-[#5BD8F5]/10 text-[#5BD8F5]'
                    : 'border-[#1C2630] bg-[#10161D] text-[#7F8B95]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    config.rfiFilterEnabled ? 'bg-[#5BD8F5]' : 'bg-[#7F8B95]'
                  }`}
                />
                {config.rfiFilterEnabled ? 'Enabled' : 'Off'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
