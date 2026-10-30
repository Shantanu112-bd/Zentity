import { createPublicClient, http, defineChain, parseAbiItem } from "viem";
import { PersistentIndexer } from "../../server/services/indexerService.ts";
import { db } from "../../server/db/index.ts";
import fs from "fs";
import path from "path";

async function main() {
  console.log("=== Pramaan-ZK: Live Indexer vs Coral Registry Verification ===");

  const coralChain = defineChain({
    id: 54635,
    name: "MST Coral Testnet",
    nativeCurrency: { decimals: 18, name: "tMSTC", symbol: "tMSTC" },
    rpcUrls: { default: { http: ["https://coralrpc.mstblockchain.com"] } }
  });

  const client = createPublicClient({
    chain: coralChain,
    transport: http("https://coralrpc.mstblockchain.com")
  });

  const registryAddress = "0x39f842043b7de6421ae21d5e4c955dd6cbaa415b";
  const startBlock = 406200n;
  const currentBlock = await client.getBlockNumber();

  console.log(`Querying Coral RPC directly for live event logs...`);
  console.log(`Registry: ${registryAddress}`);
  console.log(`Block Range: ${startBlock} to ${currentBlock}`);

  const proofEventAbi = parseAbiItem(
    "event ProofVerifiedAndRecorded(uint256 indexed scopeId, uint256 indexed nullifier, address indexed recipient)"
  );

  const rawRpcLogs = await client.getLogs({
    address: registryAddress,
    event: proofEventAbi,
    fromBlock: startBlock,
    toBlock: currentBlock
  });

  console.log(`Raw RPC returned ${rawRpcLogs.length} ProofVerifiedAndRecorded event(s).`);

  const startBlockHeader = await client.getBlock({ blockNumber: startBlock - 1n });

  // Initialize DB and Indexer
  await db.init();
  const indexer = new PersistentIndexer({
    registryAddress,
    rpcUrl: "https://coralrpc.mstblockchain.com",
    chainId: 54635,
    confirmationDepth: 1, // Testnet instant sync
    pollIntervalMs: 1000
  });

  // Set indexer cursor to startBlock - 1 with true parent hash
  await db.setIndexerCursor(54635, startBlock - 1n, startBlockHeader.hash);

  console.log(`Running PersistentIndexer sync to current block (${currentBlock})...`);
  let processedTo = startBlock - 1n;
  let totalEventsFound = 0;
  while (processedTo < currentBlock) {
    const res = await indexer.processNextBatch(200n);
    totalEventsFound += res.eventsFound;
    if (res.processedTo <= processedTo) {
      break;
    }
    processedTo = res.processedTo;
    console.log(`  Processed up to block ${processedTo}... (events found so far: ${totalEventsFound})`);
  }

  // Fetch indexed events from DB
  const storedEvents = await db.getVerifiedEvents(54635, 100);
  console.log(`Indexer stored ${storedEvents.length} events in database.`);

  const comparison = {
    timestamp: new Date().toISOString(),
    network: "MST Coral Testnet (54635)",
    registryAddress,
    blockRange: {
      fromBlock: startBlock.toString(),
      toBlock: currentBlock.toString()
    },
    rawRpcLogsCount: rawRpcLogs.length,
    storedEventsCount: storedEvents.length,
    parity: rawRpcLogs.length === storedEvents.length,
    events: rawRpcLogs.map((log) => {
      const stored = storedEvents.find((e) => e.txHash.toLowerCase() === log.transactionHash.toLowerCase());
      return {
        txHash: log.transactionHash,
        blockNumber: log.blockNumber.toString(),
        scopeId: log.args.scopeId?.toString(),
        nullifier: log.args.nullifier?.toString(),
        recipient: log.args.recipient,
        indexedMatch: !!stored,
        storedScopeId: stored?.scopeId,
        storedNullifier: stored?.nullifier,
        storedRecipient: stored?.recipient
      };
    })
  };

  const evidencePath = path.resolve(process.cwd(), "docs/evidence/indexer-live-comparison.json");
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, JSON.stringify(comparison, null, 2));

  console.log(`\nComparison saved to: ${evidencePath}`);
  console.log(`Parity Status: ${comparison.parity ? "100% PARITY CONFIRMED" : "MISMATCH DETECTED"}`);

  if (!comparison.parity) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
