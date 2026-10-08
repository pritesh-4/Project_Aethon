import { useState } from 'react';
import { IMPLEMENTATION_MATRIX } from '../data/dossierData.ts';
import type { ImplementationCategory } from '../types.ts';
import { CheckCircle2, Clock, Cpu, Compass } from 'lucide-react';

export function ImplementationStatusSection() {
  const [activeFilter, setActiveFilter] = useState<ImplementationCategory | 'all'>('all');

  const filteredItems = IMPLEMENTATION_MATRIX.filter(
    (item) => activeFilter === 'all' || item.category === activeFilter
  );

  const getBadgeStyle = (category: ImplementationCategory) => {
    switch (category) {
      case 'implemented':
        return 'bg-[#3D7D54]/15 text-[#2E6040] border-[#3D7D54]/30';
      case 'prototype':
        return 'bg-[#376A9B]/15 text-[#2B547C] border-[#376A9B]/30';
      case 'target':
        return 'bg-[#C19348]/15 text-[#916B2E] border-[#C19348]/30';
      case 'future':
        return 'bg-[#7E8B96]/15 text-[#4E5862] border-[#7E8B96]/30';
    }
  };

  const getCategoryIcon = (category: ImplementationCategory) => {
    switch (category) {
      case 'implemented':
        return <CheckCircle2 className="h-3 w-3 inline mr-1 text-[#3D7D54]" />;
      case 'prototype':
        return <Clock className="h-3 w-3 inline mr-1 text-[#376A9B]" />;
      case 'target':
        return <Cpu className="h-3 w-3 inline mr-1 text-[#C19348]" />;
      case 'future':
        return <Compass className="h-3 w-3 inline mr-1 text-[#7E8B96]" />;
    }
  };

  return (
    <section id="implementation-status" className="space-y-6 scroll-mt-24">
      {/* Chapter Number & Title */}
      <div className="space-y-1 border-b border-[#E4E1D9] pb-3">
        <div className="font-mono text-xs text-[#376A9B] font-semibold tracking-wider uppercase">
          02 / Implementation Status
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#17202A] tracking-tight">
          System Verification & Status Matrix
        </h2>
        <p className="text-xs text-[#7E8B96] font-mono">
          Explicit division between active repository code, prototype demonstrations, target
          architectures, and future research.
        </p>
      </div>

      {/* Scientific Honesty Callout */}
      <div className="p-4 bg-[#FAF8F5] border-l-3 border-[#C19348] border border-[#D6D2C9] rounded-r-[2px] space-y-2">
        <div className="font-mono text-xs font-semibold text-[#17202A] uppercase tracking-wider flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#C19348]" />
          <span>Epistemological Distinction: Prototype vs Target Architecture</span>
        </div>
        <p className="text-xs sm:text-sm text-[#56616A] leading-relaxed">
          In strict adherence to scientific integrity, target machine-learning models, deep
          polyphase filterbanks, and telescope facility integrations described in this dossier are
          distinguished from software currently implemented in this repository. Target backend
          architectures represent research design specifications and should not be misconstrued as
          empirically pre-trained or benchmarked models.
        </p>
      </div>

      {/* Category Filter Controls */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {(
          [
            { id: 'all', label: 'All Components' },
            { id: 'implemented', label: 'Implemented Code' },
            { id: 'prototype', label: 'Prototype / Demo' },
            { id: 'target', label: 'Target Architecture' },
            { id: 'future', label: 'Future Research' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-mono transition-colors cursor-pointer border ${
              activeFilter === tab.id
                ? 'bg-[#17202A] text-[#FAF8F5] border-[#17202A] font-semibold'
                : 'bg-[#FAF8F5] text-[#56616A] border-[#D6D2C9] hover:bg-[#EAE7E0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Implementation Matrix Table */}
      <div className="overflow-x-auto border border-[#D6D2C9] rounded-[2px] bg-[#FAF8F5]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#EAE7E0] border-b border-[#D6D2C9] text-[#17202A] font-mono text-[11px]">
              <th className="py-2.5 px-3">Subsystem / Component</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Execution Scope</th>
              <th className="py-2.5 px-3">Repository Evidence</th>
              <th className="py-2.5 px-3">Technical Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E1D9] text-[#56616A]">
            {filteredItems.map((item) => (
              <tr key={item.component} className="hover:bg-[#F4F1EA] transition-colors">
                <td className="py-3 px-3 font-medium text-[#17202A] font-sans">{item.component}</td>
                <td className="py-3 px-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-[2px] border text-[10.5px] font-mono font-medium ${getBadgeStyle(
                      item.category
                    )}`}
                  >
                    {getCategoryIcon(item.category)}
                    {item.categoryLabel}
                  </span>
                </td>
                <td className="py-3 px-3 font-mono text-[11px] text-[#17202A] whitespace-nowrap">
                  {item.scope}
                </td>
                <td className="py-3 px-3 font-mono text-[11px] text-[#376A9B] whitespace-nowrap">
                  {item.evidence}
                </td>
                <td className="py-3 px-3 text-xs leading-relaxed max-w-xs">{item.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
