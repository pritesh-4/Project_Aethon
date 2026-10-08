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
    <div className="border border-[#242825] bg-[#0F1110] select-none rounded-[2px] font-sans">
      {/* Header / Accordion Toggle */}
      <button
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        aria-controls="search-settings-panel"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-[#141715] cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
      >
        <div className="flex items-center gap-2.5">
          <Sliders className="h-3.5 w-3.5 text-[#D4864A]" />
          <span className="text-xs font-medium text-[#E6E4DD]">Search Parameters</span>
          <span className="text-[#363C38]">•</span>
          <span className="text-[11px] font-mono text-[#848780]">
            {config.sensitivity === 'standard' ? 'Standard sensitivity' : 'High sensitivity'} /{' '}
            {config.rejectTerrestrialRfi ? 'RFI rejection active' : 'RFI rejection bypass'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-[#767973]">
          <span>{isOpen ? 'COLLAPSE' : 'CONFIGURE'}</span>
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>
      </button>

      {/* Expanded Settings */}
      {isOpen && (
        <div
          id="search-settings-panel"
          className="border-t border-[#242825] px-4 py-3 bg-[#0B0D0C]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Search Sensitivity */}
            <div className="space-y-2">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-[#767973]">
                Detection Sensitivity
              </span>
              <div className="flex items-center rounded-[2px] border border-[#242825] bg-[#121513] p-0.5">
                <button
                  type="button"
                  aria-pressed={config.sensitivity === 'standard'}
                  disabled={disabled}
                  onClick={() => handleSensitivityChange('standard')}
                  className={`flex-1 py-1.5 px-3 text-xs font-mono transition-colors text-center cursor-pointer outline-none ${
                    config.sensitivity === 'standard'
                      ? 'bg-[#221B16] text-[#D4864A] font-semibold'
                      : 'text-[#848780] hover:text-[#C9C8C0]'
                  }`}
                >
                  STANDARD
                </button>
                <button
                  type="button"
                  aria-pressed={config.sensitivity === 'high'}
                  disabled={disabled}
                  onClick={() => handleSensitivityChange('high')}
                  className={`flex-1 py-1.5 px-3 text-xs font-mono transition-colors text-center cursor-pointer outline-none ${
                    config.sensitivity === 'high'
                      ? 'bg-[#221B16] text-[#D4864A] font-semibold'
                      : 'text-[#848780] hover:text-[#C9C8C0]'
                  }`}
                >
                  HIGH SENSITIVITY
                </button>
              </div>
              <p className="text-[11px] text-[#767973] leading-snug">
                {config.sensitivity === 'standard'
                  ? 'Baseline threshold targeting persistent, high-SNR coherent anomalies.'
                  : 'Screens for faint, transient, or drift-accelerating signals with relaxed threshold.'}
              </p>
            </div>

            {/* Interference Rejection */}
            <div className="space-y-2">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-[#767973]">
                Interference Filtering
              </span>
              <div className="flex items-center justify-between border border-[#242825] bg-[#121513] px-3 py-2 rounded-[2px]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#529E72]" />
                  <span className="text-xs text-[#E6E4DD]">Terrestrial RFI rejection</span>
                </div>
                <button
                  type="button"
                  aria-pressed={config.rejectTerrestrialRfi}
                  disabled={disabled}
                  onClick={handleToggleRfi}
                  className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer ${
                    config.rejectTerrestrialRfi
                      ? 'border border-[#529E72]/40 bg-[#141F18] text-[#529E72]'
                      : 'border border-[#242825] bg-[#171917] text-[#767973]'
                  }`}
                >
                  {config.rejectTerrestrialRfi ? 'FILTER ON' : 'BYPASS'}
                </button>
              </div>
              <p className="text-[11px] text-[#767973] leading-snug">
                Rejects orbital satellite transponders and persistent terrestrial transmitter
                channels.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
