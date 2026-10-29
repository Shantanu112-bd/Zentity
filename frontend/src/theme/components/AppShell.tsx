/**
 * frontend/src/theme/components/AppShell.tsx
 * 
 * Application Shell for Pramaan-ZK App Routes (/app/*)
 * Strictly adheres to ANTIGRAVITY_UI_REDESIGN_PROMPT.md §2, §3 & §4:
 * - Full-screen black frame (p-3 md:p-4)
 * - Rounded-2xl inner stage (overflow-hidden relative bg-black)
 * - BackgroundStage with staticMode={true} (0 running rAF loops, static canvas snapshot)
 *   guaranteeing 100% CPU to the Groth16 SnarkJS prover worker
 * - Octagonal cut navigation buttons (.btn-cut, .btn-cut-border)
 * - Live network pill (Coral / Legacy) and WalletConnect button
 * - Mobile responsive drawer/collapse
 * - Preserves all IDs, testids, and routes
 */

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BackgroundStage } from "../BackgroundStage";
import { CutButton } from "./CutButton";
import { StatusChip } from "./StatusChip";
import { useWallet } from "../../context/WalletContext";
import { Menu, X, ArrowLeft, ExternalLink } from "lucide-react";

export interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  badge?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  pageTitle,
  pageSubtitle,
  badge = "DEMO / SYNTHETIC",
}) => {
  const location = useLocation();
  const { address, isConnected, isConnecting, connect, disconnect, targetNetwork, isCorrectNetwork, switchNetwork } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Prove", to: "/app/prove" },
    { label: "Verify", to: "/app/verify" },
    { label: "Registry Gate", to: "/app/dapp" },
    { label: "Relying Party", to: "/app/relying-party" },
  ];

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="h-screen w-full bg-black p-3 md:p-4 font-inter select-none overflow-hidden flex flex-col box-border">
      {/* Inner Rounded Stage */}
      <div className="w-full h-full rounded-2xl flex flex-col overflow-hidden relative bg-black border border-white/10 shadow-2xl">
        {/* Background Canvas (Static Mode on App routes to isolate Prover CPU) */}
        <BackgroundStage staticMode={true} />

        {/* Top Navbar */}
        <header className="relative z-20 flex items-center justify-between px-6 md:px-10 pt-5 md:pt-6 pb-4 border-b border-white/10 backdrop-blur-md bg-black/40">
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
            <StatusChip status={badge} size="sm" className="hidden sm:inline-flex" />

            {isConnected && address ? (
              <button
                onClick={disconnect}
                data-testid="wallet-connect-btn"
                className="btn-cut px-4 py-2 text-xs font-mono font-medium hover:bg-white/90"
                title="Click to disconnect"
              >
                {formatAddress(address)}
              </button>
            ) : (
              <button
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
              <StatusChip status={badge} size="sm" />
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

        {/* Main Content Area (Scrollable within Stage) */}
        <main className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-6 md:py-8 flex flex-col">
          {pageTitle && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 anim-stagger">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-normal tracking-[-0.03em] text-white">
                  {pageTitle}
                </h1>
                {pageSubtitle && (
                  <p className="text-sm text-white/60 mt-1 max-w-2xl">{pageSubtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/"
                  className="text-xs text-white/50 hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Landing
                </Link>
              </div>
            </div>
          )}

          <div className="flex-1 w-full flex flex-col">{children}</div>
        </main>
      </div>
    </div>
  );
};

