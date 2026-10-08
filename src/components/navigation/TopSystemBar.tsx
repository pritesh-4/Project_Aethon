import { useLocation } from 'react-router';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils.ts';

export interface TopSystemBarProps {
  onOpenMobileNav: () => void;
  className?: string;
}

export function TopSystemBar({ onOpenMobileNav, className }: TopSystemBarProps) {
  const location = useLocation();

  const getSubsystemTitle = (path: string) => {
    if (path.startsWith('/observatory')) return 'Observe';
    if (path.startsWith('/discover')) return 'Discover';
    if (path.startsWith('/candidates')) return 'Candidates';
    if (path.startsWith('/analysis')) return 'Analysis';
    if (path.startsWith('/model')) return 'Method';
    if (path.startsWith('/archive')) return 'Archive';
    if (path.startsWith('/about')) return 'About';
    return 'Observe';
  };

  const activeSubsystem = getSubsystemTitle(location.pathname);

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-10 w-full shrink-0 border-b border-[#262C28] bg-[#131614] px-4 font-sans select-none flex items-center justify-between',
        className
      )}
    >
      {/* Left: Brand & Active Workspace */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open Navigation"
          title="Open Navigation"
          className="lg:hidden flex h-7 w-7 items-center justify-center rounded-[2px] border border-[#262C28] bg-[#1A1E1B] text-[#9A9C96] hover:text-[#E6E4DD] hover:border-[#363C38] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
        >
          <Menu className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-sans">
          <span className="text-[#9A9C96] font-mono tracking-wider text-[11px]">AETHON</span>
          <span className="text-[#363C38]">/</span>
          <span className="text-[#E6E4DD] font-medium">{activeSubsystem}</span>
        </div>
      </div>

      {/* Right: Subtle Scientific Context */}
      <div className="flex items-center gap-2 text-xs text-[#9A9C96]">
        <span className="text-[11px] font-mono hidden sm:inline text-[#6B706A]">
          CH-1420.405 MHz · LIVE
        </span>
      </div>
    </header>
  );
}
