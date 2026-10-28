import * as snarkjs from "snarkjs";
import { createCircuitInput } from "../../../scripts/pramaan/crypto-utils.ts";
import type { SyntheticCredential } from "../../../scripts/pramaan/crypto-utils.ts";

export interface ProverProgressCallback {
  (stage: string, percent: number): void;
}

export interface ProverOptions {
  onProgress?: ProverProgressCallback;
  signal?: AbortSignal;
  wasmUrl?: string;
  zkeyUrl?: string;
  hashesUrl?: string;
}

export interface ProofResult {
  proof: any;
  publicSignals: string[];
  nullifier: string;
}

export async function generateProofClientSide(
  credential: SyntheticCredential,
  params: {
    scopeId: string | number;
    recipient: string;
    chainId: number;
    currentDateDays?: number;
    thresholdAgeDays?: number;
  },
  options: ProverOptions = {}
): Promise<ProofResult> {
  const { onProgress, signal } = options;

  if (signal?.aborted) {
    throw new Error("Proving aborted by caller before start.");
  }

  onProgress?.("PREPARING_INPUTS", 10);
  const currentDateDays = params.currentDateDays ?? 20000;
  const thresholdAgeDays = params.thresholdAgeDays ?? 6575;

  const circuitInput = await createCircuitInput({
    credential,
    scopeId: params.scopeId,
    recipient: params.recipient,
    chainId: params.chainId,
    currentDateDays,
    thresholdAgeDays,
  });

  if (signal?.aborted) {
    throw new Error("Proving aborted by caller.");
  }

  const wasmUrl = options.wasmUrl || "/circuits/age_credential.wasm";
  const zkeyUrl = options.zkeyUrl || "/circuits/age_credential_final.zkey";

  onProgress?.("FETCHING_CIRCUIT_ARTIFACTS", 30);
  // In node environment or browser, snarkjs groth16.fullProve accepts URLs or file paths or buffers
  if (signal?.aborted) {
    throw new Error("Proving aborted by caller.");
  }

  onProgress?.("COMPUTING_WITNESS_AND_PROOF", 60);
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInput,
    wasmUrl,
    zkeyUrl
  );

  if (signal?.aborted) {
    throw new Error("Proving aborted by caller after witness generation.");
  }

  onProgress?.("PROOF_COMPLETE", 100);

  return {
    proof,
    publicSignals,
    nullifier: circuitInput.nullifier,
  };
}

/**
 * Sanitizes outbound request payload to ensure strictly ZERO private credential fields
 * are ever transmitted across the network.
 */
export function buildVerificationPayload(proofResult: ProofResult, relayOnChain = false) {
  return {
    proof: proofResult.proof,
    publicSignals: proofResult.publicSignals,
    relayOnChain,
  };
}
