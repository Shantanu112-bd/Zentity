/**
 * frontend/src/App.tsx
 * 
 * Cinematic Liquid-Glass Hero & Real Web3 Application Workspace
 * 100% Real Protocol Navigation, Metadata, and Functional Components
 */

import React, { useState } from "react";
import {
  Shield,
  Cpu,
  Layers,
  Play,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Database,
  CheckCircle2,
} from "lucide-react";
import { useWallet, useNetwork } from "./core";
import { ProverTab, VerifierTab, RegistryTab } from "./components/AppWorkspace";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4";

type ActiveTab = "overview" | "prover" | "verifier" | "registry";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Web3 Connection
  const { address, isConnected, isConnecting, connect, disconnect, chainId } = useWallet();
  const { targetNetwork, isCorrectNetwork, switchNetwork } = useNetwork(chainId);

  const tabs: ActiveTab[] = ["overview", "prover", "verifier", "registry"];
  const currentTabIndex = tabs.indexOf(activeTab);

  const prevTab = () => {
    const nextIdx = (currentTabIndex - 1 + tabs.length) % tabs.length;
    setActiveTab(tabs[nextIdx]);
  };

  const nextTab = () => {
    const nextIdx = (currentTabIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIdx]);
  };

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden bg-black text-white font-sans select-none flex flex-col justify-between">
      {/* 1. Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0"
        src={VIDEO_URL}
      />

      {/* 2. Bottom Blur Overlay (CSS mask with backdrop-blur-24, no black gradient) */}
      <div className="fixed inset-0 bottom-blur-mask pointer-events-none z-1" />

      {/* 3. Application Frame & Real Navigation */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-between p-6 md:p-10 pointer-events-auto">
        {/* Top Header & Real Application Nav */}
        <header className="w-full flex items-center justify-between pb-6 border-b border-white/10 bg-black/30 backdrop-blur-md rounded-2xl px-6 py-4">
          {/* Brand Logo */}
          <div
            className="animate-blur-fade-up flex items-center gap-2.5 cursor-pointer"
            style={{ animationDelay: "0ms" }}
            onClick={() => setActiveTab("overview")}
          >
            <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center liquid-glass">
              <Shield size={16} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-widest text-sm uppercase">Pramaan-ZK</span>
              <span className="text-[9px] uppercase tracking-wider text-white/50 font-mono -mt-0.5">
                Privacy Protocol
              </span>
            </div>
          </div>

          {/* Real Application Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`animate-blur-fade-up transition-all flex items-center gap-1.5 py-1 px-2.5 rounded-lg ${
                activeTab === "overview"
                  ? "text-white font-bold bg-white/10"
                  : "text-white/60 hover:text-white"
              }`}
              style={{ animationDelay: "100ms" }}
            >
              <span className="text-[10px] text-white/40 font-mono">00</span>
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("prover")}
              className={`animate-blur-fade-up transition-all flex items-center gap-1.5 py-1 px-2.5 rounded-lg ${
                activeTab === "prover"
                  ? "text-white font-bold bg-white/10"
                  : "text-white/60 hover:text-white"
              }`}
              style={{ animationDelay: "150ms" }}
            >
              <span className="text-[10px] text-white/40 font-mono">01</span>
              <span>ZK Prover Gate</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("verifier")}
              className={`animate-blur-fade-up transition-all flex items-center gap-1.5 py-1 px-2.5 rounded-lg ${
                activeTab === "verifier"
                  ? "text-white font-bold bg-white/10"
                  : "text-white/60 hover:text-white"
              }`}
              style={{ animationDelay: "200ms" }}
            >
              <span className="text-[10px] text-white/40 font-mono">02</span>
              <span>Receipt Verifier</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("registry")}
              className={`animate-blur-fade-up transition-all flex items-center gap-1.5 py-1 px-2.5 rounded-lg ${
                activeTab === "registry"
                  ? "text-white font-bold bg-white/10"
                  : "text-white/60 hover:text-white"
              }`}
              style={{ animationDelay: "250ms" }}
            >
              <span className="text-[10px] text-white/40 font-mono">03</span>
              <span>Registry Explorer</span>
            </button>
          </nav>

          {/* Real Wallet & Network Controls */}
          <div className="flex items-center gap-3">
            {/* Network Badge */}
            <div
              className="animate-blur-fade-up hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass text-xs font-mono text-white/80"
              style={{ animationDelay: "350ms" }}
            >
              <span className={`w-2 h-2 rounded-full ${isCorrectNetwork ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span>Coral</span>
              <span className="text-white/40">({targetNetwork.chainId})</span>
            </div>

            {/* Wallet Connect */}
            <div className="animate-blur-fade-up" style={{ animationDelay: "400ms" }}>
              {!isConnected ? (
                <button
                  type="button"
                  onClick={connect}
                  disabled={isConnecting}
                  className="liquid-glass px-4 py-1.5 rounded-full text-xs font-medium text-white hover:text-white/90 border border-white/20"
                  data-testid="wallet-connect-btn"
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
              ) : !isCorrectNetwork ? (
                <button
                  type="button"
                  onClick={switchNetwork}
                  className="px-4 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
                  data-testid="switch-network-btn"
                >
                  Switch to Coral
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="liquid-glass px-3 py-1 rounded-full text-xs font-mono text-white/80 border border-white/15">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
                  </div>
                  <button
                    type="button"
                    onClick={disconnect}
                    className="px-2.5 py-1 rounded-full text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    title="Disconnect wallet"
                    data-testid="wallet-disconnect-btn"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Center Stage: Overview Hero OR Application Module */}
        <div className="my-auto py-8">
          {activeTab === "overview" && (
            <div className="w-full flex flex-col md:flex-row items-end justify-between gap-8">
              <div className="max-w-2xl space-y-4">
                {/* Real Protocol Metadata Row */}
                <div
                  className="animate-blur-fade-up flex items-center gap-3 text-xs text-white/80 font-mono"
                  style={{ animationDelay: "300ms" }}
                >
                  <div className="flex items-center gap-1.5">
                    <Shield size={14} className="text-emerald-400" />
                    <span>BN254 GROTH16</span>
                  </div>
                  <span className="text-white/40">•</span>
                  <div className="flex items-center gap-1.5">
                    <Cpu size={14} className="text-white/70" />
                    <span>5,014 CONSTRAINTS</span>
                  </div>
                  <span className="text-white/40">•</span>
                  <div className="flex items-center gap-1.5">
                    <Layers size={14} className="text-white/70" />
                    <span>MST CORAL TESTNET (54635)</span>
                  </div>
                </div>

                {/* Real Headline */}
                <h1
                  className="animate-blur-fade-up text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-none text-white"
                  style={{ animationDelay: "400ms" }}
                >
                  Prove Attributes. Protect Identity.
                </h1>

                {/* Real Subhead */}
                <p
                  className="animate-blur-fade-up text-sm sm:text-base text-white/70 max-w-xl font-normal leading-relaxed"
                  style={{ animationDelay: "500ms" }}
                >
                  Zero-egress client-side zero-knowledge proofs. Sybil-protected attribute verification on MST Coral Testnet without revealing personal data.
                </p>

                {/* Real Application CTA Buttons */}
                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("prover")}
                    className="animate-blur-fade-up liquid-glass px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all bg-white/10 text-white"
                    style={{ animationDelay: "600ms" }}
                  >
                    <Play size={14} className="fill-white" />
                    <span>Launch Prover Gate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("verifier")}
                    className="animate-blur-fade-up liquid-glass px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all text-white/80 hover:text-white"
                    style={{ animationDelay: "700ms" }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Verify Transaction</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("registry")}
                    className="animate-blur-fade-up liquid-glass px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all text-white/80 hover:text-white hidden sm:flex"
                    style={{ animationDelay: "750ms" }}
                  >
                    <Database size={14} />
                    <span>Explore Registry</span>
                  </button>
                </div>
              </div>

              {/* View Switcher Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevTab}
                  className="animate-blur-fade-up liquid-glass w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  style={{ animationDelay: "800ms" }}
                  title="Previous section"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={nextTab}
                  className="animate-blur-fade-up liquid-glass w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  style={{ animationDelay: "900ms" }}
                  title="Next section"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Active Application Component: Prover */}
          {activeTab === "prover" && (
            <div className="animate-blur-fade-up max-w-6xl mx-auto w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
                  <Shield size={20} className="text-white" />
                  <span>ZK Prover Gate</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="text-xs text-white/60 hover:text-white underline font-mono"
                >
                  ← Return to Overview
                </button>
              </div>
              <ProverTab
                address={address}
                isConnected={isConnected}
                isCorrectNetwork={isCorrectNetwork}
                targetNetwork={targetNetwork}
                connect={connect}
                switchNetwork={switchNetwork}
              />
            </div>
          )}

          {/* Active Application Component: Verifier */}
          {activeTab === "verifier" && (
            <div className="animate-blur-fade-up max-w-3xl mx-auto w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-white" />
                  <span>Receipt Verifier</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="text-xs text-white/60 hover:text-white underline font-mono"
                >
                  ← Return to Overview
                </button>
              </div>
              <VerifierTab targetNetwork={targetNetwork} />
            </div>
          )}

          {/* Active Application Component: Registry */}
          {activeTab === "registry" && (
            <div className="animate-blur-fade-up max-w-5xl mx-auto w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
                  <Database size={20} className="text-white" />
                  <span>Registry & Sybil Explorer</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="text-xs text-white/60 hover:text-white underline font-mono"
                >
                  ← Return to Overview
                </button>
              </div>
              <RegistryTab targetNetwork={targetNetwork} />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="w-full flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/40 pt-4 border-t border-white/10 font-mono gap-2">
          <div>PRAMAAN-ZK · ZERO-EGRESS PRIVACY ATTESTATION</div>
          <div className="flex items-center gap-4">
            <a
              href={`${targetNetwork.explorerUrl}/address/${targetNetwork.registryAddress}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Coral Registry Contract</span>
              <ExternalLink size={11} />
            </a>
            <span>•</span>
            <span>Testnet Issuer (Self-Attested)</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
