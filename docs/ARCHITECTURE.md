# docs/ARCHITECTURE.md — System Architecture

**STATUS: SKELETON** · **Created:** 2026-10-28

## 1. High-Level Architecture Overview

```mermaid
flowchart TD
    subgraph Client Device [Client Environment]
        QR[Signed Government QR] --> Parse[QR Decompression & Parser]
        Parse --> WitGen[Witness Calculator]
        WitGen --> Prover[snarkjs Groth16 WASM Worker]
        Prover --> Proof[zk-Proof + Public Signals]
    end

    subgraph Channel A [Web3 on MST Blockchain]
        Proof --> Relayer[Pramaan Relayer Service]
        Relayer --> VerifierContract[PramaanVerifier.sol]
        VerifierContract --> RegistryContract[PramaanRegistry.sol]
        RegistryContract --> dApp[MST dApps / Contracts]
    end

    subgraph Channel B [Web2 Enterprise]
        Proof --> Gateway[OIDC Gateway / Token Issuer]
        Gateway --> AuthCode[OAuth2 / PKCE Authorization]
        AuthCode --> RP[Relying Party Applications]
    end

    subgraph Channel C [Government DPI Stub]
        RegistryContract -.-> WebhookStub[Signed Webhook Simulation Stub]
    end
```

## 2. Component Definitions
- **Client Proving Engine (`packages/client`):** Executes in a dedicated Web Worker on the user's browser or mobile device. Generates witness and Groth16 proof using zero-knowledge circuits without transmitting credentials over the network.
- **On-Chain Verifier (`contracts/PramaanVerifier.sol`):** Cryptographic contract verifying Groth16 pairings on MST Blockchain using BN254 precompiles (`0x06`, `0x07`, `0x08`).
- **State Registry (`contracts/PramaanRegistry.sol`):** Tracks scope-isolated nullifiers, manages active and revoked issuer public key hashes, enforces anti-replay, and handles governance roles.
- **Gas Relayer (`backend/relayer`):** Facilitates gasless submissions for users, abstracting MST native gas tokens (`tMSTC`) via KMS-backed transaction signing with strict idempotency and quota management.
- **OIDC Gateway (`backend/gateway`):** Web2 OpenID Connect identity provider that verifies proofs off-chain via snarkjs and issues scoped, pairwise pseudonymous JSON Web Tokens (`sub`) to registered clients.
- **Government DPI Webhook Stub (`backend/gov-stub`):** Explicitly simulated webhook emitter demonstrating how government/registry observers could ingest event logs.

