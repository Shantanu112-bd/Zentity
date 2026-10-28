# docs/API_SPECIFICATION.md — API Specification

**STATUS: SKELETON** · **Created:** 2026-10-28

## 1. OIDC Gateway Service (`backend/gateway`)
Implements OpenID Connect Core 1.0 with Authorization Code Flow and PKCE.

### Endpoints
- `GET /.well-known/openid-configuration`: OpenID Provider Configuration document.
- `GET /jwks.json`: Public JSON Web Key Set for verifying issued identity tokens.
- `GET /oauth/authorize`: Authorization endpoint initiating PKCE flow.
- `POST /oauth/token`: Token endpoint exchanging code and code_verifier for ID token.
- `GET /userinfo`: Returns verified claims (`age_over_18: true`, `sub: <pairwise-hash>`).
- `POST /api/verify`: Internal off-chain proof verification endpoint (snarkjs).

## 2. Relayer Service (`backend/relayer`)
Facilitates gasless transaction broadcast to MST Blockchain.

### Endpoints
- `POST /relayer/submit`: Submits zk-SNARK proof and public signals to on-chain registry.
  - Body: `{ proof: {...}, publicInputs: [...], recipient: "0x...", deadline: 1234567890 }`
  - Returns: `{ txHash: "0x...", status: "PENDING" | "MINED" }`
- `GET /relayer/status/:txHash`: Queries transaction receipt status on MST explorer/RPC.
- `GET /relayer/quota/:clientId`: Returns remaining quota and rate-limit allocations.

