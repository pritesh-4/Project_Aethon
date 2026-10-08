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
    <section className="rounded-[2px] border border-[#262C28] bg-[#141715] select-none overflow-hidden font-sans">
      {/* Header / Accordion Toggle */}
      <button
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        aria-controls="search-settings-panel"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#1A1E1B] cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
      >
        <div className="flex items-center gap-2.5">
          <Sliders className="h-4 w-4 text-[#D4864A]" />
          <div>
            <span className="text-xs font-semibold text-[#E6E4DD]">Optional search settings</span>
            <span className="ml-2 text-[11px] text-[#9A9C96]">
              {config.sensitivity === 'standard' ? 'Standard sensitivity' : 'High sensitivity'} •{' '}
              {config.rejectTerrestrialRfi ? 'RFI rejection on' : 'RFI rejection off'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-[#9A9C96]">
          <span>{isOpen ? 'Hide' : 'Configure'}</span>
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </div>
      </button>

      {/* Expanded Settings */}
      {isOpen && (
        <div
          id="search-settings-panel"
          className="border-t border-[#262C28] p-4 space-y-4 bg-[#101311]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search Sensitivity */}
            <div className="space-y-2">
              <span className="block text-xs font-medium text-[#9A9C96]">Search sensitivity</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={config.sensitivity === 'standard'}
                  disabled={disabled}
                  onClick={() => handleSensitivityChange('standard')}
                  className={`flex flex-col items-start p-2.5 rounded-[2px] border text-left transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] ${
                    config.sensitivity === 'standard'
                      ? 'border-[#D4864A] bg-[#241A14] text-[#E6E4DD]'
                      : 'border-[#262C28] bg-[#141715] text-[#9A9C96] hover:text-[#E6E4DD] hover:border-[#363C38]'
                  }`}
                >
                  <span className="text-xs font-medium">Standard</span>
                  <span className="mt-0.5 text-[11px] text-[#9A9C96] leading-snug">
                    Standard threshold for persistent signals.
                  </span>
                </button>

                <button
                  type="button"
                  aria-pressed={config.sensitivity === 'high'}
                  disabled={disabled}
                  onClick={() => handleSensitivityChange('high')}
                  className={`flex flex-col items-start p-2.5 rounded-[2px] border text-left transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] ${
                    config.sensitivity === 'high'
                      ? 'border-[#D4864A] bg-[#241A14] text-[#E6E4DD]'
                      : 'border-[#262C28] bg-[#141715] text-[#9A9C96] hover:text-[#E6E4DD] hover:border-[#363C38]'
                  }`}
                >
                  <span
                    className={`text-xs font-medium ${config.sensitivity === 'high' ? 'text-[#D4864A]' : ''}`}
                  >
                    High sensitivity
                  </span>
                  <span className="mt-0.5 text-[11px] text-[#9A9C96] leading-snug">
                    Screens for faint and transient anomalies.
                  </span>
                </button>
              </div>
            </div>

            {/* Interference Rejection */}
            <div className="space-y-2">
              <span className="block text-xs font-medium text-[#9A9C96]">
                Terrestrial interference
              </span>
              <div className="rounded-[2px] border border-[#262C28] bg-[#141715] p-2.5 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#E6E4DD]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#529E72]" />
                    <span>Filter terrestrial RFI</span>
                  </div>
                  <span className="block text-[11px] text-[#9A9C96] leading-snug">
                    Rejects orbital satellite beacons and ground transmitter bands.
                  </span>
                </div>

                <button
                  type="button"
                  aria-pressed={config.rejectTerrestrialRfi}
                  disabled={disabled}
                  onClick={handleToggleRfi}
                  className={`shrink-0 rounded-[2px] border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] ${
                    config.rejectTerrestrialRfi
                      ? 'border-[#529E72]/40 bg-[#141F18] text-[#529E72]'
                      : 'border-[#262C28] bg-[#1A1E1B] text-[#9A9C96]'
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
