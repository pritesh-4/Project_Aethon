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
    <section className="border border-[#D6D2C9] bg-[#FAF8F5] rounded-[4px] select-none font-sans overflow-hidden">
      {/* Collapsed Bar: Information Separated from Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-4">
        {/* Information Group */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 text-[#376A9B]" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#7E8B96] font-semibold">
              Screening parameters
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#17202A]">
            <span className="font-medium">
              {config.sensitivity === 'standard' ? 'Standard sensitivity' : 'High sensitivity'}
            </span>
            <span className="text-[#D6D2C9]">·</span>
            <span className="text-[#56616A]">
              {config.rejectTerrestrialRfi ? 'RFI rejection active' : 'RFI rejection bypassed'}
            </span>
          </div>
        </div>

        {/* Clear Action Affordance */}
        <button
          type="button"
          disabled={disabled}
          aria-expanded={isOpen}
          aria-controls="screening-settings-panel"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-[3px] border border-[#D6D2C9] bg-[#FFFFFF] hover:bg-[#EAE7E0] hover:border-[#BCB6A8] text-xs font-medium text-[#17202A] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B]"
        >
          <span>{isOpen ? 'Close settings' : 'Adjust screening'}</span>
          {isOpen ? (
            <ChevronUp className="h-3 w-3 text-[#376A9B]" />
          ) : (
            <ChevronDown className="h-3 w-3 text-[#7E8B96]" />
          )}
        </button>
      </div>

      {/* Expanded Controls Panel */}
      {isOpen && (
        <div
          id="screening-settings-panel"
          className="border-t border-[#D6D2C9] p-4 bg-[#F4F1EA] space-y-4 animate-in fade-in duration-150"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Control 1: Sensitivity */}
            <div className="space-y-2">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-[#7E8B96]">
                Detection threshold
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={config.sensitivity === 'standard'}
                  disabled={disabled}
                  onClick={() => handleSensitivityChange('standard')}
                  className={`p-3 text-left rounded-[3px] border transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] ${
                    config.sensitivity === 'standard'
                      ? 'border-[#376A9B] bg-[#FFFFFF] text-[#17202A] shadow-2xs font-medium'
                      : 'border-[#D6D2C9] bg-[#FAF8F5] text-[#56616A] hover:border-[#BCB6A8]'
                  }`}
                >
                  <span className="text-xs font-semibold block text-[#17202A]">Standard</span>
                  <span className="text-[11px] text-[#56616A] block mt-0.5 leading-snug">
                    Target persistent coherent carriers.
                  </span>
                </button>

                <button
                  type="button"
                  aria-pressed={config.sensitivity === 'high'}
                  disabled={disabled}
                  onClick={() => handleSensitivityChange('high')}
                  className={`p-3 text-left rounded-[3px] border transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] ${
                    config.sensitivity === 'high'
                      ? 'border-[#376A9B] bg-[#FFFFFF] text-[#17202A] shadow-2xs font-medium'
                      : 'border-[#D6D2C9] bg-[#FAF8F5] text-[#56616A] hover:border-[#BCB6A8]'
                  }`}
                >
                  <span className="text-xs font-semibold block text-[#17202A]">
                    High sensitivity
                  </span>
                  <span className="text-[11px] text-[#56616A] block mt-0.5 leading-snug">
                    Detect faint transient anomalies.
                  </span>
                </button>
              </div>
            </div>

            {/* Control 2: RFI Filter */}
            <div className="space-y-2">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-[#7E8B96]">
                Interference filtering
              </span>

              <div className="flex items-center justify-between p-3 rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5]">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#17202A]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#3D7D54]" />
                    <span>Terrestrial RFI rejection</span>
                  </div>
                  <span className="text-[11px] text-[#56616A] block">
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
                      ? 'bg-[#EFF7F2] text-[#3D7D54] border border-[#B2D8C0] font-semibold'
                      : 'bg-[#EAE7E0] text-[#56616A] border border-[#D6D2C9]'
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
