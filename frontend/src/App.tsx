/**
 * frontend/src/App.tsx
 * 
 * Complete Web3 dApp System Integration & Full-Lifecycle UI
 * Pure Cinematic Liquid-Glass Design System wired to live Core Web3 Services
 */

import React, { useState } from "react";
import { DappProvider } from "./core";
import { Nav, NavView } from "./components/Nav";
import { OverviewView } from "./components/OverviewView";
import { ProverView } from "./components/ProverView";
import { RegistryView } from "./components/RegistryView";
import { AuditView } from "./components/AuditView";
import { ExternalLink, Shield } from "lucide-react";
import { DEFAULT_CORAL } from "./core";
import { ProceduralAtmosphere } from "./components/ProceduralAtmosphere";

function MainAppShell() {
  const [currentView, setCurrentView] = useState<NavView>("overview");

  return (
    <div className="relative min-h-screen w-screen bg-black text-white font-sans select-none flex flex-col justify-between overflow-x-hidden">
      {/* 1. Procedural Atmospheric Generative Background (Zero Media Assets / Zero Bandwidth Egress) */}
      <ProceduralAtmosphere />

      {/* 2. Bottom Blur Overlay (No dark gradient overlay, purely backdrop-blur-24 with CSS mask) */}
      <div className="fixed inset-0 bottom-blur-mask pointer-events-none z-1" />

      {/* 3. Operational Layer */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-between pointer-events-auto">
        {/* Dynamic Navigation Bar */}
        <Nav currentView={currentView} onSelectView={setCurrentView} />

        {/* Center Operational Stage */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {currentView === "overview" && (
            <OverviewView
              onLaunchProver={() => setCurrentView("prover")}
              onViewAudit={() => setCurrentView("audit")}
            />
          )}

          {currentView === "prover" && <ProverView />}

          {currentView === "registry" && <RegistryView />}

          {currentView === "audit" && <AuditView />}
        </main>

        {/* Global Footer */}
        <footer className="w-full border-t border-white/10 bg-black/60 backdrop-blur-xl py-6 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 font-mono gap-3">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-white/70" />
              <span>Pramaan-ZK Privacy Protocol · Zero-Egress Client Prover</span>
            </div>

            <div className="flex items-center gap-4">
              <a
                href={`${DEFAULT_CORAL.explorerUrl}/address/${DEFAULT_CORAL.registryAddress}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white flex items-center gap-1 transition-colors underline underline-offset-2"
              >
                <span>Coral Registry Contract</span>
                <ExternalLink size={11} />
              </a>
              <span>•</span>
              <span className="text-white/40">Testnet Issuer (Self-Attested, No Real PII)</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DappProvider>
      <MainAppShell />
    </DappProvider>
  );
}
