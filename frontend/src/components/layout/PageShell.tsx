/**
 * frontend/src/components/layout/PageShell.tsx
 * 
 * Shared Layout Shell for Pramaan-ZK App Routes (/app/*)
 * - Fixed nav at the top of the rounded stage
 * - Page body scrolls cleanly inside stage (overflow-y:auto, overscroll-behavior:contain)
 * - Zero horizontal scroll at any screen width
 * - Content column centered with max-width ~1152px (max-w-6xl)
 * - BackgroundStage with staticMode={true} (0 rAF loops on prover)
 * - Minimum 44px touch targets on mobile interactions
 */

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BackgroundStage } from "../../theme/BackgroundStage";
import { StatusChip } from "../StatusChip";
import { useWallet } from "../../context/WalletContext";
import { Menu, X, ArrowLeft, ExternalLink } from "lucide-react";

export interface PageShellProps {
  children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({ children }) => {
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
    { label: "Registry", to: "/app/dapp" },
    { label: "Relying Party", to: "/app/relying-party" },
    { label: "Simulation", to: "/app/simulation" },
  ];

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Connect Wallet";

  const explorerUrl =
    contracts?.PramaanRegistry?.address && targetNetwork.explorerUrl
      ? `${targetNetwork.explorerUrl}/address/${contracts.PramaanRegistry.address}`
      : targetNetwork.explorerUrl || "https://coral.mstscan.com";

  return (
    <div className="h-screen w-full bg-black p-3 md:p-4 font-inter select-none overflow-hidden flex flex-col box-border">
      {/* Inner Rounded Stage */}
      <div className="w-full h-full rounded-2xl flex flex-col overflow-hidden relative bg-black border border-white/10 shadow-2xl">
        {/* Background Canvas: Static mode on app routes isolates CPU completely for SnarkJS Groth16 */}
        <BackgroundStage staticMode={true} />

        {/* Fixed Top Navbar */}
        <header className="relative z-30 flex-shrink-0 flex items-center justify-between px-6 md:px-10 py-3.5 border-b border-white/10 backdrop-blur-xl bg-black/60">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded py-1 min-h-[44px]"
            >
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

            <span className="hidden sm:inline-block h-4 w-px bg-white/20 mx-1 sm:mx-2" />

            {/* Network Chip */}
            <div className="hidden md:flex items-center gap-2">
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
                  className="px-2.5 py-1 text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded hover:bg-rose-500/30 transition-colors"
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
                  className={`px-3.5 py-2 min-h-[38px] flex items-center text-xs font-medium tracking-tight transition-all rounded ${
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
          <div className="flex items-center gap-2 sm:gap-3">
            <StatusChip type="DEMO / SYNTHETIC" size="sm" className="hidden sm:inline-flex" />

            {isConnected && address ? (
              <button
                type="button"
                onClick={disconnect}
                data-testid="wallet-connect-btn"
                className="btn-cut px-4 min-h-[44px] flex items-center justify-center text-xs font-mono font-medium hover:bg-white/90"
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
                className="btn-cut px-4 min-h-[44px] flex items-center justify-center text-xs font-medium hover:bg-white/90"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}

            {/* Mobile Hamburger Toggle (Minimum 44x44px touch target) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/70 hover:text-white rounded-lg border border-white/10 bg-white/5 focus:outline-none focus:ring-1 focus:ring-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden relative z-40 bg-black/95 border-b border-white/10 px-6 py-4 flex flex-col gap-3 backdrop-blur-xl">
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
                  className={`px-3 min-h-[44px] flex items-center text-sm font-medium rounded ${
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
                className="min-h-[44px] flex items-center text-xs text-white/60 hover:text-white gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Landing Home
              </Link>
            </div>
          </div>
        )}

        {/* Scrollable Stage Body */}
        <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-6 md:px-10 py-6 md:py-8 flex flex-col">
          <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col">
            {children}
          </div>

          {/* Footer Bar */}
          <footer className="w-full max-w-6xl mx-auto mt-12 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50 font-mono">
            <div>
              MST Coral Testnet · Chain ID 54635 · 5,014 Constraints
            </div>
            <div className="flex items-center gap-4">
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] sm:min-h-0 flex items-center hover:text-white gap-1 transition-colors"
              >
                <span>Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://github.com/Shantanu112-bd/Zentity"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] sm:min-h-0 flex items-center hover:text-white transition-colors"
              >
                GitHub
              </a>
              <Link
                to="/"
                className="min-h-[44px] sm:min-h-0 flex items-center hover:text-white transition-colors"
              >
                Landing
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default PageShell;
