import { useState } from 'react';
import type { SearchConfig, SearchSensitivity } from '../types.ts';
import { ChevronDown, ChevronUp, Sliders, ShieldCheck } from 'lucide-react';

export interface SearchSettingsProps {
  config: SearchConfig;
  onChange: (newConfig: SearchConfig) => void;
  disabled?: boolean;
}

export function SearchSettings({ config, onChange, disabled = false }: SearchSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSensitivityChange = (sensitivity: SearchSensitivity) => {
    onChange({ ...config, sensitivity });
  };

  const handleToggleRfi = () => {
    onChange({ ...config, rejectTerrestrialRfi: !config.rejectTerrestrialRfi });
  };

  return (
    <section className="border border-[#242825] bg-[#0E100F] rounded-[3px] select-none font-sans overflow-hidden">
      {/* Collapsed Bar: Information Separated from Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-4">
        {/* Information Group */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 text-[#D4864A]" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#767973] font-semibold">
              Screening Parameters
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#E6E4DD]">
            <span>
              {config.sensitivity === 'standard' ? 'Standard sensitivity' : 'High sensitivity'}
            </span>
            <span className="text-[#363C38]">·</span>
            <span className="text-[#9A9C96]">
              {config.rejectTerrestrialRfi ? 'RFI rejection enabled' : 'RFI rejection bypassed'}
            </span>
          </div>
        </div>

        {/* Clear Action Affordance (Role 3: Action Control) */}
        <button
          type="button"
          disabled={disabled}
          aria-expanded={isOpen}
          aria-controls="screening-settings-panel"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-[2px] border border-[#242825] bg-[#141715] hover:border-[#D4864A]/60 hover:bg-[#1A1D1B] text-xs font-medium text-[#C9C8C0] hover:text-[#E6E4DD] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
        >
          <span>{isOpen ? 'Close settings' : 'Adjust screening'}</span>
          {isOpen ? (
            <ChevronUp className="h-3 w-3 text-[#D4864A]" />
          ) : (
            <ChevronDown className="h-3 w-3 text-[#848780]" />
          )}
        </button>
      </div>

      {/* Expanded Controls Panel */}
      {isOpen && (
        <div
          id="screening-settings-panel"
          className="border-t border-[#242825] p-4 bg-[#0A0C0B] space-y-4 animate-in fade-in duration-150"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Control 1: Sensitivity */}
            <div className="space-y-2">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-[#767973]">
                Detection Threshold
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={config.sensitivity === 'standard'}
                  disabled={disabled}
                  onClick={() => handleSensitivityChange('standard')}
                  className={`p-3 text-left rounded-[2px] border transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] ${
                    config.sensitivity === 'standard'
                      ? 'border-[#D4864A] bg-[#221B16] text-[#E6E4DD]'
                      : 'border-[#242825] bg-[#101211] text-[#848780] hover:border-[#333834]'
                  }`}
                >
                  <span className="text-xs font-semibold block">Standard</span>
                  <span className="text-[11px] text-[#767973] block mt-0.5 leading-snug">
                    Target persistent coherent carriers.
                  </span>
                </button>

                <button
                  type="button"
                  aria-pressed={config.sensitivity === 'high'}
                  disabled={disabled}
                  onClick={() => handleSensitivityChange('high')}
                  className={`p-3 text-left rounded-[2px] border transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] ${
                    config.sensitivity === 'high'
                      ? 'border-[#D4864A] bg-[#221B16] text-[#E6E4DD]'
                      : 'border-[#242825] bg-[#101211] text-[#848780] hover:border-[#333834]'
                  }`}
                >
                  <span className="text-xs font-semibold block">High sensitivity</span>
                  <span className="text-[11px] text-[#767973] block mt-0.5 leading-snug">
                    Detect faint transient anomalies.
                  </span>
                </button>
              </div>
            </div>

            {/* Control 2: RFI Filter */}
            <div className="space-y-2">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-[#767973]">
                Interference Filtering
              </span>

              <div className="flex items-center justify-between p-3 rounded-[2px] border border-[#242825] bg-[#101211]">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#E6E4DD]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#529E72]" />
                    <span>Terrestrial RFI rejection</span>
                  </div>
                  <span className="text-[11px] text-[#767973] block">
                    Filters known satellite beacons and ground stations.
                  </span>
                </div>

                <button
                  type="button"
                  aria-pressed={config.rejectTerrestrialRfi}
                  disabled={disabled}
                  onClick={handleToggleRfi}
                  className={`px-3 py-1 text-xs font-mono rounded-[2px] transition-colors cursor-pointer ${
                    config.rejectTerrestrialRfi
                      ? 'bg-[#142318] text-[#529E72] border border-[#529E72]/40 font-semibold'
                      : 'bg-[#171917] text-[#767973] border border-[#242825]'
                  }`}
                >
                  {config.rejectTerrestrialRfi ? 'FILTER ON' : 'BYPASS'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
