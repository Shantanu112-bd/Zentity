import React, { useEffect, useRef } from "react";

/**
 * Procedural Atmospheric Background for Pramaan-ZK
 * 
 * - 100% original generative canvas + layered CSS radial gradients.
 * - Zero external assets, zero video egress, zero media download badges.
 * - Hardware accelerated with requestAnimationFrame.
 * - Respects prefers-reduced-motion and Save-Data headers.
 */
export function ProceduralAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Check user accessibility preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as any).connection?.saveData === true;

    if (prefersReducedMotion || saveData) {
      // Keep static atmospheric glow without CPU animation
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    // Particle field
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: (Math.random() - 0.5) * 0.25,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render subtle dust particles
      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden bg-black">
      {/* 1. Deep cosmic gradient base */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(120, 119, 198, 0.20), rgba(255, 255, 255, 0)), radial-gradient(ellipse 60% 40% at 50% 110%, rgba(245, 158, 11, 0.12), rgba(0, 0, 0, 0))"
        }}
      />

      {/* 2. Atmospheric coral horizon beam */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] rounded-full blur-[140px] opacity-25"
        style={{
          background: "radial-gradient(circle, rgba(234, 88, 12, 0.4) 0%, rgba(99, 102, 241, 0.2) 60%, rgba(0, 0, 0, 0) 100%)"
        }}
      />

      {/* 3. Generative particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />

      {/* 4. Film grain / subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
    </div>
  );
}

