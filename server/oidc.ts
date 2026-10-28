import crypto from "crypto";
import * as jose from "jose";

export interface OidcTenant {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  name: string;
}

export const SEEDED_TENANT: OidcTenant = {
  clientId: "demo-relying-party",
  clientSecret: "demo-client-secret-not-for-production",
  redirectUris: [
    "http://localhost:5173/relying-party",
    "http://127.0.0.1:5173/relying-party",
    "http://localhost:3000/relying-party",
  ],
  name: "Demo Age-Gated Relying Party",
};

export interface AuthSession {
  code: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state: string;
  nullifier?: string;
  createdAt: number;
}

const authSessions = new Map<string, AuthSession>();
const HMAC_SECRET = "pramaan-zk-demo-pairwise-sub-hmac-secret-2026";

let keyPair: jose.GenerateKeyPairResult | null = null;
let publicJwks: any = null;

export async function getSigningKey() {
  if (!keyPair) {
    keyPair = await jose.generateKeyPair("ES256", { extractable: true });
    const jwk = await jose.exportJWK(keyPair.publicKey);
    jwk.kid = "pramaan-demo-key-1";
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
  if (method === "plain") {
    return verifier === challenge;
  }
  return false;
}

export function storeAuthSession(session: AuthSession) {
  authSessions.set(session.code, session);
}

export function getAuthSession(code: string): AuthSession | undefined {
  return authSessions.get(code);
}

export function consumeAuthSession(code: string): AuthSession | undefined {
  const session = authSessions.get(code);
  if (session) {
    authSessions.delete(code);
  }
  return session;
}

export async function createIdToken(params: {
  sub: string;
  clientId: string;
  issuerUrl: string;
}): Promise<string> {
  const { privateKey } = await getSigningKey();
  return await new jose.SignJWT({
    sub: params.sub,
    aud: params.clientId,
    iss: params.issuerUrl,
    age_over_18: true,
    attribute_proven: "AGE_GE_18",
    credential_type: "SYNTHETIC_DEMO",
    notice: "demo-grade; not a conformance-tested OIDC provider",
  })
    .setProtectedHeader({ alg: "ES256", kid: "pramaan-demo-key-1" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);
}
