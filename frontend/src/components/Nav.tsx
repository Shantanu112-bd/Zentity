/**
 * frontend/src/components/Nav.tsx
 * 
 * Dynamic Liquid-Glass Navigation Header & Web3 Network/Wallet Switcher
 */

import React, { useState } from "react";
import {
  Shield,
  ExternalLink,
  Menu,
  X,
  Layers,
  Cpu,
  FileCheck2,
  Database,
  History,
  AlertTriangle,
} from "lucide-react";
import { useWallet, useNetwork } from "../core";

export type NavView = "overview" | "prover" | "registry" | "audit";

interface NavProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
}

export function Nav({ currentView, onSelectView }: NavProps) {
  const { address, isConnected, isConnecting, connect, disconnect, chainId } = useWallet();
  const { targetNetwork, isCorrectNetwork, switchNetwork } = useNetwork(chainId);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavView; label: string; code: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", code: "00", icon: <Layers size={14} /> },
    { id: "prover", label: "Prover Studio", code: "01", icon: <Cpu size={14} /> },
    { id: "registry", label: "Registry Explorer", code: "02", icon: <Database size={14} /> },
    { id: "audit", label: "Audit Log", code: "03", icon: <History size={14} /> },
  ];

  const handleNavClick = (view: NavView) => {
    onSelectView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick("overview")}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center liquid-glass group-hover:border-white/60 transition-colors">
            <Shield size={18} className="text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-widest text-sm uppercase text-white">Pramaan-ZK</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/15">
                Coral v1.0
              </span>
            </div>
            <span className="text-[10px] text-white/40 font-mono tracking-wider">
              Zero-Egress Identity Gate
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider transition-all font-medium ${
                  isActive
                    ? "bg-white text-black font-semibold shadow-lg shadow-white/10"
                    : "liquid-glass text-white/70 hover:text-white"
                }`}
              >
                <span className={isActive ? "text-black/60 font-mono" : "text-white/40 font-mono"}>
                  {item.code}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* External Block Explorer Link */}
          <a
            href={targetNetwork.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="liquid-glass flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider text-white/70 hover:text-white transition-all font-medium ml-1"
          >
            <span>Coral Explorer</span>
            <ExternalLink size={12} className="text-white/50" />
          </a>
        </nav>

        {/* Web3 Wallet & Network Pill */}
        <div className="flex items-center gap-3">
          {/* Wrong Network Warning Pill */}
          {isConnected && !isCorrectNetwork && (
            <button
              type="button"
              onClick={switchNetwork}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all animate-pulse"
              data-testid="switch-network-btn"
            >
              <AlertTriangle size={14} />
              <span>Switch to MST Coral</span>
            </button>
          )}

          {/* Network Status Pill */}
          {isConnected && isCorrectNetwork && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Coral</span>
              <span className="text-white/40">({targetNetwork.chainId})</span>
            </div>
          )}

          {/* Wallet Connect / Disconnect */}
          {!isConnected ? (
            <button
              type="button"
              onClick={connect}
              disabled={isConnecting}
              className="liquid-glass px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 border border-white/20 transition-all flex items-center gap-2"
              data-testid="wallet-connect-btn"
            >
              <span className="w-2 h-2 rounded-full bg-white/40" />
              <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="liquid-glass px-3 py-1.5 rounded-full text-xs font-mono text-white/90 border border-white/20">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
              </div>
              <button
                type="button"
                onClick={disconnect}
                className="px-2.5 py-1 rounded-full text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="Disconnect Wallet"
                data-testid="wallet-disconnect-btn"
              >
                Disconnect
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden liquid-glass p-2 rounded-xl text-white/80 hover:text-white"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-black/95 p-4 space-y-2 backdrop-blur-2xl">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors ${
                currentView === item.id
                  ? "bg-white text-black font-bold"
                  : "liquid-glass text-white/70 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-mono text-white/40">{item.code}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <a
            href={targetNetwork.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full liquid-glass flex items-center justify-between px-4 py-3 rounded-xl text-xs uppercase tracking-wider text-white/70 hover:text-white"
          >
            <span>MST Coral Block Explorer</span>
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </header>
  );
}

