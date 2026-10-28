import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Lock, EyeOff, Cpu, CheckCircle2 } from "lucide-react";
import { ProofGateCanvas } from "../components/ProofGateCanvas";
import { StatusChip } from "../components/StatusChip";

export const LandingPage: React.FC = () => {
  const [gateOpenness, setGateOpenness] = useState(0.15);
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [loadProgress, setLoadProgress] = useState(15);

  useEffect(() => {
    // Real preloader counter tied to asset verification
    const timer = setInterval(() => {
      setLoadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setPreloaderDone(true), 300);
          return 100;
        }
        return prev + 25;
      });
    }, 150);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-cyan-600/10 via-emerald-600/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Preloader Overlay */}
      {!preloaderDone && (
        <div className="fixed inset-0 z-50 bg-[#08090d] flex flex-col items-center justify-center gap-4 transition-opacity duration-500">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
            <Shield className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
          <span className="font-mono text-xs text-slate-400">
            Initializing Proving Engine &bull; {loadProgress}%
          </span>
        </div>
      )}

      {/* Hero Section with Proof Gate */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Zero-Knowledge Proof Gate Active</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Prove your age. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              Never your identity.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mb-8">
            Pramaan-ZK uses client-side Groth16 zero-knowledge proofs to cryptographically prove 
            <strong> age &ge; 18</strong> from a signed credential without revealing birth date, name, photo, or government identity.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Link
              to="/prove"
              onMouseEnter={() => setGateOpenness(0.85)}
              onMouseLeave={() => setGateOpenness(0.25)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-semibold text-sm hover:opacity-95 shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Begin Proof</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/relying-party"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl glass-panel text-slate-300 hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Web2 OIDC Demo</span>
            </Link>
          </div>

          {/* Trust Matrix Badges */}
          <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 justify-center lg:justify-start">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>BN254 Groth16 Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero PII Egress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Pairwise Pseudonymity</span>
            </div>
          </div>
        </div>

        {/* Proof Gate Interactive Portal */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 flex flex-col items-center relative group">
            <div className="absolute top-4 right-4">
              <StatusChip type="SYNTHETIC" />
            </div>

            <ProofGateCanvas isOpen={gateOpenness > 0.7} openness={gateOpenness} size={420} />

            <div className="text-center mt-4">
              <span className="font-heading font-semibold text-white text-sm block">
                The Proof Gate Portal
              </span>
              <span className="text-slate-400 text-xs">
                Aperture expands dynamically as cryptographic proofs resolve.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Architecture Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-3">
            Three Verification Channels
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            A single zero-knowledge proof verifies attributes seamlessly across Web3 smart contracts, Web2 identity providers, and simulated enterprise gateways.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Lock className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-heading font-semibold text-white text-base mb-2">
              Client Proving (Browser)
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Proofs are computed locally in the client using SnarkJS and WebAssembly. Your credential never touches any network or third-party server.
            </p>
            <StatusChip type="OFF-CHAIN VERIFIED" />
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-heading font-semibold text-white text-base mb-2">
              On-Chain State Registry
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Smart contracts on MST Blockchain verify pairing precompiles (0x06, 0x07, 0x08) and track scoped nullifiers to prevent Sybil replay attacks.
            </p>
            <StatusChip type="REAL" />
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-purple-500/30 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <EyeOff className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-heading font-semibold text-white text-base mb-2">
              Web2 OIDC-Lite Gateway
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Issues signed ID tokens with pairwise pseudonymous subjects (HMAC) and PKCE authorization code exchange for mainstream consumer applications.
            </p>
            <StatusChip type="SIMULATED" />
          </div>
        </div>
      </section>
    </div>
  );
};
