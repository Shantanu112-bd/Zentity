import assert from "node:assert";
import path from "node:path";
import crypto from "node:crypto";
import * as snarkjs from "snarkjs";
import { buildApp } from "../server/app.ts";
import {
  issueSyntheticCredential,
  createCircuitInput,
} from "../scripts/pramaan/crypto-utils.ts";

describe("Milestone MVP Step 4: Backend Fastify API & OIDC-Lite Gateway", function () {
  this.timeout(60000);

  let app: any;
  const wasmPath = path.resolve("circuits/pramaan/age_credential_js/age_credential.wasm");
  const zkeyPath = path.resolve("circuits/pramaan/age_credential_final.zkey");

  before(async function () {
    app = await buildApp({ enableRateLimit: false });
    await app.ready();
  });

  after(async function () {
    await app.close();
  });

  it("1. GET /health returns service status and chain mode", async function () {
    const res = await app.inject({ method: "GET", url: "/health" });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.status, "ok");
    assert(body.chainMode);
  });

  it("1b. Observability: GET /healthz, /readyz, and /metrics return valid formats", async function () {
    // Liveness
    const healthz = await app.inject({ method: "GET", url: "/healthz" });
    assert.strictEqual(healthz.statusCode, 200);
    const hzBody = JSON.parse(healthz.payload);
    assert.strictEqual(hzBody.status, "ok");

    // Readiness
    const readyz = await app.inject({ method: "GET", url: "/readyz" });
    assert.ok(readyz.statusCode === 200 || readyz.statusCode === 503);
    const rzBody = JSON.parse(readyz.payload);
    assert.ok(rzBody.status);
    assert.ok("database" in rzBody.checks);
    assert.ok("rpc" in rzBody.checks);

    // Prometheus Metrics
    const metrics = await app.inject({ method: "GET", url: "/metrics" });
    assert.strictEqual(metrics.statusCode, 200);
    assert.ok(metrics.headers["content-type"].includes("text/plain"));
    assert.ok(metrics.payload.includes("pramaan_uptime_seconds"));
    assert.ok(metrics.payload.includes("pramaan_requests_total"));
    assert.ok(metrics.payload.includes("pramaan_database_connected"));
  });

  it("2. POST /api/v1/issue (and /api/demo/issue) issues synthetic credential and rejects real PII", async function () {
    // Prohibited PII check
    const badRes = await app.inject({
      method: "POST",
      url: "/api/v1/issue",
      payload: { aadhaar: "123456789012" },
    });
    assert.strictEqual(badRes.statusCode, 400);
    const badBody = JSON.parse(badRes.payload);
    assert.strictEqual(badBody.error, "PII_PROHIBITED");

    // Valid synthetic issue via /api/v1/issue
    const okRes = await app.inject({
      method: "POST",
      url: "/api/v1/issue",
      payload: { age: 25, stateCode: 27 },
    });
    assert.strictEqual(okRes.statusCode, 200);
    const okBody = JSON.parse(okRes.payload);
    assert(okBody.credential.credentialSecret);
    assert(okBody.credential.sigR8x);
    assert(okBody.label.includes("PRAMAAN TESTNET ISSUER"));

    // Backwards compatibility alias /api/demo/issue
    const aliasRes = await app.inject({
      method: "POST",
      url: "/api/demo/issue",
      payload: { age: 25, stateCode: 27 },
    });
    assert.strictEqual(aliasRes.statusCode, 200);
  });

  it("3. POST /api/verify performs off-chain Groth16 verification", async function () {
    const cred = await issueSyntheticCredential({ dobDays: 10000, stateCode: 27 });
    const circuitInput = await createCircuitInput({
      credential: cred,
      scopeId: 10,
      recipient: "0x1111111111111111111111111111111111111111",
      chainId: 31337,
      currentDateDays: 20000,
    });

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      wasmPath,
      zkeyPath
    );

    const res = await app.inject({
      method: "POST",
      url: "/api/verify",
      payload: { proof, publicSignals },
    });

    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.offChainVerified, true);
    assert.strictEqual(body.publicSignals.scopeId, "10");
  });

  it("4. OIDC-Lite: /.well-known/openid-configuration and /jwks", async function () {
    const resConfig = await app.inject({
      method: "GET",
      url: "/.well-known/openid-configuration",
    });
    assert.strictEqual(resConfig.statusCode, 200);
    const config = JSON.parse(resConfig.payload);
    assert.strictEqual(config.authorization_endpoint, "http://localhost:3001/authorize");

    const resJwks = await app.inject({ method: "GET", url: "/jwks" });
    assert.strictEqual(resJwks.statusCode, 200);
    const jwks = JSON.parse(resJwks.payload);
    assert(jwks.keys.length > 0);
  });

  it("5. OIDC-Lite: Authorize + Token exchange with PKCE and pairwise sub", async function () {
    const verifier = "demo-pkce-verifier-string-1234567890";
    const challenge = crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64url");

    // 1. Authorize
    const authRes = await app.inject({
      method: "GET",
      url: `/authorize?client_id=demo-relying-party&redirect_uri=http://localhost:5173/relying-party&response_type=code&code_challenge=${challenge}&code_challenge_method=S256&state=state123`,
    });
    assert.strictEqual(authRes.statusCode, 302);
    const location = authRes.headers.location;
    const redirectUrl = new URL(location);
    const code = redirectUrl.searchParams.get("code");
    assert(code);

    // 2. Token Exchange
    const tokenRes = await app.inject({
      method: "POST",
      url: "/token",
      payload: {
        grant_type: "authorization_code",
        code,
        client_id: "demo-relying-party",
        redirect_uri: "http://localhost:5173/relying-party",
        code_verifier: verifier,
      },
    });

    assert.strictEqual(tokenRes.statusCode, 200);
    const tokens = JSON.parse(tokenRes.payload);
    assert(tokens.access_token);
    assert(tokens.id_token);
  });

  it("6. Government Simulation Channel: POST /api/simulation/government/webhook", async function () {
    const res = await app.inject({
      method: "POST",
      url: "/api/simulation/government/webhook",
      payload: { scopeId: "tax-portal-sim", nullifier: "sim-nullifier-1" },
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers["x-pramaan-simulation"], "TRUE");
    assert(res.headers["x-pramaan-signature"]);
    const body = JSON.parse(res.payload);
    assert.strictEqual(body.banner, "SIMULATION — NOT A GOVERNMENT INTEGRATION");
  });
});
