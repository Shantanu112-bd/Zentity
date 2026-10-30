/**
 * frontend/src/components/ProverView.tsx
 * 
 * 3-Stage Zero-Knowledge Prover Studio
 * 1. Testnet Credential Attestation -> 2. Local WASM Groth16 Prover -> 3. On-Chain Settlement
 */

import React, { useState, useRef } from "react";
import {
  Key,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Shield,
  RotateCcw,
  Clock,
  Sparkles,
} from "lucide-react";
import { useWallet, useNetwork, useDapp, protocolService, DEFAULT_CORAL } from "../core";

export function ProverView() {
  const { address, isConnected, chainId, connect } = useWallet();
  const { targetNetwork, isCorrectNetwork, switchNetwork } = useNetwork(chainId);
  const { credential, setCredential, proof, setProof, latestTx, setLatestTx, addToRegistryCache, resetPipeline } = useDapp();

  // Stage 1 State
  const [scopeId, setScopeId] = useState("1");
  const [dob, setDob] = useState("2000-01-01");
  const [isRequestingCred, setIsRequestingCred] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);

  // Stage 2 State
  const [minAge, setMinAge] = useState(18);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [proofProgress, setProofProgress] = useState(0);
  const [proofStage, setProofStage] = useState("idle");
  const [proofError, setProofError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Stage 3 State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<"idle" | "simulating" | "signing" | "mining" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 1. Request Credential
  const handleRequestCredential = async () => {
    setCredError(null);
    setIsRequestingCred(true);

    try {
      const cred = await protocolService.requestCredential(
        address || "0x0000000000000000000000000000000000000000",
        BigInt(scopeId || "1"),
        dob
      );
      setCredential(cred);
    } catch (err: any) {
      setCredError(err.message || "Failed to request credential");
    } finally {
      setIsRequestingCred(false);
    }
  };

  // 2. Generate Proof
  const handleGenerateProof = async () => {
    if (!credential) return;
    setProofError(null);
    setIsGeneratingProof(true);
    setProofProgress(10);
    setProofStage("Initializing BN254 WASM runtime...");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (!credential || !credential.credentialSecret) {
        throw new Error(
          "Credential secret is missing from session state. Please request a new attestation in Step 1 before synthesizing a proof. (Nullifiers must never be mutated silently)."
        );
      }

      const recipient = (address as `0x${string}`) || "0x0000000000000000000000000000000000000001";
      const proofPayload = await protocolService.generateProof(
        credential,
        recipient,
        targetNetwork.chainId,
        {
          scopeId: BigInt(scopeId || "1"),
          minAge,
          signal: controller.signal,
          onProgress: ({ percentage, step }) => {
            setProofProgress(percentage);
            setProofStage(step);
          },
        }
      );

      setProof(proofPayload);
      setProofProgress(100);
      setProofStage("Proof synthesis complete");
    } catch (err: any) {
      setProofError(err.message || "Proof generation failed");
    } finally {
      setIsGeneratingProof(false);
      abortControllerRef.current = null;
    }
  };

  // 3. Submit On-Chain
  const handleSubmitOnChain = async () => {
    if (!proof) return;
    setSubmitError(null);
    setIsSubmitting(true);
    setSubmitStage("simulating");

    try {
      setSubmitStage("signing");
      const txResult = await protocolService.submitVerifyAndRecord(
        proof,
        targetNetwork.registryAddress,
        targetNetwork
      );

      setLatestTx(txResult);
      setSubmitStage("success");

      // Update registry cache automatically
      addToRegistryCache({
        scopeId: proof.scopeId.toString(),
        nullifier: proof.nullifier.toString(),
        isSpent: true,
      });
    } catch (err: any) {
      setSubmitStage("error");
      setSubmitError(err.shortMessage || err.message || "On-chain verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    resetPipeline();
    setProofProgress(0);
    setProofStage("idle");
    setSubmitStage("idle");
    setCredError(null);
    setProofError(null);
    setSubmitError(null);
  };

  return (
    <div className="space-y-6 animate-blur-fade-up">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Cpu size={22} className="text-white" />
            <span>Prover Studio</span>
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Complete 3-step proof lifecycle: Credential Attestation → Local Proof Synthesis → On-chain Settlement
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="liquid-glass px-3.5 py-1.5 rounded-full text-xs text-white/60 hover:text-white flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <RotateCcw size={12} />
          <span>Reset Pipeline</span>
        </button>
      </div>

      {/* 3-Step Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Credential Attestation */}
        <div className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/40">Step 01 / Attestation</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                credential ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white/60"
              }`}>
                {credential ? "Attested" : "Pending"}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key size={16} />
                <span>Testnet Credential</span>
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Testnet issuer signs your self-provided date of birth using BabyJubjub EdDSA. Contains zero real Aadhaar PII.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1">Scope / Application ID</label>
                <input
                  type="text"
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full liquid-glass rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full liquid-glass rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/60 font-mono space-y-1">
                <div className="flex justify-between">
                  <span>Subject Address:</span>
                  <span className="truncate max-w-[120px] text-white">
                    {address ? address.slice(0, 6) + "..." + address.slice(-4) : "Not connected"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Signature Scheme:</span>
                  <span className="text-white">BabyJubjub EdDSA</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6">
            {credError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{credError}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isRequestingCred}
              onClick={handleRequestCredential}
              className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                credential
                  ? "bg-white/10 text-emerald-300 border border-emerald-500/30"
                  : "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/5"
              }`}
            >
              {isRequestingCred ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Requesting Attestation...</span>
                </>
              ) : credential ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Credential Attested</span>
                </>
              ) : (
                <span>Request Attestation</span>
              )}
            </button>
          </div>
        </div>

        {/* Step 2: Local Zero-Knowledge Prover */}
        <div className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/40">Step 02 / Local WASM</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                proof ? "bg-emerald-500/20 text-emerald-300" : isGeneratingProof ? "bg-amber-500/20 text-amber-300 animate-pulse" : "bg-white/10 text-white/60"
              }`}>
                {proof ? "Proof Ready" : isGeneratingProof ? "Synthesizing" : "Standby"}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu size={16} />
                <span>Client-Side Groth16</span>
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Zero-knowledge witness calculation runs entirely in browser. Private credential never leaves local memory.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1">Required Minimum Age</label>
                <input
                  type="number"
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                  min={1}
                  max={120}
                  className="w-full liquid-glass rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/60 font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span>Curve / Scheme:</span>
                  <span className="text-white">BN254 Groth16</span>
                </div>
                <div className="flex justify-between">
                  <span>R1CS Constraints:</span>
                  <span className="text-white">5,014</span>
                </div>
                {proof && (
                  <div className="flex justify-between border-t border-white/10 pt-1.5">
                    <span>Synthesis Time:</span>
                    <span className="text-emerald-400 font-bold">{proof.durationMs} ms</span>
                  </div>
                )}
              </div>

              {isGeneratingProof && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10px] font-mono text-white/60">
                    <span>{proofStage}</span>
                    <span>{proofProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300 rounded-full"
                      style={{ width: `${proofProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6">
            {proofError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{proofError}</span>
              </div>
            )}

            <button
              type="button"
              disabled={!credential || isGeneratingProof}
              onClick={handleGenerateProof}
              className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                !credential
                  ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                  : proof
                  ? "bg-white/10 text-emerald-300 border border-emerald-500/30"
                  : "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/5"
              }`}
            >
              {isGeneratingProof ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Synthesizing ({proofProgress}%)...</span>
                </>
              ) : proof ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Regenerate Proof</span>
                </>
              ) : (
                <span>Synthesize ZK Proof</span>
              )}
            </button>
          </div>
        </div>

        {/* Step 3: On-Chain Settlement */}
        <div className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/40">Step 03 / Coral Settlement</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                latestTx?.status === "success"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : isSubmitting
                  ? "bg-amber-500/20 text-amber-300 animate-pulse"
                  : "bg-white/10 text-white/60"
              }`}>
                {latestTx?.status === "success" ? "Recorded" : isSubmitting ? "Broadcasting" : "Awaiting Proof"}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers size={16} />
                <span>On-Chain Recording</span>
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Calls <code className="text-white/80">verifyAndRecord</code> on PramaanRegistry. Permanently records nullifier to prevent double-spending.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/60 font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span className="text-white">{targetNetwork.name} ({targetNetwork.chainId})</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Contract:</span>
                  <span className="text-white truncate max-w-[140px]">{targetNetwork.registryAddress}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-1.5">
                  <span>Derived Nullifier:</span>
                  <span className="text-white truncate max-w-[140px]">
                    {proof ? proof.nullifier.toString() : "Not synthesized"}
                  </span>
                </div>
              </div>

              {isSubmitting && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>
                    {submitStage === "simulating" && "Running preflight simulation..."}
                    {submitStage === "signing" && "Awaiting wallet signature..."}
                    {submitStage === "mining" && "Mining transaction on Coral..."}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6">
            {submitError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span className="truncate">{submitError}</span>
              </div>
            )}

            {!isConnected ? (
              <button
                type="button"
                onClick={connect}
                className="w-full bg-white text-black font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-white/90 transition-all"
              >
                Connect Wallet First
              </button>
            ) : !isCorrectNetwork ? (
              <button
                type="button"
                onClick={switchNetwork}
                className="w-full bg-amber-500/20 text-amber-300 border border-amber-500/40 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-500/30 transition-all"
              >
                Switch to Coral Testnet
              </button>
            ) : (
              <button
                type="button"
                disabled={!proof || isSubmitting}
                onClick={handleSubmitOnChain}
                className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  !proof
                    ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                    : latestTx?.status === "success"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/5"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : latestTx?.status === "success" ? (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Settled on Coral</span>
                  </>
                ) : (
                  <span>Submit to PramaanRegistry</span>
                )}
              </button>
            )}

            {latestTx?.status === "success" && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Tx Confirmed</span>
                  <a
                    href={latestTx.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 underline text-white hover:text-emerald-200"
                  >
                    <span>Explorer</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <div className="text-[10px] font-mono truncate text-white/70">{latestTx.txHash}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

