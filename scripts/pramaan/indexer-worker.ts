/**
 * scripts/pramaan/indexer-worker.ts
 * 
 * Standalone Production Worker for Pramaan-ZK Blockchain Indexer
 * Features:
 * - Resumable cursor from PostgreSQL
 * - Safe target confirmations buffer against shallow reorgs
 * - Parent hash verification & automatic reorg rollback
 * - Exponential backoff on RPC failures
 * - Graceful shutdown on SIGTERM / SIGINT
 */

import dotenv from "dotenv";
import { db } from "../../server/db/index.ts";
import { PersistentIndexer } from "../../server/services/indexerService.ts";
import { logger } from "../../server/services/logger.ts";

dotenv.config();

const CHAIN_ID = 54635;
const REGISTRY_ADDRESS: `0x${string}` = "0x39f842043b7de6421ae21d5e4c955dd6cbaa415b";
const RPC_URL = process.env.MST_CORAL_TESTNET_RPC || "https://coralrpc.mstblockchain.com";
const START_BLOCK = 406200n; // Deployment block of the active PramaanRegistry

let isTerminating = false;

async function main() {
  console.log("==============================================================");
  console.log("          Pramaan-ZK Persistent Blockchain Indexer            ");
  console.log("==============================================================");
  console.log(`[Config] Chain ID: ${CHAIN_ID}`);
  console.log(`[Config] Target Registry: ${REGISTRY_ADDRESS}`);
  console.log(`[Config] RPC Endpoint: ${RPC_URL}`);

  await db.init();

  const indexer = new PersistentIndexer({
    chainId: CHAIN_ID,
    registryAddress: REGISTRY_ADDRESS,
    rpcUrl: RPC_URL,
    startBlock: START_BLOCK,
    confirmations: 2,
  });

  const status = await indexer.getStatus();
  console.log(`[Status] Initial cursor block: ${status.lastProcessedBlock} | Current chain block: ${status.latestChainBlock} | Lag: ${status.blockLag}`);

  let consecutiveErrors = 0;

  async function loop() {
    if (isTerminating) return;

    try {
      const res = await indexer.processNextBatch(100n);
      if (res.eventsFound > 0) {
        console.log(`[Event Ingested] Processed to block ${res.processedTo}. Found ${res.eventsFound} new event(s).`);
      }
      consecutiveErrors = 0;
    } catch (err: any) {
      consecutiveErrors++;
      const backoffSec = Math.min(30, Math.pow(2, consecutiveErrors));
      console.warn(`[Indexer Warning] Batch processing error: ${err.message}. Retrying in ${backoffSec}s...`);
      await new Promise((resolve) => setTimeout(resolve, backoffSec * 1000));
    }

    if (!isTerminating) {
      setTimeout(loop, 4000); // Poll every 4 seconds (MST Coral block time ~2s)
    }
  }

  // Graceful termination
  process.on("SIGINT", async () => {
    console.log("\n[Indexer] Received SIGINT. Shutting down cleanly...");
    isTerminating = true;
    await db.close().catch(() => {});
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n[Indexer] Received SIGTERM. Shutting down cleanly...");
    isTerminating = true;
    await db.close().catch(() => {});
    process.exit(0);
  });

  // Start polling loop
  loop();
}

main().catch((err) => {
  console.error("[FATAL] Indexer worker crash:", err);
  process.exit(1);
});
