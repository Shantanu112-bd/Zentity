import assert from "assert";
import fs from "fs";
import path from "path";
import * as snarkjs from "snarkjs";
import {
  getCrypto,
  getDemoIssuer,
  issueSyntheticCredential,
  createCircuitInput,
} from "../scripts/pramaan/crypto-utils.ts";

describe("Milestone MVP Step 2: Pramaan Age Credential Circuit (Groth16)", function () {
  this.timeout(60000);

  const wasmPath = path.resolve("circuits/pramaan/age_credential_js/age_credential.wasm");
  const zkeyPath = path.resolve("circuits/pramaan/age_credential_final.zkey");
  const vkPath = path.resolve("circuits/pramaan/verification_key.json");

  let vKey: any;

  before(function () {
    assert(fs.existsSync(wasmPath), `wasm missing at ${wasmPath}`);
    assert(fs.existsSync(zkeyPath), `zkey missing at ${zkeyPath}`);
    assert(fs.existsSync(vkPath), `vk missing at ${vkPath}`);
    vKey = JSON.parse(fs.readFileSync(vkPath, "utf-8"));
  });

  it("1. Valid adult credential (age >= 18) generates proof and passes verification", async function () {
    // Current date: 20000 epoch days (~2024-10-04)
    // Birth date: 10000 epoch days (~1997-05-19) -> age ~27 years (20000 - 10000 = 10000 days > 6575 days)
    const cred = await issueSyntheticCredential({
      dobDays: 10000,
      stateCode: 27,
    });

    const circuitInput = await createCircuitInput({
      credential: cred,
      scopeId: 101,
      recipient: "0x1234567890123456789012345678901234567890",
      chainId: 91562037, // MST Legacy Testnet
      currentDateDays: 20000,
      thresholdAgeDays: 6575,
    });

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      wasmPath,
      zkeyPath
    );

    assert(proof, "Proof must be generated");
    assert.strictEqual(publicSignals.length, 7, "Must have exactly 7 public signals");

    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    assert.strictEqual(isValid, true, "Proof must verify as true");
  });

  it("2. Negative: Under-18 credential fails constraint check", async function () {
    // Current date: 20000
    // Birth date: 15000 (~2011) -> age = 5000 days < 6575 threshold (18 years)
    const cred = await issueSyntheticCredential({
      dobDays: 15000,
      stateCode: 27,
    });

    const circuitInput = await createCircuitInput({
      credential: cred,
      scopeId: 101,
      recipient: "0x1234567890123456789012345678901234567890",
      chainId: 91562037,
      currentDateDays: 20000,
      thresholdAgeDays: 6575,
    });

    await assert.rejects(
      async () => {
        await snarkjs.groth16.fullProve(circuitInput, wasmPath, zkeyPath);
      },
      /Assert Failed|Error in template LessEqThan/,
      "Under-18 proof generation must fail constraint assertion"
    );
  });

  it("3. Negative: Wrong issuer key hash fails constraint check", async function () {
    const cred = await issueSyntheticCredential({
      dobDays: 10000,
      stateCode: 27,
    });

    const circuitInput = await createCircuitInput({
      credential: cred,
      scopeId: 101,
      recipient: "0x1234567890123456789012345678901234567890",
      chainId: 91562037,
      currentDateDays: 20000,
      thresholdAgeDays: 6575,
    });

    // Tamper with issuerPubKeyHash
    circuitInput.issuerPubKeyHash = "999999999999999999999999";

    await assert.rejects(
      async () => {
        await snarkjs.groth16.fullProve(circuitInput, wasmPath, zkeyPath);
      },
      /Assert Failed/,
      "Wrong issuer key hash must fail constraint assertion"
    );
  });

  it("4. Negative: Tampered signature fails EdDSA verification constraint", async function () {
    const cred = await issueSyntheticCredential({
      dobDays: 10000,
      stateCode: 27,
    });

    const circuitInput = await createCircuitInput({
      credential: cred,
      scopeId: 101,
      recipient: "0x1234567890123456789012345678901234567890",
      chainId: 91562037,
      currentDateDays: 20000,
      thresholdAgeDays: 6575,
    });

    // Tamper with signature scalar S
    circuitInput.sigS = "12345678901234567890";

    await assert.rejects(
      async () => {
        await snarkjs.groth16.fullProve(circuitInput, wasmPath, zkeyPath);
      },
      /Assert Failed/,
      "Tampered signature must fail EdDSA constraint assertion"
    );
  });

  it("5. Negative: Tampered nullifier / wrong scope fails constraint check", async function () {
    const cred = await issueSyntheticCredential({
      dobDays: 10000,
      stateCode: 27,
    });

    const circuitInput = await createCircuitInput({
      credential: cred,
      scopeId: 101,
      recipient: "0x1234567890123456789012345678901234567890",
      chainId: 91562037,
      currentDateDays: 20000,
      thresholdAgeDays: 6575,
    });

    // Tamper with public nullifier
    circuitInput.nullifier = "111222333444555666777";

    await assert.rejects(
      async () => {
        await snarkjs.groth16.fullProve(circuitInput, wasmPath, zkeyPath);
      },
      /Assert Failed/,
      "Tampered nullifier must fail constraint assertion"
    );
  });
});
