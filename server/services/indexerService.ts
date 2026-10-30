import { createPublicClient, http, parseAbiItem } from "viem";
import { db } from "../db/index.ts";
import type { VerifiedEventRecord } from "../db/index.ts";

export interface IndexerConfig {
  chainId: number;
  rpcUrl: string;
  registryAddress: `0x${string}`;
  startBlock?: bigint;
  confirmations?: number; // Safe buffer against shallow reorgs
}

export const PROOF_VERIFIED_EVENT_ABI = parseAbiItem(
  "event ProofVerifiedAndRecorded(uint256 indexed scopeId, uint256 indexed nullifier, address indexed recipient)"
);

export class PersistentIndexer {
  private config: IndexerConfig;
  private client: ReturnType<typeof createPublicClient>;
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(config: IndexerConfig) {
    this.config = {
      ...config,
      confirmations: config.confirmations ?? 6,
    };
    this.client = createPublicClient({
      transport: http(config.rpcUrl),
    });
  }

  public async getStatus() {
    const cursor = await db.getIndexerCursor(this.config.chainId);
    let latestBlock = 0n;
    try {
      latestBlock = await this.client.getBlockNumber();
    } catch {
      // offline or testing
    }
    const lastProcessed = cursor ? cursor.lastProcessedBlock : 0n;
    const lag = latestBlock > lastProcessed ? latestBlock - lastProcessed : 0n;
    const events = await db.getVerifiedEvents(this.config.chainId, 100);

    return {
      chainId: this.config.chainId,
      lastProcessedBlock: lastProcessed.toString(),
      latestChainBlock: latestBlock.toString(),
      blockLag: lag.toString(),
      totalIndexedEvents: events.length,
      lastProcessedHash: cursor?.lastProcessedHash || null,
      updatedAt: cursor?.updatedAt || null,
    };
  }

  public async processNextBatch(maxBlocks = 50n): Promise<{ processedTo: bigint; eventsFound: number }> {
    const latest = await this.client.getBlockNumber();
    const safeTarget = latest >= BigInt(this.config.confirmations!)
      ? latest - BigInt(this.config.confirmations!)
      : latest;

    const cursor = await db.getIndexerCursor(this.config.chainId);
    let fromBlock = cursor
      ? cursor.lastProcessedBlock + 1n
      : (this.config.startBlock ?? (safeTarget > 20n ? safeTarget - 20n : 0n));

    if (fromBlock > safeTarget) {
      return { processedTo: fromBlock - 1n, eventsFound: 0 };
    }

    const toBlock = fromBlock + maxBlocks > safeTarget ? safeTarget : fromBlock + maxBlocks;

    // 1. Reorg check: If we have a previous cursor hash, check if the parent of fromBlock matches
    if (cursor && cursor.lastProcessedHash) {
      try {
        const fromBlockHeader = await this.client.getBlock({ blockNumber: fromBlock });
        if (fromBlockHeader && fromBlockHeader.parentHash !== cursor.lastProcessedHash) {
          // Reorg detected!
          console.warn(`[Indexer] Reorg detected at block ${fromBlock}. Rolling back 6 blocks...`);
          const rollbackTo = fromBlock > 6n ? fromBlock - 6n : 0n;
          await db.rollbackEventsAfterBlock(this.config.chainId, rollbackTo);
          const rollbackHeader = await this.client.getBlock({ blockNumber: rollbackTo });
          await db.setIndexerCursor(this.config.chainId, rollbackTo, rollbackHeader.hash || "0x");
          return { processedTo: rollbackTo, eventsFound: 0 };
        }
      } catch (err) {
        // continue if RPC fails block lookup
      }
    }

    // 2. Fetch logs for ProofVerifiedAndRecorded
    let logs: any[] = [];
    try {
      logs = await this.client.getLogs({
        address: this.config.registryAddress,
        event: PROOF_VERIFIED_EVENT_ABI,
        fromBlock,
        toBlock,
      });
    } catch (err: any) {
      console.warn(`[Indexer] Log query failed for blocks ${fromBlock}-${toBlock}:`, err?.message || err);
      return { processedTo: fromBlock - 1n, eventsFound: 0 };
    }

    // 3. Ingest events idempotently
    let eventsFound = 0;
    for (const log of logs) {
      const { args, blockNumber, blockHash, transactionHash } = log;
      if (!args || !blockNumber || !blockHash || !transactionHash) continue;

      const record: VerifiedEventRecord = {
        id: `${this.config.chainId}-${transactionHash}-${log.logIndex}`,
        chainId: this.config.chainId,
        blockNumber,
        blockHash,
        txHash: transactionHash,
        scopeId: (args.scopeId as bigint).toString(),
        nullifier: (args.nullifier as bigint).toString(),
        recipient: (args.recipient as string).toLowerCase(),
        timestamp: new Date(),
      };

      const inserted = await db.recordVerifiedEvent(record);
      if (inserted) eventsFound++;
    }

    // 4. Update cursor
    const toBlockHeader = await this.client.getBlock({ blockNumber: toBlock });
    await db.setIndexerCursor(this.config.chainId, toBlock, toBlockHeader.hash || "0x");

    return { processedTo: toBlock, eventsFound };
  }

  public start(pollIntervalMs = 5000): void {
    if (this.isRunning) return;
    this.isRunning = true;
    const run = async () => {
      if (!this.isRunning) return;
      try {
        await this.processNextBatch();
      } catch (err: any) {
        // keep running despite errors
      }
      if (this.isRunning) {
        this.timer = setTimeout(run, pollIntervalMs);
      }
    };
    run();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
