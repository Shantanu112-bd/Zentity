import { buildApp } from "./app.ts";

const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";

async function start() {
  const app = await buildApp();
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`\n======================================================`);
    console.log(`[Pramaan-ZK Backend & OIDC Gateway] Listening on http://localhost:${PORT}`);
    console.log(`OpenID Configuration: http://localhost:${PORT}/.well-known/openid-configuration`);
    console.log(`Synthetic Issuance:   http://localhost:${PORT}/api/demo/issue`);
    console.log(`Proof Verification:   http://localhost:${PORT}/api/verify`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test" || process.env.RUN_STANDALONE === "true") {
  start();
}
