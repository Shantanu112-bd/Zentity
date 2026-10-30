/**
 * frontend/src/core/prover.ts
 * 
 * Core Prover Service
 * Wraps client-side Groth16 witness calculation and proof generation.
 * Enforces zero private-credential network egress.
 */

import { generateProofClientSide, type ProofResult } from "../../../packages/client/src/prover.ts";
import type {
  TestnetCredential,
  ProofGenerationOutput,
  ProverProgress,
  Groth16ProofCalldata,
} from "./types.ts";

export interface ProverOptions {
  onProgress?: (progress: ProverProgress) => void;
  signal?: AbortSignal;
}

export function formatCalldataForRegistry(snarkjsCalldataString: string): Groth16ProofCalldata {
  const parsed = JSON.parse(`[${snarkjsCalldataString}]`);
  return {
    a: parsed[0] as [string, string],
    b: parsed[1] as [[string, string], [string, string]],
    c: parsed[2] as [string, string],
    pubSignals: parsed[3] as string[],
  };
}

export async function generateProof(
  credential: any,
  scopeId: string | number,
  recipientAddress: string,
  chainId: number = 54635,
  options?: ProverOptions
): Promise<ProofGenerationOutput> {
  const startTime = Date.now();

  const proofResult: ProofResult = await generateProofClientSide(
    credential,
    {
      scopeId,
      recipient: recipientAddress,
      chainId,
    },
    {
      signal: options?.signal,
      onProgress: (stage, percent) => {
        options?.onProgress?.({
          percentage: percent,
          step: stage,
        });
      },
    }
  );

  const durationMs = Date.now() - startTime;

  return {
    proof: proofResult.proof,
    publicSignals: proofResult.publicSignals,
    calldata: {
      a: proofResult.proof.pi_a ? [proofResult.proof.pi_a[0], proofResult.proof.pi_a[1]] : ["0", "0"],
      b: proofResult.proof.pi_b ? [[proofResult.proof.pi_b[0][1], proofResult.proof.pi_b[0][0]], [proofResult.proof.pi_b[1][1], proofResult.proof.pi_b[1][0]]] : [["0", "0"], ["0", "0"]],
      c: proofResult.proof.pi_c ? [proofResult.proof.pi_c[0], proofResult.proof.pi_c[1]] : ["0", "0"],
      pubSignals: proofResult.publicSignals,
    },
    nullifier: proofResult.nullifier,
    durationMs,
  };
}
