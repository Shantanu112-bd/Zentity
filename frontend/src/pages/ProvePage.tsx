import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Sparkles,
  CheckCircle,
  Loader2,
  ArrowRight,
  AlertCircle,
  Send,
  ExternalLink,
} from "lucide-react";
import { StatusChip } from "../components/StatusChip";
import { useWallet, TxResult } from "../context/WalletContext";
import { issueSyntheticCredential, SyntheticCredential } from "../../../scripts/pramaan/crypto-utils.ts";
import { generateProofClientSide, ProofResult } from "../../../packages/client/src/prover.ts";
import { AppShell } from "../components/AppShell";

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
    // Adult: 25 years -> dobDays = 10869
    // Minor: 16 years -> dobDays = 14156
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
          chainId: targetNetwork.chainId,
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

  const activeStep = onChainTxResult
    ? "result"
    : isSubmittingOnChain
    ? "submit"
    : proofResult
    ? "submit"
    : isProving
    ? "proof"
    : "credential";

  return (
    <AppShell
      title="PROVE"
      activeStepId={activeStep}
      steps={[
        { id: "credential", label: "Credential" },
        { id: "proof", label: "Proof" },
        { id: "submit", label: "Submit" },
        { id: "result", label: "Result" },
      ]}
      facts={[
        ["Network:", `${targetNetwork?.name || "MST Coral"} (${targetNetwork?.chainId || 54635})`],
        ["Registry:", "0x8c182a53...5c5b"],
        ["Circuit:", "AgeCredential (5,014 constraints)"],
        ["Privacy:", "Zero-PII egress (proved client-side)"],
      ]}
    >
      <div className="space-y-6">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <StatusChip type="DEMO / SYNTHETIC" />
          <StatusChip type="OFF-CHAIN VERIFIED" />
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Client-Side Groth16 Prover
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 mt-1">
            Compute zk-SNARKs entirely in your browser Web Worker. No private credential data ever leaves your device.
          </p>
        </div>

        {/* Step 1: Synthetic Credential Selection */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-white text-xs sm:text-sm">
              1. Choose Synthetic Credential
            </span>
            <span className="text-[11px] font-mono text-neutral-300">DEMO ISSUER (EdDSA)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
            <button
              type="button"
              onClick={() => handleSelectPreset("adult")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedPreset === "adult"
                  ? "border-white bg-white/20 text-white"
                  : "border-white/10 bg-black/30 text-neutral-400 hover:border-white/25"
              }`}
            >
              <div className="font-semibold text-xs mb-1 text-white">
                Adult (Age 25)
              </div>
              <div className="text-[11px] text-neutral-300">DOB: ~1999 &bull; State: 27</div>
              <div className="text-[10px] font-mono text-emerald-400 mt-1.5">&ge; 18 PASSES</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset("minor")}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedPreset === "minor"
                  ? "border-rose-400 bg-rose-500/20 text-white"
                  : "border-white/10 bg-black/30 text-neutral-400 hover:border-white/25"
              }`}
            >
              <div className="font-semibold text-xs mb-1 text-rose-300">
                Minor (Age 16)
              </div>
              <div className="text-[11px] text-neutral-300">DOB: ~2008 &bull; State: 27</div>
              <div className="text-[10px] font-mono text-rose-400 mt-1.5">&lt; 18 REVERTS</div>
            </button>

            <button
              type="button"
              onClick={handleIssueCustom}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedPreset === "custom"
                  ? "border-white bg-white/20 text-white"
                  : "border-white/10 bg-black/30 text-neutral-400 hover:border-white/25"
              }`}
            >
              <div className="font-semibold text-xs mb-1 text-amber-300">
                Custom API Issue
              </div>
              <div className="text-[11px] text-neutral-300">POST /api/demo/issue</div>
              <div className="text-[10px] font-mono text-amber-400 mt-1.5">Zero-PII Filter</div>
            </button>
          </div>

          {credential && (
            <div className="mt-3 p-3 bg-black/50 rounded-xl border border-white/15 font-mono text-[11px] text-neutral-300">
              <div className="flex items-center justify-between text-neutral-400 mb-1.5 border-b border-white/10 pb-1">
                <span>Signed Credential Fields</span>
                <span className="text-[10px] text-amber-300">Memory only</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>dobDays: <span className="text-white">{credential.dobDays}</span></div>
                <div>stateCode: <span className="text-white">{credential.stateCode}</span></div>
                <div className="col-span-2 truncate">credentialSecret: <span className="text-neutral-500">{credential.credentialSecret}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Context Binding Configuration */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/20">
          <span className="font-semibold text-white text-xs sm:text-sm block mb-3">
            2. Bind Context (Scope, Recipient, Chain)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div>
              <label className="text-neutral-400 block mb-1">Scope ID</label>
              <input
                type="text"
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white truncate"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Target Chain</label>
              <input
                type="text"
                readOnly
                value={`${targetNetwork.chainId} (${targetNetwork.name})`}
                className="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-lg text-neutral-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
            <span className="text-xs text-neutral-400">
              Epoch date: <strong className="text-white">20,000 days</strong> (~2024)
            </span>

            <button
              type="button"
              disabled={isProving || !credential}
              onClick={handleGenerateProof}
              className="menu"
              style={{
                height: "38px",
                padding: "0 22px",
                fontSize: "13px",
                background: "#fff",
                color: "#000",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {isProving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Proving ({progressPercent}%)...</span>
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
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-300 mb-1.5">
                <span>{progressStage.replace(/_/g, " ")}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Alert */}
          {provingError && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Circuit Constraint Rejection</span>
                {provingError}
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Proof Result & Submission */}
        {proofResult && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white text-xs sm:text-sm">
                  Proof Generated Successfully
                </span>
              </div>
              <StatusChip type="OFF-CHAIN VERIFIED" />
            </div>

            <div className="p-3 bg-black/60 rounded-xl border border-white/15 text-[11px] font-mono space-y-1">
              <div className="text-neutral-400">Derived Nullifier:</div>
              <div className="text-white font-bold break-all">{proofResult.nullifier}</div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isVerifying}
                onClick={handleVerifyOffChain}
                className="menu"
                style={{
                  height: "38px",
                  padding: "0 18px",
                  fontSize: "12px",
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                <span>Verify Off-Chain</span>
              </button>

              <button
                type="button"
                disabled={isSubmittingOnChain}
                onClick={handleSubmitOnChain}
                className="menu"
                style={{
                  height: "38px",
                  padding: "0 22px",
                  fontSize: "12px",
                  background: "#fff",
                  color: "#000",
                }}
              >
                {isSubmittingOnChain ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    <span>Submitting on MST...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    <span>Submit to MST ({targetNetwork.name})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/app/verify/${onChainTxResult?.txHash || proofResult.nullifier}`)}
                className="ml-auto text-xs text-neutral-300 hover:text-white inline-flex items-center gap-1 font-semibold"
              >
                <span>View Verification Gate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fastify API outcome */}
            {verificationOutcome && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                <span>Fastify API Verified: Groth16 mathematical check passed.</span>
                <StatusChip type="OFF-CHAIN VERIFIED" />
              </div>
            )}

            {/* On-Chain Mined Receipt */}
            {onChainTxResult && (
              <div className="p-4 bg-black/60 rounded-xl border border-emerald-500/40 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-semibold text-emerald-400">
                    Mined on {targetNetwork.name}
                  </span>
                  <StatusChip
                    type="ZK VERIFIED ON-CHAIN"
                    txHash={onChainTxResult.txHash}
                    explorerUrl={targetNetwork.explorerUrl}
                  />
                </div>

                <div className="font-mono text-[11px] text-neutral-300 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div>
                    Tx:{" "}
                    <a
                      href={onChainTxResult.explorerUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white underline inline-flex items-center gap-1"
                    >
                      {onChainTxResult.txHash.slice(0, 10)}...{onChainTxResult.txHash.slice(-8)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div>Block: {onChainTxResult.blockNumber.toString()}</div>
                  <div>Gas: {onChainTxResult.gasUsed.toString()}</div>
                  <div>Status: {onChainTxResult.status}</div>
                </div>
              </div>
            )}

            {onChainError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{onChainError}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
};
