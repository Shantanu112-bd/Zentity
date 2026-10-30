/**
 * frontend/src/core/hooks/useTxResult.ts
 * 
 * Typed Transaction Result & Receipt Auditor Hook
 */

import { useState, useCallback } from "react";
import { NetworkInfo, TxResult } from "../types.ts";
import { DEFAULT_CORAL } from "../config.ts";
import { getPublicClient, decodeRegistryReceipt } from "../contracts.ts";

export interface UseTxResultReturn {
  isLoading: boolean;
  txResult: TxResult | null;
  error: string | null;
  fetchReceipt: (txHash: `0x${string}`, network?: NetworkInfo) => Promise<TxResult>;
  reset: () => void;
}

export function useTxResult(): UseTxResultReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [txResult, setTxResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsLoading(false);
    setTxResult(null);
    setError(null);
  }, []);

  const fetchReceipt = useCallback(
    async (txHash: `0x${string}`, network: NetworkInfo = DEFAULT_CORAL): Promise<TxResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const publicClient = getPublicClient(network);
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        const decoded = decodeRegistryReceipt(receipt, network.explorerUrl);
        setTxResult(decoded);
        return decoded;
      } catch (err: any) {
        const message = err?.shortMessage || err?.message || String(err);
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    txResult,
    error,
    fetchReceipt,
    reset,
  };
}

