/**
 * frontend/src/core/api.ts
 * 
 * Typed Backend API Client for Pramaan-ZK
 * Zero JSX, standard fetch wrappers with strict error handling.
 */

import type { NetworkInfo, ContractInfo, TestnetCredential } from "./types.ts";

export interface RegistryInfoResponse {
  chainMode: string;
  networkSlot: string;
  network: NetworkInfo;
  contracts: ContractInfo;
  issuerPubKeyHash?: string;
  demoIssuerPubKeyHash?: string;
}

export interface IssueCredentialRequest {
  age?: number;
  dobDays?: number;
  stateCode?: number;
}

export interface IssueCredentialResponse {
  credential: TestnetCredential;
  label?: string;
  notice?: string;
  age?: number;
  stateCode?: number;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) || "") {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async getRegistryInfo(): Promise<RegistryInfoResponse> {
    const res = await fetch(`${this.baseUrl}/api/registry/info`);
    if (!res.ok) {
      throw new Error(`Failed to fetch registry info: HTTP ${res.status}`);
    }
    return res.json();
  }

  async requestNonce(address: string): Promise<{ nonce: string; message: string }> {
    const res = await fetch(`${this.baseUrl}/api/auth/nonce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to request nonce: HTTP ${res.status}`);
    }
    return res.json();
  }

  async verifyAuth(
    address: string,
    signature: string,
    nonce: string
  ): Promise<{ status: string; address: string }> {
    const res = await fetch(`${this.baseUrl}/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, signature, nonce }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to verify authentication: HTTP ${res.status}`);
    }
    return res.json();
  }

  async issueTestnetCredential(
    req: IssueCredentialRequest
  ): Promise<IssueCredentialResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to issue testnet credential: HTTP ${res.status}`);
    }
    return res.json();
  }

  async verifyProofOffChain(proof: any, publicSignals: string[]): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/api/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proof, publicSignals }),
    });
    if (!res.ok) {
      return false;
    }
    const data = await res.json();
    return Boolean(data.valid);
  }
}

export const api = new ApiClient();
