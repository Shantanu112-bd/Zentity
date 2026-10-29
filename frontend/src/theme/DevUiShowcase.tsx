/**
 * frontend/src/theme/DevUiShowcase.tsx
 * 
 * Visual QA Showcase for Design Primitives
 * Dev-only testbench for validating:
 * - Octagonal cut button shapes and clipping
 * - Focus-visible survival
 * - StatusChips and truthful labels
 * - Glassmorphism panels and contrast
 */

import React, { useState } from "react";
import { AppShell } from "./components/AppShell";
import { CutButton } from "./components/CutButton";
import { CutIconButton } from "./components/CutIconButton";
import { Glass } from "./components/Glass";
import { StatusChip } from "./components/StatusChip";
import { CutInput } from "./components/CutInput";
import { ArrowRight, ExternalLink, ShieldCheck, Terminal } from "lucide-react";

// Inline GitHub SVG as specified by prompt
const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4 fill-current" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export const DevUiShowcase: React.FC = () => {
  const [inputValue, setInputValue] = useState("");

  return (
    <AppShell pageTitle="DESIGN SYSTEM BENCHMARK" pageSubtitle="Visual QA inspection for Pramaan-ZK design primitives">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        {/* Panel 1: Octagonal Cut Corner Buttons */}
        <Glass>
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-white/60" /> Cut-Corner Buttons (.btn-cut & .btn-cut-border)
          </h2>
          <p className="text-xs text-white/60 mb-6">
            Octagonal polygon clipping with custom inset focus-visible outlines that survive clip-path clipping.
          </p>

          <div className="flex flex-wrap gap-4 items-center mb-6">
            <CutButton variant="solid" size="md">
              Launch App
            </CutButton>

            <CutButton variant="solid" size="md" icon={<ArrowRight className="w-4 h-4" />}>
              Generate Proof
            </CutButton>

            <CutButton variant="outline" size="md">
              <span>Verify Off-Chain</span>
            </CutButton>

            <CutButton variant="solid" size="sm">
              Small Cut
            </CutButton>

            <CutButton variant="solid" size="md" disabled>
              Disabled State
            </CutButton>
          </div>

          <h3 className="text-xs uppercase tracking-wider text-white/50 mb-3">Small Icon Buttons (.btn-cut-sm)</h3>
          <div className="flex gap-3 items-center">
            <CutIconButton title="GitHub Repository">
              <GithubIcon className="w-4 h-4" />
            </CutIconButton>
            <CutIconButton title="Block Explorer">
              <ExternalLink className="w-4 h-4" />
            </CutIconButton>
            <CutIconButton title="ZK Security" variant="outline">
              <ShieldCheck className="w-4 h-4" />
            </CutIconButton>
          </div>
        </Glass>

        {/* Panel 2: Truthful Status Vocabulary Chips */}
        <Glass>
          <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-white/60" /> Status Vocabulary & Chips
          </h2>
          <p className="text-xs text-white/60 mb-6">
            Strictly bounded by AGENTS.md §4: No unverified claims or fake government/Aadhaar integration badges.
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
              <span className="text-xs text-white/70">Credential Origin</span>
              <StatusChip status="DEMO / SYNTHETIC" />
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
              <span className="text-xs text-white/70">WASM Witness Check</span>
              <StatusChip status="LOCAL VERIFIED" />
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
              <span className="text-xs text-white/70">SnarkJS Groth16 Snark</span>
              <StatusChip status="OFF-CHAIN VERIFIED" />
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
              <span className="text-xs text-white/70">MST Coral Block Inclusion</span>
              <StatusChip status="TESTNET TX CONFIRMED" />
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
              <span className="text-xs text-white/70">PramaanRegistry Smart Contract</span>
              <StatusChip status="ZK VERIFIED ON-CHAIN" />
            </div>
          </div>
        </Glass>

        {/* Panel 3: Form Inputs & Fields */}
        <Glass>
          <h2 className="text-lg font-medium text-white mb-4">Input & Form Elements</h2>
          <div className="flex flex-col gap-4">
            <CutInput
              label="Recipient Address"
              placeholder="0x..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="Must match msg.sender or smart contract consumer"
            />

            <CutInput
              label="Scope Identifier"
              value="42 (Age Gate Demonstration)"
              readOnly
              helperText="Domain separation scope preventing cross-app replay"
            />
          </div>
        </Glass>

        {/* Panel 4: Glassmorphism Variants */}
        <Glass variant="prominent">
          <h2 className="text-lg font-medium text-white mb-2">Prominent Glass Container</h2>
          <p className="text-sm text-white/70 mb-4">
            High contrast overlay designed for primary transaction receipts, cryptographic proofs, and interactive prover steps.
          </p>
          <div className="p-4 bg-black/60 rounded-xl border border-white/10 font-mono text-xs text-emerald-400">
            ✓ Proof generation completed with 5,014 R1CS constraints
          </div>
        </Glass>
      </div>
    </AppShell>
  );
};
