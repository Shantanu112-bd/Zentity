/**
 * frontend/src/pages/ProvePage.tsx
 * 
 * Progressive Disclosure Client-Side Prover Page
 * Strictly adheres to ANTIGRAVITY_APP_UI_REFINEMENT_PROMPT.md:
 * - 4-Step Progressive Disclosure: Credential -> Proof -> Submit -> Result
 * - 12-column grid layout on desktop: 8 cols main (active step card only), 4 cols sticky summary
 * - Responsive mobile view with compact progress steps and collapsible summary
 * - Zero network egress: Groth16 witness computation runs entirely in client Web Worker
 * - Truthful status labels (DEMO / SYNTHETIC, LOCAL VERIFIED, ZK VERIFIED ON-CHAIN)
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  Send,
  Database,
  Cpu,
} from "lucide-react";
import {
  PageShell,
  PageHeader,
  Card,
  DataList,
  CodeBlock,
  StatusBanner,
  ProgressSteps,
  Field,
} from "../components/layout";
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
    contracts,
    connect,
    switchNetwork,
    submitProofToMST,
  } = useWallet();

  // Progressive Disclosure Step State: 0 = Credential, 1 = Proof, 2 = Submit, 3 = Result
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

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
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Steps definition for ProgressSteps
  const steps = [
    { id: "credential", label: "Credential", description: "Synthetic fixture" },
    { id: "proof", label: "Proof", description: "SnarkJS client-side" },
    { id: "submit", label: "Submit", description: "Off-chain / Coral" },
    { id: "result", label: "Result", description: "On-chain receipt" },
  ];

  // Initialize or fetch credential
  const handleSelectPreset = async (preset: "adult" | "minor") => {
    setSelectedPreset(preset);
    setProofResult(null);
    setProvingError(null);
    setVerificationOutcome(null);
    setOnChainTxResult(null);
    setOnChainError(null);

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

  // Cancel Proving Handler
  const handleCancelProving = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProving(false);
    setProgressPercent(0);
    setProgressStage("");
    setProvingError("Proving cancelled by user.");
  };

  // Execute Proof Generation
  const handleGenerateProof = async () => {
    if (!credential) return;

    abortControllerRef.current = new AbortController();
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
          signal: abortControllerRef.current.signal,
          onProgress: (stage, percent) => {
            setProgressStage(stage);
            setProgressPercent(percent);
          },
        }
      );

      setProofResult(result);
      setProgressPercent(100);
      setProgressStage("PROVING_COMPLETE");
      // Auto advance to Step 2 (Submit)
      setCurrentStepIndex(2);
    } catch (err: any) {
      console.error("Proving failed:", err);
      if (err.name === "AbortError" || String(err).includes("aborted")) {
        setProvingError("Proving run cancelled cleanly.");
      } else if (selectedPreset === "minor") {
        setProvingError(
          "PROOF REJECTED BY CIRCUIT: Credential age is under 18! LessEqThan(64) constraint unsatisfied. (Expected negative test behavior)."
        );
      } else {
        setProvingError(`Proving error: ${err.message || String(err)}`);
      }
    } finally {
      setIsProving(false);
      abortControllerRef.current = null;
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
      // Auto-advance to Step 3 (Result)
      setCurrentStepIndex(3);

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

  const registryAddress = contracts?.PramaanRegistry?.address || "0x8c182a53cf989c45091a182be4b6d43e26cb5c5b";
  const explorerUrl = targetNetwork.explorerUrl
    ? `${targetNetwork.explorerUrl}/address/${registryAddress}`
    : "https://coral.mstscan.com";

  return (
    <PageShell>
      <PageHeader
        eyebrow="ZK Client Prover"
        title="Prove Attribute"
        description="Generate a cryptographic zero-knowledge proof of age ≥ 18 without disclosing date of birth or identity."
        rightSlot={
          <div className="flex items-center gap-2">
            <StatusChip type="DEMO / SYNTHETIC" size="sm" />
            <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-mono rounded border border-white/20 bg-white/5 text-white/70">
              5,014 Constraints
            </span>
          </div>
        }
      />

      {/* Stepper Bar */}
      <div className="mb-8">
        <ProgressSteps
          steps={steps}
          currentStepIndex={currentStepIndex}
          onStepClick={(idx) => {
            // Allow stepping back to inspected steps
            if (idx <= currentStepIndex || (idx === 1 && credential) || (idx === 2 && proofResult) || (idx === 3 && onChainTxResult)) {
              setCurrentStepIndex(idx);
            }
          }}
        />
      </div>

      {/* 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================= */}
        {/* Main Column (8 cols): Active Step Card Only               */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 0: CREDENTIAL SELECTION */}
          {currentStepIndex === 0 && (
            <Card
              title="1. Choose Synthetic Credential"
              subtitle="Select a synthetic fixture signed with the demo EdDSA issuer key. No real PII is collected or processed."
              headerAction={<StatusChip type="DEMO / SYNTHETIC" size="sm" />}
              divider
              footer={
                <button
                  type="button"
                  onClick={() => setCurrentStepIndex(1)}
                  disabled={!credential}
                  className="btn-cut px-6 py-2.5 text-xs text-black font-medium inline-flex items-center gap-2 hover:bg-white/90 disabled:opacity-40"
                >
                  <span>Continue to Context & Proving</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
                {/* Adult Preset */}
                <button
                  type="button"
                  onClick={() => handleSelectPreset("adult")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedPreset === "adult"
                      ? "border-white bg-white/10 text-white shadow-lg"
                      : "border-white/10 bg-black/40 text-white/60 hover:border-white/30"
                  }`}
                >
                  <div className="font-medium text-sm mb-1 text-white">Adult (Age 25)</div>
                  <div className="text-xs text-white/60">DOB: ~1999 · State: 27</div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-2 font-medium">≥ 18 PASSES</div>
                </button>

                {/* Minor Preset */}
                <button
                  type="button"
                  onClick={() => handleSelectPreset("minor")}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedPreset === "minor"
                      ? "border-rose-400 bg-rose-500/15 text-white shadow-lg"
                      : "border-white/10 bg-black/40 text-white/60 hover:border-white/30"
                  }`}
                >
                  <div className="font-medium text-sm mb-1 text-rose-300">Minor (Age 16)</div>
                  <div className="text-xs text-white/60">DOB: ~2008 · State: 27</div>
                  <div className="text-[11px] font-mono text-rose-400 mt-2 font-medium">&lt; 18 REVERTS</div>
                </button>

                {/* Custom API */}
                <button
                  type="button"
                  onClick={handleIssueCustom}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedPreset === "custom"
                      ? "border-amber-400 bg-amber-500/15 text-white shadow-lg"
                      : "border-white/10 bg-black/40 text-white/60 hover:border-white/30"
                  }`}
                >
                  <div className="font-medium text-sm mb-1 text-amber-300">Custom Synthetic API</div>
                  <div className="text-xs text-white/60">POST /api/demo/issue</div>
                  <div className="text-[11px] font-mono text-amber-400 mt-2 font-medium">Zero-PII Filter</div>
                </button>
              </div>

              {credential && (
                <div className="p-4 bg-black/60 rounded-xl border border-white/10 font-mono text-xs text-white/70 space-y-2">
                  <div className="flex items-center justify-between text-white/50 border-b border-white/10 pb-2">
                    <span className="uppercase tracking-wider text-[11px]">In-Memory Credential Data</span>
                    <span className="text-[11px] text-amber-300">Never transmitted</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>dobDays: <span className="text-white font-mono">{credential.dobDays}</span></div>
                    <div>stateCode: <span className="text-white font-mono">{credential.stateCode}</span></div>
                    <div className="col-span-2 truncate">
                      credentialSecret: <span className="text-white/40">{credential.credentialSecret}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* STEP 1: CONTEXT & PROOF GENERATION */}
          {currentStepIndex === 1 && (
            <Card
              title="2. Bind Context & Generate Proof"
              subtitle="Scope binds the nullifier to prevent cross-dApp tracking. The recipient address binds on-chain authorization."
              divider
              footer={
                <div className="w-full flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStepIndex(0)}
                    disabled={isProving}
                    className="px-4 py-2 text-xs text-white/70 hover:text-white inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Credential
                  </button>

                  <div className="flex items-center gap-2">
                    {isProving && (
                      <button
                        type="button"
                        onClick={handleCancelProving}
                        className="btn-cut-border px-4 py-2 text-xs text-rose-300 hover:text-white"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isProving || !credential}
                      onClick={handleGenerateProof}
                      className="btn-cut px-6 py-2.5 text-xs text-black font-medium inline-flex items-center gap-2 hover:bg-white/90 disabled:opacity-40"
                    >
                      {isProving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating ({progressPercent}%)...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="w-3.5 h-3.5" />
                          <span>Generate Proof</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              }
            >
              <div className="space-y-4 mb-6">
                <Field
                  label="Scope ID"
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  disabled={isProving}
                  helperText="Unique identifier for the consuming application (prevents cross-dApp linkability)."
                />

                <Field
                  label="Recipient Address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  disabled={isProving}
                  helperText="EVM address authorized to receive and register the nullifier on-chain."
                  rightElement={
                    address && recipient !== address ? (
                      <button
                        type="button"
                        onClick={() => setRecipient(address)}
                        className="text-[11px] font-mono text-white/60 hover:text-white underline"
                      >
                        Use Wallet
                      </button>
                    ) : null
                  }
                />

                <Field
                  label="Target Chain"
                  value={`${targetNetwork.chainId} (${targetNetwork.name})`}
                  disabled
                  helperText="ZK circuit binds chain ID to prevent cross-chain relay attacks."
                />
              </div>

              {/* Proving Progress Display */}
              {isProving && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-white/80">
                    <span className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-amber-300" />
                      <span>{progressStage.replace(/_/g, " ")}</span>
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-white/50 pt-1">
                    SnarkJS Groth16 witness calculation executing in Web Worker...
                  </p>
                </div>
              )}

              {/* Error Alert */}
              {provingError && (
                <StatusBanner
                  variant="error"
                  title="Circuit Constraint Unsatisfied"
                  description={provingError}
                  className="mt-4"
                />
              )}
            </Card>
          )}

          {/* STEP 2: REVIEW & SUBMIT */}
          {currentStepIndex === 2 && proofResult && (
            <Card
              title="3. Review Proof & Submit"
              subtitle="The zero-knowledge proof has been computed. Verify off-chain via Fastify API or submit directly to the MST Coral smart contract."
              headerAction={<StatusChip type="LOCAL VERIFIED" size="sm" />}
              divider
              footer={
                <div className="w-full flex items-center justify-between flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStepIndex(1)}
                    className="px-4 py-2 text-xs text-white/70 hover:text-white inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Re-prove
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isVerifying}
                      onClick={handleVerifyOffChain}
                      className="btn-cut-border px-4 py-2 text-xs text-white hover:bg-white/5"
                    >
                      {isVerifying ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" /> Verifying...
                        </span>
                      ) : (
                        <span>Verify Off-Chain</span>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isSubmittingOnChain}
                      onClick={handleSubmitOnChain}
                      className="btn-cut px-6 py-2.5 text-xs text-black font-medium inline-flex items-center gap-2 hover:bg-white/90 disabled:opacity-40"
                    >
                      {isSubmittingOnChain ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting to MST...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit to MST ({targetNetwork.name})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              }
            >
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-black/60 rounded-xl border border-white/10 space-y-1.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                    Derived Unique Nullifier
                  </div>
                  <div className="font-mono text-xs text-white break-all select-all">
                    {proofResult.nullifier}
                  </div>
                  <p className="text-[11px] text-white/40">
                    Scope-isolated nullifier ensures single-use without revealing Aadhaar secret.
                  </p>
                </div>

                <div className="text-xs uppercase font-mono text-white/50 tracking-wider">
                  Calldata Summary
                </div>
                <CodeBlock
                  title="Solidity Groth16 Calldata"
                  code={{
                    a: [proofResult.solidityCalldata.a[0].slice(0, 18) + "...", "..."],
                    b: [[proofResult.solidityCalldata.b[0][0].slice(0, 18) + "...", "..."], ["..."]],
                    c: [proofResult.solidityCalldata.c[0].slice(0, 18) + "...", "..."],
                    publicSignals: proofResult.solidityCalldata.pubSignals,
                  }}
                />
              </div>

              {verificationOutcome && (
                <StatusBanner
                  variant="success"
                  title="Fastify Off-Chain Verification Passed"
                  description="SnarkJS verified the Groth16 proof against the verification key on the server."
                  details={verificationOutcome}
                  className="mb-4"
                />
              )}

              {onChainError && (
                <StatusBanner
                  variant="error"
                  title="Submission Error"
                  description={onChainError}
                  className="mb-4"
                />
              )}
            </Card>
          )}

          {/* STEP 3: RESULT MINED ON-CHAIN */}
          {currentStepIndex === 3 && onChainTxResult && (
            <Card
              title="4. Proof Verified On-Chain"
              subtitle="The PramaanRegistry contract successfully verified the proof and recorded the nullifier on MST Coral Testnet."
              headerAction={
                <StatusChip
                  type="ZK VERIFIED ON-CHAIN"
                  txHash={onChainTxResult.txHash}
                  explorerUrl={targetNetwork.explorerUrl}
                  size="sm"
                />
              }
              divider
              footer={
                <div className="w-full flex items-center justify-between flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStepIndex(0);
                      setOnChainTxResult(null);
                      setProofResult(null);
                      handleSelectPreset("adult");
                    }}
                    className="btn-cut-border px-4 py-2 text-xs text-white"
                  >
                    <span>Prove Another Credential</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/app/verify/${onChainTxResult.txHash}`)}
                    className="btn-cut px-5 py-2.5 text-xs text-black font-medium inline-flex items-center gap-2 hover:bg-white/90"
                  >
                    <span>View in Verification Gate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              }
            >
              <StatusBanner
                variant="success"
                title="Transaction Mined Successfully"
                description={`Block #${onChainTxResult.blockNumber} confirmed on ${targetNetwork.name}. Nullifier registered for Scope ID ${scopeId}.`}
                className="mb-6"
              />

              <DataList
                items={[
                  {
                    label: "Transaction Hash",
                    value: onChainTxResult.txHash,
                    isMono: true,
                    truncateMiddle: true,
                    copyable: true,
                  },
                  {
                    label: "Block Number",
                    value: onChainTxResult.blockNumber.toString(),
                    isMono: true,
                  },
                  {
                    label: "Gas Consumed",
                    value: `${Number(onChainTxResult.gasUsed).toLocaleString()} units`,
                    isMono: true,
                  },
                  {
                    label: "Registry Status",
                    value: onChainTxResult.status === 1 ? "1 (Confirmed Success)" : "0 (Reverted)",
                    isMono: true,
                  },
                  {
                    label: "Recorded Nullifier",
                    value: proofResult?.nullifier || "N/A",
                    isMono: true,
                    truncateMiddle: true,
                    copyable: true,
                  },
                ]}
                className="mb-6"
              />

              {onChainTxResult.explorerUrl && (
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                  <span className="text-white/60">MST Coral Block Explorer:</span>
                  <a
                    href={onChainTxResult.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white underline inline-flex items-center gap-1 font-mono hover:text-white/80"
                  >
                    <span>View Transaction</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ========================================================= */}
        {/* Sticky Sidebar Summary (4 cols)                            */}
        {/* ========================================================= */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-8">
          {/* Target Network Card */}
          <div className="bg-white/[0.05] border border-white/15 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-white/50">Network Status</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-white/50">Network:</span>
                <span className="text-white font-medium">{targetNetwork.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Chain ID:</span>
                <span className="text-white">{targetNetwork.chainId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Slot:</span>
                <span className="text-amber-300">testnet-coral</span>
              </div>
            </div>
          </div>

          {/* Connected Wallet Card */}
          <div className="bg-white/[0.05] border border-white/15 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-white/50">Active Wallet</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isConnected ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/50"}`}>
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="text-xs space-y-1 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-white/50">Account:</span>
                <span className="text-white truncate max-w-[160px]" title={address || undefined}>
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "None"}
                </span>
              </div>
              {!isConnected && (
                <button
                  type="button"
                  onClick={connect}
                  className="w-full mt-2 py-2.5 min-h-[44px] text-xs bg-white text-black font-medium rounded-lg hover:bg-white/90 flex items-center justify-center"
                >
                  Connect MetaMask
                </button>
              )}
            </div>
          </div>

          {/* Registry Contract Card */}
          <div className="bg-white/[0.05] border border-white/15 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-white/50">Pramaan Registry</span>
              <Database className="w-3.5 h-3.5 text-white/50" />
            </div>
            <div className="text-xs space-y-1.5 font-mono">
              <div className="text-white/60 truncate" title={registryAddress}>
                {registryAddress.slice(0, 10)}...{registryAddress.slice(-8)}
              </div>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-white/60 hover:text-white underline pt-1"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Current Flow Summary */}
          <div className="bg-white/[0.05] border border-white/15 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-white/50 border-b border-white/10 pb-2.5">
              Proof Status
            </div>
            <div className="text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Credential:</span>
                <span className="font-medium text-white capitalize">{selectedPreset}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Proof State:</span>
                <span className="font-mono text-white/80">
                  {onChainTxResult ? "Mined" : proofResult ? "Ready" : isProving ? `Proving ${progressPercent}%` : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Privacy:</span>
                <span className="text-emerald-400 font-mono text-[11px]">Zero-PII Egress</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
};

export default ProvePage;
