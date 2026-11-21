/**
 * scripts/pramaan/issuer-admin.ts
 * 
 * Administrative Tooling for Pramaan-ZK Attestation Authority
 * Commands:
 *   pnpm issuer:status   - Inspect active issuer key hash and on-chain registration state
 *   pnpm issuer:register - Register active issuer key hash on active PramaanRegistry using deployer key from local .env
 */

import dotenv from "dotenv";
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";
import { getOrInitIssuerKey } from "../../server/services/issuerKeyService.ts";
import { db } from "../../server/db/index.ts";

dotenv.config();

const CORAL_CHAIN = defineChain({
  id: 54635,
  name: "MST Coral Testnet",
  nativeCurrency: { name: "tMSTC", symbol: "tMSTC", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.MST_CORAL_TESTNET_RPC || "https://coralrpc.mstblockchain.com"] },
  },
  blockExplorers: {
    default: { name: "CoralScan", url: "https://coral.mstscan.com" },
  },
});

const REGISTRY_ADDRESS: `0x${string}` = "0x39f842043b7de6421ae21d5e4c955dd6cbaa415b";

const REGISTRY_ABI = parseAbi([
  "function registeredIssuers(uint256 issuerKeyHash) external view returns (bool)",
  "function registerIssuer(uint256 issuerKeyHash) external",
  "function owner() external view returns (address)",
]);

async function main() {
  const mode = process.argv[2] || "status";

  await db.init().catch(() => {
    // If DB fails to connect, fallback in test/dev mode is handled
  });

  const issuer = await getOrInitIssuerKey();
  const hashBigInt = BigInt(issuer.pubKeyHash);

  const publicClient = createPublicClient({
    chain: CORAL_CHAIN,
    transport: http(),
  });

  const isRegistered = await publicClient.readContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: "registeredIssuers",
    args: [hashBigInt],
  });

  const contractOwner = await publicClient.readContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: "owner",
  });

  console.log("==============================================================");
  console.log("          Pramaan-ZK Issuer Authority & Registry State        ");
  console.log("==============================================================");
  console.log(`[Algorithm]         ${issuer.algorithm || "BabyJubjub EdDSA (Poseidon)"}`);
  console.log(`[Public Key Ax]     ${issuer.pubKeyAx}`);
  console.log(`[Public Key Ay]     ${issuer.pubKeyAy}`);
  console.log(`[Public Key Hash]   ${issuer.pubKeyHash}`);
  console.log(`[Target Registry]   ${REGISTRY_ADDRESS}`);
  console.log(`[Registry Owner]    ${contractOwner}`);
  console.log(`[On-Chain Status]   ${isRegistered ? "REGISTERED (ACTIVE)" : "UNREGISTERED (BLOCKED)"}`);
  console.log("==============================================================");

  if (mode === "status") {
    process.exit(0);
  }

  if (mode === "register") {
    if (isRegistered) {
      console.log("[Notice] Issuer key hash is already registered on PramaanRegistry. No action needed.");
      process.exit(0);
    }

    const rawKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!rawKey) {
      console.error("[FATAL ERROR] DEPLOYER_PRIVATE_KEY missing from local .env. Cannot sign registration transaction.");
      process.exit(1);
    }

    const formattedKey = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;
    const account = privateKeyToAccount(formattedKey);

    if (account.address.toLowerCase() !== contractOwner.toLowerCase()) {
      console.error(`[FATAL ERROR] Deployer key (${account.address}) is not the contract owner (${contractOwner}). Access denied.`);
      process.exit(1);
    }

    console.log(`[Transaction] Submitting registerIssuer(${issuer.pubKeyHash})...`);
    const walletClient = createWalletClient({
      account,
      chain: CORAL_CHAIN,
      transport: http(),
    });

    const hash = await walletClient.writeContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: "registerIssuer",
      args: [hashBigInt],
    });

    console.log(`[Submitted] Tx Hash: ${hash}`);
    console.log(`[Awaiting Confirmation] Waiting for block mining on Coral...`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`[CONFIRMED] Transaction mined in Block ${receipt.blockNumber}! Gas used: ${receipt.gasUsed}`);
    console.log(`[Explorer Link] https://coral.mstscan.com/tx/${hash}`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("[ERROR]", err.message || err);
  process.exit(1);
});
