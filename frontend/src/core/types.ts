/**
 * frontend/src/core/types.ts
 * 
 * Core Types for Pramaan-ZK
 * Zero JSX, pure TypeScript contracts and state definitions.
 */

export interface NetworkInfo {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  explorerUrl?: string;
  label?: string;
}

export interface ContractInfo {
  PramaanRegistry: { address: `0x${string}` };
  PramaanVerifier: { address: `0x${string}` };
  PrecompileProbe?: { address: `0x${string}` };
}

export interface DecodedEvent {
  scopeId: bigint;
  nullifier: bigint;
  recipient: string;
}

export interface TxResult {
  txHash: string;
  blockNumber: bigint;
  gasUsed: bigint;
  status: "success" | "reverted";
  explorerUrl?: string;
  eventDecoded?: DecodedEvent;
  errorMessage?: string;
}

export interface Groth16ProofCalldata {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
  pubSignals: string[];
}

export type ProverStatus =
  | "idle"
  | "issuing"
  | "ready"
  | "proving"
  | "submitting"
  | "confirmed"
  | "rejected";

export interface ProverProgress {
  percentage: number;
  step: string;
}

export interface TestnetCredential {
  dobDays: number;
  stateCode: number;
  credentialSecret: string;
  issuerKeyHash: string;
  signature: {
    R8: [string, string];
    S: string;
  };
}

export interface ProofGenerationOutput {
  proof: any;
  publicSignals: string[];
  calldata: Groth16ProofCalldata;
  nullifier: string;
  durationMs: number;
}

