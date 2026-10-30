/**
 * frontend/src/components/AppWorkspace.tsx
 * 
 * Liquid-Glass Connected Application Workspace
 * Hosts Prover, Verifier, and Registry modules wired to real core Web3 hooks.
 */

import React, { useState, useEffect } from "react";
import {
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  Copy,
  Database,
  Lock,
  Cpu,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  useWallet,
  useNetwork,
  useRegistry,
  useIssuer,
  useProver,
  useSubmitProof,
  useTxResult,
  api,
  DEFAULT_CORAL,
  formatCalldataForRegistry,
  Groth16ProofCalldata,
} from "../core";

interface AppWorkspaceProps {
  onBackToLanding: () => void;
}

type ActiveTab = "prover" | "verifier" | "registry";

export function AppWorkspace({ onBackToLanding }: AppWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("prover");

  // Web3 Hooks
  const { address, isConnected, isConnecting, connect, disconnect, chainId } = useWallet();
  const { targetNetwork, isCorrectNetwork, switchNetwork } = useNetwork(chainId);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white/20">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBackToLanding}
              className="liquid-glass px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium text-white/80 hover:text-white transition-colors"
              title="Return to cinematic hero"
            >
              <ArrowLeft size={14} />
              <span>Back to Hero</span>
            </button>

            <div className="h-4 w-px bg-white/20" />

            <div className="flex items-center gap-2">
              <Shield size={18} className="text-white" />
              <span className="font-semibold tracking-wider text-sm">PRAMAAN-ZK</span>
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
                Workspace
              </span>
            </div>
          </div>

          {/* Network & Wallet Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
              <span className={`w-2 h-2 rounded-full ${isCorrectNetwork ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span>{targetNetwork.name}</span>
              <span className="text-white/40">({targetNetwork.chainId})</span>
            </div>

            {!isConnected ? (
              <button
                type="button"
                onClick={connect}
                disabled={isConnecting}
                className="liquid-glass px-4 py-1.5 rounded-full text-xs font-medium text-white hover:text-white/90 border border-white/20"
                data-testid="wallet-connect-btn"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            ) : !isCorrectNetwork ? (
              <button
                type="button"
                onClick={switchNetwork}
                className="px-4 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
                data-testid="switch-network-btn"
              >
                Switch to Coral
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="liquid-glass px-3 py-1 rounded-full text-xs font-mono text-white/80 border border-white/15">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
                </div>
                <button
                  type="button"
                  onClick={disconnect}
                  className="px-2.5 py-1 rounded-full text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  title="Disconnect wallet"
                  data-testid="wallet-disconnect-btn"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Workspace Tab Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("prover")}
              className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-medium transition-all ${
                activeTab === "prover"
                  ? "bg-white text-black font-semibold shadow-lg shadow-white/10"
                  : "liquid-glass text-white/70 hover:text-white"
              }`}
            >
              ZK Prover Gate
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("verifier")}
              className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-medium transition-all ${
                activeTab === "verifier"
                  ? "bg-white text-black font-semibold shadow-lg shadow-white/10"
                  : "liquid-glass text-white/70 hover:text-white"
              }`}
            >
              Receipt Verifier
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("registry")}
              className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-medium transition-all ${
                activeTab === "registry"
                  ? "bg-white text-black font-semibold shadow-lg shadow-white/10"
                  : "liquid-glass text-white/70 hover:text-white"
              }`}
            >
              Registry & Sybil Explorer
            </button>
          </div>

          <div className="text-xs text-white/40 hidden md:block font-mono">
            ZK-SNARK BN254 Groth16 · 5,014 Constraints
          </div>
        </div>

        {/* Tab Content Panels */}
        {activeTab === "prover" && (
          <ProverTab
            address={address}
            isConnected={isConnected}
            isCorrectNetwork={isCorrectNetwork}
            targetNetwork={targetNetwork}
            connect={connect}
            switchNetwork={switchNetwork}
          />
        )}

        {activeTab === "verifier" && <VerifierTab targetNetwork={targetNetwork} />}

        {activeTab === "registry" && <RegistryTab targetNetwork={targetNetwork} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40 bg-black">
        <p>
          Pramaan-ZK Privacy Protocol · Zero-Egress Proofs on MST Coral Testnet ({targetNetwork.chainId}) · Testnet Issuer (Self-Attested, No Identity Verification)
        </p>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PROVER TAB                                                                 */
/* -------------------------------------------------------------------------- */

export function ProverTab({
  address,
  isConnected,
  isCorrectNetwork,
  targetNetwork,
  connect,
  switchNetwork,
}: any) {
  // Step 1: Credential Issue
  const [dob, setDob] = useState("2000-01-01");
  const { issueCredential, credential, isIssuing, error: issueError } = useIssuer();

  // Step 2: Client ZK Prover
  const { generateProof, isGenerating, progress, status, error: proverError, output: proofOutput } = useProver();

  // Step 3: On-Chain Submit
  const { submitProof, isSubmitting, error: submitError, txResult, reset: resetSubmit } = useSubmitProof();

  // Scope & minimum age
  const [minAge, setMinAge] = useState(18);
  const [scopeId, setScopeId] = useState("1");

  const handleIssue = async () => {
    try {
      await issueCredential(dob);
    } catch (_) {}
  };

  const handleGenerate = async () => {
    if (!credential) return;
    try {
      const recipientAddr = (address as `0x${string}`) || "0x0000000000000000000000000000000000000001";
      await generateProof(credential, {
        scopeId: BigInt(scopeId || "1"),
        minAge,
        recipient: recipientAddr,
        chainId: targetNetwork.chainId,
      });
    } catch (_) {}
  };

  const handleSubmitOnChain = async () => {
    if (!proofOutput || !address) return;
    try {
      const calldata = formatCalldataForRegistry(proofOutput.calldata);
      await submitProof(targetNetwork.registryAddress, targetNetwork, address, calldata);
    } catch (_) {}
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Step 1: Credential Issuance */}
      <div className="liquid-glass rounded-2xl p-6 flex flex-col justify-between border border-white/10">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-widest text-white/50 font-mono">Stage 01</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">Testnet Issuer</span>
          </div>

          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Key size={18} />
            Attest Birthdate
          </h3>
          <p className="text-xs text-white/60 mb-4 leading-relaxed">
            Testnet issuer signs your self-provided birthdate with EdDSA BabyJubjub. Contains zero real Aadhaar PII.
          </p>

          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-[11px] text-white/60 mb-1 uppercase tracking-wider">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-[11px] text-white/60 mb-1 uppercase tracking-wider">Scope / App ID</label>
              <input
                type="text"
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/40"
              />
            </div>
          </div>
        </div>

        <div>
          {issueError && (
            <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{issueError}</span>
            </div>
          )}

          <button
            type="button"
            disabled={isIssuing}
            onClick={handleIssue}
            className="w-full liquid-glass py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            {isIssuing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Signing Credential...</span>
              </>
            ) : credential ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Credential Ready</span>
              </>
            ) : (
              <span>Request Testnet Credential</span>
            )}
          </button>
        </div>
      </div>

      {/* Step 2: In-Browser ZK Proof */}
      <div className="liquid-glass rounded-2xl p-6 flex flex-col justify-between border border-white/10">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-widest text-white/50 font-mono">Stage 02</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">Zero-Egress</span>
          </div>

          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Cpu size={18} />
            Generate ZK Proof
          </h3>
          <p className="text-xs text-white/60 mb-4 leading-relaxed">
            Witness calculation & Groth16 proof run 100% locally in your browser. No birthdate or witness leaves your device.
          </p>

          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-[11px] text-white/60 mb-1 uppercase tracking-wider">Required Minimum Age</label>
              <input
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value))}
                min={1}
                max={120}
                className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
              />
            </div>

            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs space-y-1 font-mono text-white/70">
              <div className="flex justify-between">
                <span>Curve:</span>
                <span className="text-white">BN254</span>
              </div>
              <div className="flex justify-between">
                <span>Constraints:</span>
                <span className="text-white">5,014</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-white capitalize">{status}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          {proverError && (
            <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{proverError}</span>
            </div>
          )}

          <button
            type="button"
            disabled={!credential || isGenerating}
            onClick={handleGenerate}
            className={`w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
              !credential
                ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                : "liquid-glass hover:bg-white/10 text-white"
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Proving ({progress}%)...</span>
              </>
            ) : proofOutput ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Proof Ready ({proofOutput.durationMs}ms)</span>
              </>
            ) : (
              <span>Compute Groth16 Proof</span>
            )}
          </button>
        </div>
      </div>

      {/* Step 3: On-Chain Record */}
      <div className="liquid-glass rounded-2xl p-6 flex flex-col justify-between border border-white/10">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-widest text-white/50 font-mono">Stage 03</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">On-Chain</span>
          </div>

          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Layers size={18} />
            Verify & Record
          </h3>
          <p className="text-xs text-white/60 mb-4 leading-relaxed">
            Submits proof calldata to <code className="text-white/80">PramaanRegistry.sol</code> on MST Coral Testnet.
          </p>

          <div className="space-y-3 mb-6">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs space-y-1 font-mono text-white/70">
              <div className="flex justify-between">
                <span>Network:</span>
                <span className="text-white">{targetNetwork.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Chain ID:</span>
                <span className="text-white">{targetNetwork.chainId}</span>
              </div>
              <div className="flex justify-between">
                <span>Nullifier:</span>
                <span className="text-white truncate max-w-[140px]">
                  {proofOutput ? proofOutput.nullifier.slice(0, 10) + "..." : "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          {submitError && (
            <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={14} />
              <span className="truncate">{submitError}</span>
            </div>
          )}

          {!isConnected ? (
            <button
              type="button"
              onClick={connect}
              className="w-full liquid-glass py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors"
            >
              Connect Wallet
            </button>
          ) : !isCorrectNetwork ? (
            <button
              type="button"
              onClick={switchNetwork}
              className="w-full bg-amber-500/20 text-amber-300 border border-amber-500/40 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-amber-500/30 transition-colors"
            >
              Switch to Coral
            </button>
          ) : (
            <button
              type="button"
              disabled={!proofOutput || isSubmitting}
              onClick={handleSubmitOnChain}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                !proofOutput
                  ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                  : "bg-white text-black font-bold hover:bg-white/90 shadow-lg shadow-white/10"
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Submitting Transaction...</span>
                </>
              ) : txResult ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Recorded Successfully</span>
                </>
              ) : (
                <span>Submit to Coral Registry</span>
              )}
            </button>
          )}

          {txResult && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">Tx Confirmed</span>
                <a
                  href={txResult.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 underline text-emerald-300 hover:text-white"
                >
                  <span>View on Explorer</span>
                  <ExternalLink size={12} />
                </a>
              </div>
              <p className="font-mono text-[10px] truncate text-white/70">{txResult.txHash}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* VERIFIER TAB                                                               */
/* -------------------------------------------------------------------------- */

export function VerifierTab({ targetNetwork }: any) {
  const [txHash, setTxHash] = useState("");
  const { fetchReceipt, isLoading, error, txResult, reset } = useTxResult();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash.trim()) return;
    try {
      await fetchReceipt(txHash.trim() as `0x${string}`, targetNetwork);
    } catch (_) {}
  };

  return (
    <div className="max-w-2xl mx-auto w-full liquid-glass rounded-2xl p-6 sm:p-8 border border-white/10">
      <div className="flex items-center gap-3 mb-2">
        <CheckCircle2 size={22} className="text-white" />
        <h3 className="text-xl font-semibold text-white">Receipt & Event Auditor</h3>
      </div>
      <p className="text-xs text-white/60 mb-6 leading-relaxed">
        Verify any transaction receipt on MST Coral Testnet. Decodes the on-chain <code className="text-white/80">ProofVerifiedAndRecorded</code> event and parameters.
      </p>

      <form onSubmit={handleVerify} className="space-y-4 mb-6">
        <div>
          <label className="block text-[11px] text-white/60 mb-1 uppercase tracking-wider">Transaction Hash</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="0x..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="flex-1 bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/40"
            />
            <button
              type="submit"
              disabled={isLoading || !txHash.trim()}
              className="liquid-glass px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              {isLoading ? <RefreshCw size={14} className="animate-spin" /> : "Audit"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 mb-6">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {txResult && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-white/60">Execution Status</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] uppercase tracking-wider">
              {txResult.status}
            </span>
          </div>

          <div className="space-y-2 text-white/80">
            <div className="flex justify-between">
              <span className="text-white/40">Block Number:</span>
              <span>{txResult.blockNumber.toString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Gas Consumed:</span>
              <span>{txResult.gasUsed.toString()} units</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/40">Explorer:</span>
              <a
                href={txResult.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="text-white underline flex items-center gap-1 hover:text-white/80"
              >
                <span>View Transaction</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {txResult.event && (
            <div className="border-t border-white/10 pt-3 space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-white/50 mb-1">Decoded Event</div>
              <div className="flex justify-between">
                <span className="text-white/40">Event Name:</span>
                <span className="text-emerald-400">{txResult.event.eventName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Scope ID:</span>
                <span>{txResult.event.args.scopeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Nullifier:</span>
                <span className="truncate max-w-[200px]">{txResult.event.args.nullifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Recipient:</span>
                <span className="truncate max-w-[200px]">{txResult.event.args.recipient}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* REGISTRY & SYBIL EXPLORER                                                  */
/* -------------------------------------------------------------------------- */

export function RegistryTab({ targetNetwork }: any) {
  const { isNullifierSpent, isIssuerRegistered, isRegistryPaused, isLoading } = useRegistry(targetNetwork);

  const [scopeId, setScopeId] = useState("1");
  const [nullifier, setNullifier] = useState("");
  const [nullifierStatus, setNullifierStatus] = useState<boolean | null>(null);

  const [issuerKeyHash, setIssuerKeyHash] = useState("");
  const [issuerStatus, setIssuerStatus] = useState<boolean | null>(null);

  const [paused, setPaused] = useState<boolean | null>(null);

  useEffect(() => {
    isRegistryPaused().then(setPaused).catch(() => {});
  }, [isRegistryPaused]);

  const checkNullifier = async () => {
    if (!nullifier.trim()) return;
    try {
      const spent = await isNullifierSpent(BigInt(scopeId || "1"), BigInt(nullifier.trim()));
      setNullifierStatus(spent);
    } catch (_) {}
  };

  const checkIssuer = async () => {
    if (!issuerKeyHash.trim()) return;
    try {
      const registered = await isIssuerRegistered(BigInt(issuerKeyHash.trim()));
      setIssuerStatus(registered);
    } catch (_) {}
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Nullifier Sybil Protection Query */}
      <div className="liquid-glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <Database size={20} className="text-white" />
          <h3 className="text-lg font-semibold text-white">Nullifier Sybil Protection</h3>
        </div>
        <p className="text-xs text-white/60 mb-6 leading-relaxed">
          Check if a zero-knowledge nullifier has already been recorded for a specific scope. Spent nullifiers are permanently rejected by the contract.
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[11px] text-white/60 mb-1 uppercase tracking-wider">Scope ID</label>
            <input
              type="text"
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/40"
            />
          </div>

          <div>
            <label className="block text-[11px] text-white/60 mb-1 uppercase tracking-wider">Nullifier (uint256 decimal)</label>
            <input
              type="text"
              placeholder="e.g. 19482937583920..."
              value={nullifier}
              onChange={(e) => setNullifier(e.target.value)}
              className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/40"
            />
          </div>

          <button
            type="button"
            disabled={isLoading || !nullifier.trim()}
            onClick={checkNullifier}
            className="w-full liquid-glass py-2 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors"
          >
            {isLoading ? "Querying State..." : "Check Nullifier State"}
          </button>
        </div>

        {nullifierStatus !== null && (
          <div
            className={`p-4 rounded-xl border text-xs font-mono flex items-center justify-between ${
              nullifierStatus
                ? "bg-red-500/10 border-red-500/30 text-red-300"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            }`}
          >
            <span>Nullifier Status:</span>
            <span className="font-bold tracking-wider uppercase">
              {nullifierStatus ? "SPENT (Replay Blocked)" : "UNSPENT (Valid for Use)"}
            </span>
          </div>
        )}
      </div>

      {/* Contract & Issuer Governance */}
      <div className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Lock size={20} className="text-white" />
            <h3 className="text-lg font-semibold text-white">Registry Governance</h3>
          </div>
          <p className="text-xs text-white/60 mb-6 leading-relaxed">
            Live contract health and registered credential authority verification on PramaanRegistry.
          </p>

          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-white/40">Registry Contract:</span>
                <a
                  href={`${targetNetwork.explorerUrl}/address/${targetNetwork.registryAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white underline truncate max-w-[170px]"
                >
                  {targetNetwork.registryAddress}
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/40">Circuit Breaker (Paused):</span>
                <span className={paused ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                  {paused === null ? "Loading..." : paused ? "PAUSED" : "ACTIVE (Operational)"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-white/60 mb-1 uppercase tracking-wider">
                Issuer Key Hash (uint256 decimal)
              </label>
              <input
                type="text"
                placeholder="e.g. 8472918475920..."
                value={issuerKeyHash}
                onChange={(e) => setIssuerKeyHash(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white/40"
              />
            </div>

            <button
              type="button"
              disabled={isLoading || !issuerKeyHash.trim()}
              onClick={checkIssuer}
              className="w-full liquid-glass py-2 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors"
            >
              {isLoading ? "Querying..." : "Verify Issuer Authority"}
            </button>
          </div>
        </div>

        {issuerStatus !== null && (
          <div
            className={`p-4 rounded-xl border text-xs font-mono flex items-center justify-between ${
              issuerStatus
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            <span>Issuer Authorization:</span>
            <span className="font-bold tracking-wider uppercase">
              {issuerStatus ? "REGISTERED (Trusted)" : "UNREGISTERED"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

