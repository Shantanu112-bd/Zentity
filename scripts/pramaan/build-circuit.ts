import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

async function main() {
  console.log("=== Building Pramaan-ZK Age Credential Circuit ===");
  const projectRoot = process.cwd();
  const circuitsDir = path.join(projectRoot, "circuits/pramaan");
  const ptauFile = path.join(projectRoot, "build/ptau/pot13_final.ptau");
  const contractsDir = path.join(projectRoot, "contracts");

  if (!fs.existsSync(circuitsDir)) {
    fs.mkdirSync(circuitsDir, { recursive: true });
  }

  // 1. Compile Circuit with circom
  console.log("[1/5] Compiling age_credential.circom with circom 2.1.8...");
  const circomCmd = `circom "${path.join(circuitsDir, "age_credential.circom")}" --r1cs --wasm --sym -o "${circuitsDir}" -l "${path.join(projectRoot, "node_modules")}"`;
  execSync(circomCmd, { stdio: "inherit" });

  // 2. Groth16 Setup
  console.log("[2/5] Running snarkjs groth16 setup (DEV-ONLY)...");
  const zkey0 = path.join(circuitsDir, "age_credential_0000.zkey");
  const zkeyFinal = path.join(circuitsDir, "age_credential_final.zkey");
  const r1csFile = path.join(circuitsDir, "age_credential.r1cs");

  execSync(`npx snarkjs groth16 setup "${r1csFile}" "${ptauFile}" "${zkey0}"`, { stdio: "inherit" });

  // 3. Contribute Random Runtime Entropy (Never Committed, In-Memory Only)
  console.log("[3/5] Contributing fresh runtime random entropy to zkey (DEV-ONLY)...");
  // Generated at runtime, never logged, never committed
  const runtimeRandomEntropy = crypto.randomBytes(64).toString("hex");
  execSync(
    `npx snarkjs zkey contribute "${zkey0}" "${zkeyFinal}" --name="DEV-ONLY Prototype Ceremony" -v -e="${runtimeRandomEntropy}"`,
    { stdio: "pipe" } // piped to prevent printing runtime entropy to stdout
  );

  // 4. Export Verification Key
  console.log("[4/5] Exporting verification key...");
  const vkFile = path.join(circuitsDir, "verification_key.json");
  execSync(`npx snarkjs zkey export verificationkey "${zkeyFinal}" "${vkFile}"`, { stdio: "inherit" });

  // Add DEV-ONLY label to verification_key.json
  const vkJson = JSON.parse(fs.readFileSync(vkFile, "utf-8"));
  vkJson._comment = "DEV-ONLY Ceremony for Pramaan-ZK MVP Prototype. Do not use in production.";
  fs.writeFileSync(vkFile, JSON.stringify(vkJson, null, 2));

  // 5. Export Solidity Verifier
  console.log("[5/5] Exporting Solidity verifier to contracts/PramaanVerifier.sol...");
  const verifierSol = path.join(contractsDir, "PramaanVerifier.sol");
  execSync(`npx snarkjs zkey export solidityverifier "${zkeyFinal}" "${verifierSol}"`, { stdio: "inherit" });

  // Rename contract Groth16Verifier to PramaanVerifier to avoid name collisions
  let verifierCode = fs.readFileSync(verifierSol, "utf-8");
  verifierCode = verifierCode.replace(
    "contract Groth16Verifier {",
    "contract PramaanVerifier {\n    // DEV-ONLY: Generated for Pramaan-ZK MVP Prototype with runtime random entropy\n"
  );
  fs.writeFileSync(verifierSol, verifierCode);

  // Clean up intermediate zkey0
  if (fs.existsSync(zkey0)) {
    fs.unlinkSync(zkey0);
  }

  console.log("[SUCCESS] Pramaan-ZK circuit, proving key, and verifier regenerated with runtime entropy!");
}

main().catch((err) => {
  console.error("Circuit build failed:", err);
  process.exit(1);
});
