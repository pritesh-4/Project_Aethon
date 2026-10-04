import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges class names with Tailwind CSS deduplication and conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format radio astronomical frequency in MHz/GHz.
 */
export function formatFrequency(mhz: number): string {
  if (mhz >= 1000) {
    return `${(mhz / 1000).toFixed(4)} GHz`
  }
  return `${mhz.toFixed(3)} MHz`
}

/**
 * Format Signal-to-Noise Ratio (SNR) in decibels.
 */
export function formatSNR(snr: number): string {
  return `${snr > 0 ? '+' : ''}${snr.toFixed(1)} dB`
}

/**
 * Format timestamps into UTC ISO representation standard in astrophysics.
 */
export function formatTelemetryTime(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
}
