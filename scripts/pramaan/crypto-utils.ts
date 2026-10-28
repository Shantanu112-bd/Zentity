import { buildEddsa, buildPoseidon } from "circomlibjs";

export interface DemoIssuer {
  prvKey: Buffer;
  pubKeyAx: string;
  pubKeyAy: string;
  pubKeyHash: string;
}

export interface SyntheticCredential {
  dobDays: number;
  stateCode: number;
  credentialSecret: string;
  issuerPubKeyAx: string;
  issuerPubKeyAy: string;
  issuerPubKeyHash: string;
  sigR8x: string;
  sigR8y: string;
  sigS: string;
  label: string;
}

export interface CircuitInput {
  issuerPubKeyHash: string;
  scopeId: string;
  nullifier: string;
  recipient: string;
  chainId: string;
  currentDateDays: string;
  thresholdAgeDays: string;
  dobDays: string;
  stateCode: string;
  credentialSecret: string;
  issuerPubKeyAx: string;
  issuerPubKeyAy: string;
  sigR8x: string;
  sigR8y: string;
  sigS: string;
}

let cryptoInstance: { eddsa: any; poseidon: any; F: any } | null = null;

export async function getCrypto() {
  if (!cryptoInstance) {
    const eddsa = await buildEddsa();
    const poseidon = await buildPoseidon();
    cryptoInstance = { eddsa, poseidon, F: poseidon.F };
  }
  return cryptoInstance;
}

// Deterministic seed for demo issuer (DEV-ONLY)
const DEMO_ISSUER_SEED = "pramaan-zk-demo-issuer-synthetic-key-seed-2026";

export async function getDemoIssuer(): Promise<DemoIssuer> {
  const { eddsa, poseidon, F } = await getCrypto();
  const prvKey = Buffer.from(
    "3a8b49f2c18d96005e3f1672986427d1490284abce9123847592019483756201",
    "hex"
  );
  const pubKey = eddsa.prv2pub(prvKey);
  const pubKeyAx = F.toString(pubKey[0]);
  const pubKeyAy = F.toString(pubKey[1]);
  const pubKeyHash = F.toString(poseidon([pubKey[0], pubKey[1]]));

  return {
    prvKey,
    pubKeyAx,
    pubKeyAy,
    pubKeyHash,
  };
}

export async function issueSyntheticCredential(params: {
  dobDays: number; // e.g. 10000 (~1997)
  stateCode: number; // e.g. 27
  credentialSecret?: string;
  issuer?: DemoIssuer;
}): Promise<SyntheticCredential> {
  const { eddsa, poseidon, F } = await getCrypto();
  const issuer = params.issuer || (await getDemoIssuer());

  // If secret not provided, generate random 253-bit scalar in field
  const secretBigInt =
    params.credentialSecret
      ? BigInt(params.credentialSecret)
      : (BigInt(Date.now()) << 120n) ^ BigInt(Math.floor(Math.random() * 1e15));
  const credentialSecret = secretBigInt.toString();

  // M = Poseidon(dobDays, stateCode, credentialSecret)
  const M = poseidon([params.dobDays, params.stateCode, credentialSecret]);
  const sig = eddsa.signPoseidon(issuer.prvKey, M);

  return {
    dobDays: params.dobDays,
    stateCode: params.stateCode,
    credentialSecret,
    issuerPubKeyAx: issuer.pubKeyAx,
    issuerPubKeyAy: issuer.pubKeyAy,
    issuerPubKeyHash: issuer.pubKeyHash,
    sigR8x: F.toString(sig.R8[0]),
    sigR8y: F.toString(sig.R8[1]),
    sigS: sig.S.toString(),
    label: "DEMO ISSUER (SYNTHETIC CREDENTIAL - NOT REAL AADHAAR)",
  };
}

export async function computeNullifier(
  credentialSecret: string,
  scopeId: string | number | bigint
): Promise<string> {
  const { poseidon, F } = await getCrypto();
  const nullifierBig = poseidon([BigInt(credentialSecret), BigInt(scopeId)]);
  return F.toString(nullifierBig);
}

export async function createCircuitInput(params: {
  credential: SyntheticCredential;
  scopeId: string | number | bigint;
  recipient: string; // EVM address (e.g. 0x...)
  chainId: number; // e.g. 91562037 or 31337
  currentDateDays: number; // e.g. 20000 (~2024)
  thresholdAgeDays?: number; // default 6575 (18 years)
}): Promise<CircuitInput> {
  const thresholdAgeDays = params.thresholdAgeDays ?? 6575; // 18 * 365.25 ≈ 6575
  const nullifier = await computeNullifier(
    params.credential.credentialSecret,
    params.scopeId
  );

  const recipientBig = BigInt(params.recipient).toString();

  return {
    issuerPubKeyHash: params.credential.issuerPubKeyHash,
    scopeId: BigInt(params.scopeId).toString(),
    nullifier,
    recipient: recipientBig,
    chainId: params.chainId.toString(),
    currentDateDays: params.currentDateDays.toString(),
    thresholdAgeDays: thresholdAgeDays.toString(),
    dobDays: params.credential.dobDays.toString(),
    stateCode: params.credential.stateCode.toString(),
    credentialSecret: params.credential.credentialSecret,
    issuerPubKeyAx: params.credential.issuerPubKeyAx,
    issuerPubKeyAy: params.credential.issuerPubKeyAy,
    sigR8x: params.credential.sigR8x,
    sigR8y: params.credential.sigR8y,
    sigS: params.credential.sigS,
  };
}

export function formatSolidityCalldata(proof: any, publicSignals: any[]) {
  return {
    a: [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])] as const,
    b: [
      [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
      [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
    ] as const,
    c: [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])] as const,
    input: publicSignals.map((s) => BigInt(s)) as readonly bigint[],
  };
}

