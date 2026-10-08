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
        'sticky top-0 z-20 h-11 w-full shrink-0 border-b border-[#D6D2C9] bg-[#FAF8F5] px-4 sm:px-6 font-sans select-none flex items-center justify-between',
        className
      )}
    >
      {/* Left: Brand & Active Workspace */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open Navigation"
          title="Open Navigation"
          className="lg:hidden flex h-7 w-7 items-center justify-center rounded-[2px] border border-[#D6D2C9] bg-[#EAE7E0] text-[#56616A] hover:text-[#17202A] hover:border-[#BCB6A8] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B]"
        >
          <Menu className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-sans">
          <span className="text-[#7E8B96] font-mono tracking-wider text-[11px]">AETHON</span>
          <span className="text-[#D6D2C9]">/</span>
          <span className="text-[#17202A] font-semibold">{activeSubsystem}</span>
        </div>
      </div>

      {/* Right: Stable Scientific Orientation Context */}
      <div className="flex items-center gap-3 text-xs text-[#56616A]">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3D7D54]" />
          <span className="text-[11px] font-mono text-[#56616A]">1420.405 MHz</span>
        </div>
        <span className="text-[#D6D2C9] hidden sm:inline">|</span>
        <span className="text-[11px] font-mono hidden sm:inline text-[#7E8B96]">
          HI LINE SURVEY
        </span>
      </div>
    </header>
  );
}
