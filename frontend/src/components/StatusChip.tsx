import React from "react";
import { CheckCircle2, ShieldCheck, Sparkles, Cpu, ExternalLink } from "lucide-react";

export type ChipType = "REAL" | "OFF-CHAIN VERIFIED" | "SYNTHETIC" | "SIMULATED";

interface StatusChipProps {
  type: ChipType;
  txHash?: string;
  network?: string;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ type, txHash, network, className = "" }) => {
  switch (type) {
    case "REAL":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${className}`}
          title="Verified cryptographically on-chain"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>REAL (ON-CHAIN)</span>
          {txHash && (
            <a
              href={`https://testnet.mstscan.com/tx/${txHash}`}
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

    case "SYNTHETIC":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 ${className}`}
          title="Demo Synthetic Credential - Never Real PII"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>SYNTHETIC</span>
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
