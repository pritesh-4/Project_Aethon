import type { Variants } from 'motion/react';

/**
 * Standard observatory panel entrance animation.
 * Smooth, subtle fade + vertical settle.
 */
export const panelVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

/**
 * Stagger container variant for scientific telemetry items.
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

/**
 * Sub-item variant for use inside staggerContainerVariants.
 */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: 'easeOut' },
  },
};
