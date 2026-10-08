import { useEffect, useRef } from 'react';

interface WebGLFallbackProps {
  progress: number;
}

/**
 * Resilient 2D HTML5 Canvas Fallback for devices without WebGL support.
 * Preserves the narrative arc: telescope silhouette, sky, signal population,
 * deviation, and candidate lock.
 */
export function WebGLFallback({ progress }: WebGLFallbackProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const fallbackImg = new Image();
    fallbackImg.src = '/textures/planet_fallback.jpg';
    let imgLoaded = false;
    fallbackImg.onload = () => {
      imgLoaded = true;
    };

    const render = () => {
      ctx.fillStyle = '#070b10';
      ctx.fillRect(0, 0, width, height);

      const p = progress;
      const cx = width * 0.5;
      const cy = height * 0.5;

      // 1. Distant Starlight / Noise Floor
      ctx.fillStyle = 'rgba(202, 213, 226, 0.4)';
      const numStars = 60;
      for (let i = 0; i < numStars; i++) {
        const sx = (Math.sin(i * 12.3) * 0.5 + 0.5) * width;
        const sy = (Math.cos(i * 23.4) * 0.5 + 0.5) * height * 0.8;
        ctx.fillRect(sx, sy, 1.2, 1.2);
      }

      // 2. Distant Rocky Celestial Body (0.00 - 0.155)
      if (p < 0.155) {
        const descentProg = p <= 0.038 ? 0 : Math.min(1, Math.max(0, (p - 0.038) / (0.14 - 0.038)));
        const smoothDescent = descentProg * descentProg * (3 - 2 * descentProg);
        const planetAlpha = p <= 0.08 ? 1 : Math.max(0, 1 - (p - 0.08) / (0.152 - 0.08));

        ctx.save();
        ctx.globalAlpha = planetAlpha;

        const planetRadius = Math.min(width, height) * 0.14;
        const planetY = height * 0.44 + smoothDescent * height * 0.48;

        // Base planetary sphere clip
        ctx.beginPath();
        ctx.arc(cx, planetY, planetRadius, 0, Math.PI * 2);
        ctx.clip();

        if (imgLoaded) {
          ctx.drawImage(
            fallbackImg,
            cx - planetRadius,
            planetY - planetRadius,
            planetRadius * 2,
            planetRadius * 2
          );
        } else {
          // Deep shadow base (night side)
          ctx.fillStyle = '#0a0d11';
          ctx.fillRect(
            cx - planetRadius,
            planetY - planetRadius,
            planetRadius * 2,
            planetRadius * 2
          );

          // Directional stellar sunlight (illuminated day side with mineral regolith tones)
          const lightX = cx - planetRadius * 0.45;
          const lightY = planetY - planetRadius * 0.45;
          const sunGrad = ctx.createRadialGradient(
            lightX,
            lightY,
            planetRadius * 0.1,
            lightX,
            lightY,
            planetRadius * 1.55
          );
          sunGrad.addColorStop(0, '#b8a692'); // Sunlit mineral bedrock
          sunGrad.addColorStop(0.35, '#786858'); // Weathered sandstone plains
          sunGrad.addColorStop(0.65, '#423830'); // Basaltic terrain
          sunGrad.addColorStop(0.85, '#1e1a18'); // Terminator edge
          sunGrad.addColorStop(1.0, '#0a0d11'); // Deep shadow

          ctx.fillStyle = sunGrad;
          ctx.beginPath();
          ctx.arc(cx, planetY, planetRadius, 0, Math.PI * 2);
          ctx.fill();

          // Subtle daylight atmospheric limb haze (lit crescent only)
          const atmoGrad = ctx.createRadialGradient(
            lightX,
            lightY,
            planetRadius * 0.85,
            lightX,
            lightY,
            planetRadius * 1.15
          );
          atmoGrad.addColorStop(0, 'rgba(140, 170, 205, 0)');
          atmoGrad.addColorStop(0.8, 'rgba(140, 170, 205, 0.28)');
          atmoGrad.addColorStop(1, 'rgba(140, 170, 205, 0)');
          ctx.fillStyle = atmoGrad;
          ctx.beginPath();
          ctx.arc(cx, planetY, planetRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Connective Precursor Signal Dots (0.13 - 0.26)
      if (p >= 0.13 && p <= 0.26) {
        const precIn = Math.min(1, Math.max(0, (p - 0.13) / 0.05));
        const precOut = Math.max(0, 1 - (p - 0.22) / 0.05);
        const precAlpha = precIn * precOut * 0.6;
        ctx.fillStyle = '#7da4cc';
        ctx.globalAlpha = precAlpha;
        for (let i = 0; i < 40; i++) {
          const side = i % 2 === 0 ? 1 : -1;
          const px = cx + side * (width * 0.18 + ((i * 19.3) % (width * 0.28)));
          const py = height * 0.22 + ((i * 37.1) % (height * 0.55));
          ctx.fillRect(px, py, 1.6, 1.6);
        }
        ctx.globalAlpha = 1.0;
      }

      // 3. Signal Population Field (0.25 - 0.65)
      if (p > 0.2 && p < 0.75) {
        const fieldIn = Math.min(1, (p - 0.2) / 0.15);
        const fieldOut = Math.max(0, 1 - (p - 0.62) / 0.12);
        const alpha = fieldIn * fieldOut * 0.45;

        ctx.save();
        ctx.strokeStyle = '#376a9b';
        ctx.lineWidth = 1;
        ctx.globalAlpha = alpha;

        for (let j = -6; j <= 6; j++) {
          const yOff = cy + j * 24;
          ctx.beginPath();
          ctx.moveTo(0, yOff);
          for (let x = 0; x <= width; x += 10) {
            const y = yOff + Math.sin(x * 0.02 + j) * 8;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // 4. The Anomalous Signal (0.60 - 1.00)
      if (p > 0.58) {
        const heroAlpha = Math.min(1, (p - 0.58) / 0.12);
        ctx.save();
        ctx.strokeStyle = '#d4a359';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = heroAlpha * 0.85;

        ctx.beginPath();
        for (let x = 0; x <= width; x += 8) {
          const drift = (x - cx) * -0.06;
          const y = cy + drift + Math.sin(x * 0.04) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 5. Spectrogram / Candidate Lock Reticle (0.85 - 1.00)
      if (p > 0.85) {
        const lockAlpha = Math.min(1, (p - 0.85) / 0.1);
        ctx.save();
        ctx.strokeStyle = '#d4a359';
        ctx.lineWidth = 1;
        ctx.globalAlpha = lockAlpha * 0.75;

        const bw = 160;
        const bh = 70;
        ctx.strokeRect(cx - bw * 0.5, cy - bh * 0.5, bw, bh);

        ctx.font = '10px ui-monospace, monospace';
        ctx.fillStyle = '#d4a359';
        ctx.textAlign = 'center';
        ctx.fillText('CANDIDATE LOCK // Δf/Δt: -0.32 Hz/s', cx, cy + bh * 0.5 + 18);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none z-10"
      aria-hidden="true"
    />
  );
}
