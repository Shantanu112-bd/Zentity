import { createPublicClient, http, fallback, defineChain, type PublicClient } from "viem";
import { DEFAULT_CORAL } from "../../frontend/src/core/config.ts";

export interface RpcEndpointHealth {
  url: string;
  isHealthy: boolean;
  latencyMs: number;
  lastChecked: number;
  blockNumber?: bigint;
}

const endpointHealthMap = new Map<string, RpcEndpointHealth>();

export function getCoralRpcEndpoints(): string[] {
  const envEndpoints = process.env.CORAL_RPC_URLS;
  if (envEndpoints) {
    return envEndpoints.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [
    DEFAULT_CORAL.rpcUrl, // Primary: https://coralrpc.mstblockchain.com
  ];
}

export function createResilientPublicClient(
  customEndpoints?: string[],
  chainId = DEFAULT_CORAL.chainId
): PublicClient {
  const endpoints = customEndpoints && customEndpoints.length > 0
    ? customEndpoints
    : getCoralRpcEndpoints();

  const coralChain = defineChain({
    id: chainId,
    name: DEFAULT_CORAL.name,
    nativeCurrency: { decimals: 18, name: "tMSTC", symbol: "tMSTC" },
    rpcUrls: {
      default: { http: endpoints },
      public: { http: endpoints },
    },
  });

  const transports = endpoints.map((url) =>
    http(url, {
      timeout: 8_000,
      retryCount: 3,
      retryDelay: 1_000,
    })
  );

  return createPublicClient({
    chain: coralChain,
    transport: fallback(transports, {
      rank: true,
      retryCount: 3,
    }),
  });
}

export async function probeRpcEndpoint(url: string): Promise<RpcEndpointHealth> {
  const start = Date.now();
  try {
    const client = createPublicClient({
      transport: http(url, { timeout: 5000 }),
    });
    const blockNumber = await client.getBlockNumber();
    const latencyMs = Date.now() - start;

    const health: RpcEndpointHealth = {
      url,
      isHealthy: true,
      latencyMs,
      lastChecked: Date.now(),
      blockNumber,
    };
    endpointHealthMap.set(url, health);
    return health;
  } catch {
    const health: RpcEndpointHealth = {
      url,
      isHealthy: false,
      latencyMs: Date.now() - start,
      lastChecked: Date.now(),
    };
    endpointHealthMap.set(url, health);
    return health;
  }
}

export function getRpcHealthSnapshot(): RpcEndpointHealth[] {
  return Array.from(endpointHealthMap.values());
}
