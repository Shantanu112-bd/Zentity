/**
 * frontend/src/components/RegistryView.tsx
 * 
 * Live Interactive Registry & Sybil Explorer
 * Real-time on-chain queries for nullifier spent status and issuer authority.
 */

import React, { useState, useEffect } from "react";
import {
  Database,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Key,
} from "lucide-react";
import { useNetwork, useWallet, useDapp, protocolService, DEFAULT_CORAL } from "../core";

export function RegistryView() {
  const { chainId } = useWallet();
  const { targetNetwork } = useNetwork(chainId);
  const { registryCache, addToRegistryCache } = useDapp();

  // Nullifier Query State
  const [scopeId, setScopeId] = useState("1");
  const [nullifier, setNullifier] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<{ isSpent: boolean } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Issuer Authority State
  const [issuerKeyHash, setIssuerKeyHash] = useState("");
  const [isQueryingIssuer, setIsQueryingIssuer] = useState(false);
  const [issuerResult, setIssuerResult] = useState<{ isRegistered: boolean } | null>(null);
  const [issuerError, setIssuerError] = useState<string | null>(null);

  // Query Nullifier
  const handleQueryNullifier = async (scopeToUse?: string, nullifierToUse?: string) => {
    const s = scopeToUse ?? scopeId;
    const n = nullifierToUse ?? nullifier;

    if (!n.trim()) return;
    setQueryError(null);
    setIsQuerying(true);

    try {
      const scopeBigInt = BigInt(s || "1");
      const nullifierBigInt = BigInt(n.trim());

      const res = await protocolService.queryNullifier(
        scopeBigInt,
        nullifierBigInt,
        targetNetwork.registryAddress,
        targetNetwork
      );

      setQueryResult(res);
      addToRegistryCache({
        scopeId: s,
        nullifier: n.trim(),
        isSpent: res.isSpent,
      });
    } catch (err: any) {
      setQueryError(err.message || "Failed to query nullifier on-chain");
    } finally {
      setIsQuerying(false);
    }
  };

  // Query Issuer
  const handleQueryIssuer = async () => {
    if (!issuerKeyHash.trim()) return;
    setIssuerError(null);
    setIsQueryingIssuer(true);

    try {
      const hashBigInt = BigInt(issuerKeyHash.trim());
      const res = await protocolService.queryIssuer(
        hashBigInt,
        targetNetwork.registryAddress,
        targetNetwork
      );
      setIssuerResult(res);
    } catch (err: any) {
      setIssuerError(err.message || "Failed to query issuer on-chain");
    } finally {
      setIsQueryingIssuer(false);
    }
  };

  const handleSelectCached = (entry: { scopeId: string; nullifier: string }) => {
    setScopeId(entry.scopeId);
    setNullifier(entry.nullifier);
    handleQueryNullifier(entry.scopeId, entry.nullifier);
  };

  return (
    <div className="space-y-6 animate-blur-fade-up">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Database size={22} className="text-white" />
            <span>Registry Explorer</span>
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Audit on-chain nullifiers and registered issuer keys on <code className="text-white/80">PramaanRegistry.sol</code>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-white/60">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>MST Coral Testnet ({targetNetwork.chainId})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Nullifier Lookup */}
        <div className="lg:col-span-2 space-y-6">
          <div className="liquid-glass rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Search size={18} />
                <span>On-Chain Nullifier Audit</span>
              </h2>
              <p className="text-xs text-white/60 mt-1">
                Spent nullifiers indicate an attribute proof has already been verified and consumed. 
                Any attempt to reuse a spent nullifier within the same scope will revert on-chain.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleQueryNullifier();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1 font-mono">
                    Scope ID
                  </label>
                  <input
                    type="text"
                    value={scopeId}
                    onChange={(e) => setScopeId(e.target.value)}
                    placeholder="1"
                    className="w-full liquid-glass rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1 font-mono">
                    Nullifier (uint256 decimal hash)
                  </label>
                  <input
                    type="text"
                    value={nullifier}
                    onChange={(e) => setNullifier(e.target.value)}
                    placeholder="e.g. 19482937583920..."
                    className="w-full liquid-glass rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-white/40"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-white/40 font-mono">
                  Contract: <span className="text-white/60 truncate">{targetNetwork.registryAddress.slice(0, 10)}...</span>
                </div>

                <button
                  type="submit"
                  disabled={isQuerying || !nullifier.trim()}
                  className="bg-white text-black font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {isQuerying ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Reading On-Chain...</span>
                    </>
                  ) : (
                    <span>Inspect State</span>
                  )}
                </button>
              </div>
            </form>

            {queryError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>{queryError}</span>
              </div>
            )}

            {/* Query Result Badge */}
            {queryResult !== null && (
              <div
                className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                  queryResult.isSpent
                    ? "bg-red-500/10 border-red-500/30 text-red-200"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      queryResult.isSpent ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {queryResult.isSpent ? <XCircle size={22} /> : <CheckCircle2 size={22} />}
                  </div>
                  <div>
                    <div className="text-sm font-bold uppercase tracking-wider">
                      {queryResult.isSpent ? "SPENT / REVOKED" : "UNSPENT / VALID"}
                    </div>
                    <p className="text-xs text-white/70 mt-0.5">
                      {queryResult.isSpent
                        ? "This nullifier has already been recorded on Coral. Sybil replay protection is active."
                        : "This nullifier is unspent for this scope. Eligible for verification and proof recording."}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-[11px] text-white/50 self-end sm:self-auto">
                  <div>Status Verified</div>
                  <div className="text-white">Block Head</div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Session Nullifiers Cache */}
          {registryCache.length > 0 && (
            <div className="liquid-glass rounded-2xl p-6 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span className="font-semibold uppercase tracking-wider flex items-center gap-2">
                  <Clock size={14} />
                  <span>Recent Session Queries</span>
                </span>
                <span className="font-mono text-[10px] text-white/40">{registryCache.length} cached</span>
              </div>

              <div className="space-y-2">
                {registryCache.map((entry, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectCached(entry)}
                    className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="text-white/40">Scope {entry.scopeId}:</span>
                      <span className="text-white truncate max-w-[200px] sm:max-w-md">{entry.nullifier}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider shrink-0 ml-2 ${
                        entry.isSpent
                          ? "bg-red-500/20 text-red-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {entry.isSpent ? "SPENT" : "UNSPENT"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Issuer Authority & Registry Governance */}
        <div className="space-y-6">
          <div className="liquid-glass rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck size={16} />
                <span>Issuer Authority Audit</span>
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Check whether an issuer public key hash is authorized to issue attestations on the registry.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1 font-mono">
                  Issuer Key Hash (uint256 decimal)
                </label>
                <input
                  type="text"
                  value={issuerKeyHash}
                  onChange={(e) => setIssuerKeyHash(e.target.value)}
                  placeholder="e.g. 8472918475920..."
                  className="w-full liquid-glass rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <button
                type="button"
                disabled={isQueryingIssuer || !issuerKeyHash.trim()}
                onClick={handleQueryIssuer}
                className="w-full liquid-glass py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                {isQueryingIssuer ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Querying Authority...</span>
                  </>
                ) : (
                  <span>Verify Issuer Authority</span>
                )}
              </button>
            </div>

            {issuerError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>{issuerError}</span>
              </div>
            )}

            {issuerResult !== null && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
                  issuerResult.isRegistered
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/10 border-red-500/20 text-red-300"
                }`}
              >
                <span>Authorization:</span>
                <span className="font-bold uppercase tracking-wider">
                  {issuerResult.isRegistered ? "AUTHORIZED / TRUSTED" : "UNAUTHORIZED"}
                </span>
              </div>
            )}
          </div>

          {/* Quick Network & Contract Card */}
          <div className="liquid-glass rounded-2xl p-6 border border-white/10 space-y-3 font-mono text-xs text-white/70">
            <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Network Diagnostics</div>
            <div className="flex justify-between">
              <span>Network:</span>
              <span className="text-white">{targetNetwork.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Chain ID:</span>
              <span className="text-white">{targetNetwork.chainId}</span>
            </div>
            <div className="flex justify-between">
              <span>Currency:</span>
              <span className="text-white">{targetNetwork.symbol}</span>
            </div>
            <div className="pt-2 border-t border-white/10">
              <a
                href={`${targetNetwork.explorerUrl}/address/${targetNetwork.registryAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-white/80 hover:text-white flex items-center gap-1.5 underline underline-offset-2 transition-colors text-[11px]"
              >
                <span>View PramaanRegistry on Coral Scan</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
