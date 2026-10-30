/**
 * frontend/src/core/hooks/useNetwork.ts
 * 
 * Typed Network Hook
 * Validates active chain against configured target and handles switching.
 */

import { useState, useCallback } from "react";
import { NetworkInfo } from "../types.ts";
import { DEFAULT_CORAL, DEFAULT_LEGACY, DEFAULT_LOCAL } from "../config.ts";

export interface UseNetworkReturn {
  targetNetwork: NetworkInfo;
  isCorrectNetwork: boolean;
  switchNetwork: () => Promise<void>;
  setTargetNetwork: (net: NetworkInfo) => void;
  availableNetworks: NetworkInfo[];
}

export function useNetwork(currentChainId: number | null): UseNetworkReturn {
  const [targetNetwork, setTargetNetwork] = useState<NetworkInfo>(DEFAULT_CORAL);

  const availableNetworks = [DEFAULT_CORAL, DEFAULT_LEGACY, DEFAULT_LOCAL];
  const isCorrectNetwork = currentChainId === targetNetwork.chainId;

  const switchNetwork = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;

    const chainIdHex = `0x${targetNetwork.chainId.toString(16)}`;

    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Need to add chain
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainIdHex,
              chainName: targetNetwork.name,
              nativeCurrency: {
                name: targetNetwork.symbol,
                symbol: targetNetwork.symbol,
                decimals: 18,
              },
              rpcUrls: [targetNetwork.rpcUrl],
              blockExplorerUrls: targetNetwork.explorerUrl
                ? [targetNetwork.explorerUrl]
                : undefined,
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }, [targetNetwork]);

  return {
    targetNetwork,
    isCorrectNetwork,
    switchNetwork,
    setTargetNetwork,
    availableNetworks,
  };
}
