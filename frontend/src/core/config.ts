/**
 * frontend/src/core/config.ts
 * 
 * Core Network & Contract Configuration
 * Zero hardcoded addresses outside manifests/config.
 */

import { parseAbi } from "viem";
import type { NetworkInfo } from "./types.ts";

export const DEFAULT_CORAL: NetworkInfo = {
  id: "mstCoralTestnet",
  name: "MST Coral Testnet",
  chainId: 54635,
  rpcUrl: "https://coralrpc.mstblockchain.com",
  symbol: "tMSTC",
  explorerUrl: "https://coral.mstscan.com",
  label: "CORAL TESTNET",
};

export const DEFAULT_LEGACY: NetworkInfo = {
  id: "mstLegacyTestnet",
  name: "MST Legacy Testnet",
  chainId: 91562037,
  rpcUrl: "https://testnetrpc.mstblockchain.com",
  symbol: "tMSTC",
  explorerUrl: "https://testnet.mstscan.com",
  label: "LEGACY TESTNET (SHUTDOWN 2027)",
};

export const DEFAULT_LOCAL: NetworkInfo = {
  id: "local",
  name: "Local Hardhat Node",
  chainId: 31337,
  rpcUrl: "http://127.0.0.1:8545",
  symbol: "ETH",
  label: "LOCAL / TEST",
};

export const PRAMAAN_REGISTRY_ABI = parseAbi([
  "function verifyAndRecord(uint256[2] calldata a, uint256[2][2] calldata b, uint256[2] calldata c, uint256[7] calldata input) external returns (bool)",
  "function isNullifierSpent(uint256 scopeId, uint256 nullifier) external view returns (bool)",
  "function registeredIssuers(uint256 issuerKeyHash) external view returns (bool)",
  "function paused() external view returns (bool)",
  "event ProofVerifiedAndRecorded(uint256 indexed scopeId, uint256 indexed nullifier, address indexed recipient)",
]);
