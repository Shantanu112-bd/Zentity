/**
 * scripts/gate0/02-precompiles.ts
 * 
 * Gate 0 Phase B: Direct Precompile Probes
 * Probes BN254 precompiles (0x06, 0x07, 0x08) via eth_call:
 * - 0x06 (ecAdd): valid input compared to expected; invalid input checked for failure
 * - 0x07 (ecMul): valid input compared to expected; invalid input checked for failure
 * - 0x08 (ecPairing): valid identity expected 1; non-identity expected 0; bad inputs checked
 * 
 * Saves results to docs/evidence/precompile-probes-<network>.json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { NETWORKS } from "../../config/networks.js";

async function ethCall(rpcUrl: string, to: string, data: string): Promise<{ result?: string; error?: any; latencyMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Math.floor(Math.random() * 100000),
        method: "eth_call",
        params: [{ to, data }, "latest"],
      }),
    });
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      return { error: `HTTP ${res.status}: ${res.statusText}`, latencyMs };
    }
    const json = (await res.json()) as any;
    if (json.error) {
      return { error: json.error, latencyMs };
    }
    return { result: json.result, latencyMs };
  } catch (err: any) {
    return { error: err.message, latencyMs: Date.now() - start };
  }
}

export async function runPrecompileProbes(networkKey: string) {
  const config = NETWORKS[networkKey];
  if (!config) {
    throw new Error(`Unknown network: ${networkKey}`);
  }

  const vectorsPath = path.resolve(process.cwd(), "scripts/gate0/vectors.json");
  if (!fs.existsSync(vectorsPath)) {
    throw new Error(`vectors.json not found! Run generate-vectors.ts first.`);
  }
  const vectors = JSON.parse(fs.readFileSync(vectorsPath, "utf-8"));

  console.log(`\n======================================================`);
  console.log(`[Precompile Probe] Target Network: ${config.name} (${config.id})`);
  console.log(`[Precompile Probe] RPC URL: ${config.rpcUrl}`);
  console.log(`======================================================\n`);

  const results: Record<string, any> = {
    network: config.id,
    timestamp: new Date().toISOString(),
    probes: {},
    summary: { pass: 0, fail: 0 },
  };

  const PRECOMPILES = {
    ecAdd: "0x0000000000000000000000000000000000000006",
    ecMul: "0x0000000000000000000000000000000000000007",
    ecPairing: "0x0000000000000000000000000000000000000008",
  };

  // 1. ecAdd (0x06) Valid
  console.log(`--> Probing 0x06 (ecAdd) [Valid: G1 + 2*G1 = 3*G1]...`);
  const addValid = await ethCall(config.rpcUrl, PRECOMPILES.ecAdd, vectors.ecAdd.valid.input);
  const addMatch = addValid.result?.toLowerCase() === vectors.ecAdd.valid.expected.toLowerCase();
  console.log(`    Result: ${addValid.result ?? JSON.stringify(addValid.error)}`);
  console.log(`    Expected: ${vectors.ecAdd.valid.expected}`);
  console.log(`    Verdict: ${addMatch ? "PASS" : "FAIL"}`);
  results.probes.ecAdd_valid = { ...addValid, match: addMatch, verdict: addMatch ? "PASS" : "FAIL" };
  if (addMatch) results.summary.pass++; else results.summary.fail++;

  // 2. ecAdd (0x06) Invalid Point
  console.log(`--> Probing 0x06 (ecAdd) [Invalid: Point (1,1) not on curve]...`);
  const addInvalid = await ethCall(config.rpcUrl, PRECOMPILES.ecAdd, vectors.ecAdd.invalidPoint.input);
  // Expected: error/revert or empty result (precompile failure)
  const addInvalidHandled = !!addInvalid.error || addInvalid.result === "0x";
  console.log(`    Returned: ${addInvalid.result ?? JSON.stringify(addInvalid.error)}`);
  console.log(`    Verdict: ${addInvalidHandled ? "PASS (Correctly rejected)" : "FAIL (Accepted invalid point)"}`);
  results.probes.ecAdd_invalid = { ...addInvalid, rejected: addInvalidHandled, verdict: addInvalidHandled ? "PASS" : "FAIL" };
  if (addInvalidHandled) results.summary.pass++; else results.summary.fail++;

  // 3. ecMul (0x07) Valid
  console.log(`--> Probing 0x07 (ecMul) [Valid: 7 * G1]...`);
  const mulValid = await ethCall(config.rpcUrl, PRECOMPILES.ecMul, vectors.ecMul.valid.input);
  const mulMatch = mulValid.result?.toLowerCase() === vectors.ecMul.valid.expected.toLowerCase();
  console.log(`    Result: ${mulValid.result ?? JSON.stringify(mulValid.error)}`);
  console.log(`    Expected: ${vectors.ecMul.valid.expected}`);
  console.log(`    Verdict: ${mulMatch ? "PASS" : "FAIL"}`);
  results.probes.ecMul_valid = { ...mulValid, match: mulMatch, verdict: mulMatch ? "PASS" : "FAIL" };
  if (mulMatch) results.summary.pass++; else results.summary.fail++;

  // 4. ecMul (0x07) Invalid Point
  console.log(`--> Probing 0x07 (ecMul) [Invalid: 7 * Point (1,1)]...`);
  const mulInvalid = await ethCall(config.rpcUrl, PRECOMPILES.ecMul, vectors.ecMul.invalidPoint.input);
  const mulInvalidHandled = !!mulInvalid.error || mulInvalid.result === "0x";
  console.log(`    Returned: ${mulInvalid.result ?? JSON.stringify(mulInvalid.error)}`);
  console.log(`    Verdict: ${mulInvalidHandled ? "PASS (Correctly rejected)" : "FAIL (Accepted invalid point)"}`);
  results.probes.ecMul_invalid = { ...mulInvalid, rejected: mulInvalidHandled, verdict: mulInvalidHandled ? "PASS" : "FAIL" };
  if (mulInvalidHandled) results.summary.pass++; else results.summary.fail++;

  // 5. ecPairing (0x08) Valid Identity
  console.log(`--> Probing 0x08 (ecPairing) [Valid Identity: e(G1, G2)*e(-G1, G2) = 1]...`);
  const pairValid = await ethCall(config.rpcUrl, PRECOMPILES.ecPairing, vectors.ecPairing.validIdentity.input);
  const pairMatch = pairValid.result?.toLowerCase() === vectors.ecPairing.validIdentity.expected.toLowerCase();
  console.log(`    Result: ${pairValid.result ?? JSON.stringify(pairValid.error)}`);
  console.log(`    Expected: ${vectors.ecPairing.validIdentity.expected}`);
  console.log(`    Verdict: ${pairMatch ? "PASS" : "FAIL"}`);
  results.probes.ecPairing_validIdentity = { ...pairValid, match: pairMatch, verdict: pairMatch ? "PASS" : "FAIL" };
  if (pairMatch) results.summary.pass++; else results.summary.fail++;

  // 6. ecPairing (0x08) Non-Identity
  console.log(`--> Probing 0x08 (ecPairing) [Non-Identity: e(G1, G2)*e(G1, G2) != 1]...`);
  const pairNonId = await ethCall(config.rpcUrl, PRECOMPILES.ecPairing, vectors.ecPairing.nonIdentity.input);
  const pairNonIdMatch = pairNonId.result?.toLowerCase() === vectors.ecPairing.nonIdentity.expected.toLowerCase();
  console.log(`    Result: ${pairNonId.result ?? JSON.stringify(pairNonId.error)}`);
  console.log(`    Expected: ${vectors.ecPairing.nonIdentity.expected}`);
  console.log(`    Verdict: ${pairNonIdMatch ? "PASS" : "FAIL"}`);
  results.probes.ecPairing_nonIdentity = { ...pairNonId, match: pairNonIdMatch, verdict: pairNonIdMatch ? "PASS" : "FAIL" };
  if (pairNonIdMatch) results.summary.pass++; else results.summary.fail++;

  // 7. ecPairing (0x08) Bad Length (100 bytes)
  console.log(`--> Probing 0x08 (ecPairing) [Malformed Length: 100 bytes]...`);
  const pairBadLen = await ethCall(config.rpcUrl, PRECOMPILES.ecPairing, vectors.ecPairing.badLength.input);
  const pairBadLenHandled = !!pairBadLen.error || pairBadLen.result === "0x";
  console.log(`    Returned: ${pairBadLen.result ?? JSON.stringify(pairBadLen.error)}`);
  console.log(`    Verdict: ${pairBadLenHandled ? "PASS (Correctly rejected)" : "FAIL (Accepted malformed length)"}`);
  results.probes.ecPairing_badLength = { ...pairBadLen, rejected: pairBadLenHandled, verdict: pairBadLenHandled ? "PASS" : "FAIL" };
  if (pairBadLenHandled) results.summary.pass++; else results.summary.fail++;

  // 8. ecPairing (0x08) Bad Point
  console.log(`--> Probing 0x08 (ecPairing) [Invalid Point in Pairing]...`);
  const pairBadPoint = await ethCall(config.rpcUrl, PRECOMPILES.ecPairing, vectors.ecPairing.badPoint.input);
  const pairBadPointHandled = !!pairBadPoint.error || pairBadPoint.result === "0x";
  console.log(`    Returned: ${pairBadPoint.result ?? JSON.stringify(pairBadPoint.error)}`);
  console.log(`    Verdict: ${pairBadPointHandled ? "PASS (Correctly rejected)" : "FAIL"}`);
  results.probes.ecPairing_badPoint = { ...pairBadPoint, rejected: pairBadPointHandled, verdict: pairBadPointHandled ? "PASS" : "FAIL" };
  if (pairBadPointHandled) results.summary.pass++; else results.summary.fail++;

  console.log(`\n------------------------------------------------------`);
  console.log(`Precompile Probe Summary: ${results.summary.pass} Passed, ${results.summary.fail} Failed`);
  console.log(`------------------------------------------------------\n`);

  const outDir = path.resolve(process.cwd(), "docs/evidence");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `precompile-probes-${config.id}.json`);
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Evidence saved to: ${outPath}\n`);

  return results;
}

const networkArg = process.argv.find((_, i, arr) => arr[i - 1] === "--network") || "mstLegacyTestnet";
runPrecompileProbes(networkArg).catch((err) => {
  console.error("Probe failed:", err);
  process.exit(1);
});

