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
  registryAddress: "0x8c182a53fca78fe237734239bdb1256bc2658c5b",
  verifierAddress: "0xed8fe30962b3df64accdf867a355c68addedbf28",
  probeAddress: "0x94b9b520b975e20e82ce5862c523bfe389c12ed3",
};

export const DEFAULT_LEGACY: NetworkInfo = {
  id: "mstLegacyTestnet",
  name: "MST Legacy Testnet",
  chainId: 91562037,
  rpcUrl: "https://testnetrpc.mstblockchain.com",
  symbol: "tMSTC",
  explorerUrl: "https://testnet.mstscan.com",
  label: "LEGACY TESTNET (SHUTDOWN 2027)",
  registryAddress: "0x8c182a53fca78fe237734239bdb1256bc2658c5b",
  verifierAddress: "0xed8fe30962b3df64accdf867a355c68addedbf28",
  probeAddress: "0x94b9b520b975e20e82ce5862c523bfe389c12ed3",
};

export const DEFAULT_LOCAL: NetworkInfo = {
  id: "local",
  name: "Local Hardhat Node",
  chainId: 31337,
  rpcUrl: "http://127.0.0.1:8545",
  symbol: "ETH",
  label: "LOCAL / TEST",
  registryAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  verifierAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  probeAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
};

export const PRAMAAN_REGISTRY_ABI = parseAbi([
  "function verifyAndRecord(uint256[2] calldata a, uint256[2][2] calldata b, uint256[2] calldata c, uint256[7] calldata input) external returns (bool)",
  "function isNullifierSpent(uint256 scopeId, uint256 nullifier) external view returns (bool)",
  "function registeredIssuers(uint256 issuerKeyHash) external view returns (bool)",
  "function paused() external view returns (bool)",
  "event ProofVerifiedAndRecorded(uint256 indexed scopeId, uint256 indexed nullifier, address indexed recipient)",
]);
