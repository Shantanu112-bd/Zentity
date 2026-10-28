import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cpu, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink } from "lucide-react";
import { StatusChip } from "../components/StatusChip";
import { useWallet } from "../context/WalletContext";

export const DappGatePage: React.FC = () => {
  const { targetNetwork, contracts, address, isConnected } = useWallet();

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

  const registryAddress = contracts?.PramaanRegistry?.address || "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0";
  const explorerUrl = targetNetwork?.explorerUrl || "https://coral.mstscan.com";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <StatusChip type="ZK VERIFIED ON-CHAIN" />
          <StatusChip type="DEMO / SYNTHETIC" />
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-2">
          Web3 Smart Contract Gate
        </h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Reads the on-chain state of <code>PramaanRegistry.sol</code> on {targetNetwork.name} to grant access based on verified nullifiers.
        </p>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-slate-800 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span className="font-heading font-semibold text-white text-sm">
              MST On-Chain Gatekeeper
            </span>
          </div>
          <span className="font-mono text-xs text-cyan-400">
            {targetNetwork.name} ({targetNetwork.chainId})
          </span>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Scope Identifier
            </label>
            <input
              type="text"
              value={scopeInput}
              onChange={(e) => setScopeInput(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Nullifier Hash (Poseidon)
            </label>
            <input
              type="text"
              value={nullifierInput}
              onChange={(e) => setNullifierInput(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="button"
            onClick={checkRegistryState}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Query PramaanRegistry.isNullifierSpent</span>
          </button>
        </div>

        {isChecked && (
          <div
            className={`p-4 rounded-xl border text-xs font-mono transition-all ${
              isSpent
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">Registry Response:</span>
              <StatusChip type={isSpent ? "ZK VERIFIED ON-CHAIN" : "OFF-CHAIN VERIFIED"} />
            </div>
            <div>Nullifier: <span className="break-all">{nullifierInput}</span></div>
            <div>Status: <strong>{isSpent ? "SPENT & VERIFIED (ACCESS GRANTED)" : "UNSPENT / FRESH"}</strong></div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="truncate max-w-[240px]">Contract: {registryAddress}</span>
          <a
            href={`${explorerUrl}/address/${registryAddress}`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-cyan-400 flex items-center gap-1"
          >
            <span>Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
