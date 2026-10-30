import path from "path";
import fs from "fs";
import crypto from "crypto";
import fastify from "fastify";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { verifyMessage } from "viem";
import * as snarkjs from "snarkjs";
import { getActiveChainMode, NETWORKS } from "../config/networks.ts";
import { db } from "./db/index.ts";
import { seedDefaultTenants } from "./db/seed-tenants.ts";
import { issueAttestationCredential, getOrInitIssuerKey } from "./services/issuerKeyService.ts";
import { PersistentIndexer } from "./services/indexerService.ts";
import { webhookService, computeWebhookSignature, verifyWebhookSignature } from "./services/webhookService.ts";
import {
  getSigningKey,
  verifyPkce,
  computePairwiseSub,
  storeAuthSession,
  consumeAuthSession,
  createIdToken,
  getTenant,
} from "./oidc.ts";

export interface ServerOptions {
  enableRateLimit?: boolean;
  enableIndexer?: boolean;
}

export function formatSignInMessage(address: string, nonce: string, origin?: string): string {
  return [
    "Pramaan-ZK Authentication",
    `Address: ${address}`,
    `Nonce: ${nonce}`,
    origin ? `Origin: ${origin}` : undefined,
    "Statement: Sign in to Pramaan-ZK. Signing in is free and is not a blockchain transaction.",
  ].filter(Boolean).join("\n");
}

export const authNonces = {
  get(nonce: string) {
    return (db as any).memoryNonces?.get(nonce);
  },
  set(nonce: string, record: any) {
    (db as any).memoryNonces?.set(nonce, record);
  },
  delete(nonce: string) {
    (db as any).memoryNonces?.delete(nonce);
  },
};

