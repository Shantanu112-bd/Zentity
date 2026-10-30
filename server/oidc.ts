import crypto from "crypto";
import * as jose from "jose";
import { db } from "./db/index.ts";
import type { OidcSessionRecord, TenantRecord } from "./db/index.ts";

export interface OidcTenant {
  clientId: string;
  clientSecretHash: string;
  redirectUris: string[];
  name: string;
}

export interface AuthSession {
  code: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state: string;
  nullifier?: string;
  scopeId?: string;
  expiresAt: Date;
}

const HMAC_SECRET = process.env.PAIRWISE_HMAC_SECRET || "pramaan-zk-pairwise-sub-hmac-secret-2026";

let keyPair: jose.GenerateKeyPairResult | null = null;
let publicJwks: any = null;

export async function getSigningKey() {
  if (!keyPair) {
    keyPair = await jose.generateKeyPair("ES256", { extractable: true });
    const jwk = await jose.exportJWK(keyPair.publicKey);
    jwk.kid = "pramaan-signing-key-1";
    jwk.use = "sig";
    jwk.alg = "ES256";
    publicJwks = { keys: [jwk] };
  }
  return { ...keyPair, publicJwks };
}

export function computePairwiseSub(nullifier: string, clientId: string): string {
  return crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(`${nullifier}:${clientId}`)
    .digest("hex");
}

export function verifyPkce(verifier: string, challenge: string, method: string): boolean {
  if (method === "S256") {
    const computed = crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64url");
    return computed === challenge;
  }
  return verifier === challenge;
}

export async function storeAuthSession(session: AuthSession): Promise<void> {
  await db.storeOidcSession({
    code: session.code,
    clientId: session.clientId,
    redirectUri: session.redirectUri,
    codeChallenge: session.codeChallenge,
    codeChallengeMethod: session.codeChallengeMethod,
    state: session.state,
    nullifier: session.nullifier,
    scopeId: session.scopeId,
    expiresAt: session.expiresAt,
  });
}

export async function consumeAuthSession(code: string): Promise<OidcSessionRecord | null> {
  return await db.consumeOidcSession(code);
}

export async function getTenant(clientId: string): Promise<TenantRecord | null> {
  return await db.getTenantByClientId(clientId);
}

export async function createIdToken(params: {
  sub: string;
  clientId: string;
  issuerUrl: string;
  scopeId?: string;
}): Promise<string> {
  const { privateKey } = await getSigningKey();

  const jwt = await new jose.SignJWT({
    sub: params.sub,
    aud: params.clientId,
    iss: params.issuerUrl,
    age_over_18: true,
    scope_id: params.scopeId || "1",
    attribute_proven: "AGE_GE_18",
    credential_type: "SYNTHETIC_ATTESTATION",
    notice: "zero-pii attribute attestation; pairwise pseudonymous sub",
  })
    .setProtectedHeader({ alg: "ES256", kid: "pramaan-signing-key-1" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);

  return jwt;
}
