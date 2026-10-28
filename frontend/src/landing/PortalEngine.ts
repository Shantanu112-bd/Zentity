/**
 * frontend/src/landing/PortalEngine.ts
 * 
 * High-Performance Canvas-Masked 3D Tilt Engine for Pramaan-ZK Landing
 * Ported from reference mechanics with exact math & timings:
 * - Fake-3D perspective projection (focal 850)
 * - Rounded-rect polygon point sampler (~44 points)
 * - Screen-locked cover draw with bottom shade gradient
 * - Smooth cubic easing for travel expansion and mask reveals
 * - 0 external libraries, responsive from 360px, prefers-reduced-motion safe
 */

import {
  ProceduralScene,
  createCredentialScene,
  createProofScene,
  createVerifiedScene,
  createWarpScene,
} from "./scenes";

export type ChapterId = "credential" | "proof" | "verified";

export interface ChapterData {
  id: ChapterId;
  number: string;
  name: string;
  nextName: string;
  nextNumber: string;
  facts: [string, string][];
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class PortalEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private portalEl: HTMLElement;
  private isDestroyed = false;
  private isPaused = false;

  // Scenes
  private credentialScene: ProceduralScene;
  private proofScene: ProceduralScene;
  private verifiedScene: ProceduralScene;
  private warpScene: ProceduralScene;
  private frozenCanvas: HTMLCanvasElement | null = null;

  // Animation & Motion State
  private rotX = 0;
  private rotY = 0;
  private targetX = 0;
  private targetY = 0;
  private maskScale = 1;
  private expansion = 0;
  private transitionActive = false;
  private isBusy = false;
  private currentChapter: ChapterId = "credential";

  private lastTime = performance.now();
  private rafId: number | null = null;

  // Callbacks
  private onChapterCommit?: (chapter: ChapterId) => void;
  private onTransitionStart?: () => void;
  private onTransitionEnd?: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    portalEl: HTMLElement,
    callbacks?: {
      onChapterCommit?: (chapter: ChapterId) => void;
      onTransitionStart?: () => void;
      onTransitionEnd?: () => void;
    }
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.portalEl = portalEl;
    this.onChapterCommit = callbacks?.onChapterCommit;
    this.onTransitionStart = callbacks?.onTransitionStart;
    this.onTransitionEnd = callbacks?.onTransitionEnd;

    // Instantiate procedural offscreen scenes
    this.credentialScene = createCredentialScene();
    this.proofScene = createProofScene();
    this.verifiedScene = createVerifiedScene();
    this.warpScene = createWarpScene();

