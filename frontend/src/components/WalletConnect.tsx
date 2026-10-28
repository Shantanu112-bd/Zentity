import React from "react";
import { Wallet, AlertTriangle, CheckCircle, LogOut, KeyRound, Loader2 } from "lucide-react";
import { useWallet } from "../context/WalletContext";

export const WalletConnect: React.FC = () => {
  const {
    address,
    isConnected,
    isConnecting,
    chainId,
    isCorrectNetwork,
    targetNetwork,
    isAuthenticated,
    connect,
    disconnect,
    switchNetwork,
    signIn,
  } = useWallet();

  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
    } finally {
      setIsSigningIn(false);
    }
  };

  if (!isConnected) {
    return (
      <button
        type="button"
        onClick={connect}
        disabled={isConnecting}
        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 hover:opacity-95 transition-all"
      >
        {isConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Network Chip */}
      {!isCorrectNetwork ? (
        <button
          type="button"
          onClick={switchNetwork}
          className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-mono flex items-center gap-1 hover:bg-amber-500/30 transition-all"
        >
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>Switch to {targetNetwork.label || targetNetwork.name}</span>
        </button>
      ) : (
        <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{targetNetwork.label || `Chain ${chainId}`}</span>
        </div>
      )}

      {/* Off-Chain Sign-In Button */}
      {!isAuthenticated ? (
        <button
          type="button"
          onClick={handleSignIn}
          disabled={isSigningIn}
          title="Off-chain EIP-191 sign-in (free, not a transaction)"
          className="px-2.5 py-1 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[11px] font-medium flex items-center gap-1 hover:bg-cyan-500/30 transition-all"
        >
          {isSigningIn ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
          <span>Sign In (Free)</span>
        </button>
      ) : (
        <div
          title="Authenticated via off-chain signature"
          className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-[10px] font-mono text-cyan-400 flex items-center gap-1"
        >
          <CheckCircle className="w-2.5 h-2.5 text-cyan-400" />
          <span>AUTHENTICATED</span>
        </div>
      )}

      {/* Account Info */}
      <div className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono flex items-center gap-2">
        <span>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}</span>
        <button
          type="button"
          onClick={disconnect}
          title="Disconnect wallet"
          className="text-slate-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
