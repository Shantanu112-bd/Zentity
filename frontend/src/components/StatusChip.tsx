import React from "react";
import { CheckCircle2, ShieldCheck, Sparkles, Cpu, ExternalLink } from "lucide-react";

export type ChipType =
  | "ZK VERIFIED ON-CHAIN"
  | "TESTNET TX CONFIRMED"
  | "LOCAL VERIFIED"
  | "OFF-CHAIN VERIFIED"
  | "DEMO / SYNTHETIC"
  | "SYNTHETIC"
  | "SIMULATED"
  | "REAL";

interface StatusChipProps {
  type: ChipType;
  txHash?: string;
  explorerUrl?: string;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ type, txHash, explorerUrl, className = "" }) => {
  const getExplorerLink = () => {
    if (!txHash) return null;
    const base = explorerUrl || "https://coral.mstscan.com";
    return `${base.replace(/\/$/, "")}/tx/${txHash}`;
  };

  switch (type) {
    case "ZK VERIFIED ON-CHAIN":
    case "REAL":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${className}`}
          title="Cryptographically verified and recorded on MST Blockchain"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>ZK VERIFIED ON-CHAIN</span>
          {txHash && (
            <a
              href={getExplorerLink() || "#"}
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-300 ml-1 inline-flex items-center"
              title="View transaction on MSTScan"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </span>
      );

    case "TESTNET TX CONFIRMED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 ${className}`}
          title="Transaction mined on MST Testnet"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>TESTNET TX CONFIRMED</span>
        </span>
      );

    case "LOCAL VERIFIED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/30 ${className}`}
          title="Verified on local Hardhat EVM"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>LOCAL VERIFIED</span>
        </span>
      );

    case "OFF-CHAIN VERIFIED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 ${className}`}
          title="Verified mathematically via Groth16 SnarkJS"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>OFF-CHAIN VERIFIED</span>
        </span>
      );

    case "DEMO / SYNTHETIC":
    case "SYNTHETIC":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 ${className}`}
          title="Synthetic credential issued by DEMO ISSUER (not real Aadhaar)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>DEMO / SYNTHETIC</span>
        </span>
      );

    case "SIMULATED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30 ${className}`}
          title="Simulated Environment / Stub"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>SIMULATED</span>
        </span>
      );
  }
};
