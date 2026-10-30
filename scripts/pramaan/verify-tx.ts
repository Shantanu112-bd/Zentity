import { createPublicClient, http, defineChain, parseAbiItem, decodeEventLog } from "viem";
import fs from "fs";
import path from "path";
import { db } from "../../server/db/index.ts";
import { DEFAULT_CORAL, DEFAULT_LEGACY, PRAMAAN_REGISTRY_ABI } from "../../frontend/src/core/config.ts";

async function main() {
  const txHash = process.argv[2]?.trim();

  if (!txHash || !txHash.startsWith("0x")) {
    console.error("Usage: pnpm verify:tx <0xTransactionHash>");
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`[Pramaan-ZK On-Chain Transaction Verification Audit]`);
  console.log(`Transaction Hash: ${txHash}`);
  console.log(`Target Network:   MST Coral Testnet (${DEFAULT_CORAL.chainId})`);
  console.log(`======================================================\n`);

  const coralChain = defineChain({
    id: DEFAULT_CORAL.chainId,
    name: DEFAULT_CORAL.name,
    nativeCurrency: { decimals: 18, name: "tMSTC", symbol: "tMSTC" },
    rpcUrls: { default: { http: [DEFAULT_CORAL.rpcUrl] } }
  });

  const client = createPublicClient({
    chain: coralChain,
    transport: http(DEFAULT_CORAL.rpcUrl)
  });

  // 1. Fetch Receipt
  console.log(`[1/6] Fetching transaction receipt from Coral RPC...`);
  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
  } catch (err: any) {
    console.error(`Failed to fetch receipt: ${err.message}`);
    process.exit(1);
  }

  const isSuccess = receipt.status === "success";
  const targetAddress = receipt.to?.toLowerCase();
  const isNewRegistry = targetAddress === DEFAULT_CORAL.registryAddress.toLowerCase();
  const isOldRegistry = targetAddress === DEFAULT_LEGACY.registryAddress.toLowerCase();

  console.log(`  - Block Number: ${receipt.blockNumber}`);
  console.log(`  - Gas Used:     ${receipt.gasUsed.toString()} gas`);
  console.log(`  - Status:       ${receipt.status.toUpperCase()}`);
  console.log(`  - Target To:    ${receipt.to} (${isNewRegistry ? "ACTIVE REGISTRY" : isOldRegistry ? "DEPRECATED OLD REGISTRY" : "CUSTOM/UNKNOWN"})`);

  if (!isSuccess) {
    console.error(`Transaction was REVERTED on-chain.`);
    process.exit(1);
  }

  // 2. Decode ProofVerifiedAndRecorded event
  console.log(`\n[2/6] Decoding transaction logs for ProofVerifiedAndRecorded event...`);
  const proofEventAbi = parseAbiItem(
    "event ProofVerifiedAndRecorded(uint256 indexed scopeId, uint256 indexed nullifier, address indexed recipient)"
  );

  let decodedEvent: { scopeId: string; nullifier: string; recipient: string } | null = null;

  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: [proofEventAbi],
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === "ProofVerifiedAndRecorded") {
        decodedEvent = {
          scopeId: decoded.args.scopeId.toString(),
          nullifier: decoded.args.nullifier.toString(),
          recipient: decoded.args.recipient,
        };
        break;
      }
    } catch {
      // Non-matching log item, continue
    }
  }

  if (decodedEvent) {
    console.log(`  - Scope ID:     ${decodedEvent.scopeId}`);
    console.log(`  - Nullifier:    ${decodedEvent.nullifier}`);
    console.log(`  - Recipient:    ${decodedEvent.recipient}`);
  } else {
    console.log(`  - Notice: No ProofVerifiedAndRecorded event emitted in this transaction.`);
  }

  // 3. Verify on-chain contract state
  console.log(`\n[3/6] Reading registry contract state for nullifier...`);
  let isNullifierSpentOnChain: boolean | null = null;
  if (decodedEvent && receipt.to) {
    try {
      isNullifierSpentOnChain = await client.readContract({
        address: receipt.to,
        abi: PRAMAAN_REGISTRY_ABI,
        functionName: "isNullifierSpent",
        args: [BigInt(decodedEvent.scopeId), BigInt(decodedEvent.nullifier)],
      });
      console.log(`  - isNullifierSpent on-chain: ${isNullifierSpentOnChain} (${isNullifierSpentOnChain ? "CONFIRMED RECORDED" : "UNSPENT"})`);
    } catch (err: any) {
      console.warn(`  - Warning reading nullifier state: ${err.message}`);
    }
  }

  // 4. Compare with Persistent Indexer
  console.log(`\n[4/6] Comparing against persistent database indexer...`);
  await db.init();
  const indexedEvents = await db.getVerifiedEvents(DEFAULT_CORAL.chainId, 200);
  const matchedIndexerRecord = indexedEvents.find(
    (e) => e.txHash.toLowerCase() === txHash.toLowerCase()
  );
  console.log(`  - Matched in Indexer DB: ${matchedIndexerRecord ? "YES (SYNCHRONIZED)" : "NO (Awaiting Indexer Batch)"}`);

  // 5. Query Blockscout explorer
  console.log(`\n[5/6] Verifying explorer endpoint...`);
  const explorerUrl = `${DEFAULT_CORAL.explorerUrl}/tx/${txHash}`;
  let explorerReachable = false;
  try {
    const res = await fetch(explorerUrl, { method: "HEAD" });
    explorerReachable = res.status < 500;
    console.log(`  - Explorer URL: ${explorerUrl} (HTTP ${res.status})`);
  } catch {
    console.log(`  - Explorer URL: ${explorerUrl} (Unreachable or network timeout)`);
  }

  // 6. Write Sanitized Evidence File
  console.log(`\n[6/6] Writing sanitized evidence artifact to docs/evidence/...`);
  const evidence = {
    verifiedAt: new Date().toISOString(),
    transactionHash: txHash,
    network: {
      name: DEFAULT_CORAL.name,
      chainId: DEFAULT_CORAL.chainId,
      rpcUrl: DEFAULT_CORAL.rpcUrl,
    },
    receipt: {
      blockNumber: receipt.blockNumber.toString(),
      blockHash: receipt.blockHash,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
      to: receipt.to,
      contractTarget: isNewRegistry ? "ACTIVE_REGISTRY" : isOldRegistry ? "DEPRECATED_OLD_REGISTRY" : "CUSTOM",
    },
    eventDecoded: decodedEvent,
    registryState: {
      isNullifierSpent: isNullifierSpentOnChain,
    },
    indexerParity: {
      foundInDatabase: !!matchedIndexerRecord,
      storedScopeId: matchedIndexerRecord?.scopeId,
      storedNullifier: matchedIndexerRecord?.nullifier,
    },
    explorer: {
      url: explorerUrl,
      reachable: explorerReachable,
    },
  };

  const filename = `tx-${txHash.slice(0, 10)}.json`;
  const evidenceDir = path.resolve(process.cwd(), "docs/evidence");
  fs.mkdirSync(evidenceDir, { recursive: true });
  const evidencePath = path.join(evidenceDir, filename);
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

  console.log(`\n>>> Verification complete! Evidence saved: docs/evidence/${filename}\n`);
}

main().catch((err) => {
  console.error("Verification audit failed:", err);
  process.exit(1);
});
