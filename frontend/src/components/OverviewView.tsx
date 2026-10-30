/**
 * frontend/src/components/OverviewView.tsx
 * 
 * Protocol Telemetry, Live Contract Inventory, and Architecture Overview
 */

import React from "react";
import {
  Shield,
  Cpu,
  Layers,
  Flame,
  Clock,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  Lock,
  Server,
  FileCode,
} from "lucide-react";
import { DEFAULT_CORAL } from "../core";

interface OverviewViewProps {
  onLaunchProver: () => void;
  onViewAudit: () => void;
}

export function OverviewView({ onLaunchProver, onViewAudit }: OverviewViewProps) {
  const telemetry = [
    {
      title: "Circuit Constraints",
      value: "5,014",
      unit: "R1CS Non-linear Constraints",
      icon: <Cpu className="text-white" size={20} />,
      desc: "BN254 Groth16 zk-SNARK with Poseidon hash trees",
    },
    {
      title: "Verification Gas",
      value: "~288,882",
      unit: "Gas Units on Coral",
      icon: <Flame className="text-white" size={20} />,
      desc: "Optimized pairing precompile settlement",
    },
    {
      title: "Target Network",
      value: "MST Coral",
      unit: `Chain ID: ${DEFAULT_CORAL.chainId}`,
      icon: <Layers className="text-white" size={20} />,
      desc: "EVM-compatible privacy execution layer",
    },
    {
      title: "Privacy Guarantee",
      value: "Zero-Egress",
      unit: "Local Browser WASM",
      icon: <Lock className="text-white" size={20} />,
      desc: "Zero private credential leakage over network",
    },
  ];

  const contracts = [
    {
      name: "PramaanRegistry",
      role: "Nullifier Sybil Protection & State Registry",
      address: DEFAULT_CORAL.registryAddress,
      explorer: `${DEFAULT_CORAL.explorerUrl}/address/${DEFAULT_CORAL.registryAddress}`,
    },
    {
      name: "PramaanVerifier",
      role: "BN254 Groth16 Pairing Verifier",
      address: DEFAULT_CORAL.verifierAddress,
      explorer: `${DEFAULT_CORAL.explorerUrl}/address/${DEFAULT_CORAL.verifierAddress}`,
    },
    {
      name: "PrecompileProbe",
      role: "EVM Alt_bn128 Pair Precompile Diagnostic",
      address: DEFAULT_CORAL.probeAddress,
      explorer: `${DEFAULT_CORAL.explorerUrl}/address/${DEFAULT_CORAL.probeAddress}`,
    },
  ];

  return (
    <div className="space-y-8 animate-blur-fade-up">
      {/* Hero Header */}
      <div className="liquid-glass rounded-3xl p-8 sm:p-10 border border-white/10 relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Testnet Protocol Telemetry</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Prove Attributes. <br className="hidden sm:block" />
            Protect Identity.
          </h1>

          <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-2xl">
            Pramaan-ZK generates client-side zero-knowledge proofs with zero network egress. 
            Verifies age and credential predicates while recording unspent nullifiers on MST Coral Testnet 
            with cryptographic sybil protection.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              type="button"
              onClick={onLaunchProver}
              className="bg-white text-black px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white/90 shadow-lg shadow-white/10 transition-all flex items-center gap-2"
            >
              <span>Launch Prover Studio</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={onViewAudit}
              className="liquid-glass px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
            >
              Audit On-Chain Receipts
            </button>
          </div>
        </div>
      </div>

      {/* Protocol Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {telemetry.map((t, idx) => (
          <div
            key={idx}
            className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider text-white/40 font-mono">{t.title}</span>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">{t.icon}</div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{t.value}</div>
              <div className="text-xs text-white/60 font-mono mt-1">{t.unit}</div>
            </div>
            <p className="text-[11px] text-white/50 mt-4 pt-4 border-t border-white/5 leading-normal">
              {t.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Contract Registry Section */}
      <div className="liquid-glass rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Server size={18} />
              <span>MST Coral Deployed Contracts</span>
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              Verified smart contract addresses running live on MST Coral Testnet ({DEFAULT_CORAL.chainId})
            </p>
          </div>
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 self-start sm:self-auto">
            RPC Active · 54635
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {contracts.map((c, i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">{c.name}</span>
                  <FileCode size={16} className="text-white/40" />
                </div>
                <p className="text-xs text-white/60 leading-normal">{c.role}</p>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-mono text-white/80 truncate bg-black/60 px-3 py-2 rounded-lg border border-white/10">
                  {c.address}
                </div>
                <a
                  href={c.explorer}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-white/70 hover:text-white flex items-center gap-1.5 underline underline-offset-2 transition-colors pt-1"
                >
                  <span>View on Coral Scan</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

