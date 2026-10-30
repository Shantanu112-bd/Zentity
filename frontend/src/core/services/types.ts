/**
 * frontend/src/core/services/types.ts
 * 
 * Canonical Service Interface Types for Pramaan-ZK
 */

import { Groth16ProofCalldata, DecodedEvent } from "../types.ts";

export interface AttestationRequest {
  address: string;
  scopeId: bigint;
  dateOfBirth?: string;
  minAge?: number;
}

export interface AttestationCredential {
  issuer: string;
  subject: string;
  dob: string;
  dobDays: number;
  stateCode: number;
  credentialSecret: string;
  issuerPubKeyAx: string;
  issuerPubKeyAy: string;
  issuerPubKeyHash: string;
  sigR8x: string;
  sigR8y: string;
  sigS: string;
  label?: string;
  issuanceTimestamp: number;
  signature?: {
    R8: [string, string];
    S: string;
  };
  issuerPublicKey?: [string, string];
  honestNotice: string;
}

export interface Groth16ProofPayload {
  calldata: Groth16ProofCalldata;
  nullifier: bigint;
  scopeId: bigint;
  recipient: `0x${string}`;
  chainId: number;
  durationMs: number;
}

export interface VerificationTransactionResult {
  txHash: `0x${string}`;
  blockNumber: bigint;
  gasUsed: bigint;
  status: "success" | "reverted";
  explorerUrl: string;
  eventDecoded?: DecodedEvent;
  errorMessage?: string;
}

export interface RegistryQueryResult {
  scopeId: bigint;
  nullifier: bigint;
  isSpent: boolean;
  recordedAtBlock?: bigint;
}

export interface IssuerRecord {
  issuerKeyHash: bigint;
  isRegistered: boolean;
  active: boolean;
}

