import path from "path";
import fs from "fs";
import crypto from "crypto";
import fastify from "fastify";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { verifyMessage } from "viem";
import * as snarkjs from "snarkjs";
import {
  issueSyntheticCredential,
  formatSolidityCalldata,
} from "../scripts/pramaan/crypto-utils.ts";
import { getActiveChainMode, NETWORKS } from "../config/networks.ts";
import {
  getSigningKey,
  SEEDED_TENANT,
  verifyPkce,
  computePairwiseSub,
  storeAuthSession,
  consumeAuthSession,
  createIdToken,
} from "./oidc.ts";

export interface ServerOptions {
  enableRateLimit?: boolean;
}

export interface AuthNonceRecord {
  nonce: string;
  address: `0x${string}`;
  origin?: string;
  message: string;
  expiresAt: number;
}

export const authNonces = new Map<string, AuthNonceRecord>();

export function formatSignInMessage(address: string, nonce: string, origin?: string): string {
  return [
    "Pramaan-ZK Authentication",
    `Address: ${address}`,
    `Nonce: ${nonce}`,
    origin ? `Origin: ${origin}` : undefined,
    "Statement: Sign in to Pramaan-ZK. Signing in is free and is not a blockchain transaction.",
  ].filter(Boolean).join("\n");
}

export async function buildApp(opts: ServerOptions = {}): Promise<FastifyInstance> {
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
      service: "Pramaan-ZK Backend & OIDC Gateway",
      notice: "Synthetic credential demo. Real Aadhaar QR support is future work (milestone M2).",
    };
  });

  // --------------------------------------------------------------------------
  // 1. Synthetic Credential Issuance
  // --------------------------------------------------------------------------
  app.post("/api/demo/issue", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body as any) || {};

    // Strict PII Filter: Reject any attempt to provide real personal data
    const piiKeys = ["aadhaar", "uid", "name", "phone", "mobile", "email", "address", "pincode"];
    for (const key of piiKeys) {
      if (body[key] !== undefined) {
        return reply.status(400).send({
          error: "PII_PROHIBITED",
          message: `Zero-PII Policy: Input field '${key}' is prohibited. Pramaan-ZK MVP strictly uses synthetic credentials.`,
        });
      }
    }

    const age = typeof body.age === "number" ? body.age : 25;
    const stateCode = typeof body.stateCode === "number" ? body.stateCode : 27;

    // Epoch calculation: 20000 days (~2024) minus (age * 365.25)
    const currentDateDays = 20000;
    const dobDays = Math.floor(currentDateDays - age * 365.25);

    const credential = await issueSyntheticCredential({
      dobDays,
      stateCode,
    });

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
  // 2. Proof Verification & Optional Relay
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
      // If relayer private key were configured, broadcast would execute here.
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
  // 3. Registry State Read
  // --------------------------------------------------------------------------
  app.get("/api/registry/:scopeId/:nullifier", async (req: FastifyRequest, reply: FastifyReply) => {
    const params = req.params as { scopeId: string; nullifier: string };
    const chainMode = getActiveChainMode();

    return {
      scopeId: params.scopeId,
      nullifier: params.nullifier,
      isSpent: false, // Default unspent on fresh check
      chainMode,
      network: NETWORKS[chainMode]?.name || chainMode,
    };
  });

  // --------------------------------------------------------------------------
  // 4. OIDC-Lite Endpoints
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
      notice: "demo-grade; not a conformance-tested OIDC provider",
    };
  });

  app.get("/jwks", async (_req: FastifyRequest) => {
    const { publicJwks } = await getSigningKey();
    return publicJwks;
  });

  app.get("/authorize", async (req: FastifyRequest, reply: FastifyReply) => {
    const query = (req.query as any) || {};
    const { client_id, redirect_uri, response_type, code_challenge, code_challenge_method, state } = query;

    // Validate client
    if (client_id !== SEEDED_TENANT.clientId) {
      return reply.status(400).send({ error: "unauthorized_client", message: "Unknown client_id" });
    }

    // Exact redirect URI match
    if (!SEEDED_TENANT.redirectUris.includes(redirect_uri)) {
      return reply.status(400).send({
        error: "invalid_request",
        message: "redirect_uri does not match registered URI exactly.",
      });
    }

    if (response_type !== "code") {
      return reply.status(400).send({ error: "unsupported_response_type" });
    }

    // Generate an authorization code
    const code = crypto.randomBytes(24).toString("hex");
    storeAuthSession({
      code,
      clientId: client_id,
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method || "S256",
      state: state || "",
      nullifier: query.nullifier,
      createdAt: Date.now(),
    });

    // In OIDC-lite flow: redirect back to relying party with code and state
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

    const session = consumeAuthSession(code);
    if (!session) {
      return reply.status(400).send({ error: "invalid_grant", message: "Code expired or not found." });
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

    const nullifier = session.nullifier || "demo-nullifier-42";
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
      sub: "pairwise-sub-demo-holder",
      age_over_18: true,
      attribute_proven: "AGE_GE_18",
      issuer_type: "DEMO_SYNTHETIC",
      notice: "demo-grade; not a conformance-tested OIDC provider",
    };
  });

  // --------------------------------------------------------------------------
  // 5. Government Channel Simulation Stub
  // --------------------------------------------------------------------------
  app.post("/api/simulation/government/webhook", async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body as any) || {};

    const simulationPayload = {
      event: "ATTRIBUTE_VERIFICATION_SIMULATION",
      timestamp: new Date().toISOString(),
      nullifier: body.nullifier || "simulated-nullifier",
      scope: body.scopeId || "0xgov-sim",
      ageVerified: true,
      issuer: "SIMULATED_GOVERNMENT_STUB",
    };

    const webhookSecret = "simulation-secret-not-real-government";
    const signature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(simulationPayload))
      .digest("hex");

    reply.header("X-Pramaan-Simulation", "TRUE");
    reply.header("X-Pramaan-Signature", signature);

    return {
      status: "DELIVERED",
      banner: "SIMULATION — NOT A GOVERNMENT INTEGRATION",
      payload: simulationPayload,
      signature,
      notice: "Strictly a development simulation stub. No government integration exists or is claimed.",
    };
  });

  // --------------------------------------------------------------------------
  // 6. Off-Chain Wallet Authentication (EIP-191 / EIP-4361 Nonce Challenge)
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
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    authNonces.set(nonce, {
      nonce,
      address: address.toLowerCase() as `0x${string}`,
      origin,
      message,
      expiresAt,
    });

    return {
      nonce,
      message,
      expiresAt: new Date(expiresAt).toISOString(),
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

    const record = authNonces.get(nonce);
    if (!record) {
      return reply.status(400).send({
        error: "INVALID_OR_CONSUMED_NONCE",
        message: "Nonce not found, already consumed, or replayed.",
      });
    }

    // Always consume nonce to prevent replay attacks
    authNonces.delete(nonce);

    // Check expiration
    if (Date.now() > record.expiresAt) {
      return reply.status(400).send({
        error: "NONCE_EXPIRED",
        message: "Authentication nonce has expired.",
      });
    }

    // Check address binding
    if (record.address !== address.toLowerCase()) {
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
