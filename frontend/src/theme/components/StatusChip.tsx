/**
 * frontend/src/theme/components/StatusChip.tsx
 * 
 * Truthful Status Chip in Octagonal Design Language
 * Strictly adheres to AGENTS.md §4 and ANTIGRAVITY_UI_REDESIGN_PROMPT.md §0 & §3:
 * Allowed statuses:
 * - DEMO / SYNTHETIC
 * - LOCAL VERIFIED
 * - OFF-CHAIN VERIFIED
 * - TESTNET TX CONFIRMED
 * - ZK VERIFIED ON-CHAIN
 * (Never "REAL CREDENTIAL VERIFIED")
 */

import React from "react";

export type AllowedStatus =
  | "DEMO / SYNTHETIC"
  | "LOCAL VERIFIED"
  | "OFF-CHAIN VERIFIED"
  | "TESTNET TX CONFIRMED"
  | "ZK VERIFIED ON-CHAIN"
  | "PENDING"
  | "REVERTED"
  | "WRONG NETWORK";

export interface StatusChipProps {
  status: AllowedStatus | string;
  className?: string;
  size?: "sm" | "md";
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  className = "",
  size = "md",
}) => {
  let styleClasses = "bg-white/10 text-white/90 border-white/20";
  let dotColor = "bg-white/60";

  switch (status) {
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
    case "ZK VERIFIED ON-CHAIN":
      styleClasses = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      dotColor = "bg-emerald-400";
      break;
    case "PENDING":
      styleClasses = "bg-purple-500/10 text-purple-300 border-purple-500/30";
      dotColor = "bg-purple-400 animate-pulse";
      break;
    case "REVERTED":
    case "WRONG NETWORK":
      styleClasses = "bg-rose-500/10 text-rose-300 border-rose-500/30";
      dotColor = "bg-rose-400";
      break;
  }

  const paddingClass = size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-3.5 py-1.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium tracking-wider uppercase border rounded-md ${styleClasses} ${paddingClass} ${className}`}
      style={{
        clipPath:
          size === "sm"
            ? "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)"
            : "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)",
      }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{status}</span>
    </span>
  );
};

