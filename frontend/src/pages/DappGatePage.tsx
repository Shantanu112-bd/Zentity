import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cpu, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink } from "lucide-react";
import { StatusChip } from "../components/StatusChip";
import { useWallet } from "../context/WalletContext";
import { AppShell } from "../components/AppShell";

export const DappGatePage: React.FC = () => {
  const { targetNetwork, contracts } = useWallet();

  const [nullifierInput, setNullifierInput] = useState<string>("sample-nullifier-42");
  const [scopeInput, setScopeInput] = useState<string>("42");
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isSpent, setIsSpent] = useState<boolean>(false);

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

  const checkRegistryState = async () => {
    try {
      const res = await fetch(`/api/registry/${scopeInput}/${nullifierInput}`);
      const data = await res.json();
      setIsSpent(data.isSpent || false);
      setIsChecked(true);
    } catch (err) {
      console.error(err);
    }
  };

  const registryAddress = contracts?.PramaanRegistry?.address || "0x8c182a53fca78fe237734239bdb1256bc2658c5b";
  const explorerUrl = targetNetwork?.explorerUrl || "https://coral.mstscan.com";

  return (
    <AppShell
      title="DAPP GATE"
      activeStepId="dapp"
      steps={[
        { id: "prove", label: "Prove" },
        { id: "verify", label: "Verify" },
        { id: "dapp", label: "dApp Gate" },
      ]}
      facts={[
        ["Network:", `${targetNetwork?.name || "MST Coral"} (${targetNetwork?.chainId || 54635})`],
        ["Contract:", "PramaanRegistry.sol"],
        ["Address:", `${registryAddress.slice(0, 10)}...${registryAddress.slice(-8)}`],
        ["Scope Check:", `Domain ${scopeInput}`],
      ]}
    >
      <div className="bg-[rgba(17,16,15,0.35)] backdrop-blur-[20px] rounded-[24px] border border-white/[0.06] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              On-Chain Gatekeeper
            </h2>
            <p className="text-xs text-neutral-300 mt-0.5">
              Reads <code>PramaanRegistry.sol</code> on {targetNetwork.name} to verify nullifiers and prevent Sybil replay.
            </p>
          </div>
          <StatusChip type="ZK VERIFIED ON-CHAIN" />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">
              Scope Identifier
            </label>
            <input
              type="text"
              value={scopeInput}
              onChange={(e) => setScopeInput(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-[12px] px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-white/50"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1">
              Nullifier Hash (Poseidon)
            </label>
            <input
              type="text"
              value={nullifierInput}
              onChange={(e) => setNullifierInput(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-[12px] px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-white/50"
            />
          </div>

          <button
            type="button"
            onClick={checkRegistryState}
            className="w-full h-[48px] bg-[#E9E9E9] rounded-[12px] text-[#0A0707] font-[450] text-sm hover:bg-white transition-opacity font-medium"
          >
            Check Nullifier On-Chain
          </button>
        </div>

        {isChecked && (
          <div
            className={`p-4 rounded-xl border text-xs ${
              isSpent
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-white/5 border-white/20 text-neutral-300"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold mb-1">
              {isSpent ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ACCESS GRANTED: Verified on MST Coral</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>NULLIFIER UNSPENT: No prior proof recorded for this scope</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-neutral-400">
              {isSpent
                ? "This nullifier has been recorded in PramaanRegistry. Sybil protection enforced."
                : "Generate and submit a proof on /app/prove to register this nullifier."}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
};
