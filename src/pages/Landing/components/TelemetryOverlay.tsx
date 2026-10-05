import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Volume2, VolumeX, Activity, ArrowRight } from 'lucide-react';
import { observatoryAudio } from '@/lib/audio-synth.ts';
import { formatTelemetryTime } from '@/lib/utils.ts';

interface TelemetryOverlayProps {
  progress: number;
  currentSectionIndex: number;
  onNavigateToSection: (sectionIndex: number) => void;
}

const SECTIONS = [
  { id: 0, code: '01', title: 'Context' },
  { id: 1, code: '02', title: 'Data Volume' },
  { id: 2, code: '03', title: 'Signal Anomaly' },
  { id: 3, code: '04', title: 'Representation' },
  { id: 4, code: '05', title: 'Candidate Event' },
  { id: 5, code: '06', title: 'Observatory' },
];

export function TelemetryOverlay({
  progress,
  currentSectionIndex,
  onNavigateToSection,
}: TelemetryOverlayProps) {
  const [time, setTime] = useState<string>(formatTelemetryTime());
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatTelemetryTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleAudio = () => {
    const active = observatoryAudio.toggle();
    setIsAudioActive(active);
  };

  const progressPercent = Math.min(100, Math.max(0, Math.round(progress * 100)));

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 text-[#7F8B95] font-sans text-xs select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-[#172230] pb-3 bg-[#06080B]/80">
        {/* Left: Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[#E6EDF2]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
            <span className="font-semibold text-xs tracking-wider">AETHON</span>
            <span className="text-[11px] text-[#7F8B95] font-normal hidden sm:inline">
              Signal Discovery
            </span>
          </div>

          <span className="text-[#243345] hidden sm:inline">|</span>

          <span className="text-[11px] text-[#7F8B95] hidden md:inline">
            Demonstration Environment
          </span>
        </div>

        {/* Right: Audio toggle & Direct Console Link */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <span className="text-[#7F8B95] font-mono text-[11px] tabular-nums hidden sm:inline">
            {time}
          </span>

          <button
            onClick={handleToggleAudio}
            title={isAudioActive ? 'Mute Sonification' : 'Enable Sonification'}
            className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] border border-[#172230] bg-[#10161D] hover:border-[#243345] hover:text-[#E6EDF2] transition-colors text-xs cursor-pointer"
          >
            {isAudioActive ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-[#5BD8F5]" />
                <span className="text-[#5BD8F5]">Audio on</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-[#7F8B95]" />
                <span className="text-[#7F8B95]">Audio off</span>
              </>
            )}
          </button>

          <Link
            to="/observatory"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border border-[#5BD8F5]/40 bg-[#10161D] text-[#5BD8F5] hover:border-[#5BD8F5] transition-colors text-xs"
          >
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Observatory</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Side Narrative Index (Desktop) */}
      <div className="pointer-events-auto hidden md:flex flex-col gap-1 fixed left-6 top-1/2 -translate-y-1/2 z-30">
        <div className="text-[10px] text-[#7F8B95] mb-1 font-medium">Sections</div>
        {SECTIONS.map((sec, index) => {
          const isActive = currentSectionIndex === index;
          return (
            <button
              key={sec.id}
              onClick={() => onNavigateToSection(index)}
              className={`flex items-center gap-2.5 py-1 text-left transition-all group cursor-pointer ${
                isActive ? 'text-[#5BD8F5] font-medium pl-1' : 'text-[#7F8B95] hover:text-[#E6EDF2]'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  isActive ? 'bg-[#5BD8F5] scale-110' : 'bg-[#243345] group-hover:bg-[#7F8B95]'
                }`}
              />
              <span className="font-mono text-[10px]">{sec.code}</span>
              <span className="text-xs">{sec.title}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Progress Bar */}
      <div className="flex items-center justify-between border-t border-[#172230] pt-3 bg-[#06080B]/80">
        <div className="flex items-center gap-2 text-xs text-[#7F8B95]">
          <span>
            {SECTIONS[currentSectionIndex]?.code} • {SECTIONS[currentSectionIndex]?.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7F8B95]">Progress</span>
          <div className="w-20 h-1 bg-[#10161D] rounded-full overflow-hidden border border-[#172230]">
            <div
              className="h-full bg-[#5BD8F5] transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[#5BD8F5] font-mono tabular-nums text-xs font-medium w-8 text-right">
            {progressPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}
