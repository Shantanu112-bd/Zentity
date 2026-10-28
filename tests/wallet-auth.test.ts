import assert from "node:assert";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { buildApp, authNonces } from "../server/app.ts";

describe("Milestone MVP Step 4: Wallet Authentication (EIP-191 Challenge)", function () {
  let app: any;
  let testAccount: any;
  let otherAccount: any;

  before(async function () {
    app = await buildApp({ enableRateLimit: false });
    const pkey1 = generatePrivateKey();
    const pkey2 = generatePrivateKey();
    testAccount = privateKeyToAccount(pkey1);
    otherAccount = privateKeyToAccount(pkey2);
  });

  after(async function () {
    await app.close();
  });

  it("1. Successfully issues nonce challenge for valid address", async function () {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/nonce",
      payload: {
        address: testAccount.address,
        origin: "http://localhost:5173",
      },
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.nonce);
    assert.ok(body.message.includes(testAccount.address));
    assert.ok(body.message.includes(body.nonce));
    assert.strictEqual(body.notice, "Signing in is free and is not a blockchain transaction.");
  });

  it("2. Rejects nonce request for invalid address", async function () {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/nonce",
      payload: {
        address: "not-an-address",
      },
    });

    assert.strictEqual(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.error, "INVALID_ADDRESS");
  });

  it("3. Successfully authenticates valid signature", async function () {
    // Request nonce
    const nonceRes = await app.inject({
      method: "POST",
      url: "/api/auth/nonce",
      payload: { address: testAccount.address },
    });
    const { nonce, message } = JSON.parse(nonceRes.body);

    // Sign message
    const signature = await testAccount.signMessage({ message });

    // Verify
    const verifyRes = await app.inject({
      method: "POST",
      url: "/api/auth/verify",
      payload: {
        address: testAccount.address,
        nonce,
        signature,
      },
    });

    assert.strictEqual(verifyRes.statusCode, 200);
    const body = JSON.parse(verifyRes.body);
    assert.strictEqual(body.status, "AUTHENTICATED");
    assert.strictEqual(body.address, testAccount.address);
  });

  it("4. Replay attack fails: cannot reuse consumed nonce", async function () {
    // Request nonce
    const nonceRes = await app.inject({
      method: "POST",
      url: "/api/auth/nonce",
      payload: { address: testAccount.address },
    });
    const { nonce, message } = JSON.parse(nonceRes.body);
    const signature = await testAccount.signMessage({ message });

    // First verify succeeds
    const firstVerify = await app.inject({
      method: "POST",
      url: "/api/auth/verify",
      payload: { address: testAccount.address, nonce, signature },
    });
    assert.strictEqual(firstVerify.statusCode, 200);

    // Replay with identical payload fails
    const secondVerify = await app.inject({
      method: "POST",
      url: "/api/auth/verify",
      payload: { address: testAccount.address, nonce, signature },
    });
    assert.strictEqual(secondVerify.statusCode, 400);
    const body = JSON.parse(secondVerify.body);
    assert.strictEqual(body.error, "INVALID_OR_CONSUMED_NONCE");
  });

  it("5. Rejects expired nonce", async function () {
    // Request nonce
    const nonceRes = await app.inject({
      method: "POST",
      url: "/api/auth/nonce",
      payload: { address: testAccount.address },
    });
    const { nonce, message } = JSON.parse(nonceRes.body);
    const signature = await testAccount.signMessage({ message });

    // Artificially expire the nonce in the store
    const record = authNonces.get(nonce);
    if (record) {
      record.expiresAt = Date.now() - 1000; // 1 sec in past
    }

    const verifyRes = await app.inject({
      method: "POST",
      url: "/api/auth/verify",
      payload: { address: testAccount.address, nonce, signature },
    });
    assert.strictEqual(verifyRes.statusCode, 400);
    const body = JSON.parse(verifyRes.body);
    assert.strictEqual(body.error, "NONCE_EXPIRED");
  });

  it("6. Rejects address mismatch (submitting different address than requested nonce)", async function () {
    const nonceRes = await app.inject({
      method: "POST",
      url: "/api/auth/nonce",
      payload: { address: testAccount.address },
    });
    const { nonce, message } = JSON.parse(nonceRes.body);
    const signature = await testAccount.signMessage({ message });

    const verifyRes = await app.inject({
      method: "POST",
      url: "/api/auth/verify",
      payload: {
        address: otherAccount.address, // mismatch!
        nonce,
        signature,
      },
    });
    assert.strictEqual(verifyRes.statusCode, 400);
    const body = JSON.parse(verifyRes.body);
    assert.strictEqual(body.error, "ADDRESS_MISMATCH");
  });

  it("7. Rejects invalid signature signed with wrong key", async function () {
    const nonceRes = await app.inject({
      method: "POST",
      url: "/api/auth/nonce",
      payload: { address: testAccount.address },
    });
    const { nonce, message } = JSON.parse(nonceRes.body);

    // Signed by otherAccount instead of testAccount
    const wrongSignature = await otherAccount.signMessage({ message });

    const verifyRes = await app.inject({
      method: "POST",
      url: "/api/auth/verify",
      payload: {
        address: testAccount.address,
        nonce,
        signature: wrongSignature,
      },
    });
    assert.strictEqual(verifyRes.statusCode, 401);
    const body = JSON.parse(verifyRes.body);
    assert.strictEqual(body.error, "INVALID_SIGNATURE");
  });
});
