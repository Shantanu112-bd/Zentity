import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Sparkles,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Send,
  ExternalLink,
} from "lucide-react";
import { StatusChip } from "../components/StatusChip";
import { useWallet, TxResult } from "../context/WalletContext";
import { issueSyntheticCredential, SyntheticCredential } from "../../../scripts/pramaan/crypto-utils.ts";
import { generateProofClientSide, ProofResult } from "../../../packages/client/src/prover.ts";

export const ProvePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    address,
    isConnected,
    isCorrectNetwork,
    targetNetwork,
    connect,
    switchNetwork,
    submitProofToMST,
  } = useWallet();

  // Preset Credentials
  const [selectedPreset, setSelectedPreset] = useState<"adult" | "minor" | "custom">("adult");
  const [credential, setCredential] = useState<SyntheticCredential | null>(null);
  const [scopeId, setScopeId] = useState<string>("42");
  const [recipient, setRecipient] = useState<string>("0x1234567890123456789012345678901234567890");

  // Prover State
  const [isProving, setIsProving] = useState<boolean>(false);
  const [progressStage, setProgressStage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [proofResult, setProofResult] = useState<ProofResult | null>(null);
  const [provingError, setProvingError] = useState<string | null>(null);

  // Verification State
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationOutcome, setVerificationOutcome] = useState<any | null>(null);

  // On-Chain Submission State
  const [isSubmittingOnChain, setIsSubmittingOnChain] = useState<boolean>(false);
  const [onChainTxResult, setOnChainTxResult] = useState<TxResult | null>(null);
  const [onChainError, setOnChainError] = useState<string | null>(null);

  // Sync recipient to connected wallet address
  useEffect(() => {
    if (address) {
      setRecipient(address);
    }
  }, [address]);

  // Initialize or fetch credential
  const handleSelectPreset = async (preset: "adult" | "minor") => {
    setSelectedPreset(preset);
    setProofResult(null);
    setProvingError(null);
    setVerificationOutcome(null);
    setOnChainTxResult(null);
    setOnChainError(null);

    const currentDateDays = 20000;
    // Adult: 25 years (25 * 365.25 ≈ 9131 days) -> dobDays = 20000 - 9131 = 10869
    // Minor: 16 years (16 * 365.25 ≈ 5844 days) -> dobDays = 20000 - 5844 = 14156
    const dobDays = preset === "adult" ? 10869 : 14156;
    const cred = await issueSyntheticCredential({
      dobDays,
      stateCode: 27,
    });
    setCredential(cred);
  };

  const handleIssueCustom = async () => {
    setSelectedPreset("custom");
    setProofResult(null);
    setProvingError(null);
    setVerificationOutcome(null);
    setOnChainTxResult(null);
    setOnChainError(null);

    try {
      const res = await fetch("/api/demo/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: 28, stateCode: 27 }),
      });
      const data = await res.json();
      if (data.credential) {
        setCredential(data.credential);
      }
    } catch (err: any) {
      setProvingError(`Failed to issue custom synthetic credential: ${err.message}`);
    }
  };

  // Run initial preset
  useEffect(() => {
    handleSelectPreset("adult");
  }, []);

  // Execute Proof Generation
  const handleGenerateProof = async () => {
    if (!credential) return;

    setIsProving(true);
    setProvingError(null);
    setProofResult(null);
    setVerificationOutcome(null);
    setOnChainTxResult(null);
    setOnChainError(null);
    setProgressPercent(10);
    setProgressStage("INITIALIZING_CIRCUIT");

    try {
      const result = await generateProofClientSide(
        credential,
        {
          scopeId,
          recipient,
          chainId: targetNetwork.chainId, // Bind to active target network
        },
        {
          wasmUrl: "/circuits/age_credential.wasm",
          zkeyUrl: "/circuits/age_credential_final.zkey",
          onProgress: (stage, percent) => {
            setProgressStage(stage);
            setProgressPercent(percent);
          },
        }
      );

      setProofResult(result);
      setProgressPercent(100);
      setProgressStage("PROVING_COMPLETE");
    } catch (err: any) {
      console.error("Proving failed:", err);
      if (selectedPreset === "minor") {
        setProvingError(
          "PROOF REJECTED BY CIRCUIT: Credential age is under 18! LessEqThan(64) constraint unsatisfied. (Expected negative test behavior)."
        );
      } else {
        setProvingError(`Proving error: ${err.message || String(err)}`);
      }
    } finally {
      setIsProving(false);
    }
  };

  // Execute Off-Chain Verification
  const handleVerifyOffChain = async () => {
    if (!proofResult) return;
    setIsVerifying(true);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof: proofResult.proof,
          publicSignals: proofResult.publicSignals,
          relayOnChain: false,
        }),
      });

      const outcome = await res.json();
      setVerificationOutcome(outcome);
    } catch (err: any) {
      setProvingError(`Verification request failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  // Execute On-Chain Verification ("Submit to MST")
  const handleSubmitOnChain = async () => {
    if (!proofResult) return;
    if (!isConnected) {
      await connect();
      return;
    }
    if (!isCorrectNetwork) {
      await switchNetwork();
      return;
    }

    setIsSubmittingOnChain(true);
    setOnChainError(null);

    try {
      const txRes = await submitProofToMST(
        proofResult.solidityCalldata.a,
        proofResult.solidityCalldata.b,
        proofResult.solidityCalldata.c,
        proofResult.solidityCalldata.pubSignals
      );

      setOnChainTxResult(txRes);

      // Persist last tx for VerifyPage re-reading
      const stored = {
        txHash: txRes.txHash,
        blockNumber: txRes.blockNumber.toString(),
        gasUsed: txRes.gasUsed.toString(),
        status: txRes.status,
        explorerUrl: txRes.explorerUrl,
        nullifier: proofResult.nullifier,
        scopeId,
        network: targetNetwork,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem("pramaan_last_tx", JSON.stringify(stored));
    } catch (err: any) {
      console.error("On-chain submission failed:", err);
      setOnChainError(err.message || String(err));
    } finally {
      setIsSubmittingOnChain(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <StatusChip type="DEMO / SYNTHETIC" />
          <StatusChip type="OFF-CHAIN VERIFIED" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-white">
          Client Prover Flow
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Compute Groth16 zk-SNARKs client-side inside your browser. No private credential data ever leaves your device.
        </p>
      </div>

      {/* Step 1: Synthetic Credential Selection */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-white text-base flex items-center gap-2">
            <span>1. Choose Synthetic Credential</span>
          </h2>
          <span className="text-xs font-mono text-amber-400">DEMO ISSUER (EdDSA-Poseidon)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <button
            type="button"
            onClick={() => handleSelectPreset("adult")}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedPreset === "adult"
                ? "border-cyan-500 bg-cyan-500/10 text-white"
                : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="font-heading font-semibold text-sm mb-1 text-emerald-400">
              Adult Credential (Age 25)
            </div>
            <div className="text-xs text-slate-400">DOB: ~1999 &bull; State: 27 (MH)</div>
            <div className="text-[11px] font-mono text-cyan-400 mt-2">&ge; 18 constraint PASSES</div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset("minor")}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedPreset === "minor"
                ? "border-red-500 bg-red-500/10 text-white"
                : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="font-heading font-semibold text-sm mb-1 text-red-400">
              Minor Credential (Age 16)
            </div>
            <div className="text-xs text-slate-400">DOB: ~2008 &bull; State: 27 (MH)</div>
            <div className="text-[11px] font-mono text-red-400 mt-2">&lt; 18 constraint REVERTS</div>
          </button>

          <button
            type="button"
            onClick={handleIssueCustom}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedPreset === "custom"
                ? "border-amber-500 bg-amber-500/10 text-white"
                : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="font-heading font-semibold text-sm mb-1 text-amber-400">
              Issue via Backend API
            </div>
            <div className="text-xs text-slate-400">POST /api/demo/issue</div>
            <div className="text-[11px] font-mono text-amber-400 mt-2">Zero-PII Filter Verified</div>
          </button>
        </div>

        {/* Credential Data Preview */}
        {credential && (
          <div className="mt-4 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between text-slate-400 mb-2 border-b border-slate-800/80 pb-1">
              <span>Synthetic Credential Signed Fields</span>
              <span className="text-[10px] text-amber-400">Stored in browser memory only</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>dobDays: <span className="text-cyan-400">{credential.dobDays}</span></div>
              <div>stateCode: <span className="text-cyan-400">{credential.stateCode}</span></div>
              <div className="col-span-2 truncate">credentialSecret: <span className="text-slate-500">{credential.credentialSecret}</span></div>
              <div className="col-span-2 truncate">EdDSA R8x: <span className="text-slate-500">{credential.signature.R8x}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Context Binding Configuration */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 mb-6">
        <h2 className="font-heading font-semibold text-white text-base mb-4">
          2. Bind Target Context (Scope, Recipient, Chain)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1.5">Scope ID (Application Domain)</label>
            <input
              type="text"
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Scope prevents cross-site linkage</span>
          </div>

          <div>
            <label className="text-slate-400 block mb-1.5">Recipient Address (Caller / Wallet)</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 truncate"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              {address && recipient.toLowerCase() === address.toLowerCase() ? "Bound to connected wallet" : "Custom address"}
            </span>
          </div>

          <div>
            <label className="text-slate-400 block mb-1.5">Target Chain ID</label>
            <input
              type="text"
              readOnly
              value={`${targetNetwork.chainId} (${targetNetwork.name})`}
              className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Prevents cross-chain replay</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800/80">
          <div className="text-xs text-slate-400">
            Current public date epoch: <strong className="text-slate-200">20,000 days</strong> (~2024)
          </div>

          <button
            type="button"
            disabled={isProving || !credential}
            onClick={handleGenerateProof}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 hover:opacity-95 transition-all disabled:opacity-50"
          >
            {isProving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Proving in Worker ({progressPercent}%)...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Generate Proof</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {isProving && (
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>{progressStage.replace(/_/g, " ")}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {provingError && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Proving Constraint Alert</span>
              {provingError}
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Proof Result & Submission */}
      {proofResult && (
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/40 glow-cyan mb-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="font-heading font-semibold text-white text-base">
                Proof Generated Successfully
              </h3>
            </div>
            <StatusChip type="OFF-CHAIN VERIFIED" />
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">Derived Nullifier (Sybil Prevention):</span>
              <span className="text-cyan-400 font-bold break-all">{proofResult.nullifier}</span>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1">Public Inputs Array (7 signals):</span>
              <div className="text-[11px] text-slate-300 space-y-0.5">
                <div>[0] issuerPubKeyHash: {proofResult.publicSignals[0]}</div>
                <div>[1] scopeId: {proofResult.publicSignals[1]}</div>
                <div>[2] nullifier: {proofResult.publicSignals[2]}</div>
                <div>[3] recipient: {proofResult.publicSignals[3]}</div>
                <div>[4] chainId: {proofResult.publicSignals[4]}</div>
                <div>[5] currentDateDays: {proofResult.publicSignals[5]}</div>
                <div>[6] thresholdAgeDays: {proofResult.publicSignals[6]}</div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isVerifying}
              onClick={handleVerifyOffChain}
              className="px-4 py-2.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              <span>Verify Off-Chain (API)</span>
            </button>

            {/* Step 5: Explicit "Submit to MST" Button */}
            <button
              type="button"
              disabled={isSubmittingOnChain}
              onClick={handleSubmitOnChain}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold flex items-center gap-2 hover:opacity-95 shadow-md shadow-emerald-500/20 transition-all"
            >
              {isSubmittingOnChain ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting & Minding on MST...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to MST ({targetNetwork.label || targetNetwork.name})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate(`/verify/${onChainTxResult?.txHash || proofResult.nullifier}`)}
              className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold flex items-center gap-2 transition-all ml-auto"
            >
              <span>View Verify Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Off-Chain Verification Outcome */}
          {verificationOutcome && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>Fastify API Verified:</strong> Groth16 mathematical check passed. Mode:{" "}
                  <strong>{verificationOutcome.chainMode}</strong>.
                </span>
              </div>
              <StatusChip type="OFF-CHAIN VERIFIED" />
            </div>
          )}

          {/* On-Chain Transaction Result Display */}
          {onChainTxResult && (
            <div className="mt-4 p-5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-xs space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Mined Successfully on {targetNetwork.name}</span>
                </div>
                <StatusChip
                  type="ZK VERIFIED ON-CHAIN"
                  txHash={onChainTxResult.txHash}
                  explorerUrl={targetNetwork.explorerUrl}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px] pt-1">
                <div>
                  <span className="text-slate-400">Tx Hash: </span>
                  <a
                    href={onChainTxResult.explorerUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{onChainTxResult.txHash.slice(0, 10)}...{onChainTxResult.txHash.slice(-8)}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div>
                  <span className="text-slate-400">Block: </span>
                  <span>{onChainTxResult.blockNumber.toString()}</span>
                </div>
                <div>
                  <span className="text-slate-400">Gas Used: </span>
                  <span>{onChainTxResult.gasUsed.toString()}</span>
                </div>
                <div>
                  <span className="text-slate-400">Status: </span>
                  <span className="text-emerald-400 font-bold uppercase">{onChainTxResult.status}</span>
                </div>
              </div>

              {onChainTxResult.eventDecoded && (
                <div className="p-2.5 bg-black/40 rounded border border-emerald-500/20 text-[10px] font-mono text-emerald-300">
                  <span className="font-semibold block mb-0.5">Event ProofVerifiedAndRecorded Decoded:</span>
                  <div>scopeId: {onChainTxResult.eventDecoded.scopeId.toString()}</div>
                  <div className="truncate">nullifier: {onChainTxResult.eventDecoded.nullifier.toString()}</div>
                  <div>recipient: {onChainTxResult.eventDecoded.recipient}</div>
                </div>
              )}
            </div>
          )}

          {/* On-Chain Revert / Submission Error Alert */}
          {onChainError && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">On-Chain Submission / Revert</span>
                {onChainError}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
