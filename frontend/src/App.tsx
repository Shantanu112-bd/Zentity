/**
 * frontend/src/App.tsx
 * 
 * Unstyled Core Shell for Pramaan-ZK (Phase 1)
 * Exercises core services and hooks without any styling or brand presentation.
 */

import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import {
  useWallet,
  useNetwork,
  useRegistry,
  useIssuer,
  useProver,
  useSubmitProof,
  useTxResult,
  api,
  DEFAULT_CORAL,
} from "./core";

function CoreStatusHome() {
  const { address, isConnected, isConnecting, connect, disconnect, chainId } = useWallet();
  const { targetNetwork, isCorrectNetwork, switchNetwork } = useNetwork(chainId);
  const [registryInfo, setRegistryInfo] = useState<any>(null);

  useEffect(() => {
    api.getRegistryInfo().then(setRegistryInfo).catch(() => {});
  }, []);

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2>Pramaan-ZK — Protocol Core Status</h2>
      <p style={{ color: "#aaa" }}>Unstyled Core Shell (Phase 1). Zero presentation code.</p>
      <hr style={{ borderColor: "#333", margin: "1rem 0" }} />

      <pre style={{ background: "#111", padding: "1rem", borderRadius: "4px", overflowX: "auto" }}>
{JSON.stringify(
  {
    protocol: "Pramaan-ZK Attribute Gate",
    network: {
      name: targetNetwork.name,
      chainId: targetNetwork.chainId,
      activeChainId: chainId,
      isCorrectNetwork,
      rpc: targetNetwork.rpcUrl,
    },
    wallet: {
      address: address || "Not connected",
      isConnected,
      isConnecting,
    },
    contracts: registryInfo?.contracts || "Loading...",
    chainMode: registryInfo?.chainMode || "unknown",
  },
  null,
  2
)}
      </pre>

      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
        {!isConnected ? (
          <button onClick={connect} disabled={isConnecting} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        ) : (
          <button onClick={disconnect} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
            Disconnect
          </button>
        )}
        {!isCorrectNetwork && isConnected && (
          <button onClick={switchNetwork} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
            Switch to {targetNetwork.name}
          </button>
        )}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Functional Test Routes</h3>
        <ul>
          <li><Link to="/" style={{ color: "#7af" }}>/ (Core Status Home)</Link></li>
          <li><Link to="/prove" style={{ color: "#7af" }}>/prove (Prover Core)</Link></li>
          <li><Link to="/verify" style={{ color: "#7af" }}>/verify (Verifier Core)</Link></li>
          <li><Link to="/registry" style={{ color: "#7af" }}>/registry (Registry Core)</Link></li>
        </ul>
      </div>
    </div>
  );
}

function CoreProver() {
  const { address, isConnected, chainId } = useWallet();
  const { targetNetwork } = useNetwork(chainId);
  const { credential, requestCredential, loading: issuing } = useIssuer();
  const { status, progress, proofOutput, error: proverError, startProving, cancelProving } = useProver();
  const { submitProof, isSubmitting, txResult, error: submitError } = useSubmitProof();

  const [dobDays, setDobDays] = useState(10950); // ~30 yrs
  const [scopeId, setScopeId] = useState("12345");

  const handleIssue = async () => {
    await requestCredential({ dobDays, stateCode: 27 });
  };

  const handleProve = async () => {
    if (!credential || !address) return;
    const now = Math.floor(Date.now() / 1000);
    await startProving(credential, scopeId, now, address);
  };

  const handleSubmit = async () => {
    if (!proofOutput || !address) return;
    const info = await api.getRegistryInfo();
    const registryAddress = info.contracts.PramaanRegistry.address;
    await submitProof(registryAddress, targetNetwork, address, proofOutput.calldata);
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2>Pramaan-ZK — Prover Core</h2>
      <p><Link to="/" style={{ color: "#7af" }}>&larr; Back to Status Home</Link></p>
      <hr style={{ borderColor: "#333", margin: "1rem 0" }} />

      <div>
        <h4>Step 1: Testnet Credential</h4>
        <p style={{ color: "#888" }}>Testnet issuer: attests self-provided date of birth without identity verification.</p>
        <label>DOB Days: </label>
        <input
          type="number"
          value={dobDays}
          onChange={(e) => setDobDays(Number(e.target.value))}
          style={{ padding: "0.25rem", marginRight: "0.5rem" }}
        />
        <button onClick={handleIssue} disabled={issuing} style={{ padding: "0.25rem 0.75rem" }}>
          {issuing ? "Issuing..." : "Issue Testnet Credential"}
        </button>
        {credential && <pre style={{ background: "#111", padding: "0.5rem", marginTop: "0.5rem" }}>Credential Issued: Secret={credential.credentialSecret.slice(0, 10)}... KeyHash={credential.issuerKeyHash.slice(0, 10)}...</pre>}
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <h4>Step 2: Generate ZK Proof (Client-side Groth16)</h4>
        <label>Scope ID: </label>
        <input
          type="text"
          value={scopeId}
          onChange={(e) => setScopeId(e.target.value)}
          style={{ padding: "0.25rem", marginRight: "0.5rem" }}
        />
        <button
          onClick={handleProve}
          disabled={!credential || !isConnected || status === "proving"}
          style={{ padding: "0.25rem 0.75rem", marginRight: "0.5rem" }}
        >
          {status === "proving" ? `Proving (${progress.percentage}%)...` : "Generate Proof"}
        </button>
        {status === "proving" && (
          <button onClick={cancelProving} style={{ padding: "0.25rem 0.75rem" }}>Cancel</button>
        )}
        {proverError && <p style={{ color: "#f77" }}>Prover Error: {proverError}</p>}
        {proofOutput && (
          <pre style={{ background: "#111", padding: "0.5rem", marginTop: "0.5rem" }}>
            Proof Ready: Nullifier={proofOutput.nullifier} Duration={proofOutput.durationMs}ms
          </pre>
        )}
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <h4>Step 3: Submit to MST On-Chain</h4>
        <button
          onClick={handleSubmit}
          disabled={!proofOutput || isSubmitting}
          style={{ padding: "0.5rem 1rem" }}
        >
          {isSubmitting ? "Submitting to MST..." : "Submit Proof On-Chain"}
        </button>
        {submitError && <p style={{ color: "#f77" }}>Submission Error: {submitError}</p>}
        {txResult && (
          <pre style={{ background: "#111", padding: "0.5rem", marginTop: "0.5rem" }}>
            Tx Confirmed! Status={txResult.status} Block={txResult.blockNumber.toString()} Gas={txResult.gasUsed.toString()}
            TxHash={txResult.txHash}
          </pre>
        )}
      </div>
    </div>
  );
}

