/**
 * frontend/src/core/hooks/useSubmitProof.ts
 * 
 * Typed Submit Proof Hook
 * Submits Groth16 proof to PramaanRegistry on-chain with preflight simulation & event decoding.
 */

import { useState, useCallback } from "react";
import { createWalletClient, custom } from "viem";
import { NetworkInfo, TxResult, Groth16ProofCalldata } from "../types.ts";
import { PRAMAAN_REGISTRY_ABI } from "../config.ts";
import {
  getPublicClient,
  getViemChain,
  simulateVerifyAndRecord,
  decodeRegistryReceipt,
} from "../contracts.ts";

export interface UseSubmitProofReturn {
  isSubmitting: boolean;
  txResult: TxResult | null;
  error: string | null;
  submitProof: (
    registryAddress: `0x${string}`,
    network: NetworkInfo,
    userAddress: `0x${string}`,
    calldata: Groth16ProofCalldata
  ) => Promise<TxResult>;
  reset: () => void;
}

export function useSubmitProof(): UseSubmitProofReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txResult, setTxResult] = useState<TxResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setTxResult(null);
    setError(null);
  }, []);

  const submitProof = useCallback(
    async (
      registryAddress: `0x${string}`,
      network: NetworkInfo,
      userAddress: `0x${string}`,
      calldata: Groth16ProofCalldata
    ): Promise<TxResult> => {
      setIsSubmitting(true);
      setError(null);

      // 1. Preflight Simulation via eth_call
      const sim = await simulateVerifyAndRecord(
        registryAddress,
        network,
        userAddress,
        calldata
      );

      if (!sim.success) {
        const simError = `Preflight simulation failed: ${sim.error}`;
        setError(simError);
        setIsSubmitting(false);
        throw new Error(simError);
      }

      // 2. Submit transaction via connected wallet
      if (typeof window === "undefined" || !(window as any).ethereum) {
        const noEthErr = "No Web3 wallet available for signing";
        setError(noEthErr);
        setIsSubmitting(false);
        throw new Error(noEthErr);
      }

      try {
        const chain = getViemChain(network);
        const walletClient = createWalletClient({
          chain,
          account: userAddress,
          transport: custom((window as any).ethereum),
        });

        const formattedA = [BigInt(calldata.a[0]), BigInt(calldata.a[1])] as const;
        const formattedB = [
          [BigInt(calldata.b[0][0]), BigInt(calldata.b[0][1])],
          [BigInt(calldata.b[1][0]), BigInt(calldata.b[1][1])],
        ] as const;
        const formattedC = [BigInt(calldata.c[0]), BigInt(calldata.c[1])] as const;
        const formattedInput = calldata.pubSignals.map((s) => BigInt(s)) as [
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint
        ];

        const txHash = await walletClient.writeContract({
          chain,
          address: registryAddress,
          abi: PRAMAAN_REGISTRY_ABI,
          functionName: "verifyAndRecord",
          args: [formattedA, formattedB, formattedC, formattedInput],
        });

        // 3. Wait for transaction receipt
        const publicClient = getPublicClient(network);
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        const decodedResult = decodeRegistryReceipt(receipt, network.explorerUrl);
        setTxResult(decodedResult);
        return decodedResult;
      } catch (err: any) {
        const msg = err.shortMessage || err.message || "Transaction submission failed";
        setError(msg);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    isSubmitting,
    txResult,
    error,
    submitProof,
    reset,
  };
}
