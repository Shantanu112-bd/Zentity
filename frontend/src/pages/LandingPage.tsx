/**
 * frontend/src/pages/LandingPage.tsx
 * 
 * Redesigned Pramaan-ZK Landing Page
 * Strictly adheres to ANTIGRAVITY_UI_REDESIGN_PROMPT.md §3 step C and
 * bDmADrNPj4BiT_qYsfvm-neWDol26SLv6udUYv7W0sE.md specification:
 * - Full-screen black outer frame (p-3 md:p-4)
 * - Rounded-2xl inner stage with procedural BackgroundStage
 * - Navbar with original SVG logo, "P R A M A A N" wordmark, and cut buttons (.btn-cut, .btn-cut-border)
 * - Staggered fade-up entrances (.anim-stagger) with exact delay table:
 *   Background video/canvas: 0.2s
 *   Logo + brand: 0.1s
 *   Nav buttons: 0.2s
 *   Left column: 0.4s
 *   Center heading: 0.5s
 *   Bottom col 1: 0.7s
 *   Bottom col 2: 0.85s
 *   Bottom col 3: 1s
 * - Responsive breakpoints and 3-column bottom grid
 * - Truthful labelling (DEMO / SYNTHETIC)
 */

import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { BackgroundStage } from "../theme/BackgroundStage";
import { StatusChip } from "../theme/components/StatusChip";
import { useWallet } from "../context/WalletContext";

export const LandingPage: React.FC = () => {
  const { targetNetwork, contracts } = useWallet();

  // Active network label (e.g. "MST Coral Testnet · 54635")
  const networkLabel = targetNetwork.name
    ? `${targetNetwork.name} · ${targetNetwork.chainId}`
    : "MST Coral Testnet · 54635";

  // Registry explorer link if deployed, or base explorer
  const explorerUrl =
    contracts?.PramaanRegistry?.address && targetNetwork.explorerUrl
      ? `${targetNetwork.explorerUrl}/address/${contracts.PramaanRegistry.address}`
      : targetNetwork.explorerUrl || "https://coral.mstscan.com";

  return (
    <div className="h-screen w-full bg-black p-3 md:p-4 font-inter select-none overflow-hidden flex flex-col box-border">
      {/* Inner Liquid-Glass Stage Container */}
      <div className="w-full h-full rounded-2xl flex flex-col overflow-hidden relative bg-black border border-white/10 shadow-2xl">
        {/* Background Canvas (Procedural Dark Vortex with Light Streaks) */}
        <BackgroundStage className="anim-fade" style={{ animationDelay: "0.2s" }} />

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8">
          {/* Logo block (.anim-stagger, delay 0.1s) */}
          <div
            className="anim-stagger flex flex-col items-start cursor-pointer"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex items-center gap-3">
              <img
                src="/brand/logo.svg"
                alt="Pramaan-ZK"
                className="w-14 h-14 md:w-16 md:h-16 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-white text-[10px] md:text-xs tracking-[0.4em] mt-1 font-light">
                  P R A M A A N
                </span>
                <span className="text-white/40 text-[9px] tracking-wider mt-0.5">ZK ATTRIBUTE GATE</span>
              </div>
            </div>
            <div className="mt-2">
              <StatusChip status="DEMO / SYNTHETIC" size="sm" />
            </div>
          </div>

          {/* Nav buttons (.anim-stagger, delay 0.2s, flex items-center gap-3) */}
          <div
            className="anim-stagger flex items-center gap-3"
            style={{ animationDelay: "0.2s" }}
          >
            <Link
              to="/app/prove"
              className="hidden md:inline-flex px-5 py-2.5 text-white text-sm hover:bg-white/10 btn-cut-border"
            >
              <span>Prove</span>
            </Link>
            <Link
              to="/app/prove"
              className="hidden md:inline-flex px-5 py-2.5 bg-white text-black text-sm hover:bg-white/90 btn-cut"
            >
              Launch App
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-between px-6 md:px-10 pb-8 md:pb-10">
          {/* Top section with Left column and Center heading */}
          <div className="flex-1 flex items-center relative">
            {/* Left column (.anim-stagger, delay 0.4s) — hidden lg:flex flex-col gap-6 absolute left-0 top-[18%] */}
            <div
              className="anim-stagger hidden lg:flex flex-col gap-6 absolute left-0 top-[18%]"
              style={{ animationDelay: "0.4s" }}
            >
              <p className="text-white/80 text-base leading-relaxed max-w-[220px]">
                Prove what matters,<br />
                reveal nothing<br />
                else
              </p>
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full border border-white/40" />
                  <div className="w-1 h-1 rounded-full border border-white/40" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-white/70 text-xs">
                    Privacy<br />
                    by Proof
                  </span>
                  <span className="text-white/50 text-xs font-mono">01</span>
                </div>
              </div>
            </div>

            {/* Center heading (.anim-stagger, delay 0.5s) */}
            <div
              className="anim-stagger w-full text-center"
              style={{ animationDelay: "0.5s" }}
            >
              <h1
                className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal leading-[1.1] tracking-[-0.04em]"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
              >
                Prove Your Age<br />
                Reveal Nothing Else<br />
                Pramaan-ZK
              </h1>
            </div>
          </div>

          {/* Bottom row (3 columns; on mobile all center-aligned, on md+ outer columns right-aligned) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mt-8">
            {/* Col 1 (.anim-stagger, delay 0.7s) */}
            <div
              className="anim-stagger flex items-center justify-center md:justify-end"
              style={{ animationDelay: "0.7s" }}
            >
              <p className="text-white text-sm leading-relaxed max-w-[260px] text-center md:text-left md:ml-auto">
                Zero-knowledge proofs of an age ≥ 18 attribute, verified on MST Blockchain. Demo uses synthetic credentials.
              </p>
            </div>

            {/* Col 2 (.anim-stagger, delay 0.85s) */}
            <div
              className="anim-stagger flex flex-col items-center gap-8 md:gap-24"
              style={{ animationDelay: "0.85s" }}
            >
              <span className="text-white text-xl sm:text-2xl md:text-3xl font-medium tracking-tight text-center">
                {networkLabel}
              </span>
              <Link
                to="/app/prove"
                className="w-full max-w-[280px] py-3.5 bg-white flex items-center justify-center gap-2 text-black hover:bg-white/90 transition-colors group btn-cut"
              >
                <span className="text-sm font-medium">Launch App</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Col 3 (.anim-stagger, delay 1s) */}
            <div
              className="anim-stagger flex items-center justify-center md:justify-end gap-3"
              style={{ animationDelay: "1s" }}
            >
              {/* GitHub */}
              <a
                href="https://github.com/Shantanu112-bd/Zentity"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub Repository"
                className="w-10 h-10 bg-white flex items-center justify-center text-black hover:bg-white/90 transition-colors btn-cut-sm"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>

              {/* Explorer */}
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="MST Blockchain Explorer"
                className="w-10 h-10 bg-white flex items-center justify-center text-black hover:bg-white/90 transition-colors btn-cut-sm"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>

              {/* Documentation */}
              <a
                href="https://github.com/Shantanu112-bd/Zentity#readme"
                target="_blank"
                rel="noopener noreferrer"
                title="Protocol Documentation"
                className="w-10 h-10 bg-white flex items-center justify-center text-black hover:bg-white/90 transition-colors btn-cut-sm"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
