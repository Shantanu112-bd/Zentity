/**
 * frontend/src/core/hooks/useProver.ts
 * 
 * Typed Prover Hook
 * Manages zero-knowledge proving state machine with progress & abort handling.
 */

import { useState, useCallback, useRef } from "react";
import {
  ProverStatus,
  ProverProgress,
  TestnetCredential,
  ProofGenerationOutput,
} from "../types.ts";
import { generateProof } from "../prover.ts";

export interface UseProverReturn {
  status: ProverStatus;
  progress: ProverProgress;
  proofOutput: ProofGenerationOutput | null;
  error: string | null;
  startProving: (
    credential: TestnetCredential,
    scopeId: string,
    currentTimestamp: number,
    recipientAddress: string
  ) => Promise<ProofGenerationOutput | null>;
  cancelProving: () => void;
  reset: () => void;
}

export function useProver(): UseProverReturn {
  const [status, setStatus] = useState<ProverStatus>("idle");
  const [progress, setProgress] = useState<ProverProgress>({
    percentage: 0,
    step: "Ready",
  });
  const [proofOutput, setProofOutput] = useState<ProofGenerationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const startProving = useCallback(
    async (
      credential: TestnetCredential,
      scopeId: string,
      currentTimestamp: number,
      recipientAddress: string
    ): Promise<ProofGenerationOutput | null> => {
      setStatus("proving");
      setError(null);
      setProgress({ percentage: 5, step: "Initializing prover..." });

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const output = await generateProof(
          credential,
          scopeId,
          currentTimestamp,
          recipientAddress,
          {
            signal: abortController.signal,
            onProgress: (p) => {
              setProgress(p);
            },
          }
        );

        setProofOutput(output);
        setStatus("ready");
        setProgress({ percentage: 100, step: "Proof generated successfully" });
        return output;
      } catch (err: any) {
        if (err.name === "AbortError") {
          setStatus("idle");
          setProgress({ percentage: 0, step: "Proving cancelled" });
          return null;
        }

        const msg = err.message || "Failed to generate zero-knowledge proof";
        setError(msg);
        setStatus("rejected");
        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },
    []
  );

  const cancelProving = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus("idle");
    setProgress({ percentage: 0, step: "Cancelled" });
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress({ percentage: 0, step: "Ready" });
    setProofOutput(null);
    setError(null);
  }, []);

  return {
    status,
    progress,
    proofOutput,
    error,
    startProving,
    cancelProving,
    reset,
  };
}
