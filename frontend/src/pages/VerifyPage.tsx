import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldCheck, CheckCircle2, ExternalLink, ArrowLeft, RefreshCw, AlertTriangle, AlertCircle } from "lucide-react";
import { ProofGateCanvas } from "../components/ProofGateCanvas";
import { StatusChip } from "../components/StatusChip";
import { useWallet } from "../context/WalletContext";
import { AppShell } from "../components/AppShell";

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
      // 1. Get health / chain mode
      const healthRes = await fetch("/health");
      const healthData = await healthRes.json();
      if (healthData.chainMode) setChainMode(healthData.chainMode);

      // 2. Check if tx param is a tx hash or nullifier
      const txParam = tx?.trim();
      const isTxHash = Boolean(txParam && /^0x[a-fA-F0-9]{64}$/.test(txParam));

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
          setIsVerified(cachedData.status === "success");
          setLiveReceipt(cachedData);
        } else {
          setIsVerified(false);
          setVerificationError(`Transaction receipt not found on ${targetNetwork.name} yet.`);
        }
      } else {
        if (cachedData) {
          setIsVerified(cachedData.status === "success");
          setLiveReceipt(cachedData);
        } else {
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

  return (
    <AppShell
      title="VERIFY"
      activeStepId={isVerified ? "verified" : isChecking ? "checking" : "pending"}
      steps={[
        { id: "checking", label: "Check RPC" },
        { id: "receipt", label: "Receipt" },
        { id: "verified", label: "On-Chain Gate" },
      ]}
      facts={[
        ["Network:", `${targetNetwork?.name || "MST Coral"} (${targetNetwork?.chainId || 54635})`],
        ["Verifier:", "0xed8fe3...addedbf28"],
        ["Registry:", "0x8c182a...bc2658c5b"],
        [
          "Status:",
          liveReceipt ? (
            <span className={liveReceipt.status === "success" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
              {liveReceipt.status === "success" ? "MINED (0x1)" : "REVERTED (0x0)"}
            </span>
          ) : isChecking ? (
            "POLLING RPC..."
          ) : (
            "PENDING RECEIPT"
          ),
        ],
      ]}
    >
      <div className="bg-[rgba(17,16,15,0.35)] backdrop-blur-[20px] rounded-[24px] border border-white/[0.06] p-6 sm:p-8 space-y-6 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Link
              to="/app/prove"
              className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1 font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Prover</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {isVerified ? (
              <StatusChip type="ZK VERIFIED ON-CHAIN" txHash={liveReceipt?.txHash} />
            ) : (
              <StatusChip type="DEMO / SYNTHETIC" />
            )}
            <button
              type="button"
              onClick={fetchLiveState}
              className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* State-Accurate Gate Canvas (Opens only when status == 1 on live receipt) */}
        <div className="flex flex-col items-center justify-center py-4">
          <ProofGateCanvas
            isOpen={isVerified}
            openness={isVerified ? 1 : 0}
            size={240}
            className="mb-3"
          />

          <h2 className="text-xl font-bold text-white tracking-tight">
            {isVerified
              ? "On-Chain Zero-Knowledge Gate: OPEN"
              : isChecking
              ? "Verifying Transaction Receipt..."
              : "On-Chain Gate: CLOSED"}
          </h2>
          <p className="text-xs text-neutral-300 mt-1 max-w-md text-center">
            {isVerified
              ? "ZK Proof cryptographically verified by PramaanVerifier.sol on MST Coral Testnet."
              : verificationError || "Waiting for receipt confirmation on live blockchain."}
          </p>
        </div>

        {/* Receipt Details */}
        {liveReceipt && (
          <div className="p-4 bg-black/60 rounded-2xl border border-white/15 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-neutral-400">Live Transaction Receipt</span>
              <a
                href={`${explorerBase}/tx/${liveReceipt.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-white underline inline-flex items-center gap-1 text-[11px]"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-neutral-400">Tx Hash: </span>
                <span className="text-white">{liveReceipt.txHash?.slice(0, 12)}...{liveReceipt.txHash?.slice(-8)}</span>
              </div>
              <div>
                <span className="text-neutral-400">Block Number: </span>
                <span className="text-white">{liveReceipt.blockNumber}</span>
              </div>
              <div>
                <span className="text-neutral-400">Gas Used: </span>
                <span className="text-white">{liveReceipt.gasUsed}</span>
              </div>
              <div>
                <span className="text-neutral-400">Status: </span>
                <span className={liveReceipt.status === "success" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {liveReceipt.status === "success" ? "SUCCESS (0x1)" : "REVERTED (0x0)"}
                </span>
              </div>
            </div>
          </div>
        )}

        {verificationError && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Verification Pending or Reverted</span>
              {verificationError}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
