/**
 * frontend/src/components/AuditView.tsx
 * 
 * On-Chain Transaction & Event Auditor
 * Inspects transaction receipts, decodes ProofVerifiedAndRecorded event logs, and audits gas.
 */

import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Layers,
  Sparkles,
  FileText,
} from "lucide-react";
import { useWallet, useNetwork, useTxResult, useDapp, DEFAULT_CORAL, TxResult } from "../core";

export function AuditView() {
  const { chainId } = useWallet();
  const { targetNetwork } = useNetwork(chainId);
  const { latestTx } = useDapp();
  const { fetchReceipt, isLoading, error, txResult, reset } = useTxResult();

  const [inputHash, setInputHash] = useState("");

  // Autofill latest transaction if available
  useEffect(() => {
    if (latestTx?.txHash && !inputHash) {
      setInputHash(latestTx.txHash);
      fetchReceipt(latestTx.txHash, targetNetwork).catch(() => {});
    }
  }, [latestTx, targetNetwork, fetchReceipt]);

  const handleAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputHash.trim()) return;

    try {
      await fetchReceipt(inputHash.trim() as `0x${string}`, targetNetwork);
    } catch (_) {}
  };

  const handleAutofillLatest = () => {
    if (latestTx?.txHash) {
      setInputHash(latestTx.txHash);
      fetchReceipt(latestTx.txHash, targetNetwork).catch(() => {});
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full animate-blur-fade-up">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <History size={22} className="text-white" />
            <span>Transaction Auditor</span>
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Audit on-chain transaction receipts and decode <code className="text-white/80">ProofVerifiedAndRecorded</code> events.
          </p>
        </div>

        {latestTx?.txHash && (
          <button
            type="button"
            onClick={handleAutofillLatest}
            className="liquid-glass px-3.5 py-1.5 rounded-full text-xs text-emerald-300 border border-emerald-500/30 hover:bg-white/10 flex items-center gap-2 self-start sm:self-auto transition-colors"
          >
            <Sparkles size={12} />
            <span>Load Latest Settlement Tx</span>
          </button>
        )}
      </div>

      {/* Search Input Card */}
      <div className="liquid-glass rounded-2xl p-6 sm:p-8 border border-white/10 space-y-4">
        <form onSubmit={handleAudit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1 font-mono">
              MST Coral Transaction Hash
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={inputHash}
                onChange={(e) => setInputHash(e.target.value)}
                placeholder="0x..."
                className="flex-1 liquid-glass rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-white/40"
              />
              <button
                type="submit"
                disabled={isLoading || !inputHash.trim()}
                className="bg-white text-black font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Auditing...</span>
                  </>
                ) : (
                  <span>Audit Receipt</span>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Audit Results Card */}
      {txResult && (
        <div className="liquid-glass rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${
                  txResult.status === "success"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {txResult.status === "success" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Execution Receipt Details</h3>
                <span className="text-[11px] font-mono text-white/50">{txResult.txHash}</span>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                txResult.status === "success"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-red-500/20 text-red-300 border border-red-500/30"
              }`}
            >
              {txResult.status}
            </span>
          </div>

          {/* Receipt Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-white/40 uppercase text-[10px] tracking-wider">Mined Block</span>
              <div className="text-base font-bold text-white">#{txResult.blockNumber.toString()}</div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-white/40 uppercase text-[10px] tracking-wider">Gas Consumed</span>
              <div className="text-base font-bold text-white">{txResult.gasUsed.toString()} units</div>
            </div>
          </div>

          {/* Decoded Event Log */}
          {txResult.event ? (
            <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={14} />
                  <span>Decoded Event: {txResult.event.eventName}</span>
                </span>
                <span className="text-[10px] text-white/40">PramaanRegistry.sol</span>
              </div>

              <div className="space-y-2 text-white/80">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-white/5 gap-1">
                  <span className="text-white/40">Scope ID:</span>
                  <span className="text-white font-bold">{txResult.event.args.scopeId}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-white/5 gap-1">
                  <span className="text-white/40">Nullifier:</span>
                  <span className="text-white truncate max-w-sm">{txResult.event.args.nullifier}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 gap-1">
                  <span className="text-white/40">Recipient Address:</span>
                  <span className="text-white truncate max-w-sm">{txResult.event.args.recipient}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 font-mono">
              No <code className="text-white/70">ProofVerifiedAndRecorded</code> log emitted in this transaction.
            </div>
          )}

          {/* Block Explorer Link */}
          <div className="pt-2">
            <a
              href={txResult.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="liquid-glass w-full py-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <span>View Full Receipt on MST Coral Explorer</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

