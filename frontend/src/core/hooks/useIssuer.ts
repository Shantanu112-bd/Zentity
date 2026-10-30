/**
 * frontend/src/core/hooks/useIssuer.ts
 * 
 * Typed Testnet Issuer Hook
 * Issues testnet credentials attesting self-provided data (no identity verification).
 */

import { useState, useCallback } from "react";
import { TestnetCredential } from "../types.ts";
import { api, IssueCredentialRequest } from "../api.ts";

export interface UseIssuerReturn {
  loading: boolean;
  credential: TestnetCredential | null;
  notice: string | null;
  error: string | null;
  requestCredential: (req: IssueCredentialRequest) => Promise<TestnetCredential>;
  verifyOffChain: (proof: any, publicSignals: string[]) => Promise<boolean>;
}

export function useIssuer(): UseIssuerReturn {
  const [loading, setLoading] = useState(false);
  const [credential, setCredential] = useState<TestnetCredential | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestCredential = useCallback(
    async (req: IssueCredentialRequest): Promise<TestnetCredential> => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.issueTestnetCredential(req);
        setCredential(res.credential);
        setNotice(res.notice);
        return res.credential;
      } catch (err: any) {
        setError(err.message || "Failed to issue credential");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const verifyOffChain = useCallback(
    async (proof: any, publicSignals: string[]): Promise<boolean> => {
      return await api.verifyProofOffChain(proof, publicSignals);
    },
    []
  );

  return {
    loading,
    credential,
    notice,
    error,
    requestCredential,
    verifyOffChain,
  };
}
