import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, Sparkles, ExternalLink } from "lucide-react";
import { StatusChip } from "./StatusChip";
import { WalletConnect } from "./WalletConnect";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [chainMode, setChainMode] = useState<string>("local");

  useEffect(() => {
    fetch("/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.chainMode) setChainMode(data.chainMode);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { label: "Gate Portal", path: "/" },
    { label: "Client Prover", path: "/prove" },
    { label: "Verify Result", path: "/verify/demo" },
    { label: "Web2 Relying Party", path: "/relying-party" },
    { label: "Web3 Gate", path: "/dapp" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#08090d]/90 backdrop-blur-md">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-center text-xs text-amber-300 flex items-center justify-center gap-2 font-mono">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>
          <strong>SYNTHETIC CREDENTIAL DEMO:</strong> Designed with DEMO ISSUER. Real Aadhaar QR support is future work (milestone M2).
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className="w-full h-full bg-[#08090d] rounded-[7px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-105 transition-transform" />
            </div>
          </div>
          <div>
            <span className="font-heading font-extrabold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
              Pramaan<span className="text-cyan-400">-ZK</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300">
              MST L1
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-800/90 text-cyan-400 border border-slate-700/80"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Status Indicators & Wallet Connect */}
        <div className="flex items-center gap-3">
          <WalletConnect />
          <StatusChip type="SYNTHETIC" />
        </div>
      </div>
    </header>
  );
};
