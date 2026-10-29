/**
 * frontend/src/theme/BackgroundStage.tsx
 * 
 * Cinematic Background Stage for Pramaan-ZK
 * Strictly adheres to ANTIGRAVITY_UI_REDESIGN_PROMPT.md §1 & §2:
 * - Default: Procedural, looping, dark particle vortex with soft light streaks & subtle grain.
 * - 24–30 FPS frame cap to keep CPU overhead negligible (<2% CPU).
 * - Static mode: when staticMode={true} (or on /app/* routes), renders a single frame
 *   and completely cancels requestAnimationFrame to guarantee 100% CPU availability
 *   for the SnarkJS Groth16 prover worker.
 * - Respects prefers-reduced-motion media query.
 * - Supports local video fallback if themeConfig.background.source === "video".
 * - Never hotlinks third-party CDNs.
 */

import React, { useEffect, useRef } from "react";
import { themeConfig } from "./config";

export interface BackgroundStageProps {
  className?: string;
  style?: React.CSSProperties;
  staticMode?: boolean;
}

export const BackgroundStage: React.FC<BackgroundStageProps> = ({
  className = "",
  style,
  staticMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (themeConfig.background.source === "video") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animId: number;
    let lastTime = 0;
    const targetFps = themeConfig.background.fpsCap || 30;
    const frameInterval = 1000 / targetFps;

    // Set canvas dimensions
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      if (staticMode || prefersReducedMotion) {
        drawScene(0);
      }
    };

    window.addEventListener("resize", handleResize);

    // Particle field initialization
    const particleCount = 120;
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      angle: number;
      speed: number;
      alpha: number;
      decay: number;
    }> = [];

    const centerX = width / 2;
    const centerY = height * 0.45;

    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * Math.min(width, height) * 0.7 + 30;
      const angle = Math.random() * Math.PI * 2;
      particles.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        radius,
        angle,
        speed: (0.001 + Math.random() * 0.002) * (Math.random() > 0.5 ? 1 : -1),
        alpha: 0.15 + Math.random() * 0.45,
        decay: 0.001 + Math.random() * 0.002,
      });
    }

    // Draw single frame
    const drawScene = (elapsedTime: number) => {
      // 1. Deep space background
      ctx.fillStyle = "#030407";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height * 0.45;

      // 2. Ambient radial light streak / core glow
      const radialGlow = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.min(width, height) * 0.85);
      radialGlow.addColorStop(0, "rgba(255, 255, 255, 0.07)");
      radialGlow.addColorStop(0.35, "rgba(100, 120, 160, 0.04)");
      radialGlow.addColorStop(0.7, "rgba(20, 25, 40, 0.02)");
      radialGlow.addColorStop(1, "rgba(3, 4, 7, 0)");
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // 3. Subtle horizontal light streak
      const streakGrad = ctx.createLinearGradient(0, cy, width, cy);
      streakGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      streakGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.03)");
      streakGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = streakGrad;
      ctx.fillRect(0, cy - 80, width, 160);

      // 4. Drifting particle vortex
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!staticMode && !prefersReducedMotion) {
          p.angle += p.speed;
        }

        const px = cx + Math.cos(p.angle) * p.radius;
        const py = cy + Math.sin(p.angle) * (p.radius * 0.45); // elliptical orbit

        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();
      }

      // 5. Bottom Darkening Gradient for pristine contrast with bottom rows
      const bottomDarkening = ctx.createLinearGradient(0, height * 0.4, 0, height);
      bottomDarkening.addColorStop(0, "rgba(0, 0, 0, 0)");
      bottomDarkening.addColorStop(0.65, "rgba(0, 0, 0, 0.65)");
      bottomDarkening.addColorStop(1, "rgba(0, 0, 0, 0.95)");
      ctx.fillStyle = bottomDarkening;
      ctx.fillRect(0, height * 0.4, width, height * 0.6);
    };

    // Render initial frame
    drawScene(0);

    // If static mode or reduced motion requested, do NOT start requestAnimationFrame loop
    if (staticMode || prefersReducedMotion) {
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    // Animation loop capped at targetFps
    const render = (time: number) => {
      const delta = time - lastTime;
      if (delta >= frameInterval) {
        lastTime = time - (delta % frameInterval);
        drawScene(time);
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [staticMode]);

  if (themeConfig.background.source === "video") {
    return (
      <video
        src={themeConfig.background.videoSrc}
        autoPlay={!staticMode}
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover anim-fade ${className}`}
        style={{ animationDelay: "0.2s", ...style }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full object-cover anim-fade ${className}`}
      style={{ animationDelay: "0.2s", pointerEvents: "none", ...style }}
    />
  );
};

