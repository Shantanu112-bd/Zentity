/**
 * frontend/src/landing/scenes.ts
 * 
 * Procedural Offscreen Canvas Generators for Pramaan-ZK
 * Replaces remote videos with self-hosted 2D canvas scenes:
 * 1. credentialScene: Slow drifting credential cards & cryptographic glyphs
 * 2. proofScene: Particle ring converging into constraint matrix traces
 * 3. verifiedScene: Block ledger lattice with lit path & nullifier seal
 * 4. warpScene: 1.1s expansion streak/zoom travel transition
 * 
 * Performance:
 * - Capped at 960x540 internal resolution
 * - Zero external libraries
 * - Pauses when tab is hidden
 */

export interface ProceduralScene {
  canvas: HTMLCanvasElement;
  render: (dt: number, time: number, customProgress?: number) => void;
}

function createOffscreenCanvas(w = 960, h = 540): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

// ----------------------------------------------------------------------------
// 1. Credential Scene (CREDENTIAL [01])
// ----------------------------------------------------------------------------
export function createCredentialScene(): ProceduralScene {
  const { canvas, ctx } = createOffscreenCanvas(960, 540);
  const cards = Array.from({ length: 18 }, (_, i) => ({
    x: (i * 55 + Math.random() * 30) % 960,
    y: Math.random() * 540,
    speed: 0.15 + (i % 4) * 0.08,
    size: 28 + (i % 3) * 12,
    alpha: 0.2 + (i % 5) * 0.12,
    symbol: ["ID", "EdDSA", "AGE", "POSEIDON", "ZENTITY", "BN254"][i % 6],
  }));

  const render = (dt: number, time: number) => {
    // Clear background
    ctx.fillStyle = "#06080b";
    ctx.fillRect(0, 0, 960, 540);

    // Deep ambient radial glow
    const grad = ctx.createRadialGradient(480, 270, 40, 480, 270, 420);
    grad.addColorStop(0, "rgba(53, 240, 200, 0.12)");
    grad.addColorStop(0.6, "rgba(139, 123, 255, 0.04)");
    grad.addColorStop(1, "rgba(6, 8, 11, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 960, 540);

    // Drifting glyph cards
    cards.forEach((card, idx) => {
      card.y -= card.speed * dt * 0.05;
      if (card.y < -60) {
        card.y = 580;
        card.x = Math.random() * 960;
      }

      ctx.save();
      ctx.translate(card.x, card.y);
      ctx.fillStyle = `rgba(18, 24, 38, ${card.alpha * 0.85})`;
      ctx.strokeStyle = `rgba(53, 240, 200, ${card.alpha * 0.9})`;
      ctx.lineWidth = 1.2;

      // Card boundary
      const w = card.size * 2.2;
      const h = card.size * 1.4;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 6);
      ctx.fill();
      ctx.stroke();

      // Card chip & text
      ctx.fillStyle = "rgba(53, 240, 200, 0.7)";
      ctx.fillRect(-w / 2 + 6, -h / 2 + 6, 8, 6);

      ctx.fillStyle = `rgba(255, 255, 255, ${card.alpha * 0.9})`;
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.fillText(card.symbol, -w / 2 + 18, -h / 2 + 12);

      // Binary watermark
      ctx.fillStyle = `rgba(53, 240, 200, ${card.alpha * 0.35})`;
      ctx.font = "7px 'JetBrains Mono', monospace";
      ctx.fillText("0x" + ((idx * 8934) % 65535).toString(16), -w / 2 + 6, h / 2 - 6);

      ctx.restore();
    });

    // Subtle drifting grid overlay
    ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
    ctx.lineWidth = 1;
    const gridOffset = (time * 0.02) % 40;
    for (let x = gridOffset; x < 960; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 540);
      ctx.stroke();
    }
  };

  return { canvas, render };
}

