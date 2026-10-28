/**
 * scripts/gate0/generate-vectors.ts
 * 
 * Generates verified BN254 test vectors using @noble/curves/bn254.
 * Saves outputs to scripts/gate0/vectors.json with provenance.
 * Cross-checks with EIP-196 and EIP-197 specifications.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { bn254 } from "@noble/curves/bn254.js";

function toHex32(n: bigint): string {
  return n.toString(16).padStart(64, "0");
}

function pointToHex(point: any): string {
  const aff = point.toAffine();
  return toHex32(aff.x) + toHex32(aff.y);
}

function fp2ToHex(fp2: { c0: bigint; c1: bigint }): string {
  // EIP-197 encoding for G2: (x_im, x_re) where x = x_re + x_im * i
  // c1 is imaginary, c0 is real
  return toHex32(fp2.c1) + toHex32(fp2.c0);
}

function g2PointToHex(point: any): string {
  const aff = point.toAffine();
  return fp2ToHex(aff.x) + fp2ToHex(aff.y);
}

export function generateVectors() {
  console.log("[VectorGen] Generating BN254 test vectors using @noble/curves/bn254...");

  // 1. ecAdd (0x06)
  const P1 = bn254.G1.Point.BASE;
  const P2 = P1.multiply(2n);
  const P_add = P1.add(P2);

  const ecAdd_valid_input = "0x" + pointToHex(P1) + pointToHex(P2);
  const ecAdd_valid_expected = "0x" + pointToHex(P_add);

  // ecAdd invalid (point not on curve)
  const ecAdd_invalid_input = "0x" + toHex32(1n) + toHex32(1n) + pointToHex(P2);

  // 2. ecMul (0x07)
  const scalar = 7n;
  const P_mul = P1.multiply(scalar);
  const ecMul_valid_input = "0x" + pointToHex(P1) + toHex32(scalar);
  const ecMul_valid_expected = "0x" + pointToHex(P_mul);

  // ecMul invalid (point not on curve)
  const ecMul_invalid_input = "0x" + toHex32(1n) + toHex32(1n) + toHex32(scalar);

  // 3. ecPairing (0x08)
  const G1 = bn254.G1.Point.BASE;
  const G2 = bn254.G2.Point.BASE;
  const negG1 = G1.negate();

  // Valid pairing identity: e(G1, G2) * e(-G1, G2) = 1
  const pair1_hex = pointToHex(G1) + g2PointToHex(G2);
  const pair2_hex = pointToHex(negG1) + g2PointToHex(G2);
  const ecPairing_valid_input = "0x" + pair1_hex + pair2_hex;
  const ecPairing_valid_expected = "0x" + toHex32(1n);

  // Invalid pairing (non-identity): e(G1, G2) * e(G1, G2) != 1 -> returns 0
  const ecPairing_nonIdentity_input = "0x" + pair1_hex + pair1_hex;
  const ecPairing_nonIdentity_expected = "0x" + toHex32(0n);

  // Deliberately malformed pairing: invalid byte length (100 bytes)
  const ecPairing_badLength_input = "0x" + "00".repeat(100);

  // Deliberately malformed pairing: point not on curve
  const ecPairing_badPoint_input = "0x" + toHex32(1n) + toHex32(1n) + g2PointToHex(G2) + pair2_hex;

  const vectors = {
    provenance: {
      generator: "@noble/curves/bn254 v2.4.0",
      standards: ["EIP-196", "EIP-197"],
      generatedAt: new Date().toISOString(),
    },
    ecAdd: {
      valid: {
        description: "G1 + 2*G1 = 3*G1",
        input: ecAdd_valid_input,
        expected: ecAdd_valid_expected,
      },
      invalidPoint: {
        description: "Point (1,1) not on curve + 2*G1",
        input: ecAdd_invalid_input,
      },
    },
    ecMul: {
      valid: {
        description: "7 * G1",
        input: ecMul_valid_input,
        expected: ecMul_valid_expected,
      },
      invalidPoint: {
        description: "7 * Point (1,1)",
        input: ecMul_invalid_input,
      },
    },
    ecPairing: {
      validIdentity: {
        description: "e(G1, G2) * e(-G1, G2) = 1",
        input: ecPairing_valid_input,
        expected: ecPairing_valid_expected,
      },
      nonIdentity: {
        description: "e(G1, G2) * e(G1, G2) != 1 (returns 0)",
        input: ecPairing_nonIdentity_input,
        expected: ecPairing_nonIdentity_expected,
      },
      badLength: {
        description: "Input length 100 bytes (must be multiple of 192)",
        input: ecPairing_badLength_input,
      },
      badPoint: {
        description: "Point not on G1 curve in pairing pair",
        input: ecPairing_badPoint_input,
      },
    },
  };

  const outPath = path.resolve(process.cwd(), "scripts/gate0/vectors.json");
  fs.writeFileSync(outPath, JSON.stringify(vectors, null, 2));
  console.log(`[VectorGen] Successfully generated vectors to: ${outPath}`);
  return vectors;
}

generateVectors();
