'use client';

import { useEffect, useRef } from 'react';

/**
 * Constellation network — faint animated dot+line canvas.
 * ~30 nodes, slow drift, subtle pulse. Overall opacity controlled by parent.
 */
function ConstellationField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      pulse: number;
      ps: number;
    }>
  >([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf: number;

    const resize = () => {
      canvas.width = window.innerWidth * 1.5;
      canvas.height = window.innerHeight * 1.5;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    };
    resize();
    window.addEventListener('resize', resize);

    if (nodesRef.current.length === 0) {
      for (let i = 0; i < 30; i++) {
        nodesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          r: Math.random() * 0.8 + 0.3,
          pulse: Math.random() * Math.PI * 2,
          ps: Math.random() * 0.004 + 0.002,
        });
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const nodes = nodesRef.current;

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += n.ps;
        if (n.x < 0) n.x = canvas.width;
        if (n.x > canvas.width) n.x = 0;
        if (n.y < 0) n.y = canvas.height;
        if (n.y > canvas.height) n.y = 0;
      });

      // Connection lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.03;
            ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Dots
      nodes.forEach((n) => {
        const glow = Math.sin(n.pulse) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0,0,0,${0.04 * glow})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * glow * 1.3, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: 0.45 }}
    />
  );
}

/**
 * Shared aurora background system.
 * Renders: base color → 3 aurora orbs → constellation canvas → dot grid → optional noise.
 * Used on landing page and marketplace.
 */
export function AuroraBackground() {
  return (
    <div
      className="fixed inset-0"
      style={{ background: '#F2F3F6', zIndex: 0 }}
    >
      {/* Aurora 1 — warm coral/rose — top right */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: '60vw',
          height: '60vw',
          maxWidth: 800,
          maxHeight: 800,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(255,160,140,0.25) 0%, transparent 60%)',
          animation: 'aurora1 24s ease-in-out infinite',
          filter: 'blur(90px)',
          willChange: 'transform',
        }}
      />

      {/* Aurora 2 — cool blue — left */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '-12%',
          width: '50vw',
          height: '50vw',
          maxWidth: 700,
          maxHeight: 700,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(130,180,255,0.2) 0%, transparent 60%)',
          animation: 'aurora2 30s ease-in-out infinite',
          filter: 'blur(90px)',
          willChange: 'transform',
        }}
      />

      {/* Aurora 3 — violet — bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '30%',
          width: '45vw',
          height: '45vw',
          maxWidth: 600,
          maxHeight: 600,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(180,160,255,0.15) 0%, transparent 60%)',
          animation: 'aurora3 27s ease-in-out infinite',
          filter: 'blur(90px)',
          willChange: 'transform',
        }}
      />

      {/* Constellation canvas */}
      <ConstellationField />

      {/* Dot grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          backgroundSize: '32px 32px',
          backgroundImage:
            'radial-gradient(circle, rgba(0,0,0,0.025) 1px, transparent 1px)',
        }}
      />

      {/* Noise texture (optional, very low opacity) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          opacity: 0.25,
          mixBlendMode: 'overlay' as const,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
}
