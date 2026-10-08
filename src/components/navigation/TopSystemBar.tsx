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
    if (path.startsWith('/observatory')) return 'Observatory';
    if (path.startsWith('/discover')) return 'Discovery';
    if (path.startsWith('/candidates')) return 'Candidates';
    if (path.startsWith('/analysis')) return 'Analysis';
    if (path.startsWith('/model')) return 'Intelligence';
    if (path.startsWith('/archive')) return 'Archive';
    if (path.startsWith('/about')) return 'About';
    return 'Observatory';
  };

  const activeSubsystem = getSubsystemTitle(location.pathname);

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-10 w-full shrink-0 border-b border-[#172230] bg-[#0B0F14] px-4 font-sans select-none flex items-center justify-between',
        className
      )}
    >
      {/* Left: Brand / Current Section Breadcrumb */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open Navigation"
          title="Open Navigation"
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded border border-[#172230] bg-[#10161D] text-[#7F8B95] hover:text-[#E6EDF2] hover:border-[#243345] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5]"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-xs font-sans">
          <span className="text-[#7F8B95] font-semibold">Aethon</span>
          <span className="text-[#243345]">/</span>
          <span className="text-[#E6EDF2] font-medium">{activeSubsystem}</span>
        </div>
      </div>

      {/* Right: Subtle Session Context */}
      <div className="flex items-center gap-2 text-xs text-[#7F8B95]">
        <span className="text-[11px] hidden sm:inline">Active session</span>
      </div>
    </header>
  );
}
