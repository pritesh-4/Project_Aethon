import { useState, useEffect } from 'react';
import { TABLE_OF_CONTENTS } from '../data/dossierData.ts';
import { ListFilter, ChevronDown, ChevronUp } from 'lucide-react';

interface TableOfContentsProps {
  activeSectionId: string;
}

export function TableOfContents({ activeSectionId }: TableOfContentsProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile dropdown on scroll or selection
  const handleScrollTo = (id: string) => {
    setIsMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const topOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Mobile / Tablet Collapsible Navigation Bar */}
      <div className="lg:hidden w-full mb-6 sticky top-14 z-20 bg-[#F4F1EA]/95 backdrop-blur-xs border-b border-[#D6D2C9] py-2">
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-[#17202A] bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px]"
        >
          <div className="flex items-center gap-2">
            <ListFilter className="h-3.5 w-3.5 text-[#376A9B]" />
            <span>TABLE OF CONTENTS ({TABLE_OF_CONTENTS.length} SECTIONS)</span>
          </div>
          {isMobileOpen ? (
            <ChevronUp className="h-4 w-4 text-[#7E8B96]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#7E8B96]" />
          )}
        </button>

        {isMobileOpen && (
          <nav
            aria-label="Mobile Table of Contents"
            className="mt-2 max-h-72 overflow-y-auto bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] p-2 space-y-1 shadow-md"
          >
            {TABLE_OF_CONTENTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleScrollTo(item.id)}
                className={`w-full text-left px-2 py-1.5 rounded-[2px] text-xs flex items-baseline gap-2 transition-colors ${
                  activeSectionId === item.id
                    ? 'bg-[#376A9B]/10 text-[#376A9B] font-semibold'
                    : 'text-[#56616A] hover:bg-[#EAE7E0]'
                }`}
              >
                <span className="font-mono text-[10px] text-[#7E8B96]">{item.number}</span>
                <span className="truncate">{item.title}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Desktop Sticky Left Rail */}
      <aside
        aria-label="Table of Contents"
        className="hidden lg:block w-64 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-4 select-none"
      >
        <div className="text-[11px] font-mono uppercase tracking-wider text-[#7E8B96] mb-3 flex items-center gap-2 font-semibold border-b border-[#E4E1D9] pb-2">
          <span>Table of Contents</span>
          <span className="text-[10px] text-[#A3ADB6]">({TABLE_OF_CONTENTS.length})</span>
        </div>

        <nav className="space-y-0.5 text-xs">
          {TABLE_OF_CONTENTS.map((item) => {
            const isActive = activeSectionId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleScrollTo(item.id)}
                className={`w-full text-left py-1.5 px-2 rounded-[2px] flex items-baseline gap-2 transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-[#EAE7E0] text-[#17202A] font-medium border-l-2 border-[#376A9B]'
                    : 'text-[#56616A] hover:text-[#17202A] hover:bg-[#FAF8F5]'
                }`}
              >
                <span
                  className={`font-mono text-[10.5px] transition-colors ${
                    isActive
                      ? 'text-[#376A9B] font-semibold'
                      : 'text-[#7E8B96] group-hover:text-[#56616A]'
                  }`}
                >
                  {item.number}
                </span>
                <span className="truncate leading-tight font-sans">{item.title}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
