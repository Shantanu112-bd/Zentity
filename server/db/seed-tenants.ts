import crypto from "crypto";
import { db } from "./index.ts";
import type { TenantRecord } from "./index.ts";

export function hashClientSecret(secret: string): string {
  return crypto.createHash("sha256").update(`pramaan_salt_${secret}`).digest("hex");
}

export function verifyClientSecret(secret: string, hash: string): boolean {
  const computed = hashClientSecret(secret);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

export async function seedDefaultTenants() {
  const defaultTenant: TenantRecord = {
    id: "tenant-default-001",
    clientId: "pramaan-relying-party-alpha",
    clientSecretHash: hashClientSecret("pramaan-client-secret-2026-secure"),
    name: "Pramaan Verified Relying Party",
    redirectUris: [
      "http://localhost:5173/relying-party",
      "http://127.0.0.1:5173/relying-party",
      "http://localhost:3000/relying-party",
      "https://coral.mstscan.com",
    ],
    isActive: true,
  };

  // Legacy demo tenant compatibility
  const legacyDemoTenant: TenantRecord = {
    id: "tenant-legacy-demo",
    clientId: "demo-relying-party",
    clientSecretHash: hashClientSecret("demo-client-secret-not-for-production"),
    name: "Legacy Demo Relying Party",
    redirectUris: [
      "http://localhost:5173/relying-party",
      "http://127.0.0.1:5173/relying-party",
      "http://localhost:3000/relying-party",
    ],
    isActive: true,
  };

  await db.saveTenant(defaultTenant);
  await db.saveTenant(legacyDemoTenant);

  return { defaultTenant, legacyDemoTenant };
}

// Run standalone if executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith("seed-tenants.ts")) {
  (async () => {
    console.log("Seeding initial relying party tenants into database...");
    const result = await seedDefaultTenants();
    console.log(`Seeded default tenant: ${result.defaultTenant.clientId} (${result.defaultTenant.name})`);
    console.log(`Seeded legacy tenant: ${result.legacyDemoTenant.clientId}`);
    process.exit(0);
  })().catch((err) => {
    console.error("Failed to seed tenants:", err);
    process.exit(1);
  });
}
