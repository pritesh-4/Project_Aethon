import { useState, useEffect } from 'react';
import { api, isDemoMode } from '@/lib/api.ts';
import type { HealthStatus } from '@/types/schemas.ts';
import { CheckCircle2, AlertCircle, Cpu, Radio } from 'lucide-react';

export function ModelHeader() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    api
      .getHealth()
      .then((res) => {
        if (isMounted) {
          setHealth(res);
          setIsLive(res.status === 'healthy' || res.status === 'ok');
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLive(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 select-none font-sans">
      {/* Page Identity & Service Telemetry Strip */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#76828D] uppercase tracking-wider">
            <span>AETHON ARCHITECTURE</span>
            <span>/</span>
            <span>METHODOLOGY</span>
          </div>

          {/* Backend Service Status Badge */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {isLive ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#3D7D54]/10 border border-[#3D7D54]/30 text-[#2B573A]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#3D7D54]" />
                <span>FastAPI Service Online</span>
                <span className="text-[#3D7D54]/60">·</span>
                <span>v{health?.version || '1.0.0'}</span>
              </div>
            ) : isDemoMode() ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#C19348]/10 border border-[#C19348]/30 text-[#8C621E]">
                <Radio className="h-3.5 w-3.5 text-[#C19348]" />
                <span>Local Demonstration Mode Active</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#9E6E20]/10 border border-[#9E6E20]/30 text-[#735017]">
                <AlertCircle className="h-3.5 w-3.5 text-[#9E6E20]" />
                <span>Backend Connecting...</span>
              </div>
            )}
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#17202A] font-serif">
          Methodology
        </h1>
        <p className="text-sm text-[#56616A] leading-relaxed max-w-xl">
          Unsupervised representation, continuous manifold learning, and statistical deviation
          isolation in high-cadence radio astronomy.
        </p>
      </div>

      {/* The Core Question (Editorial Serif Typography) */}
      <div className="pt-4 border-t border-[#D6D2C9] space-y-3">
        <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#17202A] font-serif">
          How do we detect something we do not know the shape of?
        </h2>

        <p className="text-sm text-[#56616A] leading-relaxed max-w-3xl">
          A standard classifier asks{' '}
          <strong className="text-[#17202A] font-semibold">“What is this?”</strong> and attempts to
          force uncataloged phenomena into predefined taxonomy. AETHON operates under a different
          assumption:{' '}
          <strong className="text-[#376A9B] font-semibold">
            “Does this observation fit our baseline understanding?”
          </strong>
          — mapping the high-dimensional manifold of nominal cosmic background and isolating
          observations that deviate significantly from expected distributions.
        </p>

        {/* 3 Core Philosophical Pillars: Clean Horizontal Rule Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 border-t border-[#D6D2C9]">
          <div className="space-y-1.5">
            <span className="text-[11px] text-[#76828D] font-mono block uppercase tracking-wider">
              01 · Standard Classification
            </span>
            <span className="text-sm font-semibold text-[#17202A] block">“What is this?”</span>
            <p className="text-xs text-[#56616A] leading-relaxed">
              Constrained to pre-defined classes, existing catalogs, and historical training labels.
              Blind to novel morphology.
            </p>
          </div>

          <div className="space-y-1.5 md:border-l md:border-[#D6D2C9] md:pl-6">
            <span className="text-[11px] text-[#376A9B] font-mono block uppercase tracking-wider font-semibold">
              02 · Anomaly Isolation
            </span>
            <span className="text-sm font-semibold text-[#376A9B] block">“Does this belong?”</span>
            <p className="text-xs text-[#56616A] leading-relaxed">
              Measures whether an observation departs from the learned manifold of natural
              astrophysical emissions.
            </p>
          </div>

          <div className="space-y-1.5 md:border-l md:border-[#D6D2C9] md:pl-6">
            <span className="text-[11px] text-[#76828D] font-mono block uppercase tracking-wider">
              03 · Research Hypothesis
            </span>
            <span className="text-sm font-semibold text-[#17202A] block">
              Investigating deviation
            </span>
            <p className="text-xs text-[#56616A] leading-relaxed">
              Surfaces coherent non-terrestrial signals that deviate from both cataloged emitters
              and local interference.
            </p>
          </div>
        </div>

        {/* Live Operational Detector Stack Ribbon */}
        <div className="mt-4 p-4 rounded-[2px] border border-[#D6D2C9] bg-[#FAF8F5] text-xs font-mono space-y-2">
          <div className="flex items-center gap-2 text-[#17202A] font-semibold">
            <Cpu className="h-4 w-4 text-[#376A9B]" />
            <span>Active Scientific Pipeline Detectors</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[#56616A] pt-1">
            <div className="border-l-2 border-[#376A9B] pl-2.5">
              <span className="text-[#17202A] font-semibold block">Baseline Statistics</span>
              <span>MAD robust dispersion + 3σ thresholding</span>
            </div>
            <div className="border-l-2 border-[#376A9B] pl-2.5">
              <span className="text-[#17202A] font-semibold block">Isolation Forest</span>
              <span>100 estimators over 5-D spectral features</span>
            </div>
            <div className="border-l-2 border-[#376A9B] pl-2.5">
              <span className="text-[#3D7D54] font-semibold block">OLS Drift Estimator</span>
              <span>Linear regression df/dt with analytical variance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
