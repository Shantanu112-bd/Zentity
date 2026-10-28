import fs from "fs";
import path from "path";
import hre from "hardhat";
import * as snarkjs from "snarkjs";
import {
  issueSyntheticCredential,
  createCircuitInput,
  formatSolidityCalldata,
  getDemoIssuer,
} from "./crypto-utils.ts";

async function main() {
  console.log("\n=== Running On-Chain Negative Path Audits (eth_call / estimateGas) ===");

  const viem = (hre as any).viem;
  const publicClient = await viem.getPublicClient();
  const [deployer, user] = await viem.getWalletClients();
  const chainId = await publicClient.getChainId();

  // 1. Deploy Verifier and Registry locally for deterministic simulation
  console.log("--> Deploying test Verifier and Registry instances...");
  const verifier = await viem.deployContract("PramaanVerifier");
  const registry = await viem.deployContract("PramaanRegistry", [verifier.address]);

  // Register Demo Issuer
  const issuer = await getDemoIssuer();
  await registry.write.registerIssuer([BigInt(issuer.pubKeyHash)]);

  // Generate valid baseline proof
  console.log("--> Generating baseline adult Groth16 proof...");
  const wasmPath = path.resolve(process.cwd(), "circuits/pramaan/age_credential_js/age_credential.wasm");
  const zkeyPath = path.resolve(process.cwd(), "circuits/pramaan/age_credential_final.zkey");

  const cred = await issueSyntheticCredential({ dobDays: 10000, stateCode: 27 });
  const circuitInput = await createCircuitInput({
    credential: cred,
    scopeId: 42,
    recipient: user.account.address,
    chainId,
    currentDateDays: 20000,
    thresholdAgeDays: 6575,
  });

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(circuitInput, wasmPath, zkeyPath);
  const baselineCalldata = formatSolidityCalldata(proof, publicSignals);

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    chainId,
    registryAddress: registry.address,
    verifierAddress: verifier.address,
    cases: {},
  };

  const simulate = async (name: string, a: any, b: any, c: any, input: any) => {
    try {
      await registry.write.verifyAndRecord([a, b, c, input], { account: user.account });
      return { success: true, revertReason: null };
    } catch (err: any) {
      const msg = err.details || err.message || String(err);
      return { success: false, revertReason: msg };
    }
  };

  // Case 1: Tampered Proof (corrupt pA[0])
  console.log("--> Testing Case 1: Tampered Proof Coordinate...");
  const tamperedA: [bigint, bigint] = [
    baselineCalldata.a[0] ^ 1n,
    baselineCalldata.a[1],
  ];
  const res1 = await simulate(
    "tampered_proof",
    tamperedA,
    baselineCalldata.b,
    baselineCalldata.c,
    baselineCalldata.input
  );
  results.cases.tampered_proof = {
    expected: "InvalidProof",
    observed: res1.revertReason,
    passed: res1.revertReason?.includes("InvalidProof"),
  };

  // Case 2: Tampered Public Input (threshold age changed)
  console.log("--> Testing Case 2: Tampered Public Input...");
  const tamperedInput = [...baselineCalldata.input];
  tamperedInput[6] = 7000n; // tampered threshold age
  const res2 = await simulate(
    "tampered_public_input",
    baselineCalldata.a,
    baselineCalldata.b,
    baselineCalldata.c,
    tamperedInput
  );
  results.cases.tampered_public_input = {
    expected: "InvalidProof",
    observed: res2.revertReason,
    passed: res2.revertReason?.includes("InvalidProof"),
  };

  // Case 3: Unregistered Issuer
  console.log("--> Testing Case 3: Unregistered Issuer...");
  const unregisteredInput = [...baselineCalldata.input];
  unregisteredInput[0] = 999999999999n;
  const res3 = await simulate(
    "unregistered_issuer",
    baselineCalldata.a,
    baselineCalldata.b,
    baselineCalldata.c,
    unregisteredInput
  );
  results.cases.unregistered_issuer = {
    expected: "UnregisteredIssuer",
    observed: res3.revertReason,
    passed: res3.revertReason?.includes("UnregisteredIssuer"),
  };

  // Case 4: Wrong Chain ID
  console.log("--> Testing Case 4: Wrong Chain ID...");
  const wrongChainInput = [...baselineCalldata.input];
  wrongChainInput[4] = 999999n;
  const res4 = await simulate(
    "wrong_chain_id",
    baselineCalldata.a,
    baselineCalldata.b,
    baselineCalldata.c,
    wrongChainInput
  );
  results.cases.wrong_chain_id = {
    expected: "ChainIdMismatch",
    observed: res4.revertReason,
    passed: res4.revertReason?.includes("ChainIdMismatch"),
  };

  // Case 5: Wrong Recipient (zero address)
  console.log("--> Testing Case 5: Wrong Recipient (zero address)...");
  const wrongRecipientInput = [...baselineCalldata.input];
  wrongRecipientInput[3] = 0n;
  const res5 = await simulate(
    "wrong_recipient",
    baselineCalldata.a,
    baselineCalldata.b,
    baselineCalldata.c,
    wrongRecipientInput
  );
  results.cases.wrong_recipient = {
    expected: "RecipientMismatch",
    observed: res5.revertReason,
    passed: res5.revertReason?.includes("RecipientMismatch"),
  };

  // Case 6: Replayed Nullifier
  console.log("--> Testing Case 6: Replayed Nullifier...");
  // First execution writes to state
  await registry.write.verifyAndRecord(
    [baselineCalldata.a, baselineCalldata.b, baselineCalldata.c, baselineCalldata.input],
    { account: user.account }
  );
  // Second call simulates replay
  const res6 = await simulate(
    "replayed_nullifier",
    baselineCalldata.a,
    baselineCalldata.b,
    baselineCalldata.c,
    baselineCalldata.input
  );
  results.cases.replayed_nullifier = {
    expected: "NullifierAlreadySpent",
    observed: res6.revertReason,
    passed: res6.revertReason?.includes("NullifierAlreadySpent"),
  };

  // Case 7: Paused Registry
  console.log("--> Testing Case 7: Paused Registry...");
  await registry.write.pause({ account: deployer.account });
  const res7 = await simulate(
    "paused_registry",
    baselineCalldata.a,
    baselineCalldata.b,
    baselineCalldata.c,
    baselineCalldata.input
  );
  results.cases.paused_registry = {
    expected: "ContractPaused",
    observed: res7.revertReason,
    passed: res7.revertReason?.includes("ContractPaused"),
  };

  // Summary
  console.log("\n=== Negative Cases Summary ===");
  for (const [k, v] of Object.entries(results.cases) as [string, any][]) {
    console.log(`[${v.passed ? "PASS" : "FAIL"}] ${k}: expected ${v.expected}, observed: ${v.observed}`);
  }

  const outPath = path.resolve(process.cwd(), "docs/evidence/negative-cases.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n[SAVED] Evidence written to: ${outPath}\n`);
}

main().catch((err) => {
  console.error("Negative test runner failed:", err);
  process.exit(1);
});
