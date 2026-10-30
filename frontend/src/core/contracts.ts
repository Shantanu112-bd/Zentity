/**
 * frontend/src/core/contracts.ts
 * 
 * Contract Read & Write Services for Pramaan-ZK
 * Zero JSX, pure Viem RPC interactions with preflight simulation & event decoding.
 */

import {
  createPublicClient,
  http,
  custom,
  defineChain,
  decodeEventLog,
  type TransactionReceipt,
} from "viem";
import type { NetworkInfo, TxResult, Groth16ProofCalldata } from "./types.ts";
import { PRAMAAN_REGISTRY_ABI } from "./config.ts";

export function getPublicClient(network: NetworkInfo, customTransport?: any) {
  const chain = defineChain({
    id: network.chainId,
    name: network.name,
    nativeCurrency: {
      decimals: 18,
      name: network.symbol,
      symbol: network.symbol,
    },
    rpcUrls: {
      default: { http: [network.rpcUrl] },
      public: { http: [network.rpcUrl] },
    },
  });

  return createPublicClient({
    chain,
    transport: customTransport ? custom(customTransport) : http(network.rpcUrl),
  });
}

export async function checkNullifierSpent(
  registryAddress: `0x${string}`,
  network: NetworkInfo,
  scopeId: bigint,
  nullifier: bigint,
  customTransport?: any
): Promise<boolean> {
  const client = getPublicClient(network, customTransport);
  return (await client.readContract({
    address: registryAddress,
    abi: PRAMAAN_REGISTRY_ABI,
    functionName: "isNullifierSpent",
    args: [scopeId, nullifier],
  })) as boolean;
}

export async function checkRegisteredIssuer(
  registryAddress: `0x${string}`,
  network: NetworkInfo,
  issuerKeyHash: bigint,
  customTransport?: any
): Promise<boolean> {
  const client = getPublicClient(network, customTransport);
  return (await client.readContract({
    address: registryAddress,
    abi: PRAMAAN_REGISTRY_ABI,
    functionName: "registeredIssuers",
    args: [issuerKeyHash],
  })) as boolean;
}

export async function checkRegistryPaused(
  registryAddress: `0x${string}`,
  network: NetworkInfo,
  customTransport?: any
): Promise<boolean> {
  const client = getPublicClient(network, customTransport);
  return (await client.readContract({
    address: registryAddress,
    abi: PRAMAAN_REGISTRY_ABI,
    functionName: "paused",
  })) as boolean;
}

export function decodeRegistryReceipt(
  receipt: TransactionReceipt,
  explorerBaseUrl?: string
): TxResult {
  let eventDecoded: TxResult["eventDecoded"] | undefined;

  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: PRAMAAN_REGISTRY_ABI,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === "ProofVerifiedAndRecorded") {
        eventDecoded = {
          scopeId: (decoded.args as any).scopeId,
          nullifier: (decoded.args as any).nullifier,
          recipient: (decoded.args as any).recipient,
        };
        break;
      }
    } catch {
      // Ignore other logs
    }
  }

  const status = receipt.status === "success" ? "success" : "reverted";

  return {
    txHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed,
    status,
    explorerUrl: explorerBaseUrl ? `${explorerBaseUrl}/tx/${receipt.transactionHash}` : undefined,
    eventDecoded,
  };
}

export async function simulateVerifyAndRecord(
  registryAddress: `0x${string}`,
  network: NetworkInfo,
  callerAddress: `0x${string}`,
  calldata: Groth16ProofCalldata
): Promise<{ success: boolean; error?: string }> {
  const client = getPublicClient(network);

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

  try {
    await client.simulateContract({
      address: registryAddress,
      abi: PRAMAAN_REGISTRY_ABI,
      functionName: "verifyAndRecord",
      args: [formattedA, formattedB, formattedC, formattedInput],
      account: callerAddress,
    });
    return { success: true };
  } catch (err: any) {
    const errorMsg = err.shortMessage || err.message || "Simulation failed";
    return { success: false, error: errorMsg };
  }
}
