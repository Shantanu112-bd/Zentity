/**
 * frontend/src/theme/config.ts
 * 
 * Theme & Background Configuration for Pramaan-ZK
 * Complies with ANTIGRAVITY_UI_REDESIGN_PROMPT.md §1:
 * - Default: "canvas" (high-contrast, procedural looping dark particle vortex)
 * - Optional: "video" (loads local video at /media/background.mp4)
 * - Zero unauthorized external CDN hotlinks
 */

export interface ThemeConfig {
  background: {
    source: "canvas" | "video";
    videoSrc: string;
    fpsCap: number;
  };
  brand: {
    name: string;
    wordmark: string;
    tagline: string;
  };
}

export const themeConfig: ThemeConfig = {
  background: {
    source: "canvas",
    videoSrc: "/media/background.mp4",
    fpsCap: 30,
  },
  brand: {
    name: "Pramaan-ZK",
    wordmark: "P R A M A A N",
    tagline: "Privacy by Proof",
  },
};

