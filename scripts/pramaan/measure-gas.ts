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
  console.log("\n=== Measuring Native Precompile & Verifier Gas Consumption ===");

  const viem = (hre as any).viem;
  const publicClient = await viem.getPublicClient();
  const [deployer, user] = await viem.getWalletClients();
  const chainId = await publicClient.getChainId();

  // Load vectors
  const vectorsPath = path.resolve(process.cwd(), "scripts/gate0/vectors.json");
  const vectors = JSON.parse(fs.readFileSync(vectorsPath, "utf-8"));

  // 1. Deploy PrecompileProbe
  console.log("--> Deploying PrecompileProbe.sol...");
  const probe = await viem.deployContract("PrecompileProbe");

  // Probe ecAdd
  const addRes = await probe.read.probeAdd([vectors.ecAdd.valid.input]);
  const ecAddGas = Number(addRes.gasUsed);
  console.log(`[MEASURED] 0x06 ecAdd Gas: ${ecAddGas} gas`);

  // Probe ecMul
  const mulRes = await probe.read.probeMul([vectors.ecMul.valid.input]);
  const ecMulGas = Number(mulRes.gasUsed);
  console.log(`[MEASURED] 0x07 ecMul Gas: ${ecMulGas} gas`);

  // Probe ecPairing
  const pairingRes = await probe.read.probePairing([vectors.ecPairing.validIdentity.input]);
  const ecPairingGas = Number(pairingRes.gasUsed);
  console.log(`[MEASURED] 0x08 ecPairing Gas: ${ecPairingGas} gas`);

  // 2. Deploy PramaanVerifier and PramaanRegistry
  console.log("--> Deploying PramaanVerifier and PramaanRegistry...");
  const verifier = await viem.deployContract("PramaanVerifier");
  const registry = await viem.deployContract("PramaanRegistry", [verifier.address]);

  const issuer = await getDemoIssuer();
  await registry.write.registerIssuer([BigInt(issuer.pubKeyHash)]);

  // Generate proof
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
  const callArgs = formatSolidityCalldata(proof, publicSignals);

  // Measure verifyProof gas via estimateContractGas
  const verifierGasEstimate = await publicClient.estimateContractGas({
    address: verifier.address,
    abi: verifier.abi,
    functionName: "verifyProof",
    args: [callArgs.a, callArgs.b, callArgs.c, callArgs.input],
    account: user.account,
  });
  console.log(`[MEASURED] PramaanVerifier.verifyProof Gas: ${verifierGasEstimate.toString()} gas`);

  // Measure verifyAndRecord gas via execution receipt
  const txHash = await registry.write.verifyAndRecord(
    [callArgs.a, callArgs.b, callArgs.c, callArgs.input],
    { account: user.account }
  );
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  const verifyAndRecordGas = Number(receipt.gasUsed);
  console.log(`[MEASURED] PramaanRegistry.verifyAndRecord Gas: ${verifyAndRecordGas} gas`);

  const gasReport = {
    timestamp: new Date().toISOString(),
    environment: "Local EVM / PrecompileProbe Harness",
    chainId,
    precompiles: {
      "0x06_ecAdd": {
        measuredGas: ecAddGas,
        status: "MEASURED(LOCAL_EVM)",
        description: "BN254 curve point addition",
      },
      "0x07_ecMul": {
        measuredGas: ecMulGas,
        status: "MEASURED(LOCAL_EVM)",
        description: "BN254 curve scalar multiplication",
      },
      "0x08_ecPairing": {
        measuredGas: ecPairingGas,
        status: "MEASURED(LOCAL_EVM)",
        description: "BN254 curve bilinear pairing check",
      },
    },
    contracts: {
      PramaanVerifier_verifyProof: {
        measuredGas: Number(verifierGasEstimate),
        status: "MEASURED(LOCAL_EVM)",
      },
      PramaanRegistry_verifyAndRecord: {
        measuredGas: verifyAndRecordGas,
        status: "MEASURED(LOCAL_EVM)",
      },
    },
    blockGasLimitComparison: {
      officialDocumentationClaim: "15,000,000 / 30,000,000",
      measuredCoralTestnetLive: 30000000,
      measuredLegacyTestnetLive: 55000000,
      measuredMainnetLive: 30000000,
      discrepancyNote: "Official MST docs claim 15M/30M. Live Coral RPC reports 30M (0x1c9c380). Live Legacy testnet reports 55M (0x3473bc0). Live Mainnet reports 30M (0x1c9c380). Recorded as-is per Prime Directive 1 & 2.",
    },
  };

  const outPath = path.resolve(process.cwd(), "docs/evidence/gas-measured.json");
  fs.writeFileSync(outPath, JSON.stringify(gasReport, null, 2));
  console.log(`\n[SAVED] Gas measurements written to: ${outPath}\n`);
}

main().catch((err) => {
  console.error("Gas measurement failed:", err);
  process.exit(1);
});
