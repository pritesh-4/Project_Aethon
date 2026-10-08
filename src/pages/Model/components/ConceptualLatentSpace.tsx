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
      label: 'Primary candidate AET-04721 (Unclassified)',
      id: 'AET-04721',
    });
    pts.push({
      x: 0.58,
      y: 0.72,
      category: 'CANDIDATE',
      label: 'Secondary outlier AET-04738',
      id: 'AET-04738',
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
      const cx = width * 0.5;
      const cy = height * 0.5;
      const scale = Math.min(width, height) * 0.45;

      // 1. Clear background
      ctx.fillStyle = '#0F1110';
      ctx.fillRect(0, 0, width, height);

      // 2. Reticle Grid
      ctx.strokeStyle = 'rgba(154, 156, 150, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx, 20);
      ctx.lineTo(cx, height - 20);
      ctx.moveTo(20, cy);
      ctx.lineTo(width - 20, cy);
      ctx.stroke();

      // Outer rings
      ctx.beginPath();
      ctx.arc(cx, cy, scale * 0.5, 0, Math.PI * 2);
      ctx.arc(cx, cy, scale * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Render Points
      pointsRef.current.forEach((pt) => {
        const px = cx + pt.x * scale;
        const py = cy - pt.y * scale;

        // Filtering
        if (activeFilter === 'KNOWN' && pt.category === 'CANDIDATE') return;
        if (activeFilter === 'ANOMALOUS' && pt.category !== 'CANDIDATE') return;

        let color = '#9A9C96';
        let radius = 2.5;

        if (pt.category === 'NOISE') {
          color = 'rgba(154, 156, 150, 0.35)';
          radius = 2;
        } else if (pt.category === 'PULSAR') {
          color = '#C9C8C0';
          radius = 3;
        } else if (pt.category === 'RFI') {
          color = '#7A8077';
          radius = 3;
        } else if (pt.category === 'MASER') {
          color = '#9A9C96';
          radius = 2.5;
        } else if (pt.category === 'CANDIDATE') {
          color = '#D4864A';
          radius = 5.5;

          // Outlier ring
          ctx.strokeStyle = '#D4864A';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px, py, 10, 0, Math.PI * 2);
          ctx.stroke();

          // Distance vector from centroid
          ctx.strokeStyle = 'rgba(212, 134, 74, 0.35)';
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.setLineDash([]);
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
    <div className="rounded-[2px] border border-[#242825] bg-[#141715] p-5 select-none space-y-4">
      {/* Title & Explicit Conceptual Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#242825] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-[#E6E4DD]">Latent manifold projection</h3>
            <span className="rounded-[2px] border border-[#242825] bg-[#1A1E1B] px-1.5 py-0.5 text-[10px] font-medium text-[#9A9C96]">
              2D projection demonstration
            </span>
          </div>
          <p className="text-xs text-[#9A9C96] mt-0.5">
            Illustrative 2D manifold projection demonstrating cluster separation between learned
            backgrounds and candidate outliers
          </p>
        </div>

        {/* Filter Buttons */}
        <div
          className="flex items-center gap-1.5 self-start sm:self-auto text-xs"
          role="group"
          aria-label="Filter points"
        >
          <Filter className="h-3 w-3 text-[#666963]" />
          <button
            type="button"
            aria-pressed={activeFilter === 'ALL'}
            onClick={() => setActiveFilter('ALL')}
            className={`px-2 py-0.5 rounded-[2px] border transition-colors cursor-pointer text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] ${
              activeFilter === 'ALL'
                ? 'border-[#D4864A] bg-[#D4864A]/10 text-[#D4864A]'
                : 'border-[#242825] bg-[#101211] text-[#9A9C96]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            aria-pressed={activeFilter === 'KNOWN'}
            onClick={() => setActiveFilter('KNOWN')}
            className={`px-2 py-0.5 rounded-[2px] border transition-colors cursor-pointer text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] ${
              activeFilter === 'KNOWN'
                ? 'border-[#D4864A] bg-[#D4864A]/10 text-[#D4864A]'
                : 'border-[#242825] bg-[#101211] text-[#9A9C96]'
            }`}
          >
            Known catalog
          </button>
          <button
            type="button"
            aria-pressed={activeFilter === 'ANOMALOUS'}
            onClick={() => setActiveFilter('ANOMALOUS')}
            className={`px-2 py-0.5 rounded-[2px] border transition-colors cursor-pointer text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] ${
              activeFilter === 'ANOMALOUS'
                ? 'border-[#D4864A] bg-[#D4864A]/10 text-[#D4864A]'
                : 'border-[#242825] bg-[#101211] text-[#9A9C96]'
            }`}
          >
            Deviations
          </button>
        </div>
      </div>

      {/* Scientific Disclaimer Notice */}
      <div className="rounded-[2px] border border-[#242825] bg-[#101211] p-3 flex items-start gap-2.5 text-xs text-[#9A9C96] leading-normal">
        <AlertCircle className="h-4 w-4 text-[#D4864A] shrink-0 mt-0.5" />
        <span>
          <strong className="text-[#E6E4DD] font-medium">Methodological note:</strong> This
          visualization is a pedagogical 2D projection designed to explain high-dimensional manifold
          distance. Points represent feature embeddings demonstrating how outlier distance
          functions, rather than uncalibrated radio measurements.
        </span>
      </div>

      {/* Canvas Viewport */}
      <div className="relative rounded-[2px] border border-[#242825] bg-[#0F1110] overflow-hidden">
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
          <div className="absolute top-3 left-3 rounded-[2px] border border-[#242825] bg-[#141715]/95 px-3 py-1.5 text-xs font-mono space-y-0.5">
            <span className="text-[#D4864A] font-medium block">{hoveredPoint.id}</span>
            <span className="text-[#E6E4DD] text-[11px] block">{hoveredPoint.label}</span>
          </div>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-2.5 right-3 flex flex-wrap items-center gap-3 text-[11px] text-[#9A9C96] bg-[#101211]/90 px-2.5 py-1 rounded-[2px] border border-[#242825]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#9A9C96]/40" />
            <span>Thermal noise</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#C9C8C0]" />
            <span>Pulsars</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#7A8077]" />
            <span>Satellite RFI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#D4864A]" />
            <span className="text-[#D4864A] font-medium">Candidate deviation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
