/**
 * frontend/src/components/AppShell.tsx
 * 
 * Application Shell for Pramaan-ZK App Routes (/app/*)
 * Adheres strictly to the Apogee Design System:
 * - Canvas base: #080A19
 * - Header: Apogee Nav with center pill navigation and right wallet action pill
 * - Container panels: bg-[rgba(17,16,15,0.35)] backdrop-blur-[20px] rounded-[24px] border border-white/[0.06]
 * - Typography: Suisse Intl font-[450] on text-white / text-white/80
 * - Buttons: #E9E9E9 solid and 1px border pill structures
 * - Prover CPU Isolation: Static background on app routes ensures 0 animation loops during proving
 */

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { StatusChip } from "./StatusChip";
import { useWallet } from "../context/WalletContext";
import { Menu, X, ArrowLeft, ExternalLink, ChevronDown } from "lucide-react";
import { Animate } from "../theme/apogee/Animate";

export interface ShellStep {
  id: string;
  label: string;
}

export interface AppShellProps {
  title: string;
  activeStepId?: string;
  steps?: ShellStep[];
  facts?: [string, React.ReactNode][];
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  title,
  activeStepId,
  steps = [],
  facts = [],
  children,
}) => {
  const location = useLocation();
  const {
    address,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    targetNetwork,
    contracts,
    connect,
    disconnect,
    switchNetwork,
  } = useWallet();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Prove", to: "/app/prove" },
    { label: "Verify", to: "/app/verify" },
    { label: "Registry Gate", to: "/app/dapp" },
    { label: "Relying Party", to: "/app/relying-party" },
  ];

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Connect Wallet";

  const explorerUrl =
    contracts?.PramaanRegistry?.address && targetNetwork.explorerUrl
      ? `${targetNetwork.explorerUrl}/address/${contracts.PramaanRegistry.address}`
      : targetNetwork.explorerUrl || "https://coral.mstscan.com";

  return (
    <div className="min-h-screen w-full bg-[#080A19] font-['Suisse_Intl',sans-serif] text-white flex flex-col relative overflow-x-hidden selection:bg-white/20">
      {/* Background Static Gradient Layer */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0e122b]/50 via-[#080A19] to-[#04050d] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-30 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] pt-[20px] sm:pt-[24px] pb-4 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer group focus:outline-none">
            <svg
              width="28"
              height="28"
              viewBox="0 0 256 256"
              fill="none"
              className="sm:w-[30px] sm:h-[30px] group-hover:scale-105 transition-transform"
            >
              <path
                d="M 256 256 L 178 256 C 150.386 256 128 233.614 128 206 L 128 256 L 0 256 L 0 192 C 0 156.654 28.654 128 64 128 C 99.346 128 128 156.654 128 192 L 128 128 L 256 128 Z M 78 0 C 105.614 0 128 22.386 128 50 L 128 0 L 256 0 L 256 64 C 256 99.346 227.346 128 192 128 C 156.654 128 128 99.346 128 64 L 128 128 L 0 128 L 0 0 Z"
                fill="white"
              />
            </svg>
            <div className="flex flex-col">
              <span className="text-white text-[20px] sm:text-[22px] font-[450] leading-none tracking-[-0.02em]">
                Apogee
              </span>
              <span className="text-white/40 text-[9px] tracking-widest font-mono mt-0.5">
                PRAMAAN-ZK
              </span>
            </div>
          </Link>
        </div>

        {/* Center Desktop Navigation Pill */}
        <div className="hidden lg:flex h-[48px] px-6 items-center gap-[24px] bg-[rgba(10,7,7,0.35)] rounded-[11px] backdrop-blur-[17px] border border-white/[0.04]">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`text-[13.5px] font-[450] transition-colors ${
                  isActive ? "text-white font-medium" : "text-white/70 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Desktop Auth / Action Pill */}
        <div className="hidden sm:flex h-[48px] p-[3px] bg-[rgba(0,0,0,0.35)] rounded-[13px] backdrop-blur-[17px] border border-white/[0.04] items-center gap-[5px]">
          {/* Network Chip */}
          <span
            data-testid="network-chip"
            className="px-3 py-1.5 text-[11px] font-mono tracking-wider rounded-[9px] bg-white/5 text-white/70"
          >
            {targetNetwork.name}
          </span>

          {!isCorrectNetwork && isConnected && (
            <button
              type="button"
              onClick={() => switchNetwork()}
              className="px-2.5 py-1 text-[11px] bg-rose-500/20 text-rose-300 rounded-[9px] hover:bg-rose-500/30 transition-colors"
            >
              Switch Net
            </button>
          )}

          {/* Wallet Button */}
          {isConnected && address ? (
            <button
              type="button"
              onClick={disconnect}
              data-testid="wallet-connect-btn"
              className="h-[42px] px-4 rounded-[10px] text-white text-[13px] font-mono font-[450] hover:bg-white/5 transition-colors"
              title="Click to disconnect"
            >
              {shortAddress}
            </button>
          ) : (
            <button
              type="button"
              onClick={connect}
              disabled={isConnecting}
              data-testid="wallet-connect-btn"
              className="h-[42px] px-5 bg-[#E9E9E9] rounded-[10px] text-[#0A0707] text-[13.5px] font-[450] hover:bg-white transition-colors"
            >
              {isConnecting ? "Connecting..." : "Connect"}
            </button>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="sm:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-[40px] h-[40px] flex items-center justify-center rounded-[11px] bg-[rgba(10,7,7,0.35)] backdrop-blur-[17px] border border-white/[0.06] text-white"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-40 bg-[#080A19]/90 backdrop-blur-[24px] pt-[80px] px-5 flex flex-col gap-4">
          <div className="bg-[rgba(17,16,15,0.6)] backdrop-blur-[30px] rounded-[20px] border border-white/[0.06] p-6 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-[450] text-white/90 hover:text-white"
              >
                {link.label}
              </Link>
            ))}

            <div className="h-px bg-white/10 my-2" />

            <div className="flex items-center justify-between text-xs text-white/60 px-2">
              <span>Network:</span>
              <span className="font-mono text-white/80">{targetNetwork.name} ({targetNetwork.chainId})</span>
            </div>

            {isConnected && address ? (
              <button
                type="button"
                onClick={() => {
                  disconnect();
                  setMobileMenuOpen(false);
                }}
                className="w-full h-[46px] rounded-[11px] border border-white/20 text-white font-mono text-xs"
              >
                Disconnect ({shortAddress})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  connect();
                  setMobileMenuOpen(false);
                }}
                className="w-full h-[46px] bg-[#E9E9E9] rounded-[11px] text-[#0A0707] font-[450] text-sm"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Stage */}
      <main className="relative z-10 flex-1 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-6 sm:py-8 flex flex-col">
        {/* Page Header Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] sm:text-[32px] md:text-[38px] font-normal tracking-[-0.03em] text-white leading-none">
              {title}
            </h1>
            <span className="text-white/20 text-xs hidden sm:inline">•</span>
            <span className="text-xs text-white/50 font-[450] hidden sm:inline">Apogee ZK Protocol</span>
          </div>

          {/* Workflow Step Indicator */}
          {steps.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {steps.map((st, idx) => {
                const isActive = st.id === activeStepId;
                return (
                  <span
                    key={st.id}
                    className={`px-3 py-1 text-[11px] font-[450] tracking-wider rounded-[8px] transition-colors ${
                      isActive
                        ? "bg-[#E9E9E9] text-[#0A0707] font-medium"
                        : "bg-white/[0.04] text-white/60 border border-white/[0.06]"
                    }`}
                  >
                    {idx + 1}. {st.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col">{children}</div>
      </main>

      {/* Bottom Telemetry Footer */}
      <footer className="relative z-10 w-full max-w-[1800px] mx-auto px-5 sm:px-8 md:px-[82px] py-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50 font-[450]">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          {facts.length > 0 ? (
            facts.slice(0, 3).map(([k, v], idx) => (
              <span key={idx} className="flex items-center gap-1">
                <span className="text-white/40">{k}</span>
                <span className="text-white/80">{v}</span>
              </span>
            ))
          ) : (
            <span>MST Coral Testnet · 5,014 Constraints · Zero-PII Prover</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Shantanu112-bd/Zentity"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <Link to="/" className="text-white/60 hover:text-white transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            <span>Landing</span>
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
