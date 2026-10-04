import type { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

/**
 * Global application providers wrapper for AETHON Observatory.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {children}
    </>
  )
}
