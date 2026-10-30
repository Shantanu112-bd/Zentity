/**
 * frontend/src/core/hooks/useTxResult.ts
 * 
 * Typed Tx Result Hook
 * Looks up on-chain transaction receipt and decodes Pramaan events.
 */

import { useState, useCallback } from "react";
import { NetworkInfo, TxResult } from "../types.ts";
import { getPublicClient, decodeRegistryReceipt } from "../contracts.ts";

export interface UseTxResultReturn {
  loading: boolean;
  result: TxResult | null;
  error: string | null;
  lookupTx: (txHash: `0x${string}`, network: NetworkInfo) => Promise<TxResult | null>;
}

export function useTxResult(): UseTxResultReturn {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookupTx = useCallback(
    async (txHash: `0x${string}`, network: NetworkInfo): Promise<TxResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const client = getPublicClient(network);
        const receipt = await client.getTransactionReceipt({ hash: txHash });

        const decoded = decodeRegistryReceipt(receipt, network.explorerUrl);
        setResult(decoded);
        return decoded;
      } catch (err: any) {
        const msg = err.shortMessage || err.message || "Failed to lookup transaction";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    result,
    error,
    lookupTx,
  };
}
