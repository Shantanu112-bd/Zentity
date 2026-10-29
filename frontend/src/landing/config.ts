/**
 * frontend/src/landing/config.ts
 * 
 * Media Source Configuration for Landing Walkthrough
 * Per ANTIGRAVITY_UI_ALIGNMENT_PROMPT.md §1:
 * - Default: "canvas" (high-contrast, procedural cinematic scenes)
 * - Optional: "files" (loads user-provided local media in frontend/public/media/)
 * - Never hotlinks unauthorized remote URLs
 */

export interface LandingConfig {
  mediaSource: "canvas" | "files";
  files?: {
    credentialBg?: string;
    proofBg?: string;
    verifiedBg?: string;
    warpVideo?: string;
    terminalImage?: string;
  };
}

export const landingConfig: LandingConfig = {
  mediaSource: "canvas",
  files: {
    credentialBg: "/media/credential-bg.mp4",
    proofBg: "/media/proof-bg.mp4",
    verifiedBg: "/media/verified-bg.mp4",
    warpVideo: "/media/transition.mp4",
    terminalImage: "/media/terminal.jpg",
  },
};

