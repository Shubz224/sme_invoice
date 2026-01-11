// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KYCBridge
 * @notice Manages KYC/KYB verification for InvoiceStream platform
 * @dev Implements tiered verification with transaction limits and expiry
 */
contract KYCBridge is AccessControl, ReentrancyGuard {
    bytes32 public constant KYC_ADMIN_ROLE = keccak256("KYC_ADMIN");
    bytes32 public constant COMPLIANCE_OFFICER_ROLE =
        keccak256("COMPLIANCE_OFFICER");

    enum VerificationLevel {
        None, // 0 - Not verified ($0 limit)
        Basic, // 1 - Email only ($1,000 limit)
        Standard, // 2 - ID verified ($10,000 limit)
        Enhanced, // 3 - Full KYC ($50,000 limit)
        Institutional // 4 - KYB complete (unlimited)
    }

    struct KYCData {
        VerificationLevel level;
        uint256 verifiedAt;
        uint256 expiresAt; // KYC expires after 1 year
        string documentHash; // IPFS CID
        string jurisdictionCode; // "US", "EU", "IN", etc.
        bool isBlacklisted;
        uint256 lifetimeVolume; // Track total transaction volume
    }

    // State variables
    mapping(address => KYCData) public kycProfiles;
    mapping(address => uint256) public kycAttempts;
    mapping(address => uint256) public lastKycAttempt;
    mapping(address => bool) public trustedVerifiers; // Privy, Civic, etc.

    // Transaction limits by KYC level (in USDY, 6 decimals)
    uint256 public constant BASIC_LIMIT = 1_000e6; // $1,000
    uint256 public constant STANDARD_LIMIT = 10_000e6; // $10,000
    uint256 public constant ENHANCED_LIMIT = 50_000e6; // $50,000
    uint256 public constant INSTITUTIONAL_LIMIT = type(uint256).max; // Unlimited

    // Rate limiting
    uint256 public constant MAX_ATTEMPTS = 5;
    uint256 public constant ATTEMPT_WINDOW = 1 hours;
    uint256 public constant KYC_VALIDITY_PERIOD = 365 days;

    // Events
    event KYCVerified(
        address indexed user,
        VerificationLevel level,
        string jurisdictionCode,
        uint256 expiresAt
    );
    event KYCExpiredEvent(address indexed user);
    event KYCRevoked(address indexed user, string reason);
    event KYCUpgraded(
        address indexed user,
        VerificationLevel oldLevel,
        VerificationLevel newLevel
    );
    event VolumeTracked(
        address indexed user,
        uint256 amount,
        uint256 totalVolume
    );

    // Errors
    error KYCExpiredError();
    error KYCBlacklistedError();
    error InsufficientKYCLevelError();
    error ExceedsTransactionLimitError();
    error TooManyAttemptsError();
    error InvalidVerificationLevelError();
    error NotAuthorizedError();

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KYC_ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_OFFICER_ROLE, msg.sender);
    }

    /**
     * @notice Check if user's KYC is valid
     * @param user Address to check
     * @return bool True if KYC is valid and not expired
     */
    function isKYCValid(address user) public view returns (bool) {
        KYCData memory kyc = kycProfiles[user];
        return
            kyc.level != VerificationLevel.None &&
            kyc.expiresAt > block.timestamp &&
            !kyc.isBlacklisted;
    }

    /**
     * @notice Get user's KYC level
     * @param user Address to check
     * @return VerificationLevel Current verification level
     */
    function getKYCLevel(address user) public view returns (VerificationLevel) {
        return kycProfiles[user].level;
    }

    /**
     * @notice Backward compatibility - check if user has any KYC
     * @param user Address to check
     * @return bool True if user has at least Basic KYC
     */
    function isKYCd(address user) public view returns (bool) {
        return isKYCValid(user);
    }

    /**
     * @notice Backward compatibility - check if user is blacklisted
     * @param user Address to check
     * @return bool True if user is blacklisted
     */
    function isBlacklisted(address user) public view returns (bool) {
        return kycProfiles[user].isBlacklisted;
    }

    /**
     * @notice Get maximum transaction amount for user
     * @param user Address to check
     * @return uint256 Maximum allowed transaction amount
     */
    function getMaxTransactionAmount(
        address user
    ) public view returns (uint256) {
        if (!isKYCValid(user)) return 0;

        VerificationLevel level = kycProfiles[user].level;

        if (level == VerificationLevel.Basic) return BASIC_LIMIT;
        if (level == VerificationLevel.Standard) return STANDARD_LIMIT;
        if (level == VerificationLevel.Enhanced) return ENHANCED_LIMIT;
        if (level == VerificationLevel.Institutional)
            return INSTITUTIONAL_LIMIT;

        return 0;
    }

    /**
     * @notice Update KYC status for a user
     * @param user Address to update
     * @param level New verification level
     * @param documentHash IPFS hash of verification documents
     * @param jurisdictionCode User's jurisdiction (e.g., "US", "EU")
     */
    function updateKYC(
        address user,
        VerificationLevel level,
        string memory documentHash,
        string memory jurisdictionCode
    ) external onlyRole(KYC_ADMIN_ROLE) nonReentrant {
        if (level == VerificationLevel.None)
            revert InvalidVerificationLevelError();

        KYCData storage kyc = kycProfiles[user];
        VerificationLevel oldLevel = kyc.level;

        kyc.level = level;
        kyc.verifiedAt = block.timestamp;
        kyc.expiresAt = block.timestamp + KYC_VALIDITY_PERIOD;
        kyc.documentHash = documentHash;
        kyc.jurisdictionCode = jurisdictionCode;
        kyc.isBlacklisted = false;

        if (oldLevel != VerificationLevel.None && oldLevel != level) {
            emit KYCUpgraded(user, oldLevel, level);
        }

        emit KYCVerified(user, level, jurisdictionCode, kyc.expiresAt);
    }

    /**
     * @notice Batch update KYC for multiple users
     * @param users Array of addresses
     * @param levels Array of verification levels
     * @param documentHashes Array of IPFS hashes
     * @param jurisdictionCodes Array of jurisdiction codes
     */
    function batchUpdateKYC(
        address[] calldata users,
        VerificationLevel[] calldata levels,
        string[] calldata documentHashes,
        string[] calldata jurisdictionCodes
    ) external onlyRole(KYC_ADMIN_ROLE) {
        require(
            users.length == levels.length &&
                users.length == documentHashes.length &&
                users.length == jurisdictionCodes.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < users.length; i++) {
            KYCData storage kyc = kycProfiles[users[i]];

            kyc.level = levels[i];
            kyc.verifiedAt = block.timestamp;
            kyc.expiresAt = block.timestamp + KYC_VALIDITY_PERIOD;
            kyc.documentHash = documentHashes[i];
            kyc.jurisdictionCode = jurisdictionCodes[i];
            kyc.isBlacklisted = false;

            emit KYCVerified(
                users[i],
                levels[i],
                jurisdictionCodes[i],
                kyc.expiresAt
            );
        }
    }

    /**
     * @notice Revoke KYC and blacklist user
     * @param user Address to blacklist
     * @param reason Reason for revocation
     */
    function revokeKYC(
        address user,
        string memory reason
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        kycProfiles[user].isBlacklisted = true;
        emit KYCRevoked(user, reason);
    }

    /**
     * @notice Remove user from blacklist
     * @param user Address to unblacklist
     */
    function unblacklistUser(
        address user
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        kycProfiles[user].isBlacklisted = false;
    }

    /**
     * @notice Verify transaction is allowed for user
     * @param user Address attempting transaction
     * @param amount Transaction amount
     * @param minLevel Minimum required KYC level
     */
    function verifyTransaction(
        address user,
        uint256 amount,
        VerificationLevel minLevel
    ) external view {
        KYCData memory kyc = kycProfiles[user];

        // Check if blacklisted
        if (kyc.isBlacklisted) revert KYCBlacklistedError();

        // Check if expired
        if (kyc.expiresAt <= block.timestamp) revert KYCExpiredError();

        // Check minimum level
        if (uint8(kyc.level) < uint8(minLevel))
            revert InsufficientKYCLevelError();

        // Check transaction limit
        uint256 maxAmount = getMaxTransactionAmount(user);
        if (amount > maxAmount) revert ExceedsTransactionLimitError();
    }

    /**
     * @notice Track transaction volume for user
     * @param user Address of user
     * @param amount Transaction amount
     */
    function trackVolume(
        address user,
        uint256 amount
    ) external onlyRole(KYC_ADMIN_ROLE) {
        kycProfiles[user].lifetimeVolume += amount;
        emit VolumeTracked(user, amount, kycProfiles[user].lifetimeVolume);
    }

    /**
     * @notice Get complete KYC profile
     * @param user Address to query
     * @return KYCData Complete KYC data
     */
    function getKYCProfile(
        address user
    ) external view returns (KYCData memory) {
        return kycProfiles[user];
    }

    /**
     * @notice Check if user can attempt KYC (rate limiting)
     * @param user Address to check
     * @return bool True if user can attempt KYC
     */
    function canAttemptKYC(address user) public view returns (bool) {
        if (kycAttempts[user] >= MAX_ATTEMPTS) {
            return block.timestamp > lastKycAttempt[user] + ATTEMPT_WINDOW;
        }
        return true;
    }

    /**
     * @notice Record KYC attempt (for rate limiting)
     * @param user Address attempting KYC
     */
    function recordKYCAttempt(address user) external onlyRole(KYC_ADMIN_ROLE) {
        if (!canAttemptKYC(user)) revert TooManyAttemptsError();

        // Reset counter if window has passed
        if (block.timestamp > lastKycAttempt[user] + ATTEMPT_WINDOW) {
            kycAttempts[user] = 0;
        }

        kycAttempts[user]++;
        lastKycAttempt[user] = block.timestamp;
    }

    /**
     * @notice Add trusted verifier (e.g., Privy)
     * @param verifier Address of trusted verifier
     */
    function addTrustedVerifier(
        address verifier
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        trustedVerifiers[verifier] = true;
    }

    /**
     * @notice Remove trusted verifier
     * @param verifier Address to remove
     */
    function removeTrustedVerifier(
        address verifier
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        trustedVerifiers[verifier] = false;
    }

    /**
     * @notice Extend KYC expiry (for renewals)
     * @param user Address to extend
     */
    function extendKYCExpiry(address user) external onlyRole(KYC_ADMIN_ROLE) {
        KYCData storage kyc = kycProfiles[user];
        require(kyc.level != VerificationLevel.None, "No KYC to extend");

        kyc.expiresAt = block.timestamp + KYC_VALIDITY_PERIOD;
        emit KYCVerified(user, kyc.level, kyc.jurisdictionCode, kyc.expiresAt);
    }
}
