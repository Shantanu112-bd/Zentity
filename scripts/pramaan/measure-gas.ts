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
  console.log(`\n=== Measuring Native Precompile & Verifier Gas Consumption [Target: ${networkSlot}] ===`);

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

  // Load vectors
  const vectorsPath = path.resolve(process.cwd(), "scripts/gate0/vectors.json");
  const vectors = JSON.parse(fs.readFileSync(vectorsPath, "utf-8"));

  let probe: any;
  let verifier: any;
  let registry: any;

  if (isLiveNetwork) {
    const deployedPath = path.resolve(process.cwd(), "contracts/deployed-addresses.json");
    if (!fs.existsSync(deployedPath)) {
      throw new Error("No contracts/deployed-addresses.json found. Run pnpm run deploy:coral first!");
    }
    const deployed = JSON.parse(fs.readFileSync(deployedPath, "utf-8"));
    console.log(`--> Attaching to deployed contracts on ${networkSlot}:`);
    console.log(`    PrecompileProbe: ${deployed.contracts.PrecompileProbe.address}`);
    console.log(`    PramaanVerifier: ${deployed.contracts.PramaanVerifier.address}`);
    console.log(`    PramaanRegistry: ${deployed.contracts.PramaanRegistry.address}`);

    probe = await viem.getContractAt("PrecompileProbe", deployed.contracts.PrecompileProbe.address, {
      client: { public: publicClient, wallet: walletClient },
    });
    verifier = await viem.getContractAt("PramaanVerifier", deployed.contracts.PramaanVerifier.address, {
      client: { public: publicClient, wallet: walletClient },
    });
    registry = await viem.getContractAt("PramaanRegistry", deployed.contracts.PramaanRegistry.address, {
      client: { public: publicClient, wallet: walletClient },
    });
  } else {
    console.log("--> Deploying PrecompileProbe, PramaanVerifier, and PramaanRegistry locally...");
    probe = await viem.deployContract("PrecompileProbe");
    verifier = await viem.deployContract("PramaanVerifier");
    registry = await viem.deployContract("PramaanRegistry", [verifier.address]);

    const issuer = await getDemoIssuer();
    await registry.write.registerIssuer([BigInt(issuer.pubKeyHash)]);
  }

  // 1. Probe native precompiles via PrecompileProbe
  console.log("\n--> Probing native precompiles on target network...");
  const addRes = await probe.read.probeAdd([vectors.ecAdd.valid.input]);
  const ecAddGas = Number(addRes.gasUsed);
  console.log(`[MEASURED] 0x06 ecAdd Gas: ${ecAddGas} gas`);

  const mulRes = await probe.read.probeMul([vectors.ecMul.valid.input]);
  const ecMulGas = Number(mulRes.gasUsed);
  console.log(`[MEASURED] 0x07 ecMul Gas: ${ecMulGas} gas`);

  const pairingRes = await probe.read.probePairing([vectors.ecPairing.validIdentity.input]);
  const ecPairingGas = Number(pairingRes.gasUsed);
  console.log(`[MEASURED] 0x08 ecPairing Gas: ${ecPairingGas} gas`);

  // 2. Generate valid proof for on-chain verification
  console.log("\n--> Generating valid Groth16 adult proof for target chain...");
  const wasmPath = path.resolve(process.cwd(), "circuits/pramaan/age_credential_js/age_credential.wasm");
  const zkeyPath = path.resolve(process.cwd(), "circuits/pramaan/age_credential_final.zkey");

  // Pick a random scopeId to avoid nullifier collision if run multiple times
  const uniqueScopeId = Math.floor(Date.now() / 1000);
  const cred = await issueSyntheticCredential({ dobDays: 10000, stateCode: 27 });
  const circuitInput = await createCircuitInput({
    credential: cred,
    scopeId: uniqueScopeId,
    recipient: walletClient.account.address,
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
    account: walletClient.account,
  });
  console.log(`[MEASURED] PramaanVerifier.verifyProof Gas: ${verifierGasEstimate.toString()} gas`);

  // Measure verifyAndRecord gas via live transaction receipt
  console.log(`--> Broadcasting verifyAndRecord on ${networkSlot} (Scope ${uniqueScopeId})...`);
  const txHash = await registry.write.verifyAndRecord(
    [callArgs.a, callArgs.b, callArgs.c, callArgs.input],
    { account: walletClient.account }
  );
  console.log(`[WAIT] Awaiting transaction confirmation: ${txHash}...`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  const verifyAndRecordGas = Number(receipt.gasUsed);
  console.log(`[MEASURED] PramaanRegistry.verifyAndRecord Gas: ${verifyAndRecordGas} gas (status: ${receipt.status})`);

  // Build comprehensive report with LOCAL vs LIVE separation
  const gasReport = {
    timestamp: new Date().toISOString(),
    network: networkSlot,
    chainId,
    environment: isLiveNetwork ? `MST Live Testnet (${config?.name || networkSlot})` : "Local EVM (Hardhat node 31337)",
    contracts: {
      PrecompileProbe: probe.address,
      PramaanVerifier: verifier.address,
      PramaanRegistry: registry.address,
    },
    measuredOnChain: {
      "0x06_ecAdd": {
        measuredGas: ecAddGas,
        targetBudget: "<= 1,000 gas",
        status: isLiveNetwork ? "MEASURED (MST_CORAL_TESTNET)" : "MEASURED (LOCAL_EVM)",
        description: "BN254 curve point addition via native precompile staticcall",
      },
      "0x07_ecMul": {
        measuredGas: ecMulGas,
        targetBudget: "<= 10,000 gas",
        status: isLiveNetwork ? "MEASURED (MST_CORAL_TESTNET)" : "MEASURED (LOCAL_EVM)",
        description: "BN254 curve scalar multiplication via native precompile staticcall",
      },
      "0x08_ecPairing": {
        measuredGas: ecPairingGas,
        targetBudget: "<= 150,000 gas",
        status: isLiveNetwork ? "MEASURED (MST_CORAL_TESTNET)" : "MEASURED (LOCAL_EVM)",
        description: "BN254 curve bilinear pairing check via native precompile staticcall",
      },
      PramaanVerifier_verifyProof: {
        measuredGas: Number(verifierGasEstimate),
        targetBudget: "<= 300,000 gas",
        status: isLiveNetwork ? "MEASURED (MST_CORAL_TESTNET)" : "MEASURED (LOCAL_EVM)",
      },
      PramaanRegistry_verifyAndRecord: {
        measuredGas: verifyAndRecordGas,
        targetBudget: "<= 350,000 gas",
        txHash: txHash,
        explorerUrl: config?.explorerUrl ? `${config.explorerUrl}/tx/${txHash}` : undefined,
        status: isLiveNetwork ? "MEASURED (MST_CORAL_TESTNET)" : "MEASURED (LOCAL_EVM)",
      },
    },
    earlierLocalBenchmarks: {
      note: "Relabeled as LOCAL figures from Hardhat Node (Chain 31337) prior to Coral testnet deployment",
      local_0x06_ecAdd: 552,
      local_0x07_ecMul: 6396,
      local_0x08_ecPairing: 113447,
      local_verifyProof: 255949,
      local_verifyAndRecord: 288846,
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

  if (isLiveNetwork) {
    const coralDir = path.resolve(process.cwd(), `docs/evidence/testnet-coral-${new Date().toISOString().split("T")[0]}`);
    if (fs.existsSync(coralDir)) {
      fs.writeFileSync(path.join(coralDir, "gas-measured.json"), JSON.stringify(gasReport, null, 2));
    }
  }
}

main().catch((err) => {
  console.error("Gas measurement failed:", err);
  process.exit(1);
});
