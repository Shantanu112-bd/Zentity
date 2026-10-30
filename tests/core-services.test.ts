/**
 * tests/core-services.test.ts
 * 
 * Headless Tests for Pramaan-ZK Core Services & Protocols (Phase 1)
 * Validates core business logic independent of any JSX / presentation layer.
 */

import assert from "node:assert";
import { formatCalldataForRegistry, generateProof } from "../frontend/src/core/prover.ts";
import {
  decodeRegistryReceipt,
  checkNullifierSpent,
  checkRegisteredIssuer,
  checkRegistryPaused,
} from "../frontend/src/core/contracts.ts";
import { DEFAULT_CORAL, DEFAULT_LEGACY, DEFAULT_LOCAL } from "../frontend/src/core/config.ts";
import { ApiClient } from "../frontend/src/core/api.ts";
import { buildApp } from "../server/app.ts";
import { encodeEventTopics } from "viem";
import hre from "hardhat";

describe("Pramaan-ZK Core Services & Headless Protocols (Phase 1)", function () {
  this.timeout(30000);

  let server: any;
  let serverPort: number;
  let apiClient: ApiClient;
  let registryContract: any;
  let verifierContract: any;

  before(async () => {
    // 1. Deploy local contracts for live read/write assertions
    const { viem } = hre;
    verifierContract = await viem.deployContract("PramaanVerifier");
    registryContract = await viem.deployContract("PramaanRegistry", [
      verifierContract.address,
    ]);

    // 2. Start fastify server on dynamic port
    server = await buildApp({ chainMode: "local" });
    await server.listen({ port: 0, host: "127.0.0.1" });
    serverPort = server.server.address().port;
    apiClient = new ApiClient(`http://127.0.0.1:${serverPort}`);
  });

  after(async () => {
    if (server) await server.close();
  });

  describe("1. Network & Configuration Invariants", () => {
    it("Default target network is MST Coral Testnet (54635)", () => {
      assert.strictEqual(DEFAULT_CORAL.chainId, 54635);
      assert.strictEqual(DEFAULT_CORAL.id, "mstCoralTestnet");
      assert.ok(DEFAULT_CORAL.rpcUrl.includes("coralrpc.mstblockchain.com"));
      assert.ok(DEFAULT_CORAL.explorerUrl?.includes("coral.mstscan.com"));
    });

    it("Legacy testnet is flagged with deprecation label", () => {
      assert.strictEqual(DEFAULT_LEGACY.chainId, 91562037);
      assert.ok(DEFAULT_LEGACY.label?.includes("SHUTDOWN 2027"));
    });

    it("Local network is configured for 31337", () => {
      assert.strictEqual(DEFAULT_LOCAL.chainId, 31337);
    });
  });

  describe("2. Calldata Formatting & Prover Helpers", () => {
    it("Formats SnarkJS string calldata into structured Groth16 calldata", () => {
      const mockCalldata = `["0x1", "0x2"], [["0x3", "0x4"], ["0x5", "0x6"]], ["0x7", "0x8"], ["0x9", "0xa"]`;
      const formatted = formatCalldataForRegistry(mockCalldata);

      assert.deepStrictEqual(formatted.a, ["0x1", "0x2"]);
      assert.deepStrictEqual(formatted.b, [["0x3", "0x4"], ["0x5", "0x6"]]);
      assert.deepStrictEqual(formatted.c, ["0x7", "0x8"]);
      assert.deepStrictEqual(formatted.pubSignals, ["0x9", "0xa"]);
    });

    it("Supports Prover AbortSignal cancellation cleanly", async () => {
      const controller = new AbortController();
      controller.abort(); // pre-aborted

      const mockCredential = {
        dobDays: 10000,
        stateCode: 27,
        credentialSecret: "12345",
        issuerPubKeyAx: "1",
        issuerPubKeyAy: "2",
        issuerPubKeyHash: "67890",
        sigR8x: "1",
        sigR8y: "2",
        sigS: "3",
        label: "DEMO ISSUER",
      };

      try {
        await generateProof(mockCredential, "123", "0x1234567890123456789012345678901234567890", 31337, {
          signal: controller.signal,
        });
        assert.fail("Should have aborted");
      } catch (err: any) {
        assert.ok(err.message.includes("aborted"));
      }
    });
  });

  describe("3. Receipt Decoding & Event Extraction", () => {
    it("Extracts ProofVerifiedAndRecorded event parameters from transaction receipt logs", () => {
      const scopeId = 999n;
      const nullifier = 88888n;
      const recipient = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

      const eventAbi = {
        name: "ProofVerifiedAndRecorded",
        type: "event",
        inputs: [
          { indexed: true, name: "scopeId", type: "uint256" },
          { indexed: true, name: "nullifier", type: "uint256" },
          { indexed: true, name: "recipient", type: "address" },
        ],
      } as const;

      const topics = encodeEventTopics({
        abi: [eventAbi],
        eventName: "ProofVerifiedAndRecorded",
        args: {
          scopeId,
          nullifier,
          recipient: recipient as `0x${string}`,
        },
      });

      const mockReceipt: any = {
        transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        blockNumber: 42n,
        gasUsed: 288882n,
        status: "success",
        logs: [
          {
            data: "0x",
            topics,
          },
        ],
      };

      const result = decodeRegistryReceipt(mockReceipt, "https://coral.mstscan.com");

      assert.strictEqual(result.status, "success");
      assert.strictEqual(result.blockNumber, 42n);
      assert.strictEqual(result.gasUsed, 288882n);
      assert.ok(result.explorerUrl?.includes(mockReceipt.transactionHash));
      assert.ok(result.eventDecoded !== undefined);
      assert.strictEqual(result.eventDecoded?.scopeId, scopeId);
      assert.strictEqual(result.eventDecoded?.nullifier, nullifier);
      assert.strictEqual(result.eventDecoded?.recipient.toLowerCase(), recipient.toLowerCase());
    });
  });

  describe("4. On-Chain Contract Read Services", () => {
    it("Queries nullifier status on PramaanRegistry", async () => {
      const isSpent = await checkNullifierSpent(
        registryContract.address,
        DEFAULT_LOCAL,
        1n,
        12345n,
        hre.network.provider
      );
      assert.strictEqual(isSpent, false);
    });

    it("Queries registered issuer status on PramaanRegistry", async () => {
      const isRegistered = await checkRegisteredIssuer(
        registryContract.address,
        DEFAULT_LOCAL,
        999999n,
        hre.network.provider
      );
      assert.strictEqual(isRegistered, false);
    });

    it("Queries contract paused state", async () => {
      const isPaused = await checkRegistryPaused(
        registryContract.address,
        DEFAULT_LOCAL,
        hre.network.provider
      );
      assert.strictEqual(isPaused, false);
    });
  });

  describe("5. Backend ApiClient Service", () => {
    it("Fetches registry info and chainMode", async () => {
      const info = await apiClient.getRegistryInfo();
      assert.ok(info.chainMode);
      assert.ok(info.networkSlot);
    });

    it("Issues testnet credential and returns honest notice", async () => {
      const res = await apiClient.issueTestnetCredential({
        dobDays: 10950,
        stateCode: 27,
      });

      assert.ok(res.notice?.includes("Synthetic credential"));
      assert.strictEqual(res.stateCode, 27);
      assert.ok(res.credential.dobDays);
      assert.ok(res.credential.sigR8x);
      assert.ok(res.credential.sigS);
    });

    it("Handles wallet authentication challenge lifecycle", async () => {
      const [wallet] = await hre.viem.getWalletClients();
      const address = wallet.account.address;

      const { nonce, message } = await apiClient.requestNonce(address);
      assert.strictEqual(typeof nonce, "string");
      assert.strictEqual(nonce.length, 64);
      assert.ok(message.includes(nonce));

      const signature = await wallet.signMessage({ message });
      const verifyRes = await apiClient.verifyAuth(address, signature, nonce);
      assert.strictEqual(verifyRes.status, "AUTHENTICATED");
      assert.strictEqual(verifyRes.address.toLowerCase(), address.toLowerCase());
    });
  });
});
