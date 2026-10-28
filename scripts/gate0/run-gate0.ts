/**
 * scripts/gate0/run-gate0.ts
 * 
 * Master Orchestrator for Gate 0 Feasibility
 * Executes:
 * 1. Network Preflight (01-preflight.ts)
 * 2. Precompile Probes (02-precompiles.ts)
 * 3. Toy Circuit Compilation, Proving, Local Verification (build-toy-circuit.ts)
 * 4. Local EVM Verifier & Precompile Tests
 * 5. On-Chain Deployment (if DEPLOYER_PRIVATE_KEY present):
 *    - Attempts default evmVersion first.
 *    - If default fails with opcode/PUSH0 error, retries with evmVersion: "paris".
 *    - Records both outcomes.
 *    - Deploys PrecompileProbe.sol to re-measure native gas on MST.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { runPreflight } from "./01-preflight.js";
import { generateVectors } from "./generate-vectors.js";
import { runPrecompileProbes } from "./02-precompiles.js";
import { buildToyCircuit } from "./build-toy-circuit.js";
import { runOnChainVerifier } from "./03-verifier.js";
import { execSync } from "node:child_process";
import { assertBroadcastAllowed, NETWORKS } from "../../config/networks.js";

async function main() {
  const networkArg = process.argv.find((_, i, arr) => arr[i - 1] === "--network") || "local";
  const allowUnverified = process.argv.includes("--allow-unverified-network");

  console.log(`\n======================================================`);
  console.log(`[Gate 0 Master Runner] Initiating Gate 0 on: ${networkArg}`);
  console.log(`======================================================\n`);

  // Step 1: Preflight
  console.log(`[Step 1/5] Executing Network Preflight...`);
  const preflight = await runPreflight(networkArg);

  // Step 2: Vector Generation
  console.log(`[Step 2/5] Generating BN254 Test Vectors...`);
  const vectors = generateVectors();

  // Step 3: Direct Precompile Probes via eth_call
  console.log(`[Step 3/5] Running Direct Precompile Probes via eth_call...`);
  const probeResults = await runPrecompileProbes(networkArg);

  // Step 4: Toy Circuit Build & Local Verify
  console.log(`[Step 4/5] Compiling Circuit & Verifying with snarkjs...`);
  const circuitResult = await buildToyCircuit();

  // Step 5: Test Suite & On-Chain Broadcast Check
  console.log(`[Step 5/5] Running Local Test Harness...`);
  execSync("pnpm test", { stdio: "inherit" });

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey || privateKey.trim() === "") {
    console.log(`\n------------------------------------------------------`);
    console.log(`[Gate 0 Note] DEPLOYER_PRIVATE_KEY is not set in .env.`);
    console.log(`Precompile math & rejection probes completed via eth_call (PASS).`);
    console.log(`On-chain transaction broadcast requires a funded testnet key (Blocker B-04).`);
    console.log(`Overall Gate 0 verdict: OPEN (pending Coral testnet verification).`);
    console.log(`------------------------------------------------------\n`);
    return;
  }

  // Key is present -> proceed to on-chain broadcast attempt
  console.log(`\n--> DEPLOYER_PRIVATE_KEY detected. Initiating on-chain deployment check...`);
  const config = NETWORKS[networkArg];
  await assertBroadcastAllowed(networkArg, preflight.calls.eth_chainId.result ? parseInt(preflight.calls.eth_chainId.result, 16) : config.chainId, allowUnverified);

  // Attempt 1: Default evmVersion
  console.log(`--> Attempt 1: Deploying with default compiler evmVersion...`);
  let defaultSuccess = false;
  let defaultError: string | null = null;
  try {
    delete process.env.EVM_VERSION;
    execSync("npx hardhat clean && npx hardhat compile", { stdio: "inherit" });
    await runOnChainVerifier(networkArg, allowUnverified);
    defaultSuccess = true;
    console.log(`[PASS] Deployment succeeded with default evmVersion!`);
  } catch (err: any) {
    defaultError = err.message || String(err);
    console.warn(`[WARN] Default evmVersion deployment failed: ${defaultError}`);
  }

  // Attempt 2: If default failed, retry with paris as diagnostic
  let parisSuccess = false;
  let parisError: string | null = null;
  if (!defaultSuccess) {
    console.log(`--> Attempt 2: Retrying deployment with evmVersion: "paris" as diagnostic...`);
    try {
      process.env.EVM_VERSION = "paris";
      execSync("npx hardhat clean && npx hardhat compile", { stdio: "inherit" });
      await runOnChainVerifier(networkArg, allowUnverified);
      parisSuccess = true;
      console.log(`[PASS] Deployment succeeded with evmVersion: "paris"!`);
    } catch (err: any) {
      parisError = err.message || String(err);
      console.error(`[FAIL] Paris evmVersion deployment also failed: ${parisError}`);
    }
  }

  // Record outcomes in evidence
  const deployOutcomes = {
    network: networkArg,
    timestamp: new Date().toISOString(),
    attemptDefault: {
      evmVersion: "default (0.8.20 compiler default)",
      success: defaultSuccess,
      error: defaultError,
    },
    attemptParis: {
      evmVersion: "paris",
      success: parisSuccess,
      error: parisError,
    },
  };

  const outcomePath = path.resolve(process.cwd(), `docs/evidence/gate0-deploy-outcomes-${networkArg}.json`);
  fs.writeFileSync(outcomePath, JSON.stringify(deployOutcomes, null, 2));
  console.log(`Deploy outcomes recorded to: ${outcomePath}`);

  console.log(`\n======================================================`);
  console.log(`[Gate 0 Master Runner] Completed.`);
  console.log(`======================================================\n`);
}

main().catch((err) => {
  console.error("\n[Gate 0 Master Runner FAILED]:", err);
  process.exit(1);
});
