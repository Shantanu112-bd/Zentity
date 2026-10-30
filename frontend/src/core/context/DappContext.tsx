/**
 * frontend/src/core/context/DappContext.tsx
 * 
 * Global Reactive Pipeline State for Pramaan-ZK dApp
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  AttestationCredential,
  Groth16ProofPayload,
  VerificationTransactionResult,
  RegistryQueryResult,
} from "../services/types.ts";

export interface RegistryCacheEntry {
  scopeId: string;
  nullifier: string;
  isSpent: boolean;
  timestamp: number;
}

export interface DappContextType {
  credential: AttestationCredential | null;
  setCredential: (cred: AttestationCredential | null) => void;
  proof: Groth16ProofPayload | null;
  setProof: (proof: Groth16ProofPayload | null) => void;
  latestTx: VerificationTransactionResult | null;
  setLatestTx: (tx: VerificationTransactionResult | null) => void;
  registryCache: RegistryCacheEntry[];
  addToRegistryCache: (entry: Omit<RegistryCacheEntry, "timestamp">) => void;
  clearRegistryCache: () => void;
  resetPipeline: () => void;
}

const DappContext = createContext<DappContextType | undefined>(undefined);

export function DappProvider({ children }: { children: ReactNode }) {
  const [credential, setCredential] = useState<AttestationCredential | null>(null);
  const [proof, setProof] = useState<Groth16ProofPayload | null>(null);
  const [latestTx, setLatestTx] = useState<VerificationTransactionResult | null>(null);
  const [registryCache, setRegistryCache] = useState<RegistryCacheEntry[]>([]);

  const addToRegistryCache = useCallback((entry: Omit<RegistryCacheEntry, "timestamp">) => {
    setRegistryCache((prev) => {
      const filtered = prev.filter(
        (e) => !(e.scopeId === entry.scopeId && e.nullifier === entry.nullifier)
      );
      return [{ ...entry, timestamp: Date.now() }, ...filtered.slice(0, 19)];
    });
  }, []);

  const clearRegistryCache = useCallback(() => {
    setRegistryCache([]);
  }, []);

  const resetPipeline = useCallback(() => {
    setCredential(null);
    setProof(null);
    setLatestTx(null);
  }, []);

  return (
    <DappContext.Provider
      value={{
        credential,
        setCredential,
        proof,
        setProof,
        latestTx,
        setLatestTx,
        registryCache,
        addToRegistryCache,
        clearRegistryCache,
        resetPipeline,
      }}
    >
      {children}
    </DappContext.Provider>
  );
}

export function useDapp(): DappContextType {
  const context = useContext(DappContext);
  if (!context) {
    throw new Error("useDapp must be used within a DappProvider");
  }
  return context;
}
