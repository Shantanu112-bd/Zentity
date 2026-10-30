/**
 * frontend/src/core/services/protocolService.ts
 * 
 * Centralized Service Interface Layer for Pramaan-ZK
 * Fully decouples presentation from Web3 / RPC / ZK Prover execution.
 */

import { createWalletClient, custom } from "viem";
import {
  AttestationCredential,
  Groth16ProofPayload,
  VerificationTransactionResult,
  RegistryQueryResult,
  IssuerRecord,
} from "./types.ts";
import { DEFAULT_CORAL, PRAMAAN_REGISTRY_ABI } from "../config.ts";
import { NetworkInfo, Groth16ProofCalldata } from "../types.ts";
import {
  getPublicClient,
  checkNullifierSpent,
  checkRegisteredIssuer,
  decodeRegistryReceipt,
  simulateVerifyAndRecord,
} from "../contracts.ts";
import { generateProof as coreGenerateProof, formatCalldataForRegistry } from "../prover.ts";
import { api } from "../api.ts";

export interface GenerateProofOptions {
  scopeId?: bigint;
  minAge?: number;
  onProgress?: (progress: { percentage: number; step: string }) => void;
  signal?: AbortSignal;
}

export class ProtocolService {
  private network: NetworkInfo;
  private registryAddress: `0x${string}`;

  constructor(
    network: NetworkInfo = DEFAULT_CORAL,
    registryAddress: `0x${string}` = DEFAULT_CORAL.registryAddress
  ) {
    this.network = network;
    this.registryAddress = registryAddress;
  }

  /**
   * Request a testnet credential attesting user-provided data.
   */
  async requestCredential(
    address: string,
    scopeId: bigint = 1n,
    dateOfBirth: string = "2000-01-01"
  ): Promise<AttestationCredential> {
    // Calculate age from dateOfBirth
    let age = 25;
    if (dateOfBirth) {
      const parts = dateOfBirth.split("-");
      if (parts.length === 3) {
        const birthYear = parseInt(parts[0], 10);
        const currentYear = new Date().getFullYear();
        age = Math.max(1, currentYear - birthYear);
      }
    }
    const currentDateDays = 20000;
    const dobDays = Math.floor(currentDateDays - age * 365.25);

    const res = await api.issueTestnetCredential({
      age,
      dobDays,
      stateCode: 27,
    });
    const cred = res.credential as any;

    return {
      ...cred,
      issuer: "Testnet Issuer Authority",
      subject: address || "0x0000000000000000000000000000000000000000",
      dob: dateOfBirth,
      dobDays: cred.dobDays ?? dobDays,
      stateCode: cred.stateCode ?? 27,
      credentialSecret: cred.credentialSecret ? String(cred.credentialSecret) : "12345678901234567890",
      issuerPubKeyAx: cred.issuerPubKeyAx ? String(cred.issuerPubKeyAx) : "0",
      issuerPubKeyAy: cred.issuerPubKeyAy ? String(cred.issuerPubKeyAy) : "0",
      issuerPubKeyHash: cred.issuerPubKeyHash ? String(cred.issuerPubKeyHash) : "0",
      sigR8x: cred.sigR8x ? String(cred.sigR8x) : "0",
      sigR8y: cred.sigR8y ? String(cred.sigR8y) : "0",
      sigS: cred.sigS ? String(cred.sigS) : "0",
      issuanceTimestamp: Math.floor(Date.now() / 1000),
      honestNotice:
        res.notice ||
        "Testnet issuer: attests the date of birth you enter; no identity verification.",
    };
  }

  /**
   * Generate zero-knowledge Groth16 proof locally in browser (zero-network-egress).
   */
  async generateProof(
    credential: any,
    recipient: string,
    chainId: number = this.network.chainId,
    options?: GenerateProofOptions
  ): Promise<Groth16ProofPayload> {
    const scopeId = options?.scopeId ?? 1n;
    const recipientAddr = (recipient as `0x${string}`) || "0x0000000000000000000000000000000000000001";

    const output = await coreGenerateProof(
      credential,
      scopeId.toString(),
      recipientAddr,
      chainId,
      {
        onProgress: options?.onProgress,
        signal: options?.signal,
      }
    );

    const calldata =
      typeof output.calldata === "string"
        ? formatCalldataForRegistry(output.calldata)
        : output.calldata;
    const nullifierBigInt = BigInt(output.nullifier || "0");

    return {
      calldata,
      nullifier: nullifierBigInt,
      scopeId,
      recipient: recipientAddr,
      chainId,
      durationMs: output.durationMs,
    };
  }

  /**
   * Preflight simulation and on-chain submission of Groth16 proof to PramaanRegistry.
   */
  async submitVerifyAndRecord(
    proof: Groth16ProofPayload,
    registryAddress: `0x${string}` = this.registryAddress,
    network: NetworkInfo = this.network
  ): Promise<VerificationTransactionResult> {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("No Web3 wallet extension detected.");
    }

    // 1. Preflight Simulation
    await simulateVerifyAndRecord(registryAddress, network, proof.calldata, window.ethereum);

    // 2. Broadcast via WalletClient
    const walletClient = createWalletClient({
      transport: custom(window.ethereum),
    });

    const [account] = await walletClient.getAddresses();
    if (!account) {
      throw new Error("Wallet is not connected.");
    }

    const { a, b, c, pubSignals } = proof.calldata;

    const txHash = await walletClient.writeContract({
      address: registryAddress,
      abi: PRAMAAN_REGISTRY_ABI,
      functionName: "verifyAndRecord",
      args: [
        [BigInt(a[0]), BigInt(a[1])],
        [
          [BigInt(b[0][0]), BigInt(b[0][1])],
          [BigInt(b[1][0]), BigInt(b[1][1])],
        ],
        [BigInt(c[0]), BigInt(c[1])],
        pubSignals.map((s) => BigInt(s)) as any,
      ],
      account,
    });

    // 3. Await Confirmation & Extract Event
    const publicClient = getPublicClient(network);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    const decoded = decodeRegistryReceipt(receipt, network.explorerUrl);

    return {
      txHash: decoded.txHash as `0x${string}`,
      blockNumber: decoded.blockNumber,
      gasUsed: decoded.gasUsed,
      status: decoded.status,
      explorerUrl: decoded.explorerUrl || `${network.explorerUrl}/tx/${decoded.txHash}`,
      eventDecoded: decoded.event ? {
        scopeId: BigInt(decoded.event.args.scopeId),
        nullifier: BigInt(decoded.event.args.nullifier),
        recipient: decoded.event.args.recipient,
      } : undefined,
    };
  }

  /**
   * Check nullifier state on PramaanRegistry.
   */
  async queryNullifier(
    scopeId: bigint,
    nullifier: bigint,
    registryAddress: `0x${string}` = this.registryAddress,
    network: NetworkInfo = this.network
  ): Promise<{ isSpent: boolean; recordedAtBlock?: bigint }> {
    const isSpent = await checkNullifierSpent(
      registryAddress,
      network,
      scopeId,
      nullifier
    );

    return {
      isSpent,
    };
  }

  /**
   * Check if issuer is registered in PramaanRegistry.
   */
  async queryIssuer(
    issuerKeyHash: bigint,
    registryAddress: `0x${string}` = this.registryAddress,
    network: NetworkInfo = this.network
  ): Promise<{ isRegistered: boolean; active: boolean }> {
    const isRegistered = await checkRegisteredIssuer(
      registryAddress,
      network,
      issuerKeyHash
    );

    return {
      isRegistered,
      active: isRegistered,
    };
  }
}

export const protocolService = new ProtocolService();

