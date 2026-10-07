import { useState } from 'react';
import { Link } from 'react-router';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { motion, type MotionValue } from 'motion/react';
import { observatoryAudio } from '@/lib/audio-synth.ts';

interface LandingHeaderProps {
  scrollYProgress: MotionValue<number>;
}

export function LandingHeader({ scrollYProgress }: LandingHeaderProps) {
  const [isAudioActive, setIsAudioActive] = useState(false);

  const handleToggleAudio = () => {
    const active = observatoryAudio.toggle();
    setIsAudioActive(active);
  };

  return (
    <header className="relative w-full z-30 select-none font-sans">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Understated wordmark */}
        <Link
          to="/"
          className="text-xs font-mono tracking-widest text-[#7F8B95] hover:text-[#E6EDF2] transition-colors"
        >
          AETHON
        </Link>

        {/* Quiet controls */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <button
            type="button"
            onClick={handleToggleAudio}
            title={isAudioActive ? 'Mute Sonification' : 'Enable Sonification'}
            className="flex items-center gap-1.5 text-[#7F8B95] hover:text-[#E6EDF2] transition-colors cursor-pointer py-1"
          >
            {isAudioActive ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-[#5BD8F5]" />
                <span className="text-[#5BD8F5] text-[11px]">Audio on</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-[#7F8B95]" />
                <span className="text-[11px]">Audio off</span>
              </>
            )}
          </button>

          <Link
            to="/observatory"
            className="flex items-center gap-1 text-[#7F8B95] hover:text-[#5BD8F5] transition-colors py-1 cursor-pointer"
          >
            <span>Observatory</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Whisper-quiet 1px scroll progress line */}
      <motion.div
        style={{ scaleX: scrollYProgress, transformOrigin: 'left' }}
        className="h-[1px] w-full bg-[#5BD8F5]/30"
      />
    </header>
  );
}
