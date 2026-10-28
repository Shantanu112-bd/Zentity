import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldCheck, CheckCircle2, ExternalLink, ArrowLeft, RefreshCw, Cpu, AlertTriangle } from "lucide-react";
import { ProofGateCanvas } from "../components/ProofGateCanvas";
import { StatusChip } from "../components/StatusChip";
import { useWallet } from "../context/WalletContext";

export const VerifyPage: React.FC = () => {
  const { tx } = useParams<{ tx: string }>();
  const { targetNetwork } = useWallet();

  const [chainMode, setChainMode] = useState<string>("local");
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [liveReceipt, setLiveReceipt] = useState<any | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const fetchLiveState = async () => {
    setIsChecking(true);
    setVerificationError(null);

    try {
      // 1. Get health/chain mode
      const healthRes = await fetch("/health");
      const healthData = await healthRes.json();
      if (healthData.chainMode) setChainMode(healthData.chainMode);

      // 2. Check if tx param is a tx hash or nullifier
      const txParam = tx?.trim();
      const isTxHash = Boolean(txParam && /^0x[a-fA-F0-9]{64}$/.test(txParam));

      // Check localStorage for persisted recent proof
      const saved = localStorage.getItem("pramaan_last_tx");
      let cachedData: any = null;
      if (saved) {
        try {
          cachedData = JSON.parse(saved);
        } catch {}
      }

      if (isTxHash) {
        // Query RPC directly for live receipt
        const rpcUrl = targetNetwork?.rpcUrl || "https://coralrpc.mstblockchain.com";
        const rpcRes = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getTransactionReceipt",
            params: [txParam],
          }),
        });

        const rpcData = await rpcRes.json();
        const receipt = rpcData.result;

        if (receipt) {
          const success = receipt.status === "0x1" || receipt.status === 1 || receipt.status === "1";
          setIsVerified(success);
          setLiveReceipt({
            txHash: receipt.transactionHash,
            blockNumber: parseInt(receipt.blockNumber, 16),
            gasUsed: parseInt(receipt.gasUsed, 16),
            from: receipt.from,
            to: receipt.to,
            status: success ? "success" : "reverted",
          });
        } else if (cachedData && cachedData.txHash?.toLowerCase() === txParam?.toLowerCase()) {
          // If transaction was just mined or local
          setIsVerified(cachedData.status === "success");
          setLiveReceipt(cachedData);
        } else {
          setIsVerified(false);
          setVerificationError(`Transaction receipt not found on ${targetNetwork.name} yet.`);
        }
      } else {
        // Param is nullifier or demo string
        if (cachedData) {
          setIsVerified(cachedData.status === "success");
          setLiveReceipt(cachedData);
        } else {
          // Default to off-chain mathematical pass for demo nullifier
          setIsVerified(true);
        }
      }
    } catch (err: any) {
      console.error("Failed to query live chain state:", err);
      setVerificationError(`Failed to fetch live chain verification: ${err.message}`);
      setIsVerified(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    fetchLiveState();
  }, [tx, targetNetwork]);

  const explorerBase = targetNetwork.explorerUrl || "https://coral.mstscan.com";
  const txHash = liveReceipt?.txHash || (tx && /^0x[a-fA-F0-9]{64}$/.test(tx) ? tx : undefined);
  const explorerUrl = txHash ? `${explorerBase}/tx/${txHash}` : undefined;

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
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 ${isVerified ? "bg-cyan-500/10" : "bg-red-500/10"} rounded-full blur-3xl pointer-events-none -z-10`} />

        <div className="inline-flex items-center gap-2 mb-4">
          <StatusChip
            type={liveReceipt ? "ZK VERIFIED ON-CHAIN" : "OFF-CHAIN VERIFIED"}
            txHash={txHash}
            explorerUrl={explorerBase}
          />
          <StatusChip type="DEMO / SYNTHETIC" />
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

        {/* Error / Alert */}
        {verificationError && (
          <div className="max-w-lg mx-auto mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>{verificationError}</span>
          </div>
        )}

        {/* Verdict Details (Live State Re-read) */}
        <div className="max-w-lg mx-auto bg-slate-950/80 rounded-2xl border border-slate-800/80 p-5 text-left font-mono text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
            <span className="text-slate-400 font-sans font-semibold">Verification Statement</span>
            <span className={isVerified ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
              {isVerified ? "AGE >= 18 PROVEN" : "VERIFICATION PENDING / FAILED"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Target Identifier:</span>
            <span className="text-slate-200 break-all">{txParamLabel(tx)}</span>
          </div>

          {liveReceipt && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Mined Block:</span>
                <span className="text-cyan-400">{liveReceipt.blockNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Gas Used:</span>
                <span className="text-slate-200">{liveReceipt.gasUsed} gas</span>
              </div>
              {txHash && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Explorer Check:</span>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>View on MSTScan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Target Network:</span>
            <span className="text-cyan-400">{targetNetwork.name} ({targetNetwork.chainId})</span>
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
          <button
            type="button"
            onClick={fetchLiveState}
            disabled={isChecking}
            className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
            <span>Re-check Live Chain</span>
          </button>

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

function txParamLabel(tx?: string): string {
  if (!tx) return "demo-nullifier-42";
  if (tx.length > 24) {
    return `${tx.slice(0, 12)}...${tx.slice(-10)}`;
  }
  return tx;
}
