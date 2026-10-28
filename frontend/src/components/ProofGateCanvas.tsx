import React, { useEffect, useRef } from "react";

interface ProofGateCanvasProps {
  isOpen?: boolean;
  openness?: number; // 0 to 1
  size?: number;
  className?: string;
}

export const ProofGateCanvas: React.FC<ProofGateCanvasProps> = ({
  isOpen = false,
  openness = 0,
  size = 460,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetOpenness = useRef(isOpen ? 1 : openness);
  const currentOpenness = useRef(isOpen ? 1 : openness);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    targetOpenness.current = isOpen ? 1 : openness;
  }, [isOpen, openness]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Procedural Particle System
    const particleCount = 120;
    const particles = Array.from({ length: particleCount }, () => ({
      angle: Math.random() * Math.PI * 2,
      distance: 60 + Math.random() * 120,
      radius: 1 + Math.random() * 2.5,
      speed: (0.005 + Math.random() * 0.01) * (Math.random() > 0.5 ? 1 : -1),
      radialVelocity: (Math.random() - 0.5) * 0.2,
      opacity: 0.2 + Math.random() * 0.6,
      hue: Math.random() > 0.7 ? 190 : 160, // Cyan to emerald
    }));

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mousePos.current = {
        x: (e.clientX - cx) / (rect.width / 2),
        y: (e.clientY - cy) / (rect.height / 2),
      };
    };

    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      time += 0.02;

      // Smooth interpolation of openness
      currentOpenness.current += (targetOpenness.current - currentOpenness.current) * 0.05;

      ctx.clearRect(0, 0, size, size);
      const cx = size / 2 + mousePos.current.x * 12;
      const cy = size / 2 + mousePos.current.y * 12;

      // 1. Central Void / Background Glow
      const glowRadius = 80 + currentOpenness.current * 110;
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, glowRadius);
      bgGrad.addColorStop(0, `rgba(0, 242, 254, ${0.15 + currentOpenness.current * 0.35})`);
      bgGrad.addColorStop(0.5, `rgba(16, 185, 129, ${0.08 + currentOpenness.current * 0.2})`);
      bgGrad.addColorStop(1, "rgba(9, 10, 15, 0)");
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Concentric Geometric Gate Rings
      const ringCount = 5;
      for (let i = 1; i <= ringCount; i++) {
        const baseR = 40 + i * 28 + currentOpenness.current * (i * 18);
        const ringRotation = time * (i % 2 === 0 ? 0.3 : -0.2) + (i * Math.PI) / 4;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ringRotation);

        ctx.beginPath();
        const segments = 6 + i * 2;
        for (let s = 0; s <= segments; s++) {
          const a = (s / segments) * Math.PI * 2;
          const r = baseR + Math.sin(a * 4 + time * 2) * (2 + currentOpenness.current * 4);
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        ctx.strokeStyle = i === 1 && currentOpenness.current > 0.5
          ? `rgba(0, 242, 254, ${0.4 + currentOpenness.current * 0.5})`
          : `rgba(255, 255, 255, ${0.08 + (i === 1 ? 0.2 : 0)})`;
        ctx.lineWidth = i === 1 ? 2 : 1;
        ctx.stroke();

        ctx.restore();
      }

      // 3. Orbital Particles
      particles.forEach((p) => {
        p.angle += p.speed * (1 + currentOpenness.current * 2);
        p.distance += p.radialVelocity;
        if (p.distance > size * 0.45) p.distance = 50;
        if (p.distance < 40) p.distance = size * 0.4;

        const effectiveR = p.distance + currentOpenness.current * 50;
        const px = cx + Math.cos(p.angle) * effectiveR;
        const py = cy + Math.sin(p.angle) * effectiveR;

        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.opacity * (0.6 + currentOpenness.current * 0.4)})`;
        ctx.beginPath();
        ctx.arc(px, py, p.radius * (1 + currentOpenness.current * 0.5), 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Central Aperture / Lock Mechanism
      const apertureR = 26 + currentOpenness.current * 36;
      ctx.beginPath();
      ctx.arc(cx, cy, apertureR, 0, Math.PI * 2);
      ctx.strokeStyle = currentOpenness.current > 0.8 ? "#10b981" : "#00f2fe";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = currentOpenness.current > 0.8 ? "#10b981" : "#00f2fe";
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Status indicator text in gate center
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.fillStyle = currentOpenness.current > 0.8 ? "#34d399" : "#38bdf8";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const statusText = currentOpenness.current > 0.8 ? "VERIFIED" : currentOpenness.current > 0.3 ? "PROVING" : "LOCKED";
      ctx.fillText(statusText, cx, cy);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [size]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="max-w-full h-auto drop-shadow-[0_0_35px_rgba(0,242,254,0.15)]"
      />
    </div>
  );
};
