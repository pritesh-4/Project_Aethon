import { useEffect, useRef, useState } from 'react';
import { Sparkles, Info } from 'lucide-react';

interface ClusterPoint {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  category: 'NOISE' | 'PULSAR' | 'RFI' | 'MASER' | 'CANDIDATE';
  label: string;
  anomalyScore: number;
  id: string;
}

export function LearnedSignalSpace() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredPoint, setHoveredPoint] = useState<ClusterPoint | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'KNOWN' | 'ANOMALOUS'>('ALL');

  // Generate deterministic cluster points
  const pointsRef = useRef<ClusterPoint[]>([]);

  useEffect(() => {
    const pts: ClusterPoint[] = [];

    // Dense Cluster 1: Thermal Johnson-Nyquist Background Noise (center around -0.3, -0.2)
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.22;
      const x = -0.35 + Math.cos(angle) * radius;
      const y = -0.2 + Math.sin(angle) * radius;
      pts.push({
        x,
        y,
        baseX: x,
        baseY: y,
        category: 'NOISE',
        label: 'Astrophysical Thermal Noise',
        anomalyScore: 0.05 + Math.random() * 0.12,
        id: `NSE-${1000 + i}`,
      });
    }

    // Dense Cluster 2: Pulsar & Periodic Transients (center around 0.25, -0.3)
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.16;
      const x = 0.25 + Math.cos(angle) * radius;
      const y = -0.3 + Math.sin(angle) * radius;
      pts.push({
        x,
        y,
        baseX: x,
        baseY: y,
        category: 'PULSAR',
        label: 'Known Pulsar Harmonic (ATNF)',
        anomalyScore: 0.12 + Math.random() * 0.15,
        id: `PSR-${2000 + i}`,
      });
    }

    // Dense Cluster 3: Satellite RFI / Terrestrial Carrier Comb (center around -0.15, 0.35)
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.18;
      const x = -0.15 + Math.cos(angle) * radius;
      const y = 0.35 + Math.sin(angle) * radius;
      pts.push({
        x,
        y,
        baseX: x,
        baseY: y,
        category: 'RFI',
        label: 'Known Terrestrial / Satellite RFI',
        anomalyScore: 0.08 + Math.random() * 0.14,
        id: `RFI-${3000 + i}`,
      });
    }

    // Cluster 4: Interstellar Masers (center around 0.35, 0.2)
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.14;
      const x = 0.35 + Math.cos(angle) * radius;
      const y = 0.2 + Math.sin(angle) * radius;
      pts.push({
        x,
        y,
        baseX: x,
        baseY: y,
        category: 'MASER',
        label: 'Hydroxyl / Methanol Maser',
        anomalyScore: 0.14 + Math.random() * 0.18,
        id: `MSR-${4000 + i}`,
      });
    }

    // High Anomaly Outlier 1: Primary Candidate AET-04721 (clearly separated at 0.68, 0.62)
    pts.push({
      x: 0.68,
      y: 0.62,
      baseX: 0.68,
      baseY: 0.62,
      category: 'CANDIDATE',
      label: 'Candidate: AET-04721 (Simulated observation)',
      anomalyScore: 0.947,
      id: 'AET-04721',
    });

    // Secondary Candidate: AET-04738 (separated at 0.54, 0.48)
    pts.push({
      x: 0.54,
      y: 0.48,
      baseX: 0.54,
      baseY: 0.48,
      category: 'CANDIDATE',
      label: 'Candidate: AET-04738 (Simulated observation)',
      anomalyScore: 0.821,
      id: 'AET-04738',
    });

    pointsRef.current = pts;
  }, []);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      const w = container.clientWidth;
      const h = Math.min(480, Math.max(340, w * 0.45));
      const dpr = window.devicePixelRatio || 1;
      width = w;
      height = h;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    const render = (time: number) => {
      if (width === 0 || height === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep obsidian background
      ctx.fillStyle = '#05070A';
      ctx.fillRect(0, 0, width, height);

      // Draw faint coordinate grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridStep = 40;
      for (let x = 0; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw coordinate origin crosshair
      const cx = width / 2;
      const cy = height / 2;
      const scaleX = width * 0.42;
      const scaleY = height * 0.42;

      ctx.strokeStyle = 'rgba(102, 227, 255, 0.15)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, 16);
      ctx.lineTo(cx, height - 16);
      ctx.moveTo(16, cy);
      ctx.lineTo(width - 16, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw manifold density contours around dense clusters
      ctx.strokeStyle = 'rgba(102, 227, 255, 0.12)';
      ctx.lineWidth = 1;

      // Contour around Noise
      ctx.beginPath();
      ctx.ellipse(
        cx - 0.35 * scaleX,
        cy + 0.2 * scaleY,
        0.25 * scaleX,
        0.22 * scaleY,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      // Contour around Pulsars
      ctx.beginPath();
      ctx.ellipse(
        cx + 0.25 * scaleX,
        cy + 0.3 * scaleY,
        0.2 * scaleX,
        0.18 * scaleY,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      // Contour around RFI
      ctx.strokeStyle = 'rgba(255, 184, 77, 0.12)';
      ctx.beginPath();
      ctx.ellipse(
        cx - 0.15 * scaleX,
        cy - 0.35 * scaleY,
        0.22 * scaleX,
        0.19 * scaleY,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      // Draw contour manifold labels
      ctx.fillStyle = 'rgba(132, 146, 156, 0.5)';
      ctx.font = '9px monospace';
      ctx.fillText('LEARNED ASTROPHYSICAL NOISE MANIFOLD', cx - 0.52 * scaleX, cy + 0.42 * scaleY);
      ctx.fillText('KNOWN RFI EMISSION DOMAIN', cx - 0.32 * scaleX, cy - 0.45 * scaleY);

      // Animate candidate pulse
      const pulse = (Math.sin(time * 0.003) + 1) * 0.5;

      // Render points
      const pts = pointsRef.current;
      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i];

        if (activeFilter === 'KNOWN' && pt.category === 'CANDIDATE') continue;
        if (activeFilter === 'ANOMALOUS' && pt.category !== 'CANDIDATE') continue;

        // Subtle micro-drift for organic alive feel
        const wobbleX = Math.sin(time * 0.001 + i) * 0.003;
        const wobbleY = Math.cos(time * 0.001 + i) * 0.003;
        const px = cx + (pt.baseX + wobbleX) * scaleX;
        const py = cy - (pt.baseY + wobbleY) * scaleY; // Invert Y for cartesian
        pt.x = px;
        pt.y = py;

        if (pt.category === 'CANDIDATE') {
          // Outlier pulse halo
          ctx.strokeStyle = `rgba(255, 184, 77, ${0.4 + pulse * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, py, 9 + pulse * 6, 0, Math.PI * 2);
          ctx.stroke();

          // Outlier glyph (x)
          ctx.strokeStyle = '#FFB84D';
          ctx.lineWidth = 2;
          const s = 5;
          ctx.beginPath();
          ctx.moveTo(px - s, py - s);
          ctx.lineTo(px + s, py + s);
          ctx.moveTo(px + s, py - s);
          ctx.lineTo(px - s, py + s);
          ctx.stroke();

          // Outlier label
          ctx.fillStyle = '#FFB84D';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`× ${pt.id} [α = ${pt.anomalyScore.toFixed(3)}]`, px + 12, py - 4);

          // Vector line to nearest manifold centroid
          ctx.strokeStyle = 'rgba(255, 184, 77, 0.3)';
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(cx + 0.25 * scaleX, cy + 0.3 * scaleY);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Normal manifold points
          ctx.fillStyle =
            pt.category === 'NOISE'
              ? 'rgba(102, 227, 255, 0.45)'
              : pt.category === 'PULSAR'
                ? 'rgba(58, 123, 255, 0.65)'
                : pt.category === 'RFI'
                  ? 'rgba(255, 184, 77, 0.45)'
                  : 'rgba(52, 211, 153, 0.55)';

          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [activeFilter]);

  // Pointer hover detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let closest: ClusterPoint | null = null;
    let minDist = 18;

    for (const pt of pointsRef.current) {
      const d = Math.hypot(pt.x - mx, pt.y - my);
      if (d < minDist) {
        minDist = d;
        closest = pt;
      }
    }

    setHoveredPoint(closest);
  };

  return (
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-5 font-mono select-none">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#1C2630] pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#5BD8F5]" />
          <h2 className="text-xs font-medium text-[#E6EDF2]">Learned signal space</h2>
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center gap-1.5 text-[10px]">
          {(['ALL', 'KNOWN', 'ANOMALOUS'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setActiveFilter(mode)}
              className={`rounded-[1px] border px-2 py-0.5 transition-colors cursor-pointer ${
                activeFilter === mode
                  ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#5BD8F5] font-medium'
                  : 'border-[#1C2630] bg-[#06080B] text-[#7F8B95] hover:text-[#E6EDF2]'
              }`}
            >
              {mode === 'ALL' ? 'All' : mode === 'KNOWN' ? 'Known' : 'Anomalous'}
            </button>
          ))}
        </div>
      </div>

      {/* Demonstration Labeling Banner */}
      <div className="mb-3 flex items-center justify-between rounded-[2px] border border-[#1C2630] bg-[#06080B] px-3 py-1.5 text-[10px] text-[#7F8B95]">
        <div className="flex items-center gap-1.5 font-medium">
          <Info className="h-3.5 w-3.5 shrink-0 text-[#5BD8F5]" />
          <span>Representation space projection (Demonstration data)</span>
        </div>
        <span className="text-[9px] text-[#7F8B95] hidden sm:inline">
          512-D latent space projected to 2D
        </span>
      </div>

      {/* Interactive Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full rounded-[2px] border border-[#1C2630] bg-[#06080B] overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          className="w-full block cursor-crosshair"
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 rounded-[2px] border border-[#1C2630] bg-[#0B0F14]/90 p-2.5 backdrop-blur-sm text-[10px] space-y-1.5">
          <span className="block text-[9px] text-[#7F8B95] font-medium border-b border-[#1C2630] pb-1">
            Signal space geometry
          </span>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
            <span className="text-[#7F8B95]">Thermal noise baseline</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
            <span className="text-[#7F8B95]">Known pulsar harmonics</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7F8B95]" />
            <span className="text-[#7F8B95]">Terrestrial / satellite interference</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#E8AE50] font-bold text-xs">×</span>
            <span className="text-[#E8AE50] font-medium">Prioritized candidate (Isolated)</span>
          </div>
        </div>

        {/* Hover Inspector Tooltip */}
        {hoveredPoint && (
          <div
            className="pointer-events-none absolute z-20 rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-2.5 shadow-xl text-xs font-mono"
            style={{
              left: `${hoveredPoint.x > 320 ? hoveredPoint.x - 220 : hoveredPoint.x + 14}px`,
              top: `${Math.max(hoveredPoint.y - 60, 10)}px`,
            }}
          >
            <div className="text-[10px] text-[#5BD8F5] font-medium border-b border-[#1C2630] pb-1 mb-1">
              {hoveredPoint.id}
            </div>
            <div className="text-[11px] text-[#E6EDF2] font-medium">{hoveredPoint.label}</div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-[#7F8B95] gap-4">
              <span>Anomaly index:</span>
              <span
                className={`font-medium ${
                  hoveredPoint.anomalyScore > 0.7 ? 'text-[#E8AE50]' : 'text-[#E6EDF2]'
                }`}
              >
                {hoveredPoint.anomalyScore.toFixed(3)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Explanatory Caption */}
      <p className="mt-3 text-[11px] text-[#7F8B95] font-sans leading-relaxed border-t border-[#1C2630] pt-3">
        Dense clusters represent radio observations sharing coherent representation properties.
        Candidate <span className="font-mono text-[#E8AE50] font-medium">AET-04721</span> is
        isolated in representation space because its persistent structure deviates from both
        Gaussian background noise and known interference centroids.
      </p>
    </div>
  );
}