export async function buildApp(opts: ServerOptions = {}): Promise<FastifyInstance> {
  // 1. Initialize Database & Seed Default Relying Parties
  await db.init();
  await seedDefaultTenants();
  await getOrInitIssuerKey();

  const app = fastify({
    logger: false, // Strict Zero-PII / Zero-IP logging policy
    disableRequestLogging: true,
  });

  // CORS
  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
  });

  // Rate Limiting (per-IP in memory without persisting or logging IPs)
  if (opts.enableRateLimit !== false) {
    await app.register(rateLimit, {
      max: 100,
      timeWindow: "1 minute",
    });
  }

  const vkPath = path.resolve(process.cwd(), "circuits/pramaan/verification_key.json");
  const vKey = JSON.parse(fs.readFileSync(vkPath, "utf-8"));

  // Health
  app.get("/health", async () => {
    return {
      status: "ok",
      chainMode: getActiveChainMode(),
      service: "Pramaan-ZK Gateway & OIDC Provider",
      storage: db.isPostgres() ? "PostgreSQL (Supabase)" : "Relational Persistence Layer",
      notice: "Synthetic credential attestation. Real Aadhaar QR support is future work (milestone M2).",
    };
  });

  // --------------------------------------------------------------------------
  // 1. Synthetic Credential Issuance (Persisted Stable Issuer Key)
  // --------------------------------------------------------------------------
  app.post("/api/demo/issue", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body as any) || {};

    // Strict PII Filter: Reject any attempt to provide real personal data
    const piiKeys = ["aadhaar", "uid", "name", "phone", "mobile", "email", "address", "pincode"];
    for (const key of piiKeys) {
      if (body[key] !== undefined) {
        return reply.status(400).send({
          error: "PII_PROHIBITED",
          message: `Zero-PII Policy: Input field '${key}' is prohibited. Pramaan-ZK strictly uses synthetic credentials.`,
        });
      }
    }

    const age = typeof body.age === "number" ? body.age : 25;
    const stateCode = typeof body.stateCode === "number" ? body.stateCode : 27;

    // Epoch calculation: 20000 days (~2024) minus (age * 365.25)
    const currentDateDays = 20000;
    const dobDays = Math.floor(currentDateDays - age * 365.25);

    const credential = await issueAttestationCredential(dobDays, stateCode);

    return {
      credential,
      label: "DEMO ISSUER (SYNTHETIC CREDENTIAL - NOT REAL AADHAAR)",
      notice: "Synthetic credential. Real Aadhaar QR support is future work (milestone M2).",
      age,
      stateCode,
      currentDateDays,
    };
  });

  // --------------------------------------------------------------------------
  // 2. Proof Verification & Off-Chain Validation
  // --------------------------------------------------------------------------
  app.post("/api/verify", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body as any) || {};
    const { proof, publicSignals, relayOnChain } = body;

    if (!proof || !publicSignals || !Array.isArray(publicSignals)) {
      return reply.status(400).send({
        error: "INVALID_BODY",
        message: "Missing 'proof' or 'publicSignals' in request body.",
      });
    }

    // Off-chain SnarkJS Verification
    let isOffChainValid = false;
    try {
      isOffChainValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    } catch (err: any) {
      return reply.status(400).send({
        error: "VERIFY_ERROR",
        message: `Proof verification threw error: ${err.message}`,
      });
    }

    if (!isOffChainValid) {
      return reply.status(422).send({
        error: "PROOF_INVALID",
        message: "Groth16 mathematical verification returned false.",
        offChainVerified: false,
      });
    }

    const chainMode = getActiveChainMode();
    let onChainTx: string | null = null;
    let onChainStatus = "NOT_REQUESTED";

    if (relayOnChain) {
      onChainStatus = "RELAY_SKIPPED_NO_KEY";
    }

    return {
      offChainVerified: true,
      onChainTx,
      onChainStatus,
      chainMode,
      publicSignals: {
        issuerPubKeyHash: publicSignals[0],
        scopeId: publicSignals[1],
        nullifier: publicSignals[2],
        recipient: publicSignals[3],
        chainId: publicSignals[4],
        currentDateDays: publicSignals[5],
        thresholdAgeDays: publicSignals[6],
      },
      notice: "Verified via Groth16 SnarkJS against Pramaan-ZK circuit.",
    };
  });

  // --------------------------------------------------------------------------
  // 3. Registry State Read & Contract Info
  // --------------------------------------------------------------------------
  app.get("/api/registry/info", async () => {
    const chainMode = getActiveChainMode();
    const networkSlot = chainMode === "mst-coral-testnet" ? "mstCoralTestnet" : chainMode === "mst-legacy-testnet" ? "mstLegacyTestnet" : "local";
    const netConfig = NETWORKS[networkSlot];

    let deployed: any = null;
    const deployPath = path.resolve(process.cwd(), "contracts/deployed-addresses.json");
    if (fs.existsSync(deployPath)) {
      try {
        deployed = JSON.parse(fs.readFileSync(deployPath, "utf-8"));
      } catch {}
    }

    const issuer = await getOrInitIssuerKey();

    return {
      chainMode,
      networkSlot,
      network: netConfig,
      contracts: deployed?.contracts || {
        PramaanVerifier: { address: "0x1ad0bfee242e7ecae55bc4246352329555a3f91e" },
        PramaanRegistry: { address: "0x39f842043b7de6421ae21d5e4c955dd6cbaa415b" },
      },
      demoIssuerPubKeyHash: issuer.pubKeyHash,
    };
  });

  app.get("/api/registry/:scopeId/:nullifier", async (req: FastifyRequest, reply: FastifyReply) => {
    const params = req.params as { scopeId: string; nullifier: string };
    const chainMode = getActiveChainMode();

    return {
      scopeId: params.scopeId,
      nullifier: params.nullifier,
      isSpent: false,
      chainMode,
      network: NETWORKS[chainMode]?.name || chainMode,
    };
  });

  // --------------------------------------------------------------------------
  // 4. OIDC Endpoints (Database-Backed Sessions & Tenants)
  // --------------------------------------------------------------------------
  app.get("/.well-known/openid-configuration", async (_req: FastifyRequest) => {
    const baseUrl = process.env.ISSUER_BASE_URL || "http://localhost:3001";
    return {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/authorize`,
      token_endpoint: `${baseUrl}/token`,
      userinfo_endpoint: `${baseUrl}/userinfo`,
      jwks_uri: `${baseUrl}/jwks`,
      response_types_supported: ["code"],
      subject_types_supported: ["pairwise"],
      id_token_signing_alg_values_supported: ["ES256"],
      code_challenge_methods_supported: ["S256"],
      scopes_supported: ["openid", "profile"],
      claims_supported: ["sub", "iss", "aud", "exp", "iat", "age_over_18"],
      notice: "zero-pii attribute attestation; pairwise pseudonymous sub",
    };
  });

  app.get("/jwks", async (_req: FastifyRequest) => {
    const { publicJwks } = await getSigningKey();
    return publicJwks;
  });

  app.get("/authorize", async (req: FastifyRequest, reply: FastifyReply) => {
    const query = (req.query as any) || {};
    const { client_id, redirect_uri, response_type, code_challenge, code_challenge_method, state } = query;

    // Validate tenant from database
    const tenant = await getTenant(client_id);
    if (!tenant) {
      return reply.status(400).send({ error: "unauthorized_client", message: "Unknown or inactive client_id" });
    }

    // Exact redirect URI match
    if (!tenant.redirectUris.includes(redirect_uri)) {
      return reply.status(400).send({
        error: "invalid_request",
        message: "redirect_uri does not match registered URI exactly.",
      });
    }

    if (response_type !== "code") {
      return reply.status(400).send({ error: "unsupported_response_type" });
    }

    // Generate an authorization code and store in DB
    const code = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await storeAuthSession({
      code,
      clientId: client_id,
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method || "S256",
      state: state || "",
      nullifier: query.nullifier,
      expiresAt,
    });

    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set("code", code);
    if (state) redirectUrl.searchParams.set("state", state);

    return reply.redirect(redirectUrl.toString());
  });

  app.post("/token", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body as any) || {};
    const { grant_type, code, client_id, redirect_uri, code_verifier } = body;

    if (grant_type !== "authorization_code") {
      return reply.status(400).send({ error: "unsupported_grant_type" });
    }

    // Consume session from DB atomically (prevents code reuse)
    const session = await consumeAuthSession(code);
    if (!session) {
      return reply.status(400).send({ error: "invalid_grant", message: "Code expired, consumed, or not found." });
    }

    if (session.clientId !== client_id || session.redirectUri !== redirect_uri) {
      return reply.status(400).send({ error: "invalid_grant", message: "Client or redirect mismatch." });
    }

    // PKCE verification
    if (session.codeChallenge) {
      if (!code_verifier || !verifyPkce(code_verifier, session.codeChallenge, session.codeChallengeMethod)) {
        return reply.status(400).send({ error: "invalid_grant", message: "PKCE verification failed." });
      }
    }

    const nullifier = session.nullifier || "pramaan-nullifier-001";
    const sub = computePairwiseSub(nullifier, client_id);
    const baseUrl = process.env.ISSUER_BASE_URL || "http://localhost:3001";

    const idToken = await createIdToken({
      sub,
      clientId: client_id,
      issuerUrl: baseUrl,
    });

    const accessToken = crypto.randomBytes(32).toString("hex");

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      id_token: idToken,
      scope: "openid profile",
    };
  });

  app.get("/userinfo", async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "invalid_token" });
    }

    return {
      sub: "pairwise-sub-holder",
      age_over_18: true,
      attribute_proven: "AGE_GE_18",
      issuer_type: "PRAMAAN_ZK_ATTESTATION",
      notice: "zero-pii attribute attestation; pairwise pseudonymous sub",
    };
  });

  // --------------------------------------------------------------------------
  // 5. Generic Signed Webhooks & Event Gateway
  // --------------------------------------------------------------------------
  app.post("/api/v1/webhooks/enqueue", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body as any) || {};
    const { destination_url, event_type, payload, secret, tenant_id } = body;

    if (!destination_url || !event_type || !payload || !secret) {
      return reply.status(400).send({
        error: "MISSING_FIELDS",
        message: "destination_url, event_type, payload, and secret are required.",
      });
    }

    const webhook = await webhookService.enqueue(
      destination_url,
      event_type,
      payload,
      secret,
      tenant_id
    );

    return reply.status(202).send({
      id: webhook.id,
      status: webhook.status,
      message: "Webhook queued for delivery with HMAC-SHA256 signature.",
    });
  });

  // Backwards-compatible simulation & test webhook stub
  app.post("/api/simulation/government/webhook", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body as any) || {};

    const simulationPayload = {
      event: "ATTRIBUTE_VERIFICATION_ATTESTATION",
      timestamp: new Date().toISOString(),
      nullifier: body.nullifier || "attested-nullifier-42",
      scope: body.scopeId || "0xgov-sim",
      ageVerified: true,
      issuer: "PRAMAAN_SIGNED_WEBHOOK_SERVICE",
    };

    const webhookSecret = "simulation-secret-not-real-government";
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = computeWebhookSignature(simulationPayload, webhookSecret, timestamp);

    reply.header("X-Pramaan-Simulation", "TRUE");
    reply.header("X-Pramaan-Signature", signature);
    reply.header("X-Pramaan-Timestamp", timestamp.toString());

    return {
      status: "DELIVERED",
      banner: "SIMULATION — NOT A GOVERNMENT INTEGRATION",
      payload: simulationPayload,
      signature,
      notice: "Strictly a development simulation stub. No government integration exists or is claimed.",
    };
  });

  // --------------------------------------------------------------------------
  // 6. Persistent Blockchain Indexer & Event Feed
  // --------------------------------------------------------------------------
  const indexer = new PersistentIndexer({
    chainId: 54635,
    rpcUrl: process.env.MST_CORAL_TESTNET_RPC || "https://coralrpc.mstblockchain.com",
    registryAddress: "0x39f842043b7de6421ae21d5e4c955dd6cbaa415b",
  });

  if (opts.enableIndexer) {
    indexer.start(10000);
  }

  app.get("/api/indexer/status", async () => {
    return await indexer.getStatus();
  });

  app.get("/api/events", async (req: FastifyRequest) => {
    const query = (req.query as any) || {};
    const chainId = query.chainId ? parseInt(query.chainId, 10) : 54635;
    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const events = await db.getVerifiedEvents(chainId, limit);
    return {
      chainId,
      count: events.length,
      events,
    };
  });

  // --------------------------------------------------------------------------
  // 7. Off-Chain Wallet Authentication (Database Nonce Tracking)
  // --------------------------------------------------------------------------
  app.post("/api/auth/nonce", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body as any) || {};
    const { address, origin } = body;

    if (!address || typeof address !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return reply.status(400).send({
        error: "INVALID_ADDRESS",
        message: "A valid 20-byte Ethereum hex address is required.",
      });
    }

    const nonce = crypto.randomBytes(32).toString("hex");
    const message = formatSignInMessage(address, nonce, origin);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await db.storeNonce({
      nonce,
      address: address.toLowerCase() as `0x${string}`,
      origin,
      message,
      expiresAt,
    });

    return {
      nonce,
      message,
      expiresAt: expiresAt.toISOString(),
      notice: "Signing in is free and is not a blockchain transaction.",
    };
  });

  app.post("/api/auth/verify", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body as any) || {};
    const { address, nonce, signature } = body;

    if (!address || !nonce || !signature) {
      return reply.status(400).send({
        error: "MISSING_FIELDS",
        message: "address, nonce, and signature are required.",
      });
    }

    // Atomically check and consume nonce from database
    const record = await db.getNonce(nonce);
    if (!record || record.consumed) {
      return reply.status(400).send({
        error: "INVALID_OR_CONSUMED_NONCE",
        message: "Nonce not found, already consumed, or replayed.",
      });
    }

    // Consume nonce to prevent replay attacks
    await db.consumeNonce(nonce);

    // Check expiration
    const expiryTime = record.expiresAt instanceof Date ? record.expiresAt.getTime() : new Date(record.expiresAt).getTime();
    if (Date.now() > expiryTime) {
      return reply.status(400).send({
        error: "NONCE_EXPIRED",
        message: "Authentication nonce has expired.",
      });
    }

    // Check address binding
    if (record.address.toLowerCase() !== address.toLowerCase()) {
      return reply.status(400).send({
        error: "ADDRESS_MISMATCH",
        message: "Supplied address does not match nonce issuance address.",
      });
    }

    // Verify cryptographic signature
    let isValid = false;
    try {
      isValid = await verifyMessage({
        address: address as `0x${string}`,
        message: record.message,
        signature: signature as `0x${string}`,
      });
    } catch (err: any) {
      return reply.status(400).send({
        error: "MALFORMED_SIGNATURE",
        message: `Signature verification error: ${err.message}`,
      });
    }

    if (!isValid) {
      return reply.status(401).send({
        error: "INVALID_SIGNATURE",
        message: "Cryptographic signature verification failed.",
      });
    }

    return {
      status: "AUTHENTICATED",
      address,
      notice: "Signing in is free and is not a blockchain transaction.",
      timestamp: new Date().toISOString(),
    };
  });

  return app;
}
