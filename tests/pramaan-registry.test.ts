import assert from "node:assert";
import path from "node:path";
import hre from "hardhat";
import * as snarkjs from "snarkjs";
import {
  issueSyntheticCredential,
  createCircuitInput,
  formatSolidityCalldata,
  getDemoIssuer,
} from "../scripts/pramaan/crypto-utils.ts";

describe("Milestone MVP Step 3: PramaanRegistry Smart Contract", function () {
  this.timeout(60000);

  let verifierContract: any;
  let registryContract: any;
  let publicClient: any;
  let walletClients: any[];
  let deployer: any;
  let user: any;

  const wasmPath = path.resolve("circuits/pramaan/age_credential_js/age_credential.wasm");
  const zkeyPath = path.resolve("circuits/pramaan/age_credential_final.zkey");

  before(async function () {
    const viem = (hre as any).viem;
    publicClient = await viem.getPublicClient();
    walletClients = await viem.getWalletClients();
    deployer = walletClients[0];
    user = walletClients[1];

    // 1. Deploy PramaanVerifier
    verifierContract = await viem.deployContract("PramaanVerifier");
    console.log(`[Test] PramaanVerifier deployed at: ${verifierContract.address}`);

    // 2. Deploy PramaanRegistry
    registryContract = await viem.deployContract("PramaanRegistry", [verifierContract.address]);
    console.log(`[Test] PramaanRegistry deployed at: ${registryContract.address}`);

    // 3. Register Demo Issuer Key Hash
    const issuer = await getDemoIssuer();
    const hashBigInt = BigInt(issuer.pubKeyHash);
    await registryContract.write.registerIssuer([hashBigInt]);

    const isRegistered = await registryContract.read.registeredIssuers([hashBigInt]);
    assert.strictEqual(isRegistered, true, "Demo issuer must be registered");
  });

  it("1. Successfully verifies valid proof and records nullifier in registry", async function () {
    const chainId = await publicClient.getChainId();
    const cred = await issueSyntheticCredential({
      dobDays: 10000,
      stateCode: 27,
    });

    const circuitInput = await createCircuitInput({
      credential: cred,
      scopeId: 42,
      recipient: user.account.address,
      chainId,
      currentDateDays: 20000,
      thresholdAgeDays: 6575,
    });

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      wasmPath,
      zkeyPath
    );

    const callArgs = formatSolidityCalldata(proof, publicSignals);

    // Call verifyAndRecord
    const txHash = await registryContract.write.verifyAndRecord(
      [callArgs.a, callArgs.b, callArgs.c, callArgs.input],
      { account: user.account }
    );
    assert(txHash, "Transaction must return txHash");

    // Check nullifier is spent
    const nullifierBigInt = callArgs.input[2];
    const isSpent = await registryContract.read.isNullifierSpent([42n, nullifierBigInt]);
    assert.strictEqual(isSpent, true, "Nullifier must be recorded as spent in scope 42");
  });

  it("2. Replay attack fails: reusing the same nullifier in the same scope reverts", async function () {
    const chainId = await publicClient.getChainId();
    const cred = await issueSyntheticCredential({
      dobDays: 10000,
      stateCode: 27,
    });

    const circuitInput = await createCircuitInput({
      credential: cred,
      scopeId: 55,
      recipient: user.account.address,
      chainId,
      currentDateDays: 20000,
      thresholdAgeDays: 6575,
    });

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      wasmPath,
      zkeyPath
    );

    const callArgs = formatSolidityCalldata(proof, publicSignals);

    // First execution succeeds
    await registryContract.write.verifyAndRecord(
      [callArgs.a, callArgs.b, callArgs.c, callArgs.input],
      { account: user.account }
    );

    // Second execution must revert with NullifierAlreadySpent
    await assert.rejects(
      async () => {
        await registryContract.write.verifyAndRecord(
          [callArgs.a, callArgs.b, callArgs.c, callArgs.input],
          { account: user.account }
        );
      },
      /NullifierAlreadySpent/,
      "Replaying proof with same nullifier must revert with NullifierAlreadySpent"
    );
  });

  it("3. Different scopeId allows same credential without collision", async function () {
    const chainId = await publicClient.getChainId();
    const cred = await issueSyntheticCredential({
      dobDays: 10000,
      stateCode: 27,
    });

    // Scope 77
    const input1 = await createCircuitInput({
      credential: cred,
      scopeId: 77,
      recipient: user.account.address,
      chainId,
      currentDateDays: 20000,
      thresholdAgeDays: 6575,
    });
    const res1 = await snarkjs.groth16.fullProve(input1, wasmPath, zkeyPath);
    const args1 = formatSolidityCalldata(res1.proof, res1.publicSignals);

    await registryContract.write.verifyAndRecord(
      [args1.a, args1.b, args1.c, args1.input],
      { account: user.account }
    );

    // Scope 88 (different scope, derived nullifier is different)
    const input2 = await createCircuitInput({
      credential: cred,
      scopeId: 88,
      recipient: user.account.address,
      chainId,
      currentDateDays: 20000,
      thresholdAgeDays: 6575,
    });
    const res2 = await snarkjs.groth16.fullProve(input2, wasmPath, zkeyPath);
    const args2 = formatSolidityCalldata(res2.proof, res2.publicSignals);

    await registryContract.write.verifyAndRecord(
      [args2.a, args2.b, args2.c, args2.input],
      { account: user.account }
    );

    const isSpent1 = await registryContract.read.isNullifierSpent([77n, args1.input[2]]);
    const isSpent2 = await registryContract.read.isNullifierSpent([88n, args2.input[2]]);
    assert.strictEqual(isSpent1, true);
    assert.strictEqual(isSpent2, true);
  });

  it("4. Unregistered issuer reverts with UnregisteredIssuer", async function () {
    const chainId = await publicClient.getChainId();
    const cred = await issueSyntheticCredential({
      dobDays: 10000,
      stateCode: 27,
    });

    const circuitInput = await createCircuitInput({
      credential: cred,
      scopeId: 99,
      recipient: user.account.address,
      chainId,
      currentDateDays: 20000,
      thresholdAgeDays: 6575,
    });

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      wasmPath,
      zkeyPath
    );

    const callArgs = formatSolidityCalldata(proof, publicSignals);

    // Tamper with issuerPubKeyHash in public inputs
    const tamperedInput = [...callArgs.input];
    tamperedInput[0] = 123456789n; // non-registered hash

    await assert.rejects(
      async () => {
        await registryContract.write.verifyAndRecord(
          [callArgs.a, callArgs.b, callArgs.c, tamperedInput],
          { account: user.account }
        );
      },
      /UnregisteredIssuer/,
      "Unregistered issuer must revert"
    );
  });

  it("5. Wrong chain ID reverts with ChainIdMismatch", async function () {
    const chainId = await publicClient.getChainId();
    const cred = await issueSyntheticCredential({
      dobDays: 10000,
      stateCode: 27,
    });

    const circuitInput = await createCircuitInput({
      credential: cred,
      scopeId: 100,
      recipient: user.account.address,
      chainId,
      currentDateDays: 20000,
      thresholdAgeDays: 6575,
    });

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      wasmPath,
      zkeyPath
    );

    const callArgs = formatSolidityCalldata(proof, publicSignals);

    // Tamper with chainId in public inputs (e.g. 1 instead of 31337)
    const tamperedInput = [...callArgs.input];
    tamperedInput[4] = 1n; // mainnet id

    await assert.rejects(
      async () => {
        await registryContract.write.verifyAndRecord(
          [callArgs.a, callArgs.b, callArgs.c, tamperedInput],
          { account: user.account }
        );
      },
      /ChainIdMismatch/,
      "Wrong chainId must revert"
    );
  });

  it("6. Pausable: Paused contract rejects execution, unpaused resumes", async function () {
    const chainId = await publicClient.getChainId();
    const cred = await issueSyntheticCredential({
      dobDays: 10000,
      stateCode: 27,
    });

    const circuitInput = await createCircuitInput({
      credential: cred,
      scopeId: 200,
      recipient: user.account.address,
      chainId,
      currentDateDays: 20000,
      thresholdAgeDays: 6575,
    });

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      wasmPath,
      zkeyPath
    );

    const callArgs = formatSolidityCalldata(proof, publicSignals);

    // Pause contract
    await registryContract.write.pause({ account: deployer.account });
    const isPaused = await registryContract.read.paused();
    assert.strictEqual(isPaused, true);

    // Attempt verifyAndRecord while paused
    await assert.rejects(
      async () => {
        await registryContract.write.verifyAndRecord(
          [callArgs.a, callArgs.b, callArgs.c, callArgs.input],
          { account: user.account }
        );
      },
      /ContractPaused/,
      "Paused contract must revert"
    );

    // Unpause contract
    await registryContract.write.unpause({ account: deployer.account });
    const isNowPaused = await registryContract.read.paused();
    assert.strictEqual(isNowPaused, false);

    // Now execution succeeds
    const txHash = await registryContract.write.verifyAndRecord(
      [callArgs.a, callArgs.b, callArgs.c, callArgs.input],
      { account: user.account }
    );
    assert(txHash);
  });
});
