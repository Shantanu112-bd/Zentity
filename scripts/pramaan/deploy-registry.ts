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

  if (networkSlot !== "hardhat" && networkSlot !== "localhost" && networkSlot !== "local") {
    const config = NETWORKS[networkSlot];
    if (!config) {
      throw new Error(`Unknown network: ${networkSlot}`);
    }

    const publicClient = await viem.getPublicClient();
    const actualChainId = await publicClient.getChainId();
    await assertBroadcastAllowed(networkSlot, actualChainId, true);

    const customChain = defineChain({
      id: config.chainId,
      name: config.name,
      nativeCurrency: { name: config.symbol, symbol: config.symbol, decimals: 18 },
      rpcUrls: { default: { http: [config.rpcUrl] } },
    });
    deployOptions = { chain: customChain };
  }

  // 1. Deploy PramaanVerifier
  console.log("--> Deploying PramaanVerifier.sol...");
  const verifier = await viem.deployContract("PramaanVerifier", [], deployOptions);
  console.log(`[PASS] PramaanVerifier deployed at: ${verifier.address}`);

  // 2. Deploy PramaanRegistry
  console.log("--> Deploying PramaanRegistry.sol...");
  const registry = await viem.deployContract("PramaanRegistry", [verifier.address], deployOptions);
  console.log(`[PASS] PramaanRegistry deployed at: ${registry.address}`);

  // 3. Register Demo Issuer
  console.log("--> Registering Demo Issuer key hash...");
  const issuer = await getDemoIssuer();
  const txHash = await registry.write.registerIssuer([BigInt(issuer.pubKeyHash)], deployOptions);
  console.log(`[PASS] Demo Issuer registered: ${issuer.pubKeyHash}`);

  // 4. Save deployed addresses
  const deployedAddresses = {
    network: networkSlot,
    timestamp: new Date().toISOString(),
    contracts: {
      PramaanVerifier: verifier.address,
      PramaanRegistry: registry.address,
    },
    demoIssuerPubKeyHash: issuer.pubKeyHash,
  };

  const outDir = path.resolve(process.cwd(), "contracts");
  fs.writeFileSync(
    path.join(outDir, "deployed-addresses.json"),
    JSON.stringify(deployedAddresses, null, 2)
  );

  const evidencePath = path.resolve(
    process.cwd(),
    `docs/evidence/registry-deployment-${networkSlot}.json`
  );
  fs.writeFileSync(evidencePath, JSON.stringify(deployedAddresses, null, 2));

  console.log(`[SUCCESS] Deployed addresses recorded to: contracts/deployed-addresses.json`);
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
