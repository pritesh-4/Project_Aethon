import { useState } from 'react';
import type { SearchConfig, SearchSensitivity } from '../types.ts';
import { ChevronDown, ChevronRight, Sliders, ShieldCheck } from 'lucide-react';

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
    <section className="rounded border border-[#1C2630] bg-[#0B0F14] select-none overflow-hidden">
      {/* Header / Accordion Toggle */}
      <button
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        aria-controls="search-settings-panel"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#10161D] cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5]"
      >
        <div className="flex items-center gap-2.5">
          <Sliders className="h-4 w-4 text-[#5BD8F5]" />
          <div>
            <span className="text-xs font-semibold text-[#E6EDF2]">Optional search settings</span>
            <span className="ml-2 text-[11px] text-[#7F8B95]">
              {config.sensitivity === 'standard' ? 'Standard sensitivity' : 'High sensitivity'} •{' '}
              {config.rejectTerrestrialRfi ? 'RFI rejection on' : 'RFI rejection off'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-[#7F8B95]">
          <span>{isOpen ? 'Hide' : 'Configure'}</span>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded Meaningful Settings */}
      {isOpen && (
        <div
          id="search-settings-panel"
          className="border-t border-[#1C2630] p-4 space-y-4 bg-[#06080B]/50"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search Sensitivity */}
            <div className="space-y-2">
              <span className="block text-xs font-medium text-[#7F8B95]">Search sensitivity</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={config.sensitivity === 'standard'}
                  disabled={disabled}
                  onClick={() => handleSensitivityChange('standard')}
                  className={`flex flex-col items-start p-2.5 rounded border text-left transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] ${
                    config.sensitivity === 'standard'
                      ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#E6EDF2]'
                      : 'border-[#1C2630] bg-[#0B0F14] text-[#7F8B95] hover:text-[#E6EDF2] hover:border-[#1C2630]/80'
                  }`}
                >
                  <span className="text-xs font-medium">Standard</span>
                  <span className="mt-0.5 text-[11px] text-[#7F8B95] leading-snug">
                    Standard threshold for persistent signals.
                  </span>
                </button>

                <button
                  type="button"
                  aria-pressed={config.sensitivity === 'high'}
                  disabled={disabled}
                  onClick={() => handleSensitivityChange('high')}
                  className={`flex flex-col items-start p-2.5 rounded border text-left transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] ${
                    config.sensitivity === 'high'
                      ? 'border-[#E8AE50] bg-[#E8AE50]/10 text-[#E6EDF2]'
                      : 'border-[#1C2630] bg-[#0B0F14] text-[#7F8B95] hover:text-[#E6EDF2] hover:border-[#1C2630]/80'
                  }`}
                >
                  <span
                    className={`text-xs font-medium ${config.sensitivity === 'high' ? 'text-[#E8AE50]' : ''}`}
                  >
                    High sensitivity
                  </span>
                  <span className="mt-0.5 text-[11px] text-[#7F8B95] leading-snug">
                    Screens for faint and transient anomalies.
                  </span>
                </button>
              </div>
            </div>

            {/* Interference Rejection */}
            <div className="space-y-2">
              <span className="block text-xs font-medium text-[#7F8B95]">
                Terrestrial interference
              </span>
              <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-2.5 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#E6EDF2]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#5BD8F5]" />
                    <span>Filter terrestrial RFI</span>
                  </div>
                  <span className="block text-[11px] text-[#7F8B95] leading-snug">
                    Rejects orbital satellite beacons and ground transmitter bands.
                  </span>
                </div>

                <button
                  type="button"
                  aria-pressed={config.rejectTerrestrialRfi}
                  disabled={disabled}
                  onClick={handleToggleRfi}
                  className={`shrink-0 rounded border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] ${
                    config.rejectTerrestrialRfi
                      ? 'border-[#5BD8F5]/40 bg-[#5BD8F5]/10 text-[#5BD8F5]'
                      : 'border-[#1C2630] bg-[#10161D] text-[#7F8B95]'
                  }`}
                >
                  {config.rejectTerrestrialRfi ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
