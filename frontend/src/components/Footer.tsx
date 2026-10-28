import React from "react";
import { Shield, ExternalLink, Code } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#06070a] text-slate-400 text-xs py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="font-heading font-bold text-white text-sm">Pramaan-ZK</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                MVP Prototype
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Privacy-preserving attribute verification system. Proves that credential age ≥ 18 without revealing birth date, name, photo, or Aadhaar identity.
            </p>
            <p className="text-slate-500 text-[11px] mt-2">
              <strong>Honesty Guarantee:</strong> Age ≥ 18 attribute proven client-side via Groth16. Never identity verified by government.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-white text-xs uppercase tracking-wider mb-3">
              Network Target
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>MST Blockchain (PoSA EVM)</li>
              <li>Legacy Testnet: <code>91562037</code></li>
              <li>Precompiles: BN254 <code>0x06, 0x07, 0x08</code></li>
              <li>Gas Relayer: Sponsored Relaying</li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-white text-xs uppercase tracking-wider mb-3">
              Audit Transparency
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <span className="text-emerald-400 font-mono">REAL:</span> Groth16 & Precompile Math
              </li>
              <li>
                <span className="text-amber-400 font-mono">SYNTHETIC:</span> Demo Issuer Credential
              </li>
              <li>
                <span className="text-purple-400 font-mono">SIMULATED:</span> Government Webhook Stub
              </li>
              <li>
                <span className="text-red-400 font-mono">UNVERIFIED:</span> Coral Testnet RPC
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; 2026 Pramaan-ZK (Zentity). Developed for MST Blockchain Ecosystem.
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Shantanu112-bd/Zentity.git"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 flex items-center gap-1"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Repository</span>
            </a>
            <a
              href="https://testnet.mstscan.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>MSTScan</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
