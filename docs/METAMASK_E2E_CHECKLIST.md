# docs/METAMASK_E2E_CHECKLIST.md — Manual MetaMask End-to-End Verification Checklist

This document provides a manual test protocol for verifying the **Pramaan-ZK** zero-knowledge identity gate on **MST Coral Testnet (54635)** using MetaMask.

---

## 1. Prerequisites & Environment Setup

- [ ] **Browser Extension:** Google Chrome, Brave, or Firefox with MetaMask installed.
- [ ] **Network Configuration:** Verify MetaMask is configured with MST Coral Testnet:
  - **Network Name:** `MST Coral Testnet`
  - **RPC URL:** `https://coralrpc.mstblockchain.com`
  - **Chain ID:** `54635`
  - **Currency Symbol:** `tMSTC`
  - **Block Explorer URL:** `https://coral.mstscan.com`
- [ ] **Account Funding:** The test account must have &ge; 0.05 tMSTC.
  - *Faucet URL:* `https://coral-faucet.mstblockchain.com/`
  - *Deployer Balance:* `0xded5...fefa` (~44.97 tMSTC).
- [ ] **Local Dev Server:** Start development processes:
  ```bash
  pnpm run dev
  ```
  Navigate to **http://localhost:5173**.

---

## 2. Phase A: Wallet Connection & Chain Enforcement

1. **Initial State:**
   - [ ] Top nav displays `00 OVERVIEW`, `01 PROVER STUDIO`, `02 REGISTRY EXPLORER`, `03 AUDIT LOG`.
   - [ ] Wallet status button shows "Connect Wallet" (or address pill if already paired).
2. **Connection Flow:**
   - [ ] Click "Connect Wallet".
   - [ ] Approve the connection request in MetaMask popup.
   - [ ] Confirm top navigation updates to show:
     - Network pill: `● Coral (54635)` in green.
     - Account pill: `0x...` (truncated checksum address).
     - "Disconnect" action.
3. **Chain Switching Test:**
   - [ ] In MetaMask, switch to any other network (e.g. Ethereum Mainnet or Sepolia).
   - [ ] Confirm the app indicates chain mismatch.
   - [ ] Click "Switch to Coral Testnet" in Prover Studio or Nav.
   - [ ] Confirm MetaMask prompts for chain switch to Chain ID `54635` and switches automatically.

---

## 3. Phase B: Credential Attestation (Step 01 / Attestation)

1. **Inputs:**
   - [ ] Scope / Application ID: Enter `1`.
   - [ ] Date of Birth: Choose `2000-01-01` (Age &ge; 18).
   - [ ] Subject Address: Displays your connected MetaMask address.
2. **Attestation Request:**
   - [ ] Click **"REQUEST TESTNET CREDENTIAL"**.
   - [ ] Open Browser DevTools Network tab &rarr; verify `POST /api/demo/issue` returns HTTP 200.
   - [ ] Verify returned JSON contains `credentialSecret`, `issuerPubKeyHash`, `sigR8x`, `sigR8y`, `sigS`.
   - [ ] Confirm badge updates to `Attested` (green).
   - [ ] Button updates to "CREDENTIAL ATTESTED".

---

## 4. Phase C: Client-Side Groth16 Proving (Step 02 / Local WASM)

1. **Zero-Egress Invariant Check:**
   - [ ] Keep DevTools Network tab open with filter set to "Fetch/XHR".
   - [ ] Minimum Required Age: `18`.
2. **Proof Synthesis:**
   - [ ] Click **"SYNTHESIZE ZK PROOF"**.
   - [ ] Watch real-time progress callbacks:
     1. `Initializing BN254 WASM runtime...` (10%)
     2. `Fetching circuit artifacts...` (30%)
     3. `Computing witness and proof...` (60%)
     4. `Proof synthesis complete` (100%)
   - [ ] **Strict Privacy Assertion:** Inspect Network tab. Confirm that **NO** network requests contain `dob`, `dobDays`, or `credentialSecret`. Only static `.wasm` and `.zkey` files are fetched from `/circuits/`.
   - [ ] Synthesis time is displayed (e.g., `~1,800 ms` to `2,200 ms`).
   - [ ] Status updates to `Proof Ready`.