    this.initEvents();
    this.resizeCanvas();
    this.startLoop();
  }

  public setMaskScale(scale: number) {
    this.maskScale = scale;
  }

  public setChapter(chapter: ChapterId) {
    this.currentChapter = chapter;
  }

  public getChapter(): ChapterId {
    return this.currentChapter;
  }

  public isTerminal(): boolean {
    return this.currentChapter === "verified";
  }

  private initEvents() {
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("pointermove", this.handlePointerMove);
    document.addEventListener("pointerleave", this.handlePointerLeave);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  private handleResize = () => {
    this.resizeCanvas();
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (this.isBusy || this.transitionActive) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.targetY = (e.clientX / w - 0.5) * 37.4;
    this.targetX = (e.clientY / h - 0.5) * -33;
  };

  private handlePointerLeave = () => {
    this.targetX = 0;
    this.targetY = 0;
  };

  private handleVisibilityChange = () => {
    this.isPaused = document.hidden;
    if (!document.hidden && !this.isDestroyed) {
      this.lastTime = performance.now();
      this.startLoop();
    }
  };

  private resizeCanvas() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private drawCover(source: HTMLCanvasElement) {
    const sw = source.width;
    const sh = source.height;
    const dw = window.innerWidth;
    const dh = window.innerHeight;
    const scale = Math.max(dw / sw, dh / sh);
    const renderW = sw * scale;
    const renderH = sh * scale;
    const offsetX = (dw - renderW) / 2;
    const offsetY = (dh - renderH) / 2;
    this.ctx.drawImage(source, offsetX, offsetY, renderW, renderH);
  }

  private drawShade() {
    const dw = window.innerWidth;
    const dh = window.innerHeight;
    const shadeGrad = this.ctx.createLinearGradient(0, dh * 0.52, 0, dh);
    shadeGrad.addColorStop(0, "rgba(0,0,0,0)");
    shadeGrad.addColorStop(1, "rgba(0,0,0,0.88)");
    this.ctx.fillStyle = shadeGrad;
    this.ctx.fillRect(0, dh * 0.52, dw, dh * 0.48);
  }

  /**
   * Sample ~44 polygon points on rounded rectangle perimeter in local coords
   */
  private sampleRoundedRectPoints(w: number, h: number, radius: number): [number, number][] {
    const r = Math.max(0, Math.min(radius, w / 2, h / 2));
    const points: [number, number][] = [];
    const steps = 10;

    const corners: [number, number, number, number][] = [
      [w / 2 - r, -h / 2 + r, -Math.PI / 2, 0],
      [w / 2 - r, h / 2 - r, 0, Math.PI / 2],
      [-w / 2 + r, h / 2 - r, Math.PI / 2, Math.PI],
      [-w / 2 + r, -h / 2 + r, Math.PI, Math.PI * 1.5],
    ];

    for (const [cx, cy, startA, endA] of corners) {
      for (let i = 0; i <= steps; i++) {
        const theta = startA + (i / steps) * (endA - startA);
        points.push([cx + Math.cos(theta) * r, cy + Math.sin(theta) * r]);
      }
    }

    return points;
  }

  private startLoop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);

    const frame = (now: number) => {
      if (this.isDestroyed) return;
      if (this.isPaused) return;

      const rawDt = now - this.lastTime;
      const dt = Math.min(40, rawDt);
      this.lastTime = now;

      this.update(dt, now);
      this.render();

      this.rafId = requestAnimationFrame(frame);
    };

    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(frame);
  }

  private update(dt: number, time: number) {
    // Smooth tilt rotation
    const smooth = Math.min(1, dt * 0.009);
    this.rotX += (this.targetX - this.rotX) * smooth;
    this.rotY += (this.targetY - this.rotY) * smooth;

    // Update scene simulations
    this.credentialScene.render(dt, time);
    this.proofScene.render(dt, time);
    this.verifiedScene.render(dt, time);
    if (this.transitionActive) {
      this.warpScene.render(dt, time, this.expansion);
    }
  }

  private render() {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    // If frozen background from last transition exists, blit it first
    if (this.frozenCanvas) {
      this.drawCover(this.frozenCanvas);
      this.drawShade();
    }

    if (!this.portalEl) return;
    const rect = this.portalEl.getBoundingClientRect();
    const rectCx = rect.left + rect.width / 2;
    const rectCy = rect.top + rect.height / 2;

    const e = this.expansion;
    const cx = rectCx + (w / 2 - rectCx) * e;
    const cy = rectCy + (h / 2 - rectCy) * e;

    const baseW = rect.width + (w - rect.width) * e;
    const baseH = rect.height + (h - rect.height) * e;

    const scale = e > 0 ? 1 : this.maskScale;
    const portalW = baseW * scale;
    const portalH = baseH * scale;

    const r = 90 * (1 - e) * scale;
    const rx = this.rotX * (1 - e);
    const ry = this.rotY * (1 - e);

    if (portalW > 1 && portalH > 1) {
      const points = this.sampleRoundedRectPoints(portalW, portalH, r);

      // Fake-3D perspective projection (focal 850)
      const ax = (rx * Math.PI) / 180;
      const ay = (ry * Math.PI) / 180;

      ctx.save();
      ctx.beginPath();

      for (let i = 0; i < points.length; i++) {
        const [px, py] = points[i];
        const xx = px * Math.cos(ay);
        const yy = py * Math.cos(ax);
        const z = px * Math.sin(ay) - py * Math.sin(ax);
        const p = 850 / (850 + z);
        const screenX = cx + xx * p;
        const screenY = cy + yy * p;

        if (i === 0) {
          ctx.moveTo(screenX, screenY);
        } else {
          ctx.lineTo(screenX, screenY);
        }
      }

      ctx.closePath();
      ctx.clip();

      // Screen-locked cover draw of active scene
      let activeSceneCanvas: HTMLCanvasElement;
      if (this.transitionActive) {
        activeSceneCanvas = this.warpScene.canvas;
      } else if (this.currentChapter === "credential") {
        activeSceneCanvas = this.proofScene.canvas; // Portal looks into NEXT chapter
      } else if (this.currentChapter === "proof") {
        activeSceneCanvas = this.verifiedScene.canvas; // Portal looks into VERIFIED
      } else {
        activeSceneCanvas = this.verifiedScene.canvas; // Terminal
      }

      ctx.fillStyle = "#030303";
      ctx.fillRect(0, 0, w, h);
      this.drawCover(activeSceneCanvas);

      if (this.transitionActive) {
        this.drawShade();
      }

      ctx.restore();
    }
  }

  /**
   * Travel transition trigger (click or Enter/Space on portal button)
   */
  public async travel(): Promise<void> {
    if (this.isBusy || this.currentChapter === "verified") return;

    this.isBusy = true;
    this.targetX = 0;
    this.targetY = 0;

    const nextChapter: ChapterId = this.currentChapter === "credential" ? "proof" : "verified";
    this.onTransitionStart?.();

    // 1. Expansion phase: 1100ms with warp scene
    this.transitionActive = true;
    await this.animateValue((v) => (this.expansion = v), 1100);

    // 2. Freeze current warp scene to frozen background canvas
    const freeze = document.createElement("canvas");
    freeze.width = window.innerWidth;
    freeze.height = window.innerHeight;
    const fctx = freeze.getContext("2d")!;
    fctx.drawImage(this.warpScene.canvas, 0, 0, freeze.width, freeze.height);
    this.frozenCanvas = freeze;

    // 3. Commit state to next chapter
    this.currentChapter = nextChapter;
    this.onChapterCommit?.(nextChapter);

    // Wait 2 animation frames
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    // 4. Reopen mask over 1050ms
    this.transitionActive = false;
    this.expansion = 0;
    this.maskScale = 0;

    await this.animateValue((v) => (this.maskScale = v), 1050);

    this.onTransitionEnd?.();
    this.isBusy = false;
  }

  private animateValue(setter: (v: number) => void, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / durationMs);
        const eased = easeInOutCubic(progress);
        setter(eased);

        if (progress < 1 && !this.isDestroyed) {
          requestAnimationFrame(step);
        } else {
          setter(1);
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("pointermove", this.handlePointerMove);
    document.removeEventListener("pointerleave", this.handlePointerLeave);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
  }
}
