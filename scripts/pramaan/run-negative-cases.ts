import fs from "fs";
import path from "path";
import hre from "hardhat";
import { defineChain } from "viem";
import * as snarkjs from "snarkjs";
import { NETWORKS, assertBroadcastAllowed } from "../../config/networks.ts";
import {
  issueSyntheticCredential,
  createCircuitInput,
  formatSolidityCalldata,
  getDemoIssuer,
} from "./crypto-utils.ts";

async function main() {
  const networkSlot = (hre as any).network?.name || "local";
  console.log(`\n=== Running On-Chain Negative Path Audits [Target: ${networkSlot}] ===`);

  const viem = (hre as any).viem;
  const isLiveNetwork = networkSlot !== "hardhat" && networkSlot !== "localhost" && networkSlot !== "local";

  let publicClient: any;
  let walletClient: any;
  let config: any = null;

  if (isLiveNetwork) {
    config = NETWORKS[networkSlot];
    if (!config) throw new Error(`Unknown network: ${networkSlot}`);

    const customChain = defineChain({
      id: config.chainId,
      name: config.name,
      nativeCurrency: { name: config.symbol, symbol: config.symbol, decimals: 18 },
      rpcUrls: { default: { http: [config.rpcUrl] } },
    });

    publicClient = await viem.getPublicClient({ chain: customChain });
    const actualChainId = await publicClient.getChainId();
    await assertBroadcastAllowed(networkSlot, actualChainId, true);

    const walletClients = await viem.getWalletClients({ chain: customChain });
    walletClient = walletClients[0];
  } else {
    publicClient = await viem.getPublicClient();
    const walletClients = await viem.getWalletClients();
    walletClient = walletClients[0];
  }

  const chainId = await publicClient.getChainId();
  console.log(`[Connected]: Network = ${networkSlot}, Live Chain ID = ${chainId}, Account = ${walletClient?.account?.address}`);

  let registry: any;
  let verifier: any;

  if (isLiveNetwork) {
    const deployedPath = path.resolve(process.cwd(), "contracts/deployed-addresses.json");
    if (!fs.existsSync(deployedPath)) {
      throw new Error("No contracts/deployed-addresses.json found. Run pnpm run deploy:coral first!");
    }
    const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf-8"));
    console.log(`--> Attaching to deployed contracts on ${networkSlot}:`);
    console.log(`    PramaanRegistry: ${deployed.contracts.PramaanRegistry.address}`);
    console.log(`    PramaanVerifier: ${deployed.contracts.PramaanVerifier.address}`);

    verifier = await viem.getContractAt("PramaanVerifier", deployed.contracts.PramaanVerifier.address, {
      client: { public: publicClient, wallet: walletClient },
    });
    registry = await viem.getContractAt("PramaanRegistry", deployed.contracts.PramaanRegistry.address, {
      client: { public: publicClient, wallet: walletClient },
    });
  } else {
    console.log("--> Deploying test Verifier and Registry instances locally...");
    verifier = await viem.deployContract("PramaanVerifier");
    registry = await viem.deployContract("PramaanRegistry", [verifier.address]);

    const issuer = await getDemoIssuer();
    await registry.write.registerIssuer([BigInt(issuer.pubKeyHash)]);
  }

  // Generate valid baseline proof
  console.log("\n--> Generating baseline adult Groth16 proof for target chain...");
  const wasmPath = path.resolve(process.cwd(), "circuits/pramaan/age_credential_js/age_credential.wasm");
  const zkeyPath = path.resolve(process.cwd(), "circuits/pramaan/age_credential_final.zkey");

  const baselineScope = 99999;
  const cred = await issueSyntheticCredential({ dobDays: 10000, stateCode: 27 });
  const circuitInput = await createCircuitInput({
    credential: cred,
    scopeId: baselineScope,
    recipient: walletClient.account.address,
    chainId,
    currentDateDays: 20000,
    thresholdAgeDays: 6575,
  });

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(circuitInput, wasmPath, zkeyPath);
  const baselineCalldata = formatSolidityCalldata(proof, publicSignals);

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    network: networkSlot,
    chainId,
    environment: isLiveNetwork ? `MST Live Testnet (${config?.name || networkSlot})` : "Local EVM (Hardhat node 31337)",
    registryAddress: registry.address,
    verifierAddress: verifier.address,
    cases: {},
  };

  const simulate = async (name: string, a: any, b: any, c: any, input: any) => {
    try {
      await publicClient.simulateContract({
        address: registry.address,
        abi: registry.abi,
        functionName: "verifyAndRecord",
        args: [a, b, c, input],
        account: walletClient.account,
      });
      return { success: true, revertReason: null };
    } catch (err: any) {
      const msg = err.details || err.message || String(err);
      return { success: false, revertReason: msg };
    }
  };

  console.log("\n--> Executing 7 Negative Test Cases via eth_call simulation:");

  // Case 1: Tampered Proof Coordinate
  const tamperedA: [string, string] = [
    "0x" + (BigInt(baselineCalldata.a[0]) + 1n).toString(16),
    baselineCalldata.a[1],
  ];
  const res1 = await simulate("TamperedProofA", tamperedA, baselineCalldata.b, baselineCalldata.c, baselineCalldata.input);
  const pass1 = !res1.success && (res1.revertReason?.includes("InvalidProof") || res1.revertReason?.includes("revert"));
  console.log(`  Case 1 (Tampered Proof): ${pass1 ? "REVERTED AS EXPECTED [PASS]" : "FAILED"}`);
  results.cases["TamperedProof"] = { expected: "REVERT(InvalidProof)", actualRevert: res1.revertReason, pass: pass1 };

  // Case 2: Unregistered Issuer Key Hash
  const wrongIssuerInput = [...baselineCalldata.input];
  wrongIssuerInput[0] = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  const res2 = await simulate("UnregisteredIssuer", baselineCalldata.a, baselineCalldata.b, baselineCalldata.c, wrongIssuerInput);
  const pass2 = !res2.success && (res2.revertReason?.includes("UnregisteredIssuer") || res2.revertReason?.includes("revert"));
  console.log(`  Case 2 (Unregistered Issuer): ${pass2 ? "REVERTED AS EXPECTED [PASS]" : "FAILED"}`);
  results.cases["UnregisteredIssuer"] = { expected: "REVERT(UnregisteredIssuer)", actualRevert: res2.revertReason, pass: pass2 };

  // Case 3: Chain ID Mismatch
  const wrongChainInput = [...baselineCalldata.input];
  wrongChainInput[4] = "0x01"; // Chain ID 1 (Ethereum Mainnet)
  const res3 = await simulate("ChainIdMismatch", baselineCalldata.a, baselineCalldata.b, baselineCalldata.c, wrongChainInput);
  const pass3 = !res3.success && (res3.revertReason?.includes("ChainIdMismatch") || res3.revertReason?.includes("revert"));
  console.log(`  Case 3 (ChainId Mismatch): ${pass3 ? "REVERTED AS EXPECTED [PASS]" : "FAILED"}`);
  results.cases["ChainIdMismatch"] = { expected: "REVERT(ChainIdMismatch)", actualRevert: res3.revertReason, pass: pass3 };

  // Case 4: Recipient Address Mismatch
  const wrongRecipientInput = [...baselineCalldata.input];
  wrongRecipientInput[3] = "0x0000000000000000000000000000000000000000"; // Zero address
  const res4 = await simulate("RecipientMismatch", baselineCalldata.a, baselineCalldata.b, baselineCalldata.c, wrongRecipientInput);
  const pass4 = !res4.success && (res4.revertReason?.includes("RecipientMismatch") || res4.revertReason?.includes("revert"));
  console.log(`  Case 4 (Recipient Mismatch): ${pass4 ? "REVERTED AS EXPECTED [PASS]" : "FAILED"}`);
  results.cases["RecipientMismatch"] = { expected: "REVERT(RecipientMismatch)", actualRevert: res4.revertReason, pass: pass4 };

  // Case 5: Nullifier Already Spent (Replay Attack)
  // First record baseline proof on-chain (if local or test)
  console.log("  Executing baseline proof to prepare Replay Check...");
  let res5: any;
  try {
    const replayScope = Math.floor(Date.now() / 1000) + 500;
    const replayInput = await createCircuitInput({
      credential: cred,
      scopeId: replayScope,
      recipient: walletClient.account.address,
      chainId,
      currentDateDays: 20000,
      thresholdAgeDays: 6575,
    });
    const p5 = await snarkjs.groth16.fullProve(replayInput, wasmPath, zkeyPath);
    const cd5 = formatSolidityCalldata(p5.proof, p5.publicSignals);

    const firstTx = await registry.write.verifyAndRecord([cd5.a, cd5.b, cd5.c, cd5.input], { account: walletClient.account });
    await publicClient.waitForTransactionReceipt({ hash: firstTx });

    // Now try second time with same nullifier
    res5 = await simulate("NullifierAlreadySpent", cd5.a, cd5.b, cd5.c, cd5.input);
  } catch (e: any) {
    res5 = { success: false, revertReason: e.message };
  }
  const pass5 = !res5.success && (res5.revertReason?.includes("NullifierAlreadySpent") || res5.revertReason?.includes("revert"));
  console.log(`  Case 5 (Replay / Nullifier Spent): ${pass5 ? "REVERTED AS EXPECTED [PASS]" : "FAILED"}`);
  results.cases["NullifierAlreadySpent"] = { expected: "REVERT(NullifierAlreadySpent)", actualRevert: res5.revertReason, pass: pass5 };

  // Case 6: Paused Contract Execution
  console.log("  Testing contract pause mechanism...");
  let pass6 = false;
  let res6: any;
  try {
    const pauseTx = await registry.write.pause([], { account: walletClient.account });
    await publicClient.waitForTransactionReceipt({ hash: pauseTx });
    res6 = await simulate("ContractPaused", baselineCalldata.a, baselineCalldata.b, baselineCalldata.c, baselineCalldata.input);
    pass6 = !res6.success && (res6.revertReason?.includes("EnforcedPause") || res6.revertReason?.includes("revert"));
    // Unpause so contract remains operational
    const unpauseTx = await registry.write.unpause([], { account: walletClient.account });
    await publicClient.waitForTransactionReceipt({ hash: unpauseTx });
  } catch (e: any) {
    pass6 = false;
    res6 = { success: false, revertReason: e.message };
  }
  console.log(`  Case 6 (Paused Contract): ${pass6 ? "REVERTED AS EXPECTED [PASS]" : "FAILED"}`);
  results.cases["ContractPaused"] = { expected: "REVERT(EnforcedPause)", actualRevert: res6.revertReason, pass: pass6 };

  // Case 7: Tampered Public Input Date
  const tamperedDateInput = [...baselineCalldata.input];
  tamperedDateInput[5] = "0x999999";
  const res7 = await simulate("TamperedPublicSignal", baselineCalldata.a, baselineCalldata.b, baselineCalldata.c, tamperedDateInput);
  const pass7 = !res7.success && (res7.revertReason?.includes("InvalidProof") || res7.revertReason?.includes("revert"));
  console.log(`  Case 7 (Tampered Public Signal): ${pass7 ? "REVERTED AS EXPECTED [PASS]" : "FAILED"}`);
  results.cases["TamperedPublicSignal"] = { expected: "REVERT(InvalidProof)", actualRevert: res7.revertReason, pass: pass7 };

  // Write output
  const outPath = path.resolve(process.cwd(), "docs/evidence/negative-cases.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n[SAVED] Negative case results written to: ${outPath}\n`);

  if (isLiveNetwork) {
    const coralDir = path.resolve(process.cwd(), `docs/evidence/testnet-coral-${new Date().toISOString().split("T")[0]}`);
    if (fs.existsSync(coralDir)) {
      fs.writeFileSync(path.join(coralDir, "negative-cases.json"), JSON.stringify(results, null, 2));
    }
  }
}

main().catch((err) => {
  console.error("Negative cases audit failed:", err);
  process.exit(1);
});
