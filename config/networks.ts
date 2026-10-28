/**
 * config/networks.ts — Network Configuration for Pramaan-ZK
 * 
 * Rules:
 * 1. Exactly four network slots: local, mstLegacyTestnet, mstCoralTestnet, mstMainnet.
 * 2. Each slot carries a status ("verified" | "unverified") and points to evidence.
 * 3. Broadcast runner MUST verify eth_chainId against configured chainId.
 * 4. Broadcast runner MUST refuse to broadcast on any unverified slot unless
 *    --allow-unverified-network is passed AND the target is strictly a testnet (never mainnet).
 */

export interface NetworkConfig {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  explorerUrl?: string;
  status: "verified" | "unverified";
  evidence: string;
  isTestnet: boolean;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  local: {
    id: "local",
    name: "Hardhat Local Node",
    chainId: 31337,
    rpcUrl: "http://127.0.0.1:8545",
    symbol: "GO",
    status: "verified",
    evidence: "scripts/gate0/validate-local.ts",
    isTestnet: true,
  },
  mstLegacyTestnet: {
    id: "mstLegacyTestnet",
    name: "MST Legacy Testnet",
    chainId: 91562037, // 0x5752035
    rpcUrl: process.env.MST_LEGACY_TESTNET_RPC || "https://testnetrpc.mstblockchain.com",
    symbol: "tMSTC",
    explorerUrl: "https://testnet.mstscan.com",
    status: "verified", // Verified by preflight on 2026-10-28
    evidence: "docs/evidence/preflight-mstLegacyTestnet.json",
    isTestnet: true,
  },
  mstCoralTestnet: {
    id: "mstCoralTestnet",
    name: "MST Coral Testnet",
    chainId: 54635, // Secondary source; to be confirmed
    rpcUrl: process.env.MST_CORAL_TESTNET_RPC || "",
    symbol: "tMSTC",
    explorerUrl: undefined,
    status: "unverified",
    evidence: "docs/OPEN_QUESTIONS.md (B-01)",
    isTestnet: true,
  },
  mstMainnet: {
    id: "mstMainnet",
    name: "MST Mainnet",
    chainId: 4646, // 0x1226
    rpcUrl: process.env.MST_MAINNET_RPC || "https://mariorpc.mstblockchain.com",
    symbol: "MSTC",
    explorerUrl: "https://mstscan.com",
    status: "unverified", // Read-only preflight only; no broadcast permitted
    evidence: "docs/evidence/preflight-mainnet.json",
    isTestnet: false,
  },
};

/**
 * Asserts network broadcast safety.
 * Throws an error if chainId mismatches or network is unverified without explicit override.
 */
export async function assertBroadcastAllowed(
  networkSlot: string,
  actualChainId: number,
  allowUnverifiedFlag: boolean = false
): Promise<void> {
  const config = NETWORKS[networkSlot];
  if (!config) {
    throw new Error(`[Guard] Unknown network slot: ${networkSlot}`);
  }

  // Chain ID mismatch check
  if (actualChainId !== config.chainId) {
    throw new Error(
      `[Guard FATAL] Chain ID mismatch for slot '${networkSlot}'! Configured: ${config.chainId}, RPC returned: ${actualChainId}. Broadcast aborted.`
    );
  }

  // Mainnet protection
  if (!config.isTestnet) {
    throw new Error(
      `[Guard FATAL] Broadcast to Mainnet is prohibited prior to Milestone M10 and explicit human approval.`
    );
  }

  // Unverified network guard
  if (config.status === "unverified") {
    if (!allowUnverifiedFlag) {
      throw new Error(
        `[Guard BLOCKED] Network '${networkSlot}' is UNVERIFIED. Broadcast refused. Use --allow-unverified-network to override for testnet diagnostic.`
      );
    }
    console.warn(
      `[Guard WARNING] Broadcasting to UNVERIFIED testnet '${networkSlot}' under explicit --allow-unverified-network flag.`
    );
  }
}
