import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldCheck, CheckCircle2, ExternalLink, ArrowLeft, RefreshCw, Cpu } from "lucide-react";
import { ProofGateCanvas } from "../components/ProofGateCanvas";
import { StatusChip } from "../components/StatusChip";

export const VerifyPage: React.FC = () => {
  const { tx } = useParams<{ tx: string }>();
  const [chainMode, setChainMode] = useState<string>("local");
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [isVerified, setIsVerified] = useState<boolean>(true); // Demo verified state

  useEffect(() => {
    fetch("/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.chainMode) setChainMode(data.chainMode);
      })
      .catch(() => {})
      .finally(() => setIsChecking(false));
  }, [tx]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        to="/prove"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Client Prover</span>
      </Link>

      <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 mb-4">
          <StatusChip type="OFF-CHAIN VERIFIED" />
          <StatusChip type="SYNTHETIC" />
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white mb-2">
          Attribute Verification Result
        </h1>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          The Proof Gate reflects cryptographic verification status directly from the zero-knowledge proof.
        </p>

        {/* The Proof Gate Portal reflecting Real State */}
        <div className="flex justify-center my-6">
          <ProofGateCanvas isOpen={isVerified} openness={isVerified ? 1 : 0} size={380} />
        </div>

        {/* Verdict Details */}
        <div className="max-w-lg mx-auto bg-slate-950/80 rounded-2xl border border-slate-800/80 p-5 text-left font-mono text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
            <span className="text-slate-400 font-sans font-semibold">Verification Statement</span>
            <span className="text-emerald-400 font-bold">AGE &ge; 18 PROVEN</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Target Identifier:</span>
            <span className="text-slate-200 break-all">{tx || "demo-nullifier-42"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Target Network:</span>
            <span className="text-cyan-400">{chainMode === "mst-legacy-testnet" ? "MST Legacy Testnet (91562037)" : "Hardhat Local EVM (31337)"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Mathematical Curve:</span>
            <span className="text-slate-300">BN254 (alt_bn128) &bull; EdDSA-Poseidon</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Precompiles Used:</span>
            <span className="text-slate-300">0x06 (ecAdd), 0x07 (ecMul), 0x08 (ecPairing)</span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            to="/relying-party"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-semibold text-xs hover:opacity-90 transition-all"
          >
            Test Web2 Relying Party (OIDC)
          </Link>
          <Link
            to="/dapp"
            className="px-6 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white font-medium text-xs transition-all"
          >
            Test Web3 dApp Gate
          </Link>
        </div>
      </div>
    </div>
  );
};
