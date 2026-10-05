import { useEffect, useRef } from 'react';
import type { CandidateSignalData } from '../types.ts';
import { LATENT_SPACE_CLUSTERS } from '../data/mockCandidates.ts';
import { Network } from 'lucide-react';

export interface RepresentationSpaceProps {
  candidate: CandidateSignalData;
}

export function RepresentationSpace({ candidate }: RepresentationSpaceProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
      draw();
    };

    const draw = () => {
      if (width <= 0 || height <= 0) return;

      const cx = width * 0.5;
      const cy = height * 0.5;
      const scaleX = width * 0.42;
      const scaleY = height * 0.42;

      // 1. Clear Background
      ctx.fillStyle = '#03060C';
      ctx.fillRect(0, 0, width, height);

      // 2. Coordinate Grid Lines
      ctx.strokeStyle = 'rgba(23, 35, 56, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();

      // Circular Distance Boundaries
      ctx.beginPath();
      ctx.arc(cx, cy, scaleX * 0.5, 0, Math.PI * 2);
      ctx.arc(cx, cy, scaleX * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Render Background Known-Pattern Clusters
      LATENT_SPACE_CLUSTERS.forEach((cluster) => {
        const clusterCenterX = cx + cluster.x * scaleX;
        const clusterCenterY = cy + cluster.y * scaleY;

        ctx.fillStyle = cluster.color;
        ctx.globalAlpha = 0.4;

        // Render point cloud around cluster center
        for (let i = 0; i < cluster.count; i++) {
          const angle = (i / cluster.count) * Math.PI * 2 + (i % 3);
          const rad = (12 + ((i * 7) % 24)) * 0.7;
          const px = clusterCenterX + Math.cos(angle) * rad;
          const py = clusterCenterY + Math.sin(angle) * rad;

          ctx.beginPath();
          ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cluster label
        ctx.globalAlpha = 0.7;
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(cluster.label, clusterCenterX, clusterCenterY - 20);
      });

      // 4. Render Active Candidate Coordinate
      const candX = cx + candidate.latentCoordinates.x * scaleX;
      const candY = cy + candidate.latentCoordinates.y * scaleY;

      // Connecting distance vector from nearest cluster
      const nearestClusterX = cx - 0.35 * scaleX;
      const nearestClusterY = cy - 0.4 * scaleY;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 184, 77, 0.4)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(nearestClusterX, nearestClusterY);
      ctx.lineTo(candX, candY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Distance tag
      ctx.fillStyle = '#FFB84D';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `COSINE DISPLACEMENT: ${candidate.morphology.cosineDistance.toFixed(3)}`,
        (nearestClusterX + candX) * 0.5,
        (nearestClusterY + candY) * 0.5 - 6
      );

      // Candidate Target Reticle Crosshair
      const isHigh = candidate.priority === 'HIGH';
      const markerColor = isHigh ? '#FFB84D' : '#66E3FF';

      ctx.strokeStyle = markerColor;
      ctx.shadowColor = markerColor;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.5;

      const r = 6;
      ctx.beginPath();
      ctx.moveTo(candX - r, candY - r);
      ctx.lineTo(candX + r, candY + r);
      ctx.moveTo(candX + r, candY - r);
      ctx.lineTo(candX - r, candY + r);
      ctx.stroke();

      // Outer ring
      ctx.beginPath();
      ctx.arc(candX, candY, 12, 0, Math.PI * 2);
      ctx.stroke();

      // Identifier label
      ctx.fillStyle = markerColor;
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`▲ ${candidate.id} [ISOLATE]`, candX + 16, candY + 3);
      ctx.restore();
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
    };
  }, [candidate]);

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-3.5 font-mono select-none">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Network className="h-3.5 w-3.5 text-[#66E3FF]" />
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#EAF4F7]">
            LATENT REPRESENTATION MANIFOLD
          </h4>
        </div>
        <span className="text-[9px] text-[#84929C] uppercase">t-SNE 2D PROJECTION</span>
      </div>

      <div
        ref={containerRef}
        className="relative h-[160px] w-full bg-[#03060C] rounded-[2px] border border-slate-800/60 overflow-hidden"
      >
        <canvas ref={canvasRef} className="h-full w-full select-none" />
      </div>

      {/* Latent Legend */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[9px] text-[#84929C]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8]" />
            KNOWN PULSARS
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#64748B]" />
            RFI SATELLITES
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#475569]" />
            THERMAL NOISE
          </span>
        </div>

        <span className="text-amber-400 font-semibold">× {candidate.id} (ISOLATED ANOMALY)</span>
      </div>
    </div>
  );
}
