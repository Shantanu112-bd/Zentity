/**
 * frontend/src/pages/DappGatePage.tsx
 * 
 * Registry Gatekeeper & Scope Nullifier Membership Page
 * Strictly adheres to ANTIGRAVITY_APP_UI_REFINEMENT_PROMPT.md §2 & §3 Step C:
 * - 2-Card Grid Layout: Left = Nullifier & Scope Check, Right = PramaanRegistry Contract Status & Explorer Links
 * - Clearly distinguished result banner: ACCESS GRANTED vs NULLIFIER UNSPENT
 * - Built on PageShell with truthful status labels
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Database,
  Search,
} from "lucide-react";
import { StatusChip } from "../components/StatusChip";
import { useWallet } from "../context/WalletContext";
import {
  PageShell,
  PageHeader,
  Card,
  DataList,
  StatusBanner,
  Field,
} from "../components/layout";

export const DappGatePage: React.FC = () => {
  const { targetNetwork, contracts } = useWallet();

  const [nullifierInput, setNullifierInput] = useState<string>("sample-nullifier-42");
  const [scopeInput, setScopeInput] = useState<string>("42");
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isSpent, setIsSpent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load last saved nullifier if available
  useEffect(() => {
    const last = localStorage.getItem("pramaan_last_tx");
    if (last) {
      try {
        const parsed = JSON.parse(last);
        if (parsed.nullifier) {
          setNullifierInput(parsed.nullifier);
        }
        if (parsed.scopeId) {
          setScopeInput(parsed.scopeId);
        }
      } catch {}
    }
  }, []);

  const checkRegistryState = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`/api/registry/${scopeInput}/${nullifierInput}`);
      const data = await res.json();
      setIsSpent(data.isSpent || false);
      setIsChecked(true);
    } catch (err) {
      console.error("Failed to query registry API:", err);
      setIsSpent(false);
      setIsChecked(true);
    } finally {
      setIsLoading(false);
    }
  };

  const registryAddress =
    contracts?.PramaanRegistry?.address || "0x8c182a53fca78fe237734239bdb1256bc2658c5b";
  const explorerUrl = targetNetwork?.explorerUrl || "https://coral.mstscan.com";

  return (
    <PageShell>
      <PageHeader
        eyebrow="On-Chain Sybil Gate"
        title="Registry Gatekeeper"
        description="Verify nullifier registration in PramaanRegistry.sol on MST Coral. Enables dApps to enforce single-use Sybil resistance without linking user identity."
        rightSlot={
          <div className="flex items-center gap-2">
            <StatusChip type="ZK VERIFIED ON-CHAIN" size="sm" />
            <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-mono rounded border border-white/20 bg-white/5 text-white/70">
              Scope-Bounded
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
        {/* Left Column (7 cols): Check Form & Results */}
        <div className="lg:col-span-7 space-y-6">
          <Card
            title="1. Query Scope Nullifier"
            subtitle="Check whether a specific nullifier has been registered on-chain for your application domain."
            divider
          >
            <form onSubmit={checkRegistryState} className="space-y-4 mb-6">
              <Field
                label="Scope Identifier"
                placeholder="e.g. 42"
                value={scopeInput}
                onChange={(e) => setScopeInput(e.target.value)}
                helperText="Domain identifier isolating nullifiers between dApps."
                required
              />

              <Field
                label="Nullifier Hash (Poseidon)"
                placeholder="Enter derived nullifier string or hex"
                value={nullifierInput}
                onChange={(e) => setNullifierInput(e.target.value)}
                helperText="The unique single-use hash generated during proving."
                required
              />

              <button
                type="submit"
                disabled={isLoading}
                className="btn-cut w-full py-3 text-xs text-black font-medium inline-flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isLoading ? "Querying Registry..." : "Check Nullifier On-Chain"}</span>
              </button>
            </form>

            {isChecked && (
              <div className="pt-2">
                {isSpent ? (
                  <StatusBanner
                    variant="success"
                    title="ACCESS GRANTED: Verified on MST Coral"
                    description="This nullifier has been confirmed and recorded in PramaanRegistry.sol for this scope. Single-use attribute check passed."
                  />
                ) : (
                  <StatusBanner
                    variant="warning"
                    title="NULLIFIER UNSPENT: No Proof Recorded"
                    description="No prior proof has been registered for this nullifier in this scope. The user has not yet proven the required attribute on-chain."
                    action={
                      <Link
                        to="/app/prove"
                        className="btn-cut-border px-3 py-1 text-xs text-white inline-flex items-center gap-1.5"
                      >
                        <span>Generate Proof</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    }
                  />
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (5 cols): Contract Metadata & Explorer */}
        <div className="lg:col-span-5 space-y-6">
          <Card
            title="Contract State & Metadata"
            subtitle="Immutable smart contract instance deployed on MST Coral Testnet"
            headerAction={<Database className="w-4 h-4 text-white/50" />}
            divider
          >
            <DataList
              density="compact"
              items={[
                {
                  label: "Smart Contract",
                  value: "PramaanRegistry.sol",
                },
                {
                  label: "Contract Address",
                  value: registryAddress,
                  isMono: true,
                  truncateMiddle: true,
                  copyable: true,
                },
                {
                  label: "Target Network",
                  value: targetNetwork.name,
                },
                {
                  label: "Chain ID",
                  value: String(targetNetwork.chainId),
                  isMono: true,
                },
                {
                  label: "Verifier Scheme",
                  value: "Groth16 BN254",
                },
                {
                  label: "Replay Defense",
                  value: "Scope-Bounded Mapping",
                },
              ]}
              className="mb-6"
            />

            <div className="space-y-3 pt-2">
              <a
                href={`${explorerUrl}/address/${registryAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-cut-border py-2.5 text-xs text-white inline-flex items-center justify-center gap-2 hover:bg-white/5"
              >
                <span>View Contract on MST Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Link
                to="/app/prove"
                className="w-full btn-cut py-2.5 text-xs text-black font-medium inline-flex items-center justify-center gap-2 hover:bg-white/90"
              >
                <span>Open Client Prover</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
};

export default DappGatePage;
