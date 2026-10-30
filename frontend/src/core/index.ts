/**
 * frontend/src/core/index.ts
 * 
 * Barrel Export for Pramaan-ZK Core
 * Zero JSX, pure TypeScript core business and protocol logic.
 */

export * from "./types.ts";
export * from "./config.ts";
export * from "./contracts.ts";
export * from "./prover.ts";
export * from "./api.ts";

// Hooks
export * from "./hooks/useWallet.ts";
export * from "./hooks/useNetwork.ts";
export * from "./hooks/useProver.ts";
export * from "./hooks/useSubmitProof.ts";
export * from "./hooks/useTxResult.ts";
export * from "./hooks/useRegistry.ts";
export * from "./hooks/useIssuer.ts";
