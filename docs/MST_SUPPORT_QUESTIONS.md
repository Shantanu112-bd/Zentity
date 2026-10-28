# docs/MST_SUPPORT_QUESTIONS.md — Inquiries for MST Blockchain Technical Team

**Status:** Draft for Operator Review · **Created:** 2026-10-28

The following questions have been prepared for the human operator to submit to the MST technical support team (`support@mstblockchain.com` or official developer channels).

---

### 1. Coral Testnet Configuration
- What is the official HTTPS RPC endpoint and WebSocket (WSS) endpoint for the **MST Coral Testnet**?
- What is the authoritative chain ID for Coral (is it `54635` or another value)?
- Where is the official Coral block explorer and tMSTC faucet hosted?
- Can you confirm the exact deprecation timeline for Legacy Testnet (Chain ID `91562037`)?

### 2. EVM Specifications & Precompiles
- What EVM hardfork version is running on MST Mainnet, Legacy Testnet, and Coral Testnet (e.g. London, Shanghai, Cancun)?
- Are the BN254 elliptic curve precompiles supported and active at:
  - `0x06` (`ecAdd` / bn254Add)
  - `0x07` (`ecMul` / bn254Mul)
  - `0x08` (`ecPairing` / bn254Pairing)
- Are precompile gas costs standard according to EIP-196 / EIP-197 / EIP-1108?
- Is the `PUSH0` opcode supported on all active testnets and mainnet?

### 3. Block & Execution Limits
- What is the target block gas limit and maximum transaction gas limit on MST networks?
- What is the average block time and finality model (number of confirmations required for irreversible finality)?
- Are there specific JSON-RPC rate limits (requests per second/minute) on public endpoints?

### 4. Account Abstraction & Gas Sponsorship
- Does SARAL provide an on-chain gas sponsorship paymaster or relayer (ERC-4337 / ERC-2771 standard), or is it strictly an off-chain MPC onboarding / SSO solution?
- If gas sponsorship exists, where is the developer documentation or contract interface?

### 5. Developer Tooling & Verification
- What is the canonical npm package for the JavaScript/TypeScript SDK (`@mstblockchain/mst-sdk` vs `blockchain-sdk`)?
- Does MST Scan provide an API endpoint for verifying smart contracts (compatible with Etherscan standard API)?
- Is there an official MST MCP (Model Context Protocol) server for developer tooling?

