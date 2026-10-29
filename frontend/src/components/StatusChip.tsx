/**
 * frontend/src/components/StatusChip.tsx
 * 
 * Truthful Status Chip in Octagonal Cut Design Language
 * Strictly adheres to AGENTS.md §4 and ANTIGRAVITY_UI_REDESIGN_PROMPT.md §2 & §3:
 * - Octagonal clip-path
 * - Preserves existing API props (type, txHash, explorerUrl)
 * - Supported types:
 *   - "DEMO / SYNTHETIC"
 *   - "LOCAL VERIFIED"
 *   - "OFF-CHAIN VERIFIED"
 *   - "TESTNET TX CONFIRMED"
 *   - "ZK VERIFIED ON-CHAIN"
 *   (Never "REAL CREDENTIAL VERIFIED")
 */

import React from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";

export type ChipType =
  | "ZK VERIFIED ON-CHAIN"
  | "TESTNET TX CONFIRMED"
  | "LOCAL VERIFIED"
  | "OFF-CHAIN VERIFIED"
  | "DEMO / SYNTHETIC"
  | "SYNTHETIC"
  | "SIMULATED"
  | "REAL";

export interface StatusChipProps {
  type: ChipType | string;
  txHash?: string;
  explorerUrl?: string;
  className?: string;
  size?: "sm" | "md";
}

export const StatusChip: React.FC<StatusChipProps> = ({
  type,
  txHash,
  explorerUrl,
  className = "",
  size = "md",
}) => {
  const getExplorerLink = () => {
    if (!txHash) return null;
    const base = explorerUrl || "https://coral.mstscan.com";
    return `${base.replace(/\/$/, "")}/tx/${txHash}`;
  };

  let styleClasses = "bg-white/10 text-white/90 border-white/20";
  let dotColor = "bg-white/60";
  let displayLabel = type;

  if (type === "REAL") displayLabel = "ZK VERIFIED ON-CHAIN";
  if (type === "SYNTHETIC" || type === "SIMULATED") displayLabel = "DEMO / SYNTHETIC";

  switch (displayLabel) {
    case "DEMO / SYNTHETIC":
      styleClasses = "bg-amber-500/10 text-amber-300 border-amber-500/30";
      dotColor = "bg-amber-400";
      break;
    case "LOCAL VERIFIED":
    case "OFF-CHAIN VERIFIED":
      styleClasses = "bg-sky-500/10 text-sky-300 border-sky-500/30";
      dotColor = "bg-sky-400";
      break;
    case "TESTNET TX CONFIRMED":
      styleClasses = "bg-blue-500/10 text-blue-300 border-blue-500/30";
      dotColor = "bg-blue-400";
      break;
    case "ZK VERIFIED ON-CHAIN":
      styleClasses = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      dotColor = "bg-emerald-400";
      break;
  }

  const paddingClass = size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-3.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium tracking-wider uppercase border ${styleClasses} ${paddingClass} ${className}`}
      style={{
        clipPath:
          size === "sm"
            ? "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)"
            : "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)",
      }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{displayLabel}</span>
      {txHash && (
        <a
          href={getExplorerLink() || "#"}
          target="_blank"
          rel="noreferrer"
          className="hover:text-white ml-1 inline-flex items-center"
          title="View transaction on MSTScan"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </span>
  );
};
