/**
 * frontend/src/components/AppShell.tsx
 * 
 * Unified Visual Shell for Pramaan-ZK Application Routes (/app/*)
 * Adheres to ANTIGRAVITY_UI_ALIGNMENT_PROMPT.md §3 Step D:
 * - Frozen/ambient background + .shade gradient (0 continuous canvas loop on prover)
 * - Exact chrome header: logo left, nav pills center, wallet pill + network chip right
 * - Active step-indicator in .planet-list style on left
 * - Giant condensed display title bottom-left (PROVE, VERIFY, etc.)
 * - Right-bottom dl .fact rows with live chain and contract data
 * - Center glass panel for functional forms/buttons/progress
 */

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { X } from "lucide-react";
import "../landing/landing.css";

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
    isCorrectNetwork,
    targetNetwork,
    connect,
    switchNetwork,
  } = useWallet();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Format short address: 0x1234...5678
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Connect Wallet";

  const defaultSteps: ShellStep[] = [
    { id: "prove", label: "Prove" },
    { id: "verify", label: "Verify" },
    { id: "registry", label: "Registry" },
    { id: "relying-party", label: "Relying Party" },
  ];

  const renderedSteps = steps.length > 0 ? steps : defaultSteps;

  return (
    <div className="experience intro-ready content-revealing">
      {/* 1. Static Ambient Background (Zero continuous canvas loop to keep prover unthrottled) */}
      <div
        className="backgrounds"
        style={{
          background: "radial-gradient(ellipse at 50% 30%, #1a1614 0%, #0a0908 70%)",
        }}
        aria-hidden="true"
      />

      {/* 2. Bottom Shade Gradient per PDF §5 */}
      <div className="shade" aria-hidden="true" />

      {/* 3. Header Chrome */}
      <header className="header chrome">
        <Link to="/" className="brand-slot" aria-label="Pramaan-ZK Home">
          <img
            src="/brand/logo.svg"
            alt="Pramaan-ZK"
            style={{ width: "37px", height: "36px" }}
          />
          <span className="brand-name is-visible">Pramaan-ZK</span>
        </Link>

        <div className="header-actions">
          <nav className="nav" aria-label="Application navigation">
            <Link
              to="/app/prove"
              className={location.pathname.startsWith("/app/prove") ? "active" : ""}
            >
              Prove
            </Link>
            <Link
              to="/app/verify"
              className={location.pathname.startsWith("/app/verify") ? "active" : ""}
            >
              Verify
            </Link>
            <Link
              to="/app/dapp"
              className={location.pathname.startsWith("/app/dapp") ? "active" : ""}
            >
              Registry
            </Link>
            <Link
              to="/app/relying-party"
              className={location.pathname.startsWith("/app/relying-party") ? "active" : ""}
            >
              Relying Party
            </Link>
          </nav>

          {/* Network Chip */}
          <div
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 text-white"
            title={`Chain ID: ${targetNetwork?.chainId || 54635}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCorrectNetwork ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
              }`}
            />
            <span>{targetNetwork?.name || "MST Coral"}</span>
          </div>

          {/* Wallet Menu Pill */}
          <button
            type="button"
            onClick={isConnected ? () => {} : connect}
            className="menu"
            style={{ height: "42px", padding: "0 18px", fontSize: "13px" }}
            title={address || "Connect MetaMask"}
          >
            {shortAddress}
          </button>

          <button
            type="button"
            className="menu"
            style={{ height: "42px", width: "42px", padding: 0 }}
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open Navigation Menu"
          >
            ≡
          </button>
        </div>
      </header>

      {/* 4. Sidebar Flow Steps in Planet-List Style */}
      <aside className="planet-list chrome" aria-label="Workflow Steps">
        {renderedSteps.map((step) => {
          const isActive = step.id === activeStepId;
          return (
            <span
              key={step.id}
              className={`planet-item ${isActive ? "active" : ""}`}
            >
              {step.label}
            </span>
          );
        })}
      </aside>

      {/* 5. Center Glass Panel for Application Functionality */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 z-10 pointer-events-none">
        <div
          className="app-glass-panel pointer-events-auto"
          style={{
            width: "min(760px, 92vw)",
            maxHeight: "calc(100vh - 180px)",
            overflowY: "auto",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.35)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: "24px",
            padding: "clamp(20px, 3vw, 32px)",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7)",
          }}
        >
          {children}
        </div>
      </div>

      {/* 6. Giant Title & Live Fact Sheet */}
      <section className="planet-content chrome pointer-events-none" aria-live="polite">
        <h1 id="planet-title">{title}</h1>

        {facts.length > 0 && (
          <dl id="facts" className="pointer-events-auto">
            {facts.map(([k, v], idx) => (
              <div key={idx} className="fact">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* 7. Menu Overlay */}
      <div className={`menu-overlay ${isMenuOpen ? "is-open" : ""}`}>
        <div className="menu-overlay-header">
          <span className="brand-name is-visible">Pramaan-ZK Menu</span>
          <button
            type="button"
            className="menu"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close Menu"
          >
            <X className="w-4 h-4 mr-2" />
            <span>Close</span>
          </button>
        </div>
        <div className="menu-overlay-nav">
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className="menu-overlay-link"
          >
            <span className="num">[01]</span> Home & Walkthrough
          </Link>
          <Link
            to="/app/prove"
            onClick={() => setIsMenuOpen(false)}
            className="menu-overlay-link"
          >
            <span className="num">[02]</span> Generate Proof
          </Link>
          <Link
            to="/app/verify"
            onClick={() => setIsMenuOpen(false)}
            className="menu-overlay-link"
          >
            <span className="num">[03]</span> Verify On-Chain
          </Link>
          <Link
            to="/app/dapp"
            onClick={() => setIsMenuOpen(false)}
            className="menu-overlay-link"
          >
            <span className="num">[04]</span> dApp Gate & Registry
          </Link>
          <Link
            to="/app/relying-party"
            onClick={() => setIsMenuOpen(false)}
            className="menu-overlay-link"
          >
            <span className="num">[05]</span> Relying Party OIDC
          </Link>
          <a
            href="https://github.com/Shantanu112-bd/Zentity"
            target="_blank"
            rel="noreferrer"
            className="menu-overlay-link"
          >
            <span className="num">[06]</span> Documentation
          </a>
        </div>
      </div>
    </div>
  );
};

