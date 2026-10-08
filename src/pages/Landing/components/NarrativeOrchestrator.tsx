import { Link } from 'react-router';
import { motion, useTransform, useReducedMotion, type MotionValue } from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface NarrativeOrchestratorProps {
  scrollYProgress: MotionValue<number>;
}

export function NarrativeOrchestrator({ scrollYProgress }: NarrativeOrchestratorProps) {
  const shouldReduceMotion = useReducedMotion();

  // BEAT 1: 0.00 - 0.16 (THE SKY IS FULL OF SIGNALS.)
  const opacity1 = useTransform(scrollYProgress, [0.0, 0.02, 0.12, 0.16], [1, 1, 1, 0]);
  const y1 = useTransform(
    scrollYProgress,
    [0.0, 0.02, 0.12, 0.16],
    shouldReduceMotion ? [0, 0, 0, 0] : [0, 0, 0, -8]
  );

  // BEAT 2: 0.16 - 0.33 (MOST ARE KNOWN.)
  const opacity2 = useTransform(scrollYProgress, [0.16, 0.2, 0.29, 0.33], [0, 1, 1, 0]);
  const y2 = useTransform(
    scrollYProgress,
    [0.16, 0.2, 0.29, 0.33],
    shouldReduceMotion ? [0, 0, 0, 0] : [8, 0, 0, -8]
  );

  // BEAT 3: 0.33 - 0.50 (SOME ARE NOT.)
  const opacity3 = useTransform(scrollYProgress, [0.33, 0.37, 0.46, 0.5], [0, 1, 1, 0]);
  const y3 = useTransform(
    scrollYProgress,
    [0.33, 0.37, 0.46, 0.5],
    shouldReduceMotion ? [0, 0, 0, 0] : [8, 0, 0, -8]
  );

  // BEAT 4: 0.50 - 0.67 (AETHON SEARCHES THE DIFFERENCE.)
  const opacity4 = useTransform(scrollYProgress, [0.5, 0.54, 0.63, 0.67], [0, 1, 1, 0]);
  const y4 = useTransform(
    scrollYProgress,
    [0.5, 0.54, 0.63, 0.67],
    shouldReduceMotion ? [0, 0, 0, 0] : [8, 0, 0, -8]
  );

  // BEAT 5: 0.67 - 0.83 (ANOMALY IS NOT AN ANSWER. IT IS A REASON TO LOOK CLOSER.)
  const opacity5 = useTransform(scrollYProgress, [0.67, 0.71, 0.79, 0.83], [0, 1, 1, 0]);
  const y5 = useTransform(
    scrollYProgress,
    [0.67, 0.71, 0.79, 0.83],
    shouldReduceMotion ? [0, 0, 0, 0] : [8, 0, 0, -8]
  );

  // BEAT 6: 0.83 - 1.00 (ENTER THE OBSERVATORY →)
  const opacity6 = useTransform(scrollYProgress, [0.83, 0.88, 1.0], [0, 1, 1]);
  const y6 = useTransform(
    scrollYProgress,
    [0.83, 0.88, 1.0],
    shouldReduceMotion ? [0, 0, 0] : [8, 0, 0]
  );

  // Pointer events enabled only for the final interactive action beat
  const pointerEvents6 = useTransform(scrollYProgress, (v) => (v >= 0.85 ? 'auto' : 'none'));

  // Gentle initial scroll indicator
  const scrollHintOpacity = useTransform(scrollYProgress, [0.0, 0.04], [0.6, 0]);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 select-none pointer-events-none z-20 font-sans">
      <div className="relative w-full max-w-2xl text-center flex items-center justify-center min-h-[260px]">
        {/* BEAT 1: AETHON / The sky is full of signals. */}
        <motion.div
          style={{ opacity: opacity1, y: y1 }}
          className="absolute inset-x-0 mx-auto px-4 pointer-events-none"
        >
          <p className="text-xs tracking-widest text-[#7F8B95] uppercase font-mono mb-4">AETHON</p>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-light tracking-tight text-[#E6EDF2] leading-tight">
            The sky is full of signals.
          </h1>
        </motion.div>

        {/* BEAT 2: Most are known. */}
        <motion.div
          style={{ opacity: opacity2, y: y2 }}
          className="absolute inset-x-0 mx-auto px-4 pointer-events-none"
        >
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-light tracking-tight text-[#E6EDF2] leading-tight">
            Most are known.
          </h2>
        </motion.div>

        {/* BEAT 3: Some are not. */}
        <motion.div
          style={{ opacity: opacity3, y: y3 }}
          className="absolute inset-x-0 mx-auto px-4 pointer-events-none"
        >
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-light tracking-tight text-[#5BD8F5] leading-tight">
            Some are not.
          </h2>
        </motion.div>

        {/* BEAT 4: AETHON searches the difference. */}
        <motion.div
          style={{ opacity: opacity4, y: y4 }}
          className="absolute inset-x-0 mx-auto px-4 pointer-events-none"
        >
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-light tracking-tight text-[#E6EDF2] leading-tight">
            AETHON searches the difference.
          </h2>
        </motion.div>

        {/* BEAT 5: Anomaly is not an answer. It is a reason to look closer. */}
        <motion.div
          style={{ opacity: opacity5, y: y5 }}
          className="absolute inset-x-0 mx-auto px-4 pointer-events-none"
        >
          <h2 className="text-2xl sm:text-4xl font-light tracking-tight text-[#E6EDF2] leading-tight">
            Anomaly is not an answer.
          </h2>
          <p className="mt-3 text-sm sm:text-base font-light text-[#7F8B95]">
            It is a reason to look closer.
          </p>
        </motion.div>

        {/* BEAT 6: Enter the observatory → */}
        <motion.div
          style={{ opacity: opacity6, y: y6, pointerEvents: pointerEvents6 }}
          className="absolute inset-x-0 mx-auto px-4"
        >
          <h2 className="text-2xl sm:text-4xl font-light tracking-tight text-[#E6EDF2] leading-tight mb-8">
            Enter the observatory.
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/observatory"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-[#10161D] text-[#5BD8F5] border border-[#5BD8F5]/60 hover:bg-[#15202B] hover:border-[#5BD8F5] transition-all text-xs font-medium cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5]"
            >
              <span>Launch console</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              to="/candidates"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-[#7F8B95] hover:text-[#E6EDF2] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] rounded"
            >
              <span>Review candidate events</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Gentle Initial Scroll Indicator */}
      <motion.div
        style={{ opacity: scrollHintOpacity }}
        className="absolute bottom-10 inset-x-0 mx-auto flex flex-col items-center gap-1 text-[11px] text-[#7F8B95] font-mono pointer-events-none"
      >
        <span>Scroll to continue</span>
        <ChevronDown className="h-3.5 w-3.5 text-[#5BD8F5]/70" />
      </motion.div>
    </div>
  );
}
