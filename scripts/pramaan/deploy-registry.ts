import fs from "fs";
import path from "path";
import hre from "hardhat";
import { defineChain } from "viem";
import { NETWORKS, assertBroadcastAllowed, getActiveChainMode } from "../../config/networks.ts";
import { getDemoIssuer } from "./crypto-utils.ts";

async function main() {
  const networkSlot = (hre as any).network?.name || getActiveChainMode();
  console.log(`\n=== Deploying Pramaan-ZK Contracts to: ${networkSlot} ===`);

  const viem = (hre as any).viem;
  let deployOptions: any = {};
  const isLiveNetwork = networkSlot !== "hardhat" && networkSlot !== "localhost" && networkSlot !== "local";

  let publicClient: any;
  let walletClient: any;
  let config: any = null;

  if (isLiveNetwork) {
    config = NETWORKS[networkSlot];
    if (!config) {
      throw new Error(`Unknown network: ${networkSlot}`);
    }

    const customChain = defineChain({
      id: config.chainId,
      name: config.name,
      nativeCurrency: { name: config.symbol, symbol: config.symbol, decimals: 18 },
      rpcUrls: { default: { http: [config.rpcUrl] } },
      blockExplorers: config.explorerUrl ? { default: { name: "Explorer", url: config.explorerUrl } } : undefined,
    });
    publicClient = await viem.getPublicClient({ chain: customChain });
    const actualChainId = await publicClient.getChainId();
    await assertBroadcastAllowed(networkSlot, actualChainId, true);

    const walletClients = await viem.getWalletClients({ chain: customChain });
    walletClient = walletClients[0];

    deployOptions = {
      client: {
        public: publicClient,
        wallet: walletClient,
      },
    };
  } else {
    publicClient = await viem.getPublicClient();
    const walletClients = await viem.getWalletClients();
    walletClient = walletClients[0];
  }

  const deployerAddress = walletClient?.account?.address;
  console.log(`[Deployer Address]: ${deployerAddress || "Hardhat Default"}`);

  if (isLiveNetwork && deployerAddress) {
    const balance = await publicClient.getBalance({ address: deployerAddress });
    console.log(`[Deployer Balance]: ${balance.toString()} wei (${Number(balance) / 1e18} ${config.symbol})`);
    if (balance === 0n) {
      console.error(`\n[BLOCKED B-04] Deployer address ${deployerAddress} has 0 ${config.symbol} on ${networkSlot}!`);
      console.error(`Please fund this address using the faucet:`);
      if (networkSlot === "mstCoralTestnet") {
        console.error(`--> Coral Faucet: https://coral-faucet.mstblockchain.com/`);
      } else if (networkSlot === "mstLegacyTestnet") {
        console.error(`--> Legacy Faucet: https://faucet.mstblockchain.com/`);
      }
      console.error(`After funding, re-run: pnpm run deploy:${networkSlot === "mstCoralTestnet" ? "coral" : "legacy"}\n`);
      process.exit(1);
    }
  }

  // 1. Deploy PrecompileProbe
  console.log("--> Deploying PrecompileProbe.sol...");
  const probe = await viem.deployContract("PrecompileProbe", [], deployOptions);
  console.log(`[PASS] PrecompileProbe deployed at: ${probe.address}`);

  // 2. Deploy PramaanVerifier
  console.log("--> Deploying PramaanVerifier.sol...");
  const verifier = await viem.deployContract("PramaanVerifier", [], deployOptions);
  console.log(`[PASS] PramaanVerifier deployed at: ${verifier.address}`);

  // 3. Deploy PramaanRegistry
  console.log("--> Deploying PramaanRegistry.sol...");
  const registry = await viem.deployContract("PramaanRegistry", [verifier.address], deployOptions);
  console.log(`[PASS] PramaanRegistry deployed at: ${registry.address}`);

  // 4. Register Demo Issuer
  console.log("--> Registering Demo Issuer key hash...");
  const issuer = await getDemoIssuer();
  const regTxHash = await registry.write.registerIssuer([BigInt(issuer.pubKeyHash)], {
    account: walletClient.account,
  });
  console.log(`[WAIT] Awaiting transaction confirmation: ${regTxHash}...`);
  await publicClient.waitForTransactionReceipt({ hash: regTxHash });
  console.log(`[PASS] Demo Issuer registered: ${issuer.pubKeyHash} (tx: ${regTxHash})`);

  // Verify bytecodes via eth_getCode
  console.log("\n--> Verifying on-chain bytecode via eth_getCode...");
  const probeCode = await publicClient.getBytecode({ address: probe.address });
  const verifierCode = await publicClient.getBytecode({ address: verifier.address });
  const registryCode = await publicClient.getBytecode({ address: registry.address });

  if (!probeCode || probeCode === "0x") throw new Error(`PrecompileProbe bytecode empty at ${probe.address}`);
  if (!verifierCode || verifierCode === "0x") throw new Error(`PramaanVerifier bytecode empty at ${verifier.address}`);
  if (!registryCode || registryCode === "0x") throw new Error(`PramaanRegistry bytecode empty at ${registry.address}`);

  console.log(`[PASS] eth_getCode PrecompileProbe (${probe.address}): ${(probeCode.length - 2) / 2} bytes`);
  console.log(`[PASS] eth_getCode PramaanVerifier (${verifier.address}): ${(verifierCode.length - 2) / 2} bytes`);
  console.log(`[PASS] eth_getCode PramaanRegistry (${registry.address}): ${(registryCode.length - 2) / 2} bytes`);

  const dateStr = new Date().toISOString().split("T")[0];
  const explorerBase = config?.explorerUrl || "";

  const deploymentData = {
    network: networkSlot,
    chainId: config?.chainId || 31337,
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    contracts: {
      PrecompileProbe: {
        address: probe.address,
        codeBytes: (probeCode.length - 2) / 2,
        explorerUrl: explorerBase ? `${explorerBase}/address/${probe.address}` : undefined,
      },
      PramaanVerifier: {
        address: verifier.address,
        codeBytes: (verifierCode.length - 2) / 2,
        explorerUrl: explorerBase ? `${explorerBase}/address/${verifier.address}` : undefined,
      },
      PramaanRegistry: {
        address: registry.address,
        codeBytes: (registryCode.length - 2) / 2,
        explorerUrl: explorerBase ? `${explorerBase}/address/${registry.address}` : undefined,
      },
    },
    demoIssuerRegistration: {
      pubKeyHash: issuer.pubKeyHash,
      txHash: regTxHash,
      explorerUrl: explorerBase && regTxHash ? `${explorerBase}/tx/${regTxHash}` : undefined,
    },
  };

  // Save to contracts/deployed-addresses.json
  const outDir = path.resolve(process.cwd(), "contracts");
  fs.writeFileSync(
    path.join(outDir, "deployed-addresses.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  // Save to docs/evidence/
  const dirName = isLiveNetwork
    ? (networkSlot === "mstCoralTestnet" ? `testnet-coral-${dateStr}` : `testnet-${networkSlot}-${dateStr}`)
    : "";
  const evidenceDir = isLiveNetwork
    ? path.resolve(process.cwd(), `docs/evidence/${dirName}`)
    : path.resolve(process.cwd(), `docs/evidence`);
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  const evidenceFile = isLiveNetwork
    ? path.join(evidenceDir, "deployment.json")
    : path.join(evidenceDir, `registry-deployment-${networkSlot}.json`);
  fs.writeFileSync(evidenceFile, JSON.stringify(deploymentData, null, 2));

  // If Coral, also write to testnet-mstCoralTestnet-${dateStr} for complete alias coverage
  if (networkSlot === "mstCoralTestnet") {
    const aliasDir = path.resolve(process.cwd(), `docs/evidence/testnet-mstCoralTestnet-${dateStr}`);
    if (!fs.existsSync(aliasDir)) {
      fs.mkdirSync(aliasDir, { recursive: true });
    }
    fs.writeFileSync(path.join(aliasDir, "deployment.json"), JSON.stringify(deploymentData, null, 2));
  }

  console.log(`\n[SUCCESS] Deployed addresses recorded to: contracts/deployed-addresses.json`);
  console.log(`[SUCCESS] Evidence recorded to: ${evidenceFile}\n`);
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
