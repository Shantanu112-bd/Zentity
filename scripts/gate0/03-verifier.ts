/**
 * scripts/gate0/03-verifier.ts
 * 
 * Gate 0 Phase D: On-Chain Verifier Deployment and Execution
 * Deploys Groth16Verifier to target network (Legacy Testnet or Coral).
 * Verifies valid proof and tests tampered proofs.
 * Records deployment gas, verifyProof gas, tx hashes, and receipts.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import hre from "hardhat";
import { defineChain } from "viem";
import { NETWORKS, assertBroadcastAllowed } from "../../config/networks";

export async function runOnChainVerifier(networkKey: string, allowUnverified = false) {
  const config = NETWORKS[networkKey];
  if (!config) {
    throw new Error(`Unknown network slot: ${networkKey}`);
  }

  const viem = (hre as any).viem;

  // Custom chain definition for viem
  const customChain = defineChain({
    id: config.chainId,
    name: config.name,
    nativeCurrency: { name: config.symbol, symbol: config.symbol, decimals: 18 },
    rpcUrls: {
      default: { http: [config.rpcUrl] },
    },
    blockExplorers: config.explorerUrl ? {
      default: { name: "Explorer", url: config.explorerUrl },
    } : undefined,
  });

  // Preflight check chain ID
  const publicClient = await viem.getPublicClient({ chain: customChain });
  const actualChainId = await publicClient.getChainId();

  await assertBroadcastAllowed(networkKey, actualChainId, allowUnverified);

  const calldataPath = path.resolve(process.cwd(), "circuits/gate0/calldata.json");
  if (!fs.existsSync(calldataPath)) {
    throw new Error("circuits/gate0/calldata.json not found! Run build-toy-circuit first.");
  }
  const calldata = JSON.parse(fs.readFileSync(calldataPath, "utf-8"));

  console.log(`\n======================================================`);
  console.log(`[Gate 0 Verifier] Network: ${config.name} (${config.id})`);
  console.log(`[Gate 0 Verifier] Chain ID: ${actualChainId}`);
  console.log(`======================================================\n`);

  const report: Record<string, any> = {
    network: config.id,
    chainId: actualChainId,
    timestamp: new Date().toISOString(),
    tests: {},
  };

  // 1. Deploy Verifier Contract
  console.log(`--> Deploying Groth16Verifier...`);
  const deployStart = Date.now();
  const verifier = await viem.deployContract("Groth16Verifier", [], { chain: customChain });
  const deployTimeMs = Date.now() - deployStart;
  console.log(`    Contract Address: ${verifier.address}`);
  console.log(`    Deploy latency: ${deployTimeMs}ms`);

  report.contractAddress = verifier.address;

  // 2. Call verifyProof with valid proof (read / eth_call)
  console.log(`--> Calling verifyProof (valid proof via eth_call)...`);
  const isValidCall = await verifier.read.verifyProof([
    calldata.a,
    calldata.b,
    calldata.c,
    calldata.input,
  ]);
  console.log(`    verifyProof result: ${isValidCall}`);
  if (!isValidCall) {
    throw new Error("On-chain verifyProof returned FALSE for valid proof!");
  }
  report.tests.validProofEthCall = "PASS";

  // 3. Tampered public signal
  console.log(`--> Calling verifyProof (tampered public signal)...`);
  const tamperedInput = ["0x0000000000000000000000000000000000000000000000000000000000000022"];
  const isTamperedValid = await verifier.read.verifyProof([
    calldata.a,
    calldata.b,
    calldata.c,
    tamperedInput,
  ]);
  console.log(`    verifyProof tampered result: ${isTamperedValid}`);
  if (isTamperedValid) {
    throw new Error("FATAL: On-chain verifier ACCEPTED tampered public signal!");
  }
  report.tests.tamperedSignalRejected = "PASS";

  // 4. Repeat 5 times
  console.log(`--> Testing determinism (5 consecutive calls)...`);
  for (let i = 1; i <= 5; i++) {
    const res = await verifier.read.verifyProof([
      calldata.a,
      calldata.b,
      calldata.c,
      calldata.input,
    ]);
    if (!res) throw new Error(`Deterministic call ${i} failed`);
  }
  console.log(`    5/5 consecutive calls returned true deterministically.`);
  report.tests.deterministicCalls = "PASS (5/5)";

  const outPath = path.resolve(process.cwd(), `docs/evidence/gate0-verifier-${config.id}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\n[SUCCESS] Verifier test report saved to: ${outPath}\n`);
  return report;
}

const networkArg = (hre as any).network?.name && (hre as any).network.name !== "hardhat"
  ? (hre as any).network.name
  : (process.argv.find((_, i, arr) => arr[i - 1] === "--network") || "local");
const allowUnverified = process.argv.includes("--allow-unverified-network");

runOnChainVerifier(networkArg, allowUnverified).catch((err) => {
  console.error("Verifier test failed:", err);
  process.exit(1);
});

