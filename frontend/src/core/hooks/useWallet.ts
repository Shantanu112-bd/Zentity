/**
 * frontend/src/core/hooks/useWallet.ts
 * 
 * Typed Wallet Hook
 * Connects to MetaMask / injected Ethereum provider via Viem.
 */

import { useState, useEffect, useCallback } from "react";
import { createWalletClient, custom } from "viem";
import { NetworkInfo } from "../types.ts";
import { api } from "../api.ts";

export interface UseWalletReturn {
  address: `0x${string}` | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  authAddress: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signIn: () => Promise<boolean>;
}

export function useWallet(targetNetwork?: NetworkInfo): UseWalletReturn {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authAddress, setAuthAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getEthereum = () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return (window as any).ethereum;
    }
    return null;
  };

  const syncState = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) return;

    try {
      const accounts: string[] = await eth.request({ method: "eth_accounts" });
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0] as `0x${string}`);
      } else {
        setAddress(null);
      }

      const chainIdHex: string = await eth.request({ method: "eth_chainId" });
      setChainId(parseInt(chainIdHex, 16));
    } catch (err: any) {
      console.warn("Failed to sync wallet state:", err);
    }
  }, []);

  useEffect(() => {
    syncState();
    const eth = getEthereum();
    if (!eth) return;

    const handleAccountsChanged = (accs: string[]) => {
      if (accs.length === 0) {
        setAddress(null);
        setIsAuthenticated(false);
        setAuthAddress(null);
      } else {
        setAddress(accs[0] as `0x${string}`);
      }
    };

    const handleChainChanged = (newChainIdHex: string) => {
      setChainId(parseInt(newChainIdHex, 16));
    };

    eth.on?.("accountsChanged", handleAccountsChanged);
    eth.on?.("chainChanged", handleChainChanged);

    return () => {
      eth.removeListener?.("accountsChanged", handleAccountsChanged);
      eth.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [syncState]);

  const connect = useCallback(async () => {
    setError(null);
    const eth = getEthereum();
    if (!eth) {
      setError("No Web3 wallet detected. Please install MetaMask.");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0] as `0x${string}`);
      }
      const chainIdHex: string = await eth.request({ method: "eth_chainId" });
      setChainId(parseInt(chainIdHex, 16));
    } catch (err: any) {
      setError(err.message || "User rejected wallet connection");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setIsAuthenticated(false);
    setAuthAddress(null);
  }, []);

  const signIn = useCallback(async (): Promise<boolean> => {
    if (!address) {
      setError("Connect wallet before signing in");
      return false;
    }

    const eth = getEthereum();
    if (!eth) return false;

    try {
      const { nonce, message } = await api.requestNonce(address);
      const walletClient = createWalletClient({
        account: address,
        transport: custom(eth),
      });

      const signature = await walletClient.signMessage({
        account: address,
        message,
      });

      const res = await api.verifyAuth(address, signature, nonce);
      if (res.status === "ok") {
        setIsAuthenticated(true);
        setAuthAddress(res.address);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Ethereum challenge");
      return false;
    }
  }, [address]);

  return {
    address,
    chainId,
    isConnected: Boolean(address),
    isConnecting,
    isAuthenticated,
    authAddress,
    error,
    connect,
    disconnect,
    signIn,
  };
}
