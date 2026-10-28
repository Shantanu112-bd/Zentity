import assert from "node:assert";
import { assertBroadcastAllowed, NETWORKS } from "../config/networks.ts";

describe("Network Guard: assertBroadcastAllowed", function () {
  it("aborts broadcast when chain ID mismatches configured slot", async function () {
    await assert.rejects(
      async () => {
        // Coral expects 54635, providing 12345
        await assertBroadcastAllowed("mstCoralTestnet", 12345);
      },
      {
        message: /\[Guard FATAL\] Chain ID mismatch for slot 'mstCoralTestnet'! Configured: 54635, RPC returned: 12345/,
      }
    );
  });

  it("strictly refuses write broadcast to Mainnet even if chain ID matches", async function () {
    await assert.rejects(
      async () => {
        // Mainnet chain ID is 4646
        await assertBroadcastAllowed("mstMainnet", 4646);
      },
      {
        message: /\[Guard FATAL\] Broadcast to Mainnet is prohibited prior to Milestone M10/,
      }
    );
  });

  it("refuses broadcast to unverified slots unless explicitly overridden", async function () {
    // Temporarily create or test with an unverified slot
    const originalStatus = NETWORKS.mstLegacyTestnet.status;
    try {
      (NETWORKS.mstLegacyTestnet as any).status = "unverified";
      await assert.rejects(
        async () => {
          await assertBroadcastAllowed("mstLegacyTestnet", 91562037, false);
        },
        {
          message: /\[Guard BLOCKED\] Network 'mstLegacyTestnet' is UNVERIFIED/,
        }
      );

      // Overriding with flag allows broadcast on unverified testnet
      await assert.doesNotReject(async () => {
        await assertBroadcastAllowed("mstLegacyTestnet", 91562037, true);
      });
    } finally {
      NETWORKS.mstLegacyTestnet.status = originalStatus;
    }
  });

  it("aborts on unknown network slot", async function () {
    await assert.rejects(
      async () => {
        await assertBroadcastAllowed("unknownSlot", 1);
      },
      {
        message: /\[Guard\] Unknown network slot: unknownSlot/,
      }
    );
  });

  it("allows broadcast on verified testnets with matching chain ID", async function () {
    // Local
    await assert.doesNotReject(async () => {
      await assertBroadcastAllowed("local", 31337);
    });

    // Coral Testnet
    await assert.doesNotReject(async () => {
      await assertBroadcastAllowed("mstCoralTestnet", 54635);
    });

    // Legacy Testnet
    await assert.doesNotReject(async () => {
      await assertBroadcastAllowed("mstLegacyTestnet", 91562037);
    });
  });
});
