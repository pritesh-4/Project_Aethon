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
    if (path.startsWith('/model')) return 'Model';
    if (path.startsWith('/archive')) return 'Archive';
    if (path.startsWith('/about')) return 'About';
    return 'Observatory';
  };

  const activeSubsystem = getSubsystemTitle(location.pathname);

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-11 w-full shrink-0 border-b border-[#172230] bg-[#0B0F14] px-4 font-sans select-none flex items-center justify-between',
        className
      )}
    >
      {/* Left: Product & Subsystem Breadcrumb */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open Navigation"
          title="Open Navigation"
          className="lg:hidden flex h-7 w-7 items-center justify-center rounded-[4px] border border-[#172230] bg-[#10161D] text-[#7F8B95] hover:text-[#E6EDF2] hover:border-[#243345] transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-[#E6EDF2]">Aethon</span>
          <span className="text-[#7F8B95]">/</span>
          <span className="text-[#E6EDF2] font-medium text-xs sm:text-sm">{activeSubsystem}</span>
        </div>
      </div>
    </header>
  );
}
