/**
 * frontend/src/theme/DevUiShowcase.tsx
 * 
 * Visual QA Showcase for Design System Layout Primitives
 * Dev-only testbench for validating:
 * - PageShell, PageHeader, Card, DataList, CodeBlock, StatusBanner, ProgressSteps, EmptyState, Field
 * - Octagonal cut button shapes and clipping (.btn-cut, .btn-cut-border, .btn-cut-sm)
 * - Focus-visible survival
 * - StatusChips and truthful labels
 */

import React, { useState } from "react";
import {
  PageShell,
  PageHeader,
  Card,
  DataList,
  CodeBlock,
  StatusBanner,
  ProgressSteps,
  EmptyState,
  Field,
} from "../components/layout";
import { StatusChip } from "../components/StatusChip";
import { ArrowRight, ExternalLink, ShieldCheck, Database, Search } from "lucide-react";

export const DevUiShowcase: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");

  const steps = [
    { id: 1, label: "Credential", description: "Synthetic Aadhaar fixture" },
    { id: 2, label: "Proof", description: "SnarkJS Groth16 witness" },
    { id: 3, label: "Submit", description: "MST Coral Testnet" },
    { id: 4, label: "Result", description: "On-chain verification" },
  ];

  const sampleDataList = [
    {
      label: "Contract Address",
      value: "0x34293f773489eF66D38992a548eebf99F4E5642a",
      isMono: true,
      truncateMiddle: true,
      copyable: true,
    },
    {
      label: "Transaction Hash",
      value: "0x89abf10329048329480194830294823094820938402938402938402938402938",
      isMono: true,
      truncateMiddle: true,
      copyable: true,
    },
    {
      label: "Verification Status",
      value: "ZK VERIFIED ON-CHAIN",
      isMono: true,
    },
    {
      label: "Gas Consumed",
      value: "284,312 units (Coral Testnet)",
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Development Benchmark"
        title="UI Primitives Showcase"
        description="Testbed for layout components, card hierarchy, responsive grids, and design system tokens."
        rightSlot={
          <div className="flex items-center gap-2">
            <StatusChip type="DEMO / SYNTHETIC" size="sm" />
            <span className="px-2.5 py-1 text-xs font-mono rounded border border-white/20 bg-white/5 text-white/70">
              Dev Route
            </span>
          </div>
        }
      />

      <div className="space-y-8 pb-12">
        {/* Progress Steps Section */}
        <Card title="Multi-Step Progression" subtitle="ProgressSteps component with responsive desktop/mobile states">
          <ProgressSteps
            steps={steps}
            currentStepIndex={activeStep}
            onStepClick={(idx) => setActiveStep(idx)}
            className="mb-4"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
              className="px-4 py-2.5 min-h-[44px] text-xs rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 inline-flex items-center"
            >
              Previous Step
            </button>
            <button
              type="button"
              onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
              disabled={activeStep === steps.length - 1}
              className="px-4 py-2.5 min-h-[44px] text-xs rounded-xl bg-white text-black font-medium hover:bg-white/90 disabled:opacity-30 inline-flex items-center"
            >
              Next Step
            </button>
          </div>
        </Card>

        {/* 2-Column Section: Data Display & Form Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: DataList & CodeBlock */}
          <Card
            title="DataList & Monospace Copying"
            subtitle="Middle-truncation with copy action and tooltip preview"
            headerAction={<StatusChip type="TESTNET TX CONFIRMED" size="sm" />}
            divider
            footer={
              <>
                <button type="button" className="btn-cut-border px-4 py-2 text-xs text-white">
                  <span>Export JSON</span>
                </button>
                <button type="button" className="btn-cut px-4 py-2 text-xs text-black font-medium">
                  Verify Again
                </button>
              </>
            }
          >
            <DataList items={sampleDataList} className="mb-6" />

            <h4 className="text-xs uppercase font-mono text-white/50 tracking-wider mb-2">
              CodeBlock Primitive
            </h4>
            <CodeBlock
              title="Groth16 Proof Call (calldata)"
              code={{
                a: ["0x12a3...", "0x45b6..."],
                b: [["0x78...", "0x90..."], ["0x11...", "0x22..."]],
                c: ["0x33...", "0x44..."],
                input: ["0x55...", "0x66...", "0x77..."],
              }}
            />
          </Card>

          {/* Card 2: Form Fields & Interactive Buttons */}
          <Card
            title="Form Inputs & Cut-Corner Buttons"
            subtitle="Accessible form inputs with minimum 44px touch targets and inset focus rings"
            divider
          >
            <div className="space-y-4 mb-6">
              <Field
                label="Transaction Hash or Nullifier"
                placeholder="0x..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (e.target.value && !e.target.value.startsWith("0x")) {
                    setInputError("Must start with 0x hexadecimal prefix");
                  } else {
                    setInputError("");
                  }
                }}
                error={inputError}
                helperText="Enter 64-character hex hash from MST Coral testnet."
                rightElement={
                  <button
                    type="button"
                    style={{ minWidth: 44, width: 44, minHeight: 44, height: 44 }}
                    onClick={() => setInputValue("0x89abf10329048329480194830294823094820938402938402938402938402938")}
                    className="flex items-center justify-center text-white/40 hover:text-white"
                    title="Paste mock hash"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                }
              />

              <Field
                label="Disabled Field Example"
                value="0xImmutableValueHere"
                disabled
                helperText="Demonstrates disabled styling with reduced opacity."
              />
            </div>

            <h4 className="text-xs uppercase font-mono text-white/50 tracking-wider mb-3">
              Cut-Corner Action Buttons
            </h4>
            <div className="flex flex-wrap gap-3 items-center">
              <button type="button" className="btn-cut px-5 py-2.5 text-xs text-black font-medium inline-flex items-center gap-2">
                <span>Primary Action</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button type="button" className="btn-cut-border px-5 py-2.5 text-xs text-white">
                <span>Secondary Action</span>
              </button>

              <button type="button" className="btn-cut-sm w-9 h-9 text-black flex items-center justify-center" title="Explorer">
                <ExternalLink className="w-4 h-4" />
              </button>

              <button type="button" className="btn-cut-sm w-9 h-9 text-black flex items-center justify-center" title="Security">
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          </Card>
        </div>

        {/* Status Banners Section */}
        <Card title="Status Banners" subtitle="Accessible alerts with clear non-technical title and expandable technical details">
          <div className="space-y-4">
            <StatusBanner
              variant="success"
              title="Proof Verified On-Chain"
              description="The Groth16 zero-knowledge proof was verified by the PramaanVerifier contract on MST Coral Testnet."
              details={{
                contract: "0x51E2b4aE9f2e718b52cf66236319808a38F3B90B",
                block: 104523,
                gasUsed: 284312,
              }}
            />

            <StatusBanner
              variant="info"
              title="Synthetic Fixture Active"
              description="This demonstration runs against a synthetic Aadhaar credential fixture to ensure zero real PII is processed."
            />

            <StatusBanner
              variant="warning"
              title="Network Mismatch Detected"
              description="Your wallet is connected to an unexpected network. Please switch to MST Coral Testnet (Chain ID 54635)."
              action={
                <button type="button" className="px-2.5 py-1 text-xs bg-amber-500/20 text-amber-200 border border-amber-500/30 rounded hover:bg-amber-500/30">
                  Switch
                </button>
              }
            />

            <StatusBanner
              variant="error"
              title="Transaction Reverted"
              description="The execution reverted: Nullifier already recorded. This credential has already been used for this application scope."
              details="Error: VM Exception while processing transaction: reverted with custom error 'NullifierAlreadyUsed(0x789...)'"
            />
          </div>
        </Card>

        {/* Empty State Component */}
        <Card title="Empty State Container">
          <EmptyState
            icon={Database}
            title="No Nullifiers Found"
            description="No matching nullifier records exist in the current scope. Enter a valid scope and nullifier hash to verify membership."
            action={
              <button type="button" className="btn-cut px-4 py-2 text-xs text-black font-medium">
                Reset Filter
              </button>
            }
          />
        </Card>
      </div>
    </PageShell>
  );
};

export default DevUiShowcase;
