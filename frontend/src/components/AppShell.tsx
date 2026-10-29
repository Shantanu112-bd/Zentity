/**
 * frontend/src/components/AppShell.tsx
 * 
 * Unified Application Shell for Pramaan-ZK Application Routes (/app/*)
 * Strictly adheres to ANTIGRAVITY_UI_REDESIGN_PROMPT.md §2, §3 & §4:
 * - Outer black frame (p-3 md:p-4)
 * - Inner stage (rounded-2xl relative bg-black overflow-hidden)
 * - BackgroundStage with staticMode={true} (0 rAF loop on prover, zero CPU contention)
 * - Octagonal cut navigation & wallet buttons (.btn-cut, .btn-cut-border, .btn-cut-sm)
 * - Top navbar with logo, live network chip, wallet connect button
 * - Preserves steps, facts, and test IDs
 */

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BackgroundStage } from "../theme/BackgroundStage";
import { StatusChip } from "./StatusChip";
import { useWallet } from "../context/WalletContext";
import { Menu, X, ArrowLeft, ExternalLink, ArrowRight } from "lucide-react";

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

  // Explorer URL calculation
  const explorerUrl =
    contracts?.PramaanRegistry?.address && targetNetwork.explorerUrl
      ? `${targetNetwork.explorerUrl}/address/${contracts.PramaanRegistry.address}`
      : targetNetwork.explorerUrl || "https://coral.mstscan.com";

  return (
    <div className="h-screen w-full bg-black p-3 md:p-4 font-inter select-none overflow-hidden flex flex-col box-border">
      {/* Inner Rounded Stage */}
      <div className="w-full h-full rounded-2xl flex flex-col overflow-hidden relative bg-black border border-white/10 shadow-2xl">
        {/* Background Canvas: staticMode=true isolates CPU completely for Groth16 SnarkJS Web Worker */}
        <BackgroundStage staticMode={true} />

        {/* Top Navbar */}
        <header className="relative z-20 flex items-center justify-between px-6 md:px-10 pt-5 md:pt-6 pb-4 border-b border-white/10 backdrop-blur-md bg-black/50">
          {/* Logo & Brand Block */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded">
              <img
                src="/brand/logo.svg"
                alt="Pramaan-ZK Logo"
                className="w-8 h-8 md:w-9 md:h-9 object-contain group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-white text-xs md:text-sm tracking-[0.35em] font-light">
                  P R A M A A N
                </span>
                <span className="text-[10px] text-white/50 tracking-wider">ZK Attribute Gate</span>
              </div>
            </Link>

            <span className="hidden sm:inline-block h-4 w-px bg-white/20 mx-2" />

            {/* Network Chip */}
            <div className="hidden sm:flex items-center gap-2">
              <span
                data-testid="network-chip"
                className="px-2.5 py-1 text-[11px] font-mono tracking-wider rounded border border-white/20 bg-white/5 text-white/80"
              >
                {targetNetwork.name} · {targetNetwork.chainId}
              </span>
              {!isCorrectNetwork && isConnected && (
                <button
                  type="button"
                  onClick={() => switchNetwork()}
                  className="px-2 py-0.5 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded hover:bg-rose-500/30 transition-colors"
                >
                  Switch Network
                </button>
              )}
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-1.5 text-xs font-medium tracking-tight transition-all rounded ${
                    isActive
                      ? "text-white bg-white/15 border border-white/30"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Status Badge + Wallet Connect */}
          <div className="flex items-center gap-3">
            <StatusChip type="DEMO / SYNTHETIC" size="sm" className="hidden sm:inline-flex" />

            {isConnected && address ? (
              <button
                type="button"
                onClick={disconnect}
                data-testid="wallet-connect-btn"
                className="btn-cut px-4 py-2 text-xs font-mono font-medium hover:bg-white/90"
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
                className="btn-cut px-4 py-2 text-xs font-medium hover:bg-white/90"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white/70 hover:text-white rounded border border-white/10 bg-white/5"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden relative z-30 bg-black/95 border-b border-white/10 px-6 py-4 flex flex-col gap-3 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs text-white/50">Active Network:</span>
              <span className="text-xs font-mono text-white/80">
                {targetNetwork.name} ({targetNetwork.chainId})
              </span>
            </div>
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 text-sm font-medium rounded ${
                    isActive ? "text-white bg-white/15" : "text-white/70 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-2 flex items-center justify-between">
              <StatusChip type="DEMO / SYNTHETIC" size="sm" />
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Landing Home
              </Link>
            </div>
          </div>
        )}

        {/* Page Top Sub-Header: Page Title & Step Pills */}
        <div className="relative z-10 px-6 md:px-10 pt-5 pb-3 flex flex-wrap items-center justify-between gap-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal tracking-[-0.03em] text-white uppercase">
              {title}
            </h1>
            <span className="text-white/40 text-xs hidden sm:inline">•</span>
            <span className="text-xs text-white/50 hidden sm:inline">Pramaan-ZK Gateway</span>
          </div>

          {/* Workflow Steps Indicator */}
          {steps.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {steps.map((st, idx) => {
                const isActive = st.id === activeStepId;
                return (
                  <span
                    key={st.id}
                    className={`px-2.5 py-1 text-[11px] font-mono tracking-wider transition-colors ${
                      isActive
                        ? "bg-white text-black font-semibold btn-cut-sm"
                        : "bg-white/5 text-white/50 border border-white/10 rounded"
                    }`}
                  >
                    {idx + 1}. {st.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Content Area (Scrollable within Inner Stage) */}
        <main className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 md:px-10 py-6 flex flex-col">
          <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
            {children}
          </div>
        </main>

        {/* Spec Bottom-Row Facts & Secondary Action Bar */}
        <footer className="relative z-10 px-6 md:px-10 py-3 border-t border-white/10 bg-black/60 backdrop-blur-md grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs">
          {/* Col 1: Plain Language Helper / Facts */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/60 font-mono text-[11px]">
            {facts.length > 0 ? (
              facts.slice(0, 3).map(([key, val], idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="text-white/40">{key}</span>
                  <span className="text-white/80">{val}</span>
                </div>
              ))
            ) : (
              <span>MST Coral Testnet • Groth16 Age ≥ 18 Circuit • Zero-PII Egress</span>
            )}
          </div>

          {/* Col 2: Context Navigation */}
          <div className="flex items-center justify-center text-center">
            <Link
              to="/app/prove"
              className="text-white/70 hover:text-white text-xs inline-flex items-center gap-1 transition-colors"
            >
              <span>ZK Attribute Prover</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Col 3: Secondary Cut Icon Buttons */}
          <div className="flex items-center justify-center md:justify-end gap-2.5">
            <a
              href="https://github.com/Shantanu112-bd/Zentity"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub Repo"
              className="w-8 h-8 bg-white flex items-center justify-center text-black hover:bg-white/90 transition-colors btn-cut-sm"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>

            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="MST Explorer"
              className="w-8 h-8 bg-white flex items-center justify-center text-black hover:bg-white/90 transition-colors btn-cut-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Link
              to="/"
              title="Landing Portal"
              className="w-8 h-8 bg-white flex items-center justify-center text-black hover:bg-white/90 transition-colors btn-cut-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppShell;
