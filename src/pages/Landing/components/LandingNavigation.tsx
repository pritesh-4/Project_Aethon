import { useState } from 'react';
import { Link } from 'react-router';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { observatoryAudio } from '@/lib/audio-synth.ts';

interface LandingNavigationProps {
  progress: number;
}

export function LandingNavigation({ progress }: LandingNavigationProps) {
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleToggleAudio = () => {
    const active = observatoryAudio.toggle();
    setIsAudioActive(active);
  };

  // Chapter derivation based on narrative progress
  let chapter = '01 · Observatory';
  if (progress > 0.94) {
    chapter = '06 · Candidate lock';
  } else if (progress > 0.81) {
    chapter = '05 · Spectrogram quiet zone';
  } else if (progress > 0.62) {
    chapter = '04 · Spectral deviation';
  } else if (progress > 0.35) {
    chapter = '03 · Population';
  } else if (progress > 0.15) {
    chapter = '02 · Observation beam';
  }

  // Dim during deep cinematic journey (0.15 - 0.85) unless hovered
  const isDeepCinematic = progress > 0.15 && progress < 0.85;
  const opacity = isHovered ? 1.0 : isDeepCinematic ? 0.35 : 0.9;

  return (
    <header
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ opacity }}
      className="relative w-full z-30 select-none font-sans transition-opacity duration-200"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Wordmark */}
        <Link
          to="/"
          className="text-xs font-mono font-medium text-[#8CA0B2] hover:text-[#E3EBF2] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[#5C89B7] rounded-[2px]"
        >
          AETHON
        </Link>

        {/* Narrative Chapter Indicator */}
        <div className="text-xs font-mono text-[#5C89B7]">{chapter}</div>

        {/* Controls */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <button
            type="button"
            onClick={handleToggleAudio}
            title={isAudioActive ? 'Mute atmosphere' : 'Enable atmosphere'}
            className="flex items-center gap-1.5 text-[#8CA0B2] hover:text-[#E3EBF2] transition-colors cursor-pointer py-1 outline-none focus-visible:ring-1 focus-visible:ring-[#5C89B7] rounded-[2px]"
          >
            {isAudioActive ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-[#5C89B7]" />
                <span className="text-[#5C89B7] text-[11px] hidden sm:inline">Audio on</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-[#6A7E8F]" />
                <span className="text-[11px] hidden sm:inline">Audio off</span>
              </>
            )}
          </button>

          <Link
            to="/observatory"
            className="flex items-center gap-1.5 text-[#8CA0B2] hover:text-[#E3EBF2] transition-colors py-1 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5C89B7] rounded-[2px]"
          >
            <span className="hidden sm:inline">Observatory</span>
            <ArrowRight className="h-3 w-3 text-[#5C89B7]" />
          </Link>
        </div>
      </div>

      {/* 1px narrative progress bar */}
      <div className="h-[1px] w-full bg-[#182635]">
        <div
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          className="h-full bg-[#376A9B] transition-[width] duration-75 ease-out"
        />
      </div>
    </header>
  );
}
