import { useState } from 'react';
import { Link } from 'react-router';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import { observatoryAudio } from '@/lib/audio-synth.ts';

interface LandingHeaderProps {
  scrollYProgress: MotionValue<number>;
}

export function LandingHeader({ scrollYProgress }: LandingHeaderProps) {
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleToggleAudio = () => {
    const active = observatoryAudio.toggle();
    setIsAudioActive(active);
  };

  // During deep narrative (0.14 - 0.82), dim the header controls to keep attention locked on the signal
  const narrativeControlsOpacity = useTransform(
    scrollYProgress,
    [0.0, 0.12, 0.2, 0.78, 0.85],
    [1, 1, 0.35, 0.35, 1]
  );

  return (
    <header
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full z-30 select-none font-sans"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Understated wordmark */}
        <Link
          to="/"
          className="text-xs font-mono tracking-widest text-[#6A7E8F] hover:text-[#E3EBF2] transition-colors"
        >
          AETHON
        </Link>

        {/* Quiet controls with narrative-aware dimming */}
        <motion.div
          style={{ opacity: isHovered ? 1 : narrativeControlsOpacity }}
          className="flex items-center gap-4 text-xs font-mono transition-opacity duration-300"
        >
          <button
            type="button"
            onClick={handleToggleAudio}
            title={isAudioActive ? 'Mute Sonification' : 'Enable Sonification'}
            className="flex items-center gap-1.5 text-[#6A7E8F] hover:text-[#E3EBF2] transition-colors cursor-pointer py-1"
          >
            {isAudioActive ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-[#5C89B7]" />
                <span className="text-[#5C89B7] text-[11px]">Audio on</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-[#475766]" />
                <span className="text-[11px]">Audio off</span>
              </>
            )}
          </button>

          <Link
            to="/observatory"
            className="flex items-center gap-1 text-[#6A7E8F] hover:text-[#E3EBF2] transition-colors py-1 cursor-pointer"
          >
            <span>Observatory</span>
            <ArrowRight className="h-3 w-3 text-[#5C89B7]" />
          </Link>
        </motion.div>
      </div>

      {/* Whisper-quiet 1px scroll progress line */}
      <motion.div
        style={{ scaleX: scrollYProgress, transformOrigin: 'left' }}
        className="h-[1px] w-full bg-[#376A9B]/50"
      />
    </header>
  );
}
