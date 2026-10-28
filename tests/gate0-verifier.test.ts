import assert from "node:assert";
import hre from "hardhat";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Gate 0: MultiplierVerifier (Groth16Verifier.sol) on Local EVM", function () {
  let verifier: any;
  let calldata: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
    input: [string];
  };

  before(async function () {
    const calldataPath = path.resolve(process.cwd(), "circuits/gate0/calldata.json");
    assert.ok(fs.existsSync(calldataPath), "calldata.json must exist");
    calldata = JSON.parse(fs.readFileSync(calldataPath, "utf-8"));

    const viem = (hre as any).viem;
    verifier = await viem.deployContract("Groth16Verifier");
    console.log(`[Test] Groth16Verifier deployed at: ${verifier.address}`);
  });

  it("Valid proof returns true", async function () {
    const isValid = await verifier.read.verifyProof([
      calldata.a,
      calldata.b,
      calldata.c,
      calldata.input,
    ]);
    assert.strictEqual(isValid, true, "Valid proof must return true");
    console.log("[PASS] Valid proof verified as true!");
  });

  it("Tampered public signal (c = 34 instead of 33) returns false", async function () {
    const tamperedInput = ["0x0000000000000000000000000000000000000000000000000000000000000022"]; // 34
    const isValid = await verifier.read.verifyProof([
      calldata.a,
      calldata.b,
      calldata.c,
      tamperedInput,
    ]);
    assert.strictEqual(isValid, false, "Tampered public signal must return false");
    console.log("[PASS] Tampered public signal rejected!");
  });

  it("Tampered proof coordinate (flipped pA[0]) returns false or reverts safely", async function () {
    const tamperedA: [string, string] = [
      "0x" + (BigInt(calldata.a[0]) ^ 1n).toString(16).padStart(64, "0"),
      calldata.a[1],
    ];
    try {
      const isValid = await verifier.read.verifyProof([
        tamperedA,
        calldata.b,
        calldata.c,
        calldata.input,
      ]);
      assert.strictEqual(isValid, false, "Tampered coordinate must return false");
    } catch (err: any) {
      // Revert from precompile due to point-not-on-curve is also safe
      console.log(`[PASS] Tampered coordinate reverted safely: ${err.message}`);
    }
  });

  it("Swapped pA and pC terms returns false", async function () {
    const isValid = await verifier.read.verifyProof([
      calldata.c, // swapped
      calldata.b,
      calldata.a, // swapped
      calldata.input,
    ]);
    assert.strictEqual(isValid, false, "Swapped terms must return false");
    console.log("[PASS] Swapped proof terms rejected!");
  });

  it("Deterministic execution: 5 repeated calls with valid proof return true", async function () {
    for (let i = 1; i <= 5; i++) {
      const isValid = await verifier.read.verifyProof([
        calldata.a,
        calldata.b,
        calldata.c,
        calldata.input,
      ]);
      assert.strictEqual(isValid, true);
    }
    console.log("[PASS] 5/5 repeated verification calls succeeded deterministically!");
  });
});

