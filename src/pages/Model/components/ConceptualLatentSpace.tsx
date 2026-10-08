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
        label: 'Astrophysical Thermal Noise',
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
        label: 'Known Pulsar Harmonics (Cataloged)',
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
        label: 'Known Terrestrial / Satellite RFI',
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
        label: 'Hydroxyl / Methanol Maser Profile',
        id: `MSR-${4000 + i}`,
      });
    }

    // High-Anomaly Candidate Outliers (Clearly separated)
    pts.push({
      x: 0.65,
      y: 0.6,
      category: 'CANDIDATE',
      label: 'Primary Candidate AET-04721 (Unclassified)',
      id: 'AET-04721',
    });
    pts.push({
      x: 0.58,
      y: 0.72,
      category: 'CANDIDATE',
      label: 'Secondary Outlier AET-04738',
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
      ctx.fillStyle = '#06080B';
      ctx.fillRect(0, 0, width, height);

      // 2. Reticle Grid
      ctx.strokeStyle = '#172230';
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

        let color = '#7F8B95';
        let radius = 2.5;

        if (pt.category === 'NOISE') {
          color = 'rgba(127, 139, 149, 0.4)';
          radius = 2;
        } else if (pt.category === 'PULSAR') {
          color = '#5BD8F5';
          radius = 3;
        } else if (pt.category === 'RFI') {
          color = '#E8AE50';
          radius = 3;
        } else if (pt.category === 'MASER') {
          color = '#94A3B8';
          radius = 2.5;
        } else if (pt.category === 'CANDIDATE') {
          color = '#5BD8F5';
          radius = 5.5;

          // Outlier pulse ring
          ctx.strokeStyle = '#5BD8F5';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px, py, 10, 0, Math.PI * 2);
          ctx.stroke();

          // Distance vector from centroid
          ctx.strokeStyle = 'rgba(91, 216, 245, 0.4)';
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
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-5 select-none space-y-4">
      {/* Title & Explicit Conceptual Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#1C2630] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#E6EDF2]">
              Conceptual Representation Space
            </h3>
            <span className="rounded border border-[#E8AE50]/40 bg-[#E8AE50]/10 px-1.5 py-0.2 text-[10px] font-medium text-[#E8AE50]">
              Conceptual demonstration
            </span>
          </div>
          <p className="text-xs text-[#7F8B95] mt-0.5">
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
          <Filter className="h-3 w-3 text-[#7F8B95]" />
          <button
            type="button"
            aria-pressed={activeFilter === 'ALL'}
            onClick={() => setActiveFilter('ALL')}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] ${
              activeFilter === 'ALL'
                ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#5BD8F5]'
                : 'border-[#1C2630] bg-[#06080B] text-[#7F8B95]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            aria-pressed={activeFilter === 'KNOWN'}
            onClick={() => setActiveFilter('KNOWN')}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] ${
              activeFilter === 'KNOWN'
                ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#5BD8F5]'
                : 'border-[#1C2630] bg-[#06080B] text-[#7F8B95]'
            }`}
          >
            Known
          </button>
          <button
            type="button"
            aria-pressed={activeFilter === 'ANOMALOUS'}
            onClick={() => setActiveFilter('ANOMALOUS')}
            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] ${
              activeFilter === 'ANOMALOUS'
                ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#5BD8F5]'
                : 'border-[#1C2630] bg-[#06080B] text-[#7F8B95]'
            }`}
          >
            Anomalies
          </button>
        </div>
      </div>

      {/* Explicit Scientific Disclaimer Notice Banner */}
      <div className="rounded border border-[#1C2630] bg-[#06080B] p-2.5 flex items-start gap-2 text-[11px] text-[#7F8B95] leading-normal">
        <AlertCircle className="h-3.5 w-3.5 text-[#E8AE50] shrink-0 mt-0.5" />
        <span>
          <strong className="text-[#E6EDF2]">Methodological Note:</strong> This visualization is a
          conceptual pedagogical projection designed to illustrate high-dimensional cluster
          geometry. Points represent synthetic embeddings to explain how manifold distance works,
          not live calibrated telescope measurements.
        </span>
      </div>

      {/* Canvas Viewport */}
      <div className="relative rounded border border-[#1C2630] bg-[#06080B] overflow-hidden">
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
          <div className="absolute top-3 left-3 rounded border border-[#1C2630] bg-[#0B0F14]/90 backdrop-blur px-3 py-1.5 text-xs font-mono space-y-0.5">
            <span className="text-[#5BD8F5] font-semibold block">{hoveredPoint.id}</span>
            <span className="text-[#E6EDF2] text-[11px] block">{hoveredPoint.label}</span>
          </div>
        )}

        {/* Legend Overlay */}
        <div className="absolute bottom-2.5 right-3 flex flex-wrap items-center gap-3 text-[10px] text-[#7F8B95] bg-[#06080B]/80 px-2 py-1 rounded border border-[#1C2630]/60">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#7F8B95]/40" />
            <span>Thermal Noise</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#5BD8F5]" />
            <span>Pulsars</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#E8AE50]" />
            <span>Satellite RFI</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#5BD8F5] ring-2 ring-[#5BD8F5]/40" />
            <span className="text-[#5BD8F5] font-medium">Candidate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
