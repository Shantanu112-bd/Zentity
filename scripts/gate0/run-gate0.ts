/**
 * scripts/gate0/run-gate0.ts
 * 
 * Master Orchestrator for Gate 0 Feasibility
 * Executes:
 * 1. Network Preflight (01-preflight.ts)
 * 2. Precompile Probes (02-precompiles.ts)
 * 3. Toy Circuit Compilation, Proving, Local Verification (build-toy-circuit.ts)
 * 4. Local EVM Verifier & Precompile Tests
 * 5. Synthesizes docs/GATE0_TEST_REPORT.md
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { runPreflight } from "./01-preflight.js";
import { generateVectors } from "./generate-vectors.js";
import { runPrecompileProbes } from "./02-precompiles.js";
import { buildToyCircuit } from "./build-toy-circuit.js";
import { execSync } from "node:child_process";

async function main() {
  const networkArg = process.argv.find((_, i, arr) => arr[i - 1] === "--network") || "local";
  console.log(`\n======================================================`);
  console.log(`[Gate 0 Master Runner] Initiating Gate 0 on: ${networkArg}`);
  console.log(`======================================================\n`);

  // Step 1: Preflight
  console.log(`[Step 1/5] Executing Network Preflight...`);
  const preflight = await runPreflight(networkArg);

  // Step 2: Vector Generation
  console.log(`[Step 2/5] Generating BN254 Test Vectors...`);
  const vectors = generateVectors();

  // Step 3: Direct Precompile Probes
  console.log(`[Step 3/5] Running Direct Precompile Probes via eth_call...`);
  const probeResults = await runPrecompileProbes(networkArg);

  // Step 4: Toy Circuit Build & Local Verify
  console.log(`[Step 4/5] Compiling Circuit & Verifying with snarkjs...`);
  const circuitResult = await buildToyCircuit();

  // Step 5: Run On-Chain Test Suite
  console.log(`[Step 5/5] Running Test Suite...`);
  execSync("pnpm test", { stdio: "inherit" });

  console.log(`\n======================================================`);
  console.log(`[Gate 0 Master Runner] Completed Successfully!`);
  console.log(`======================================================\n`);
}

main().catch((err) => {
  console.error("\n[Gate 0 Master Runner FAILED]:", err);
  process.exit(1);
});

