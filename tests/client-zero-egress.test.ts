import assert from "node:assert";
import path from "node:path";
import { issueSyntheticCredential } from "../scripts/pramaan/crypto-utils.ts";
import { generateProofClientSide, buildVerificationPayload } from "../packages/client/src/prover.ts";

describe("Milestone MVP Step 5: Client Proving SDK & Zero-Network-Egress Guarantee", function () {
  this.timeout(60000);

  const wasmPath = path.resolve("circuits/pramaan/age_credential_js/age_credential.wasm");
  const zkeyPath = path.resolve("circuits/pramaan/age_credential_final.zkey");

  it("1. Generates proof with real progress callbacks reporting percentages", async function () {
    const cred = await issueSyntheticCredential({ dobDays: 10000, stateCode: 27 });
    const progressEvents: { stage: string; percent: number }[] = [];

    const result = await generateProofClientSide(
      cred,
      {
        scopeId: "42",
        recipient: "0x1234567890123456789012345678901234567890",
        chainId: 31337,
      },
      {
        wasmUrl: wasmPath,
        zkeyUrl: zkeyPath,
        onProgress: (stage, percent) => {
          progressEvents.push({ stage, percent });
        },
      }
    );

    assert(result.proof, "Must return valid proof");
    assert.strictEqual(result.publicSignals.length, 7);
    assert(progressEvents.length >= 3, "Must trigger progress events");
    assert(progressEvents.some((p) => p.percent === 100));
  });

  it("2. Supports AbortSignal cancellation cleanly", async function () {
    const cred = await issueSyntheticCredential({ dobDays: 10000, stateCode: 27 });
    const controller = new AbortController();
    controller.abort(); // Pre-aborted

    await assert.rejects(
      async () => {
        await generateProofClientSide(
          cred,
          {
            scopeId: "42",
            recipient: "0x1234567890123456789012345678901234567890",
            chainId: 31337,
          },
          {
            wasmUrl: wasmPath,
            zkeyUrl: zkeyPath,
            signal: controller.signal,
          }
        );
      },
      /aborted/,
      "Pre-aborted signal must throw immediately"
    );
  });

  it("3. Strict Zero-Egress Assertion: No private credential fields leak into network payload", async function () {
    const cred = await issueSyntheticCredential({
      dobDays: 11111,
      stateCode: 99,
      credentialSecret: "777888999111222333444555",
    });

    const result = await generateProofClientSide(
      cred,
      {
        scopeId: "999",
        recipient: "0x2222222222222222222222222222222222222222",
        chainId: 31337,
      },
      {
        wasmUrl: wasmPath,
        zkeyUrl: zkeyPath,
      }
    );

    const payload = buildVerificationPayload(result);
    const serializedPayload = JSON.stringify(payload);

    // 1. Structure check: payload must not contain any private property keys
    const prohibitedKeys = [
      "dobDays",
      "stateCode",
      "credentialSecret",
      "sigR8x",
      "sigR8y",
      "sigS",
      "issuerPubKeyAx",
      "issuerPubKeyAy",
    ];
    for (const key of prohibitedKeys) {
      assert.strictEqual(
        (payload as any)[key],
        undefined,
        `Privacy Leak FATAL: Outbound payload has property '${key}'`
      );
    }

    // 2. High-entropy secret check: 253-bit random secret and signature points must NEVER appear in outbound string
    const secretValues = [
      cred.credentialSecret,
      cred.sigR8x,
      cred.sigR8y,
      cred.sigS,
    ];

    for (const secretVal of secretValues) {
      assert(
        !serializedPayload.includes(secretVal),
        `Privacy Leak FATAL: Outbound network payload contains private credential secret: ${secretVal}`
      );
    }

    // Verify allowed public signals are present
    assert(serializedPayload.includes("999"), "Public scopeId must be present");
    assert(serializedPayload.includes(result.nullifier), "Public nullifier must be present");
  });
});
