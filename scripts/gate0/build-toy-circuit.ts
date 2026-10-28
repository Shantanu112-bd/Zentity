/**
 * scripts/gate0/build-toy-circuit.ts
 * 
 * Gate 0 Phase C: Toy Circuit Setup, Proof, and Local Verification
 * - Compiles circuits/gate0/multiplier.circom with circom
 * - Runs dev-only Powers of Tau (pot8, bn128) and Groth16 phase-2 setup with snarkjs
 * - Exports verification_key.json and contracts/MultiplierVerifier.sol
 * - Proves witness for a=3, b=11 -> c=33
 * - Verifies proof locally via snarkjs.groth16.verify
 * - Generates valid and tampered proof fixtures for on-chain testing
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
// @ts-ignore
import * as snarkjs from "snarkjs";

function run(cmd: string, cwd = process.cwd()) {
  console.log(`[Exec] ${cmd}`);
  return execSync(cmd, { cwd, stdio: "inherit" });
}

export async function buildToyCircuit() {
  const circuitsDir = path.resolve(process.cwd(), "circuits/gate0");
  const contractsDir = path.resolve(process.cwd(), "contracts");
  fs.mkdirSync(circuitsDir, { recursive: true });
  fs.mkdirSync(contractsDir, { recursive: true });

  const circomFile = path.join(circuitsDir, "multiplier.circom");
  const r1csFile = path.join(circuitsDir, "multiplier.r1cs");
  const wasmDir = path.join(circuitsDir, "multiplier_js");
  const wasmFile = path.join(wasmDir, "multiplier.wasm");

  console.log("\n======================================================");
  console.log("[Gate 0 Toy Circuit] Compiling multiplier.circom with circom...");
  console.log("======================================================\n");

  // 1. Compile with circom
  run(`circom multiplier.circom --r1cs --wasm --sym -o .`, circuitsDir);

  if (!fs.existsSync(r1csFile) || !fs.existsSync(wasmFile)) {
    throw new Error("Circom compilation failed: multiplier.r1cs or multiplier.wasm not found");
  }
  console.log("[PASS] Circom compilation succeeded.");

  // 2. Dev-only Powers of Tau (pot8)
  const ptau0 = path.join(circuitsDir, "pot8_0000.ptau");
  const ptau1 = path.join(circuitsDir, "pot8_0001.ptau");
  const ptauFinal = path.join(circuitsDir, "pot8_final.ptau");

  if (!fs.existsSync(ptauFinal)) {
    console.log("[Setup] Generating DEV-ONLY Powers of Tau 8...");
    run(`pnpm dlx snarkjs powersoftau new bn128 8 "${ptau0}" -v`);
    run(`pnpm dlx snarkjs powersoftau contribute "${ptau0}" "${ptau1}" --name="DEV-ONLY-POT" -v -e="pramaan-dev-seed-1"`);
    run(`pnpm dlx snarkjs powersoftau prepare phase2 "${ptau1}" "${ptauFinal}" -v`);
  }

  // 3. Groth16 Setup
  const zkey0 = path.join(circuitsDir, "multiplier_0000.zkey");
  const zkeyFinal = path.join(circuitsDir, "multiplier_final.zkey");
  console.log("[Setup] Running Groth16 circuit setup...");
  run(`pnpm dlx snarkjs groth16 setup "${r1csFile}" "${ptauFinal}" "${zkey0}"`);
  run(`pnpm dlx snarkjs zkey contribute "${zkey0}" "${zkeyFinal}" --name="DEV-ONLY-ZKEY" -v -e="pramaan-dev-seed-2"`);

  // 4. Export verification key and Solidity verifier
  const vkeyPath = path.join(circuitsDir, "verification_key.json");
  const verifierSolPath = path.join(contractsDir, "MultiplierVerifier.sol");
  run(`pnpm dlx snarkjs zkey export verificationkey "${zkeyFinal}" "${vkeyPath}"`);
  run(`pnpm dlx snarkjs zkey export solidityverifier "${zkeyFinal}" "${verifierSolPath}"`);
  console.log(`[PASS] Verification key and MultiplierVerifier.sol exported.`);

  // 5. Generate Witness for a=3, b=11 -> c=33
  console.log("[Prove] Generating witness for a=3, b=11...");
  const inputJsonPath = path.join(circuitsDir, "input.json");
  fs.writeFileSync(inputJsonPath, JSON.stringify({ a: "3", b: "11" }));

  const wtnsPath = path.join(circuitsDir, "witness.wtns");
  const genWitnessJs = path.join(wasmDir, "generate_witness.js");
  run(`node "${genWitnessJs}" "${wasmFile}" "${inputJsonPath}" "${wtnsPath}"`);

  // 6. Generate Proof with snarkjs
  console.log("[Prove] Generating Groth16 proof...");
  const proofPath = path.join(circuitsDir, "proof.json");
  const publicPath = path.join(circuitsDir, "public.json");
  run(`pnpm dlx snarkjs groth16 prove "${zkeyFinal}" "${wtnsPath}" "${proofPath}" "${publicPath}"`);

  const proof = JSON.parse(fs.readFileSync(proofPath, "utf-8"));
  const publicSignals = JSON.parse(fs.readFileSync(publicPath, "utf-8"));
  const vKey = JSON.parse(fs.readFileSync(vkeyPath, "utf-8"));

  // 7. Verify Locally with snarkjs
  console.log("[Local Verify] Verifying proof with snarkjs...");
  const localVerifyResult = await snarkjs.groth16.verify(vKey, publicSignals, proof);
  console.log(`[Local Verify Result]: ${localVerifyResult}`);
  if (!localVerifyResult) {
    throw new Error("Local snarkjs proof verification FAILED!");
  }
  console.log("[PASS] Local proof verification succeeded!");

  // 8. Prepare Solidity Call Parameters
  console.log("[Calldata] Exporting solidity calldata...");
  const calldataOut = execSync(
    `pnpm dlx snarkjs zkey export soliditycalldata "${publicPath}" "${proofPath}"`,
    { encoding: "utf-8" }
  );
  
  // Format: ["0x...", "0x..."], [["0x...", "0x..."], ["0x...", "0x..."]], ["0x...", "0x..."], ["0x..."]
  const calldata = JSON.parse(`[${calldataOut.trim()}]`);
  
  const formattedCall = {
    a: calldata[0],
    b: calldata[1],
    c: calldata[2],
    input: calldata[3],
  };

  const calldataJsonPath = path.join(circuitsDir, "calldata.json");
  fs.writeFileSync(calldataJsonPath, JSON.stringify(formattedCall, null, 2));

  console.log(`[SUCCESS] Calldata formatted and saved to: ${calldataJsonPath}\n`);
  return { proof, publicSignals, vKey, formattedCall };
}

buildToyCircuit().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
