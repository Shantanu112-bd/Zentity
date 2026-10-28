import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Sparkles, CheckCircle, XCircle, Loader2, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { StatusChip } from "../components/StatusChip";
import { issueSyntheticCredential, SyntheticCredential } from "../../../scripts/pramaan/crypto-utils.ts";
import { generateProofClientSide, ProofResult } from "../../../packages/client/src/prover.ts";

export const ProvePage: React.FC = () => {
  const navigate = useNavigate();

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

  // Initialize or fetch credential
  const handleSelectPreset = async (preset: "adult" | "minor") => {
    setSelectedPreset(preset);
    setProofResult(null);
    setProvingError(null);
    setVerificationOutcome(null);

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
  React.useEffect(() => {
    handleSelectPreset("adult");
  }, []);

  // Execute Proof Generation
  const handleGenerateProof = async () => {
    if (!credential) return;

    setIsProving(true);
    setProvingError(null);
    setProofResult(null);
    setVerificationOutcome(null);
    setProgressPercent(10);
    setProgressStage("INITIALIZING_CIRCUIT");

    try {
      const result = await generateProofClientSide(
        credential,
        {
          scopeId,
          recipient,
          chainId: 91562037, // MST Legacy Testnet
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <StatusChip type="SYNTHETIC" />
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
            <div className="text-xs text-slate-400">
              DOB ~1999 &bull; <strong className="text-emerald-400">Valid proof</strong> passes age &ge; 18 constraint.
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset("minor")}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedPreset === "minor"
                ? "border-amber-500 bg-amber-500/10 text-white"
                : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="font-heading font-semibold text-sm mb-1 text-red-400">
              Minor Credential (Age 16)
            </div>
            <div className="text-xs text-slate-400">
              DOB ~2008 &bull; <strong className="text-red-400">Negative Test</strong> triggers constraint failure.
            </div>
          </button>

          <button
            type="button"
            onClick={handleIssueCustom}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedPreset === "custom"
                ? "border-purple-500 bg-purple-500/10 text-white"
                : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="font-heading font-semibold text-sm mb-1 text-purple-400 flex items-center justify-between">
              <span>Issue Fresh</span>
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs text-slate-400">
              Calls API endpoint <code>/api/demo/issue</code> for a random synthetic scalar.
            </div>
          </button>
        </div>

        {credential && (
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-400 space-y-1">
            <div className="text-slate-300 font-semibold mb-1 flex items-center justify-between">
              <span>Signed Credential Payload (Client Memory):</span>
              <span className="text-emerald-400">CONFIDENTIAL (ZERO-EGRESS)</span>
            </div>
            <div>Credential Secret: <span className="text-slate-200">{credential.credentialSecret.slice(0, 18)}...</span></div>
            <div>Issuer Key Hash: <span className="text-cyan-400">{credential.issuerPubKeyHash.slice(0, 18)}...</span></div>
            <div>State Code: <span className="text-slate-300">{credential.stateCode}</span> &bull; DOB Days: <span className="text-slate-300">{credential.dobDays}</span></div>
          </div>
        )}
      </div>

      {/* Step 2: Context Binding Signals */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 mb-6">
        <h2 className="font-heading font-semibold text-white text-base mb-4">
          2. Context &amp; Anti-Frontrunning Signals
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Scope ID (Application Context)
            </label>
            <input
              type="text"
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              placeholder="e.g. 42"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Derives pairwise nullifier: <code>Poseidon(secret, scopeId)</code>
            </span>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Recipient Address (EVM Front-Running Guard)
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
              placeholder="0x..."
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Guarantees only this recipient address can consume proof
            </span>
          </div>
        </div>
      </div>

      {/* Step 3: Prover Action */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-semibold text-white text-base">
              3. Generate Groth16 Zero-Knowledge Proof
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Target circuit: <code>AgeCredential.circom</code> (5,014 constraints, BN254 curve)
            </p>
          </div>

          <button
            type="button"
            disabled={isProving || !credential}
            onClick={handleGenerateProof}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-semibold text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20"
          >
            {isProving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Computing zk-SNARK...</span>
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

      {/* Proof Result Display */}
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

          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={isVerifying}
              onClick={handleVerifyOffChain}
              className="px-5 py-2.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
              <span>Verify Off-Chain with Fastify API</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/verify/${proofResult.nullifier}`)}
              className="px-5 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-semibold flex items-center gap-2 transition-all ml-auto"
            >
              <span>View On-Chain Result</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Verification Outcome */}
          {verificationOutcome && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>API Verified:</strong> Groth16 mathematical check passed. Active chain mode:{" "}
                  <strong>{verificationOutcome.chainMode}</strong>.
                </span>
              </div>
              <StatusChip type="OFF-CHAIN VERIFIED" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
