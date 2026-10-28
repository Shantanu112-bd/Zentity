pragma circom 2.1.6;

// DEV-ONLY: Pramaan-ZK MVP Synthetic Age Credential Circuit
// Synthetic credential issued by DEMO ISSUER, signed with EdDSA-Poseidon over BabyJubjub.
// Real Aadhaar QR support is future work (milestone M2).

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/eddsaposeidon.circom";
include "circomlib/circuits/comparators.circom";

template AgeCredential() {
    // ------------------------------------------------------------------------
    // Public Inputs (D-05)
    // ------------------------------------------------------------------------
    signal input issuerPubKeyHash;
    signal input scopeId;
    signal input nullifier;
    signal input recipient;
    signal input chainId;
    signal input currentDateDays;
    signal input thresholdAgeDays;

    // ------------------------------------------------------------------------
    // Private Inputs (Witness)
    // ------------------------------------------------------------------------
    signal input dobDays;
    signal input stateCode;
    signal input credentialSecret;

    // Issuer Public Key (BabyJubjub)
    signal input issuerPubKeyAx;
    signal input issuerPubKeyAy;

    // Signature (EdDSA Poseidon)
    signal input sigR8x;
    signal input sigR8y;
    signal input sigS;

    // ------------------------------------------------------------------------
    // 1. Verify Issuer Public Key Hash
    // ------------------------------------------------------------------------
    component issuerHash = Poseidon(2);
    issuerHash.inputs[0] <== issuerPubKeyAx;
    issuerHash.inputs[1] <== issuerPubKeyAy;
    issuerPubKeyHash === issuerHash.out;

    // ------------------------------------------------------------------------
    // 2. Verify Credential Payload Hash & EdDSA Signature
    // ------------------------------------------------------------------------
    component credHash = Poseidon(3);
    credHash.inputs[0] <== dobDays;
    credHash.inputs[1] <== stateCode;
    credHash.inputs[2] <== credentialSecret;

    component eddsaVerifier = EdDSAPoseidonVerifier();
    eddsaVerifier.enabled <== 1;
    eddsaVerifier.Ax <== issuerPubKeyAx;
    eddsaVerifier.Ay <== issuerPubKeyAy;
    eddsaVerifier.R8x <== sigR8x;
    eddsaVerifier.R8y <== sigR8y;
    eddsaVerifier.S <== sigS;
    eddsaVerifier.M <== credHash.out;

    // ------------------------------------------------------------------------
    // 3. Verify Age Constraint: dobDays + thresholdAgeDays <= currentDateDays
    // ------------------------------------------------------------------------
    component ageCheck = LessEqThan(64);
    ageCheck.in[0] <== dobDays + thresholdAgeDays;
    ageCheck.in[1] <== currentDateDays;
    ageCheck.out === 1;

    // ------------------------------------------------------------------------
    // 4. Verify Nullifier: nullifier == Poseidon(credentialSecret, scopeId)
    // ------------------------------------------------------------------------
    component nullifierHash = Poseidon(2);
    nullifierHash.inputs[0] <== credentialSecret;
    nullifierHash.inputs[1] <== scopeId;
    nullifier === nullifierHash.out;

    // ------------------------------------------------------------------------
    // 5. Constrain Binding Signals (recipient, chainId)
    // Quadratic dummy constraints to prevent tampering / replay.
    // ------------------------------------------------------------------------
    signal recipientSquare;
    recipientSquare <== recipient * recipient;

    signal chainIdSquare;
    chainIdSquare <== chainId * chainId;
}

component main {public [issuerPubKeyHash, scopeId, nullifier, recipient, chainId, currentDateDays, thresholdAgeDays]} = AgeCredential();
