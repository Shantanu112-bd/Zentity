// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title IPramaanVerifier
 * @notice Interface for Groth16 SnarkJS generated verifier contract.
 */
interface IPramaanVerifier {
    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[7] calldata _pubSignals
    ) external view returns (bool);
}

/**
 * @title PramaanRegistry
 * @author Pramaan-ZK
 * @notice State registry for verified zero-knowledge attribute proofs on MST Blockchain.
 * 
 * Residual Risk (D-15): Uses standard Ownable + Pausable without a timelock for this MVP.
 * Timelock governance and multi-sig admin roles are scheduled for Milestone M8.
 * 
 * Zero PII Guarantee: No personal identification data (name, DOB, UID) is ever stored or emitted.
 * Only scope IDs, nullifiers, recipient addresses, and registered issuer public key hashes are handled.
 */
contract PramaanRegistry {
    // ------------------------------------------------------------------------
    // Custom Errors
    // ------------------------------------------------------------------------
    error Unauthorized();
    error ContractPaused();
    error ContractNotPaused();
    error UnregisteredIssuer();
    error NullifierAlreadySpent();
    error RecipientMismatch();
    error ChainIdMismatch();
    error InvalidProof();
    error ZeroAddress();

    // ------------------------------------------------------------------------
    // Events (Zero PII)
    // ------------------------------------------------------------------------
    event IssuerRegistered(uint256 indexed issuerKeyHash);
    event IssuerRevoked(uint256 indexed issuerKeyHash);
    event Paused(address account);
    event Unpaused(address account);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ProofVerifiedAndRecorded(
        uint256 indexed scopeId,
        uint256 indexed nullifier,
        address indexed recipient
    );

    // ------------------------------------------------------------------------
    // Storage
    // ------------------------------------------------------------------------
    address public owner;
    bool public paused;
    address public immutable verifier;

    /// @notice Registered BabyJubjub issuer public key hashes Poseidon(Ax, Ay)
    mapping(uint256 => bool) public registeredIssuers;

    /// @notice Nullifier tracking: scopeId => nullifier => isSpent
    mapping(uint256 => mapping(uint256 => bool)) public isNullifierSpent;

    // ------------------------------------------------------------------------
    // Modifiers
    // ------------------------------------------------------------------------
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier whenPaused() {
        if (!paused) revert ContractNotPaused();
        _;
    }

    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    constructor(address _verifier) {
        if (_verifier == address(0)) revert ZeroAddress();
        owner = msg.sender;
        verifier = _verifier;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ------------------------------------------------------------------------
    // Admin Management
    // ------------------------------------------------------------------------
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function pause() external onlyOwner whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function registerIssuer(uint256 issuerKeyHash) external onlyOwner {
        registeredIssuers[issuerKeyHash] = true;
        emit IssuerRegistered(issuerKeyHash);
    }

    function revokeIssuer(uint256 issuerKeyHash) external onlyOwner {
        registeredIssuers[issuerKeyHash] = false;
        emit IssuerRevoked(issuerKeyHash);
    }

    // ------------------------------------------------------------------------
    // Verification & Recording
    // ------------------------------------------------------------------------
    /**
     * @notice Verifies a Groth16 proof and records the nullifier in the registry state.
     * @param a Proof coordinate pA
     * @param b Proof coordinate pB
     * @param c Proof coordinate pC
     * @param input Public inputs:
     *        [0] = issuerPubKeyHash
     *        [1] = scopeId
     *        [2] = nullifier
     *        [3] = recipient (address encoded as uint256)
     *        [4] = chainId
     *        [5] = currentDateDays
     *        [6] = thresholdAgeDays
     * @return success True if verification and recording succeeded.
     */
    function verifyAndRecord(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[7] calldata input
    ) external whenNotPaused returns (bool) {
        // 1. Issuer key must be registered
        if (!registeredIssuers[input[0]]) {
            revert UnregisteredIssuer();
        }

        // 2. Nullifier must not have been spent for this scopeId
        uint256 scopeId = input[1];
        uint256 nullifier = input[2];
        if (isNullifierSpent[scopeId][nullifier]) {
            revert NullifierAlreadySpent();
        }

        // 3. Recipient check: if caller is not the recipient, recipient cannot be address(0)
        address recipient = address(uint160(input[3]));
        if (recipient == address(0)) {
            revert RecipientMismatch();
        }

        // If direct caller is not relayer, caller must be recipient
        // Relayers can submit valid proofs on behalf of the designated recipient
        // but proof itself binds to the recipient address.

        // 4. Chain ID check (replay prevention across chains)
        if (input[4] != block.chainid) {
            revert ChainIdMismatch();
        }

        // 5. Groth16 cryptographic proof verification
        bool valid = IPramaanVerifier(verifier).verifyProof(a, b, c, input);
        if (!valid) {
            revert InvalidProof();
        }

        // 6. Record nullifier as spent
        isNullifierSpent[scopeId][nullifier] = true;

        // 7. Emit zero-PII event
        emit ProofVerifiedAndRecorded(scopeId, nullifier, recipient);

        return true;
    }
}
