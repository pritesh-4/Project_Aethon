import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Filter } from 'lucide-react';

interface ClusterPoint {
  x: number;
  y: number;
  category: 'NOISE' | 'PULSAR' | 'RFI' | 'MASER' | 'CANDIDATE';
  label: string;
  id: string;
}

export function ConceptualLatentSpace() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredPoint, setHoveredPoint] = useState<ClusterPoint | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'KNOWN' | 'ANOMALOUS'>('ALL');

  const pointsRef = useRef<ClusterPoint[]>([]);

  useEffect(() => {
    const pts: ClusterPoint[] = [];

    // Cluster 1: Thermal Background Noise (center around -0.35, -0.2)
    for (let i = 0; i < 70; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.22;
      pts.push({
        x: -0.35 + Math.cos(angle) * radius,
        y: -0.2 + Math.sin(angle) * radius,
        category: 'NOISE',
        label: 'Astrophysical thermal noise floor',
        id: `NOISE-${1000 + i}`,
      });
    }

    // Cluster 2: Pulsar & Periodic Transients (center around 0.25, -0.3)
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.16;
      pts.push({
        x: 0.25 + Math.cos(angle) * radius,
        y: -0.3 + Math.sin(angle) * radius,
        category: 'PULSAR',
        label: 'Cataloged pulsar harmonics',
        id: `PSR-${2000 + i}`,
      });
    }

    // Cluster 3: Satellite RFI / Ground Transmitters (center around -0.15, 0.35)
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.18;
      pts.push({
        x: -0.15 + Math.cos(angle) * radius,
        y: 0.35 + Math.sin(angle) * radius,
        category: 'RFI',
        label: 'Terrestrial / orbital satellite RFI',
        id: `RFI-${3000 + i}`,
      });
    }

    // Cluster 4: Interstellar Masers (center around 0.35, 0.2)
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.14;
      pts.push({
        x: 0.35 + Math.cos(angle) * radius,
        y: 0.2 + Math.sin(angle) * radius,
        category: 'MASER',
        label: 'Hydroxyl / methanol maser profile',
        id: `MSR-${4000 + i}`,
      });
    }

    // High-Anomaly Candidate Outliers (Clearly separated)
    pts.push({
      x: 0.65,
      y: 0.6,
      category: 'CANDIDATE',
      label: 'Narrowband persistent carrier (AET-4892)',
      id: 'AET-4892',
    });

    pts.push({
      x: -0.6,
      y: 0.55,
      category: 'CANDIDATE',
      label: 'Accelerating Doppler chirp (AET-4901)',
      id: 'AET-4901',
    });

    pts.push({
      x: 0.7,
      y: -0.5,
      category: 'CANDIDATE',
      label: 'Ultra-narrow drift carrier (AET-5120)',
      id: 'AET-5120',
    });

    pointsRef.current = pts;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth;
      height = container.clientHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);

    const render = () => {
      ctx.fillStyle = '#0B0D0C';
      ctx.fillRect(0, 0, width, height);

      const cx = width * 0.5;
      const cy = height * 0.5;
      const scale = Math.min(width, height) * 0.45;

      // Coordinate Grid Lines
      ctx.strokeStyle = '#181C1A';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, scale * 0.5, 0, Math.PI * 2);
      ctx.arc(cx, cy, scale * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cluster Points
      pointsRef.current.forEach((pt) => {
        let isVisible = true;
        if (activeFilter === 'KNOWN' && pt.category === 'CANDIDATE') isVisible = false;
        if (activeFilter === 'ANOMALOUS' && pt.category !== 'CANDIDATE') isVisible = false;

        if (!isVisible) return;

        const px = cx + pt.x * scale;
        const py = cy - pt.y * scale;

        let color = '#555852';
        let radius = 2.5;

        switch (pt.category) {
          case 'NOISE':
            color = '#383E3A';
            radius = 2;
            break;
          case 'PULSAR':
            color = '#8A8D86';
            radius = 2.5;
            break;
          case 'RFI':
            color = '#5C625D';
            radius = 2.5;
            break;
          case 'MASER':
            color = '#A0A49C';
            radius = 3;
            break;
          case 'CANDIDATE':
            color = '#D4864A';
            radius = 4.5;
            break;
        }

        if (pt.category === 'CANDIDATE') {
          ctx.strokeStyle = 'rgba(212, 134, 74, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px, py, radius + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [activeFilter]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cx = rect.width * 0.5;
    const cy = rect.height * 0.5;
    const scale = Math.min(rect.width, rect.height) * 0.45;

    let closest: ClusterPoint | null = null;
    let minDist = 16;

    pointsRef.current.forEach((pt) => {
      const px = cx + pt.x * scale;
      const py = cy - pt.y * scale;
      const d = Math.hypot(mx - px, my - py);
      if (d < minDist) {
        minDist = d;
        closest = pt;
      }
    });

    setHoveredPoint(closest);
  };

  return (
    <div className="border-t border-[#242825] pt-6 select-none space-y-4 font-sans">
      {/* Title & Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242825] pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-[#E6E4DD]">Latent Manifold Projection</h3>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#767973]">
              2D Pedagogical Map
            </span>
          </div>
          <p className="text-xs text-[#848780] mt-0.5">
            Illustrative manifold space demonstrating cluster separation between learned background
            distributions and candidate outliers.
          </p>
        </div>

        {/* Filter Buttons */}
        <div
          className="flex items-center gap-1 self-start sm:self-auto text-xs font-mono"
          role="group"
          aria-label="Filter points"
        >
          <Filter className="h-3 w-3 text-[#555852] mr-1" />
          <button
            type="button"
            aria-pressed={activeFilter === 'ALL'}
            onClick={() => setActiveFilter('ALL')}
            className={`px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer text-[11px] ${
              activeFilter === 'ALL'
                ? 'bg-[#221B16] text-[#D4864A] border border-[#D4864A]/40'
                : 'text-[#848780] hover:text-[#C9C8C0] border border-[#242825]'
            }`}
          >
            ALL
          </button>
          <button
            type="button"
            aria-pressed={activeFilter === 'KNOWN'}
            onClick={() => setActiveFilter('KNOWN')}
            className={`px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer text-[11px] ${
              activeFilter === 'KNOWN'
                ? 'bg-[#221B16] text-[#D4864A] border border-[#D4864A]/40'
                : 'text-[#848780] hover:text-[#C9C8C0] border border-[#242825]'
            }`}
          >
            CATALOG
          </button>
          <button
            type="button"
            aria-pressed={activeFilter === 'ANOMALOUS'}
            onClick={() => setActiveFilter('ANOMALOUS')}
            className={`px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer text-[11px] ${
              activeFilter === 'ANOMALOUS'
                ? 'bg-[#221B16] text-[#D4864A] border border-[#D4864A]/40'
                : 'text-[#848780] hover:text-[#C9C8C0] border border-[#242825]'
            }`}
          >
            DEVIATIONS
          </button>
        </div>
      </div>

      {/* Scientific Footnote */}
      <div className="border-l-2 border-[#D4864A] pl-3 py-1 text-xs text-[#848780] leading-normal flex items-start gap-2">
        <AlertCircle className="h-3.5 w-3.5 text-[#D4864A] shrink-0 mt-0.5" />
        <span>
          <strong className="text-[#C9C8C0] font-medium font-mono text-[11px] uppercase">
            Methodological note:
          </strong>{' '}
          This projection is a 2D pedagogical visualization illustrating multi-dimensional latent
          distance. Points represent feature embeddings showing how outlier detection isolates
          signals distant from the learned astrophysical manifold.
        </span>
      </div>

      {/* Canvas Viewport */}
      <div className="relative rounded-[2px] border border-[#242825] bg-[#0B0D0C] overflow-hidden">
        <div ref={containerRef} className="h-[280px] sm:h-[320px] w-full">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredPoint(null)}
            className="h-full w-full cursor-crosshair"
          />
        </div>

        {/* Hover Readout Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-3 left-3 rounded-[2px] border border-[#242825] bg-[#121513]/95 px-3 py-1.5 text-xs font-mono space-y-0.5">
            <span className="text-[#D4864A] font-medium block">{hoveredPoint.id}</span>
            <span className="text-[#E6E4DD] text-[11px] block">{hoveredPoint.label}</span>
          </div>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-2.5 right-3 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-[#848780] bg-[#0E100F]/90 px-2.5 py-1 rounded-[2px] border border-[#242825]">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#383E3A]" />
            <span>Thermal noise</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8A8D86]" />
            <span>Pulsars</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5C625D]" />
            <span>Satellite RFI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4864A]" />
            <span className="text-[#D4864A] font-medium">Candidate outlier</span>
          </div>
        </div>
      </div>
    </div>
  );
}
