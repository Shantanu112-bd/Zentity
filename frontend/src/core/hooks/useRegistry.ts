/**
 * frontend/src/core/hooks/useRegistry.ts
 * 
 * Typed Registry Hook
 * Queries PramaanRegistry on-chain state: nullifiers, registered issuers, paused status.
 */

import { useState, useCallback } from "react";
import { NetworkInfo } from "../types.ts";
import {
  checkNullifierSpent,
  checkRegisteredIssuer,
  checkRegistryPaused,
} from "../contracts.ts";

export interface UseRegistryReturn {
  loading: boolean;
  error: string | null;
  checkNullifier: (
    registryAddress: `0x${string}`,
    network: NetworkInfo,
    scopeId: bigint,
    nullifier: bigint
  ) => Promise<boolean>;
  checkIssuer: (
    registryAddress: `0x${string}`,
    network: NetworkInfo,
    issuerKeyHash: bigint
  ) => Promise<boolean>;
  checkPaused: (
    registryAddress: `0x${string}`,
    network: NetworkInfo
  ) => Promise<boolean>;
}

export function useRegistry(): UseRegistryReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkNullifier = useCallback(
    async (
      registryAddress: `0x${string}`,
      network: NetworkInfo,
      scopeId: bigint,
      nullifier: bigint
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        return await checkNullifierSpent(registryAddress, network, scopeId, nullifier);
      } catch (err: any) {
        setError(err.message || "Failed to query nullifier status");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const checkIssuer = useCallback(
    async (
      registryAddress: `0x${string}`,
      network: NetworkInfo,
      issuerKeyHash: bigint
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        return await checkRegisteredIssuer(registryAddress, network, issuerKeyHash);
      } catch (err: any) {
        setError(err.message || "Failed to query issuer status");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const checkPaused = useCallback(
    async (
      registryAddress: `0x${string}`,
      network: NetworkInfo
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        return await checkRegistryPaused(registryAddress, network);
      } catch (err: any) {
        setError(err.message || "Failed to query paused status");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    checkNullifier,
    checkIssuer,
    checkPaused,
  };
}