// ----------------------------------------------------------------------------
// 2. Proof Scene (PROOF [02])
// ----------------------------------------------------------------------------
export function createProofScene(): ProceduralScene {
  const { canvas, ctx } = createOffscreenCanvas(960, 540);
  const particles = Array.from({ length: 64 }, (_, i) => ({
    angle: (i / 64) * Math.PI * 2,
    radius: 120 + (i % 5) * 22,
    speed: 0.0008 + (i % 3) * 0.0004,
    size: 2 + (i % 3),
  }));

  const render = (dt: number, time: number) => {
    ctx.fillStyle = "#06080b";
    ctx.fillRect(0, 0, 960, 540);

    // Cyan central glow
    const grad = ctx.createRadialGradient(480, 270, 30, 480, 270, 360);
    grad.addColorStop(0, "rgba(53, 240, 200, 0.16)");
    grad.addColorStop(0.5, "rgba(53, 240, 200, 0.05)");
    grad.addColorStop(1, "rgba(6, 8, 11, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 960, 540);

    // Converging circuit traces
    ctx.save();
    ctx.translate(480, 270);

    // Concentric circuit rings
    for (let r = 70; r <= 220; r += 35) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(53, 240, 200, 0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Radial bus lines with constraint nodes
    for (let a = 0; a < 8; a++) {
      const theta = (a / 8) * Math.PI * 2 + time * 0.0002;
      const x1 = Math.cos(theta) * 70;
      const y1 = Math.sin(theta) * 70;
      const x2 = Math.cos(theta) * 220;
      const y2 = Math.sin(theta) * 220;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "rgba(53, 240, 200, 0.18)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Constraint junction point
      ctx.fillStyle = "#35f0c8";
      ctx.beginPath();
      ctx.arc(x2, y2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Orbiting witness particles
    particles.forEach((p) => {
      p.angle += p.speed * dt;
      const px = Math.cos(p.angle) * p.radius;
      const py = Math.sin(p.angle) * p.radius;

      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Central Groth16 Core Glyph
    ctx.strokeStyle = "rgba(53, 240, 200, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#35f0c8";
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("π", 0, 0);

    ctx.restore();
  };

  return { canvas, render };
}

// ----------------------------------------------------------------------------
// 3. Verified Scene (VERIFIED [03])
// ----------------------------------------------------------------------------
export function createVerifiedScene(): ProceduralScene {
  const { canvas, ctx } = createOffscreenCanvas(960, 540);

  const render = (dt: number, time: number) => {
    ctx.fillStyle = "#06080b";
    ctx.fillRect(0, 0, 960, 540);

    // Emerald on-chain radiant glow
    const grad = ctx.createRadialGradient(480, 270, 20, 480, 270, 380);
    grad.addColorStop(0, "rgba(16, 185, 129, 0.18)");
    grad.addColorStop(0.5, "rgba(53, 240, 200, 0.08)");
    grad.addColorStop(1, "rgba(6, 8, 11, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 960, 540);

    // Ledger lattice perspective grid
    ctx.save();
    ctx.translate(480, 270);

    // Isometric block nodes
    const cols = 7;
    const rows = 5;
    for (let c = -cols; c <= cols; c++) {
      for (let r = -rows; r <= rows; r++) {
        const isoX = (c - r) * 36;
        const isoY = (c + r) * 18 + 60;
        const distFromCenter = Math.hypot(isoX, isoY);

        if (distFromCenter < 280) {
          const pulse = Math.sin(time * 0.002 + distFromCenter * 0.02) * 0.5 + 0.5;
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.1 + pulse * 0.25})`;
          ctx.lineWidth = 1;

          // Wireframe block
          ctx.beginPath();
          ctx.moveTo(isoX, isoY - 10);
          ctx.lineTo(isoX + 16, isoY - 2);
          ctx.lineTo(isoX, isoY + 6);
          ctx.lineTo(isoX - 16, isoY - 2);
          ctx.closePath();
          ctx.stroke();

          // Connective ledger lattice line
          if (c < cols) {
            ctx.beginPath();
            ctx.moveTo(isoX, isoY + 6);
            ctx.lineTo(isoX + 36, isoY + 24);
            ctx.strokeStyle = "rgba(53, 240, 200, 0.08)";
            ctx.stroke();
          }
        }
      }
    }

    // Central Verified Nullifier Shield
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
    ctx.fill();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Shield checkmark
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-11, 1);
    ctx.lineTo(-3, 9);
    ctx.lineTo(13, -7);
    ctx.stroke();

    ctx.restore();
  };

  return { canvas, render };
}

// ----------------------------------------------------------------------------
// 4. Warp Scene (Transition travel animation)
// ----------------------------------------------------------------------------
export function createWarpScene(): ProceduralScene {
  const { canvas, ctx } = createOffscreenCanvas(960, 540);
  const streaks = Array.from({ length: 90 }, () => ({
    angle: Math.random() * Math.PI * 2,
    dist: 30 + Math.random() * 450,
    len: 20 + Math.random() * 90,
    speed: 1.2 + Math.random() * 2.5,
    alpha: 0.3 + Math.random() * 0.7,
  }));

  const render = (dt: number, _time: number, progress = 0.5) => {
    ctx.fillStyle = "rgba(6, 8, 11, 0.35)"; // Trail blur
    ctx.fillRect(0, 0, 960, 540);

    const accel = 1 + progress * 3.5;

    ctx.save();
    ctx.translate(480, 270);

    streaks.forEach((s) => {
      s.dist += s.speed * accel * dt * 0.45;
      if (s.dist > 520) {
        s.dist = 20 + Math.random() * 30;
        s.angle = Math.random() * Math.PI * 2;
      }

      const x1 = Math.cos(s.angle) * s.dist;
      const y1 = Math.sin(s.angle) * s.dist;
      const x2 = Math.cos(s.angle) * (s.dist + s.len * accel);
      const y2 = Math.sin(s.angle) * (s.dist + s.len * accel);

      ctx.strokeStyle = `rgba(53, 240, 200, ${s.alpha})`;
      ctx.lineWidth = 1.8 + progress * 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Central hyperdrive flash
    const flashGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 140 * (1 + progress));
    flashGrad.addColorStop(0, `rgba(255, 255, 255, ${0.4 * progress})`);
    flashGrad.addColorStop(0.5, `rgba(53, 240, 200, ${0.25 * progress})`);
    flashGrad.addColorStop(1, "rgba(6, 8, 11, 0)");
    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 160 * (1 + progress), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  return { canvas, render };
}