---

## 5. Phase D: On-Chain Settlement (Step 03 / Coral Settlement)

1. **Preflight Simulation:**
   - [ ] Target Contract displays active verified registry: `0x39f842043b7de6421ae21d5e4c955dd6cbaa415b`.
   - [ ] Derived Nullifier is populated with a 77-digit decimal number.
   - [ ] Click **"SUBMIT TO PRAMAANREGISTRY"**.
   - [ ] Status pill pulses amber: `Broadcasting` with stage `"Running preflight simulation..."`.
2. **Wallet Signature:**
   - [ ] Status displays: `"Awaiting wallet signature..."`.
   - [ ] MetaMask transaction window appears.
   - [ ] Check function name: `verifyAndRecord`.
   - [ ] Estimated Gas: ~`288,906 gas` (~0.00029 tMSTC at 1 Gwei).
   - [ ] Click **"Confirm"** in MetaMask.
3. **Transaction Settlement:**
   - [ ] Status displays: `"Mining transaction on Coral..."`.
   - [ ] Transaction confirms in block (average block time 2-3s).
   - [ ] Banner appears: `Tx Confirmed · Settled on Coral`.
   - [ ] Click `View on Coral Scan` link.
   - [ ] Confirm Blockscout page opens to `https://coral.mstscan.com/tx/<txHash>` with status **Success** and decoded `ProofVerifiedAndRecorded` event log.

---

## 6. Phase E: Independent CLI Evidence Verification

Run the verification CLI on the resulting transaction hash:
```bash
pnpm verify:tx <TRANSACTION_HASH>
```

**Acceptance Criteria:**
- [ ] `Receipt status`: `SUCCESS`.
- [ ] `Target`: `0x39f842043b7de6421ae21d5e4c955dd6cbaa415b (ACTIVE REGISTRY)`.
- [ ] `ProofVerifiedAndRecorded` event decoded with matching `scopeId`, `nullifier`, `recipient`.
- [ ] `isNullifierSpent on-chain`: `true (CONFIRMED RECORDED)`.
- [ ] Explorer reachable (HTTP 200).
- [ ] Sanitized evidence file written to `docs/evidence/tx-<hash>.json`.

---

## 7. Phase F: Registry Explorer Check (Tab 02)

1. [ ] Click **`02 REGISTRY EXPLORER`** in top nav.
2. [ ] Enter Scope ID `1` and paste your derived Nullifier.
3. [ ] Click **"Check Nullifier"**.
4. [ ] Confirm result card displays:
   - Status: `SPENT (Recorded on-chain)`.
   - Nullifier Sybil protection active.

---

## 8. Phase G: Replay Attack Rejection Test

1. [ ] Return to **`01 PROVER STUDIO`**.
2. [ ] Do **NOT** reset the pipeline; keep the existing proof and nullifier.
3. [ ] Click **"SUBMIT TO PRAMAANREGISTRY"** a second time.
4. [ ] Confirm the transaction fails:
   - In-app error displays: `Simulation failed: NullifierAlreadySpent` (or execution reverted).
   - Double-spending is mathematically blocked by contract state.

---

## 9. Phase H: Cross-Scope Unlinkability Test

1. [ ] Click **"Reset Pipeline"** in top right of Prover Studio.
2. [ ] Change Scope ID from `1` to `2` (e.g. Application B).
3. [ ] Click **"REQUEST TESTNET CREDENTIAL"** &rarr; **"SYNTHESIZE ZK PROOF"**.
4. [ ] Confirm the newly derived Nullifier is completely different from the Scope 1 Nullifier (zero linkability across scopes).
5. [ ] Click **"SUBMIT TO PRAMAANREGISTRY"** &rarr; confirm settlement succeeds on Coral testnet.

