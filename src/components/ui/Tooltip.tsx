import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils.ts';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'right' | 'top' | 'bottom' | 'left';
  disabled?: boolean;
  className?: string;
  delay?: number;
}

export function Tooltip({
  content,
  children,
  position = 'right',
  disabled = false,
  className,
  delay = 120,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  const handleMouseEnter = () => {
    if (disabled || !content) return;
    const id = window.setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const positionStyles = {
    right: 'left-full ml-2.5 top-1/2 -translate-y-1/2',
    left: 'right-full mr-2.5 top-1/2 -translate-y-1/2',
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  };

  const initialMotion = {
    right: { opacity: 0, x: -4 },
    left: { opacity: 0, x: 4 },
    top: { opacity: 0, y: 4 },
    bottom: { opacity: 0, y: -4 },
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {isVisible && !disabled && (
          <motion.div
            initial={initialMotion[position]}
            animate={{
              opacity: 1,
              x: 0,
              y: position === 'right' || position === 'left' ? '-50%' : 0,
            }}
            exit={initialMotion[position]}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="tooltip"
            className={cn(
              'pointer-events-none absolute z-50 whitespace-nowrap rounded-[4px] border border-[#243345] bg-[#10161D] px-2.5 py-1 font-sans text-xs text-[#E6EDF2] tracking-normal select-none shadow-md',
              positionStyles[position],
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