function CoreVerifier() {
  const { lookupTx, result, loading, error } = useTxResult();
  const [hash, setHash] = useState("");
  const { targetNetwork } = useNetwork(null);

  const handleLookup = () => {
    if (hash) lookupTx(hash as `0x${string}`, targetNetwork);
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2>Pramaan-ZK — Verifier Core</h2>
      <p><Link to="/" style={{ color: "#7af" }}>&larr; Back to Status Home</Link></p>
      <hr style={{ borderColor: "#333", margin: "1rem 0" }} />
      <input
        type="text"
        placeholder="Enter Tx Hash 0x..."
        value={hash}
        onChange={(e) => setHash(e.target.value)}
        style={{ width: "400px", padding: "0.5rem", marginRight: "0.5rem" }}
      />
      <button onClick={handleLookup} disabled={loading} style={{ padding: "0.5rem 1rem" }}>
        {loading ? "Searching..." : "Lookup Receipt"}
      </button>
      {error && <p style={{ color: "#f77" }}>Error: {error}</p>}
      {result && (
        <pre style={{ background: "#111", padding: "1rem", marginTop: "1rem" }}>
          {JSON.stringify(result, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2)}
        </pre>
      )}
    </div>
  );
}

function CoreRegistry() {
  const { checkNullifier, checkIssuer, checkPaused, loading, error } = useRegistry();
  const [registryAddress, setRegistryAddress] = useState<`0x${string}` | null>(null);
  const [scopeId, setScopeId] = useState("12345");
  const [nullifier, setNullifier] = useState("");
  const [nullifierSpent, setNullifierSpent] = useState<boolean | null>(null);
  const { targetNetwork } = useNetwork(null);

  useEffect(() => {
    api.getRegistryInfo().then((info) => {
      setRegistryAddress(info.contracts.PramaanRegistry.address);
    });
  }, []);

  const handleCheck = async () => {
    if (!registryAddress || !nullifier) return;
    const spent = await checkNullifier(
      registryAddress,
      targetNetwork,
      BigInt(scopeId),
      BigInt(nullifier)
    );
    setNullifierSpent(spent);
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2>Pramaan-ZK — Registry Core</h2>
      <p><Link to="/" style={{ color: "#7af" }}>&larr; Back to Status Home</Link></p>
      <hr style={{ borderColor: "#333", margin: "1rem 0" }} />
      <p>Contract: {registryAddress || "Loading..."}</p>
      <label>Scope ID: </label>
      <input
        type="text"
        value={scopeId}
        onChange={(e) => setScopeId(e.target.value)}
        style={{ padding: "0.25rem", marginRight: "0.5rem" }}
      />
      <label>Nullifier: </label>
      <input
        type="text"
        value={nullifier}
        onChange={(e) => setNullifier(e.target.value)}
        style={{ padding: "0.25rem", marginRight: "0.5rem" }}
      />
      <button onClick={handleCheck} disabled={loading} style={{ padding: "0.25rem 0.75rem" }}>
        {loading ? "Checking..." : "Check isNullifierSpent"}
      </button>
      {error && <p style={{ color: "#f77" }}>Error: {error}</p>}
      {nullifierSpent !== null && (
        <p style={{ marginTop: "1rem" }}>
          Nullifier Status: <strong>{nullifierSpent ? "SPENT (Replay Blocked)" : "UNSPENT (Available)"}</strong>
        </p>
      )}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CoreStatusHome />} />
        <Route path="/prove" element={<CoreProver />} />
        <Route path="/verify" element={<CoreVerifier />} />
        <Route path="/registry" element={<CoreRegistry />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
