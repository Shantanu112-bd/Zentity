/**
 * frontend/src/theme/apogee/Hero.tsx
 * 
 * Main Landing Section for Apogee Design System
 * - Cloud & local looping nebula video behind content
 * - Strict horizontal breathing room (px-5 sm:px-[27px], max-w-[1800px], px-[82px])
 * - Left copy column with h1 and CTA triggers
 * - Right dynamic metric card with 32-bar synchronized staggered sequence
 */

import React from "react";
import { Link } from "react-router-dom";
import { Nav } from "./Nav";
import { Animate } from "./Animate";
import { RevenueCard } from "./RevenueCard";
import { StatusChip } from "../../components/StatusChip";
import { useWallet } from "../../context/WalletContext";

interface HeroProps {
  onBookDemo?: () => void;
  onTalkTeam?: () => void;
}

export function Hero({ onBookDemo, onTalkTeam }: HeroProps) {
  const { targetNetwork } = useWallet();

  return (
    <section className="relative w-full h-screen overflow-hidden bg-[#080A19]">
      {/* Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/media/nebula.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Subtle Ambient Contrast Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080A19]/80 via-transparent to-black/30 pointer-events-none" />

      {/* Foreground Content Stack */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        <Nav onBookDemo={onBookDemo} />

        <div className="flex-1 flex items-center py-6 sm:py-8">
          <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-12">
            
            {/* Left Copy Column */}
            <div className="max-w-[593px]">
              <Animate delay={200} direction="up" className="mb-3">
                <StatusChip type="DEMO / SYNTHETIC" size="sm" />
              </Animate>

              <Animate delay={300} direction="up">
                <h1 className="text-white text-[36px] sm:text-[52px] md:text-[64px] lg:text-[72px] font-normal leading-[0.95] mb-5 sm:mb-8 tracking-[-0.03em]">
                  Elevate your essential data to new heights
                </h1>
              </Animate>

              <Animate delay={500} direction="up">
                <p className="text-white/80 text-[16px] sm:text-[18px] md:text-[20px] font-[450] leading-[1.3] max-w-[420px] mb-7 sm:mb-10">
                  Zero-knowledge attribute verification with zero raw PII disclosure on {targetNetwork.name}.
                </p>
              </Animate>

              <Animate delay={700} direction="up">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <Link
                    to="/app/prove"
                    onClick={onBookDemo}
                    className="h-[46px] sm:h-[51px] px-5 sm:px-[27px] bg-[#E9E9E9] rounded-[12px] text-[#0A0707] text-[14px] sm:text-[15.5px] font-[450] leading-[15.5px] transition-opacity hover:opacity-90 inline-flex items-center justify-center font-medium shadow-lg"
                  >
                    Generate Proof
                  </Link>

                  <Link
                    to="/app/verify"
                    onClick={onTalkTeam}
                    className="h-[46px] sm:h-[51px] px-5 sm:px-[27px] rounded-[12px] border border-white text-white text-[14px] sm:text-[15.5px] font-[450] leading-[15.5px] transition-opacity hover:opacity-80 inline-flex items-center justify-center"
                  >
                    Verify On-Chain
                  </Link>
                </div>
              </Animate>
            </div>

            {/* Right Metric Card */}
            <RevenueCard
              label="ZK Verification Telemetry"
              amountWhole="5,014"
              amountCents=" R1CS"
              growthBadge="636 ms"
              comparisonText={`MST Coral · 288,882 gas`}
            />
          </div>
        </div>

        {/* Bottom Status Ticker */}
        <div className="w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] pb-4 flex items-center justify-between text-[11px] font-mono text-white/40">
          <span>{targetNetwork.name} (Chain ID {targetNetwork.chainId})</span>
          <span>Zero-PII Client Prover (Groth16 WASM)</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;

