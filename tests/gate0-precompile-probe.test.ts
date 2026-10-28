import assert from "node:assert";
import hre from "hardhat";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Gate 0: PrecompileProbe.sol on Local EVM", function () {
  let probeContract: any;
  let vectors: any;

  before(async function () {
    const vectorsPath = path.resolve(process.cwd(), "scripts/gate0/vectors.json");
    vectors = JSON.parse(fs.readFileSync(vectorsPath, "utf-8"));

    const viem = (hre as any).viem;
    probeContract = await viem.deployContract("PrecompileProbe");
    console.log(`[Test] PrecompileProbe deployed at: ${probeContract.address}`);
  });

  it("0x06 ecAdd valid input returns correct point and measures gas", async function () {
    const res = await probeContract.read.probeAdd([vectors.ecAdd.valid.input]);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.output.toLowerCase(), vectors.ecAdd.valid.expected.toLowerCase());
    console.log(`[ecAdd Gas Measured]: ${res.gasUsed.toString()} gas`);
    assert.ok(Number(res.gasUsed) > 0);
  });

  it("0x06 ecAdd invalid point returns success = false", async function () {
    const res = await probeContract.read.probeAdd([vectors.ecAdd.invalidPoint.input]);
    assert.strictEqual(res.success, false);
  });

  it("0x07 ecMul valid input returns correct point and measures gas", async function () {
    const res = await probeContract.read.probeMul([vectors.ecMul.valid.input]);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.output.toLowerCase(), vectors.ecMul.valid.expected.toLowerCase());
    console.log(`[ecMul Gas Measured]: ${res.gasUsed.toString()} gas`);
    assert.ok(Number(res.gasUsed) > 0);
  });

  it("0x07 ecMul invalid point returns success = false", async function () {
    const res = await probeContract.read.probeMul([vectors.ecMul.invalidPoint.input]);
    assert.strictEqual(res.success, false);
  });

  it("0x08 ecPairing valid identity returns 1 and measures gas", async function () {
    const res = await probeContract.read.probePairing([vectors.ecPairing.validIdentity.input]);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.output.toLowerCase(), vectors.ecPairing.validIdentity.expected.toLowerCase());
    console.log(`[ecPairing Gas Measured]: ${res.gasUsed.toString()} gas`);
    assert.ok(Number(res.gasUsed) > 0);
  });

  it("0x08 ecPairing non-identity returns 0", async function () {
    const res = await probeContract.read.probePairing([vectors.ecPairing.nonIdentity.input]);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.output.toLowerCase(), vectors.ecPairing.nonIdentity.expected.toLowerCase());
  });

  it("0x08 ecPairing bad length returns success = false", async function () {
    const res = await probeContract.read.probePairing([vectors.ecPairing.badLength.input]);
    assert.strictEqual(res.success, false);
  });
});
