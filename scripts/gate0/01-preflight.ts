/**
 * scripts/gate0/01-preflight.ts
 * 
 * Gate 0 Phase A: Network Preflight
 * Calls standard read-only JSON-RPC endpoints:
 * - eth_chainId
 * - net_version
 * - eth_blockNumber (3 samples ~10s apart)
 * - eth_gasPrice
 * - eth_getBalance (on zero address or test address)
 * - eth_getBlockByNumber('latest') -> gasLimit, timestamp, hash, number
 * - eth_estimateGas (trivial transfer)
 * - web3_clientVersion
 * 
 * Asserts chainId matches configured slot.
 * Records latency and saves evidence JSON to docs/evidence/
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { NETWORKS } from "../../config/networks.js";

interface RpcResponse<T = any> {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string; data?: any };
}

async function callRpc<T = any>(
  rpcUrl: string,
  method: string,
  params: any[] = []
): Promise<{ result?: T; error?: any; latencyMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Math.floor(Math.random() * 100000),
        method,
        params,
      }),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      return { error: `HTTP ${res.status}: ${res.statusText}`, latencyMs };
    }
    const data = (await res.json()) as RpcResponse<T>;
    if (data.error) {
      return { error: data.error, latencyMs };
    }
    return { result: data.result, latencyMs };
  } catch (err: any) {
    return { error: err.message, latencyMs: Date.now() - start };
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runPreflight(networkKey: string) {
  const config = NETWORKS[networkKey];
  if (!config) {
    throw new Error(`Unknown network slot: ${networkKey}. Available: ${Object.keys(NETWORKS).join(", ")}`);
  }

  console.log(`\n======================================================`);
  console.log(`[Gate 0 Preflight] Target Network: ${config.name} (${config.id})`);
  console.log(`[Gate 0 Preflight] RPC URL: ${config.rpcUrl}`);
  console.log(`[Gate 0 Preflight] Expected Chain ID: ${config.chainId} (0x${config.chainId.toString(16)})`);
  console.log(`======================================================\n`);

  if (!config.rpcUrl) {
    throw new Error(`RPC URL is not configured for network ${config.id}`);
  }

  const evidence: Record<string, any> = {
    network: config.id,
    name: config.name,
    rpcUrl: config.rpcUrl,
    expectedChainId: config.chainId,
    timestamp: new Date().toISOString(),
    calls: {},
  };

  // 1. eth_chainId
  console.log(`--> Calling eth_chainId...`);
  const chainIdCall = await callRpc<string>(config.rpcUrl, "eth_chainId");
  evidence.calls.eth_chainId = chainIdCall;
  if (chainIdCall.error) {
    throw new Error(`eth_chainId failed: ${JSON.stringify(chainIdCall.error)}`);
  }
  const actualChainId = parseInt(chainIdCall.result!, 16);
  console.log(`    Returned: ${chainIdCall.result} (Decimal: ${actualChainId}) [Latency: ${chainIdCall.latencyMs}ms]`);

  if (actualChainId !== config.chainId) {
    const msg = `FATAL CHAIN ID MISMATCH! Configured: ${config.chainId}, RPC returned: ${actualChainId}`;
    console.error(`[Guard Error] ${msg}`);
    evidence.fatalError = msg;
    saveEvidence(config.id, evidence);
    throw new Error(msg);
  }
  console.log(`[PASS] Chain ID matches configured value.`);

  // 2. net_version
  console.log(`--> Calling net_version...`);
  const netVerCall = await callRpc<string>(config.rpcUrl, "net_version");
  evidence.calls.net_version = netVerCall;
  console.log(`    Returned: ${netVerCall.result} [Latency: ${netVerCall.latencyMs}ms]`);

  // 3. web3_clientVersion
  console.log(`--> Calling web3_clientVersion...`);
  const clientVerCall = await callRpc<string>(config.rpcUrl, "web3_clientVersion");
  evidence.calls.web3_clientVersion = clientVerCall;
  console.log(`    Returned: ${clientVerCall.result ?? clientVerCall.error} [Latency: ${clientVerCall.latencyMs}ms]`);

  // 4. eth_gasPrice
  console.log(`--> Calling eth_gasPrice...`);
  const gasPriceCall = await callRpc<string>(config.rpcUrl, "eth_gasPrice");
  evidence.calls.eth_gasPrice = gasPriceCall;
  const gasPriceWei = gasPriceCall.result ? BigInt(gasPriceCall.result).toString() : null;
  console.log(`    Returned: ${gasPriceCall.result} (${gasPriceWei} wei) [Latency: ${gasPriceCall.latencyMs}ms]`);

  // 5. eth_getBalance (test/dummy address)
  const probeAddress = "0x0000000000000000000000000000000000000001";
  console.log(`--> Calling eth_getBalance(${probeAddress})...`);
  const balanceCall = await callRpc<string>(config.rpcUrl, "eth_getBalance", [probeAddress, "latest"]);
  evidence.calls.eth_getBalance = balanceCall;
  console.log(`    Returned: ${balanceCall.result} [Latency: ${balanceCall.latencyMs}ms]`);

  // 6. eth_getBlockByNumber('latest')
  console.log(`--> Calling eth_getBlockByNumber('latest', false)...`);
  const blockCall = await callRpc<any>(config.rpcUrl, "eth_getBlockByNumber", ["latest", false]);
  evidence.calls.eth_getBlockByNumber = blockCall;
  if (blockCall.result) {
    const block = blockCall.result;
    const blockNum = parseInt(block.number, 16);
    const gasLimit = parseInt(block.gasLimit, 16);
    const blockTime = parseInt(block.timestamp, 16);
    console.log(`    Latest Block: #${blockNum}`);
    console.log(`    Block Gas Limit: ${gasLimit} (0x${gasLimit.toString(16)})`);
    console.log(`    Block Timestamp: ${new Date(blockTime * 1000).toISOString()}`);
    evidence.blockSummary = { blockNum, gasLimit, blockTime, hash: block.hash };
  }

  // 7. eth_estimateGas (trivial transfer)
  console.log(`--> Calling eth_estimateGas (21,000 transfer)...`);
  const estGasCall = await callRpc<string>(config.rpcUrl, "eth_estimateGas", [
    {
      from: "0x0000000000000000000000000000000000000001",
      to: "0x0000000000000000000000000000000000000002",
      value: "0x1",
    },
  ]);
  evidence.calls.eth_estimateGas = estGasCall;
  console.log(`    Returned: ${estGasCall.result ? parseInt(estGasCall.result, 16) : estGasCall.error} [Latency: ${estGasCall.latencyMs}ms]`);

  // 8. Block progression sampling (3 samples ≥ 10s apart per spec §9-A)
  console.log(`--> Sampling block progression (3 samples, ~10s interval)...`);
  const samples: Array<{ index: number; blockNumber: number; timestamp: number; latencyMs: number }> = [];

  for (let i = 1; i <= 3; i++) {
    const blockNumCall = await callRpc<string>(config.rpcUrl, "eth_blockNumber");
    const num = blockNumCall.result ? parseInt(blockNumCall.result, 16) : -1;
    console.log(`    Sample ${i}: Block #${num} [Latency: ${blockNumCall.latencyMs}ms]`);
    samples.push({
      index: i,
      blockNumber: num,
      timestamp: Date.now(),
      latencyMs: blockNumCall.latencyMs,
    });
    if (i < 3) {
      console.log(`    Waiting 10 seconds...`);
      await sleep(10000);
    }
  }
  evidence.blockSamples = samples;

  // Compute observed block interval
  const deltaBlocks = samples[2].blockNumber - samples[0].blockNumber;
  const deltaSec = (samples[2].timestamp - samples[0].timestamp) / 1000;
  const avgBlockSec = deltaBlocks > 0 ? (deltaSec / deltaBlocks).toFixed(2) : "0 (no new blocks)";
  console.log(`\n[Preflight Result] Advanced ${deltaBlocks} blocks in ${deltaSec.toFixed(1)}s (Observed Block Time: ~${avgBlockSec}s)`);
  evidence.observedBlockTimeSec = avgBlockSec;

  const outPath = saveEvidence(config.id, evidence);
  console.log(`\n[SUCCESS] Preflight evidence recorded to: ${outPath}\n`);
  return evidence;
}

function saveEvidence(networkId: string, evidence: any): string {
  const dir = path.resolve(process.cwd(), "docs/evidence");
  fs.mkdirSync(dir, { recursive: true });
  const filename = `preflight-${networkId}.json`;
  const fullPath = path.join(dir, filename);
  fs.writeFileSync(fullPath, JSON.stringify(evidence, null, 2));
  return fullPath;
}

// CLI entry point
const networkArg = process.argv.find((_, i, arr) => arr[i - 1] === "--network") || "mstLegacyTestnet";
runPreflight(networkArg).catch((err) => {
  console.error("\n[Preflight Aborted with Error]:", err.message);
  process.exit(1);
});

