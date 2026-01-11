// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./InvoiceNFT.sol";

/**
 * @title SimpleStreamingRepayment
 * @notice Manages continuous payment streams for invoice repayments
 * @dev Optimized for gas efficiency and security
 * @custom:security-contact security@invoicefinance.com
 */
contract SimpleStreamingRepayment is Ownable, ReentrancyGuard {
    // Payment token (USDY)
    IERC20 public immutable paymentToken;

    // Invoice NFT contract
    InvoiceNFT public immutable invoiceNFT;

    // Stream data structure
    struct StreamInfo {
        uint256 invoiceId;
        address payer; // SME who owes money
        address investor; // Investor receiving payments
        uint256 totalAmount; // Total amount to be paid
        uint256 amountPerSecond; // Payment rate
        uint256 startTime; // Stream start timestamp
        uint256 endTime; // Stream end timestamp
        uint256 claimedAmount; // Amount already claimed
        bool active; // Stream status
    }

    // Mapping: invoiceId => StreamInfo
    mapping(uint256 => StreamInfo) public streams;

    // Authorized managers (InvoiceFinanceManager)
    mapping(address => bool) public authorizedManagers;

    // Track deposits per invoice
    mapping(uint256 => uint256) public deposits;

    // Events
    event StreamStarted(
        uint256 indexed invoiceId,
        address indexed payer,
        address indexed investor,
        uint256 totalAmount,
        uint256 amountPerSecond,
        uint256 duration
    );

    event StreamClaimed(
        uint256 indexed invoiceId,
        address indexed investor,
        uint256 amount,
        uint256 totalClaimed
    );

    event StreamStopped(
        uint256 indexed invoiceId,
        address indexed investor,
        uint256 finalAmount
    );

    event StreamUpdated(uint256 indexed invoiceId, uint256 newAmountPerSecond);

    event ManagerAuthorized(address indexed manager, bool status);

    event EmergencyWithdraw(
        address indexed token,
        uint256 amount,
        address indexed to
    );

    event FundsDeposited(
        uint256 indexed invoiceId,
        address indexed payer,
        uint256 amount
    );

    // Errors
    error NotAuthorized();
    error StreamNotActive();
    error StreamAlreadyActive();
    error InvalidParameters();
    error InsufficientBalance();
    error TransferFailed();
    error NothingToClaim();

    /**
     * @notice Constructor
     * @param _paymentToken Address of payment token (USDY)
     * @param _invoiceNFT Address of InvoiceNFT contract
     */
    constructor(
        address _paymentToken,
        address _invoiceNFT
    ) Ownable(msg.sender) {
        if (_paymentToken == address(0) || _invoiceNFT == address(0)) {
            revert InvalidParameters();
        }

        paymentToken = IERC20(_paymentToken);
        invoiceNFT = InvoiceNFT(_invoiceNFT);

        // Authorize deployer as manager
        authorizedManagers[msg.sender] = true;
    }

    /**
     * @notice Start a payment stream
     * @param invoiceId ID of the invoice
     * @param payer Address of the payer (SME)
     * @param investor Address of the investor
     * @param totalAmount Total amount to stream
     * @param durationSeconds Duration of the stream
     */
    function startStream(
        uint256 invoiceId,
        address payer,
        address investor,
        uint256 totalAmount,
        uint256 durationSeconds
    ) external nonReentrant {
        if (!authorizedManagers[msg.sender]) revert NotAuthorized();
        if (streams[invoiceId].active) revert StreamAlreadyActive();
        if (totalAmount == 0 || durationSeconds == 0)
            revert InvalidParameters();
        if (investor == address(0) || payer == address(0))
            revert InvalidParameters();

        // Validate invoice exists and is financed
        InvoiceNFT.Invoice memory invoice = invoiceNFT.getInvoice(invoiceId);
        if (!invoice.isFinanced) revert InvalidParameters();

        // Calculate amount per second
        uint256 amountPerSecond = totalAmount / durationSeconds;
        if (amountPerSecond == 0) revert InvalidParameters();

        // Create stream
        streams[invoiceId] = StreamInfo({
            invoiceId: invoiceId,
            payer: payer,
            investor: investor,
            totalAmount: totalAmount,
            amountPerSecond: amountPerSecond,
            startTime: block.timestamp,
            endTime: block.timestamp + durationSeconds,
            claimedAmount: 0,
            active: true
        });

        emit StreamStarted(
            invoiceId,
            payer,
            investor,
            totalAmount,
            amountPerSecond,
            durationSeconds
        );
    }

    /**
     * @notice Claim streamed tokens
     * @param invoiceId ID of the invoice
     * @return claimedAmount Amount claimed
     */
    function claimStream(
        uint256 invoiceId
    ) external nonReentrant returns (uint256 claimedAmount) {
        StreamInfo storage stream = streams[invoiceId];

        // ===== CHECKS =====
        if (!stream.active) revert StreamNotActive();
        if (msg.sender != stream.investor) revert NotAuthorized();

        // Calculate claimable amount
        uint256 streamedAmount = _calculateStreamedAmount(stream);
        claimedAmount = streamedAmount - stream.claimedAmount;
        if (claimedAmount == 0) revert NothingToClaim();

        // Check sufficient balance (validate balance during claim, not at stream start)
        uint256 contractBalance = paymentToken.balanceOf(address(this));
        if (contractBalance < claimedAmount) revert InsufficientBalance();

        // ===== EFFECTS =====
        // Update state BEFORE external calls
        stream.claimedAmount = streamedAmount;

        // Check if stream is complete
        bool shouldMarkPaid = block.timestamp >= stream.endTime;
        if (shouldMarkPaid) {
            stream.active = false;
        }

        // ===== INTERACTIONS =====
        // External calls LAST (CEI pattern)
        bool success = paymentToken.transfer(stream.investor, claimedAmount);
        if (!success) revert TransferFailed();

        emit StreamClaimed(
            invoiceId,
            stream.investor,
            claimedAmount,
            stream.claimedAmount
        );

        // Call markPaid AFTER successful transfer
        if (shouldMarkPaid) {
            invoiceNFT.markPaid(invoiceId);
            emit StreamStopped(
                invoiceId,
                stream.investor,
                stream.claimedAmount
            );
        }

        return claimedAmount;
    }

    /**
     * @notice Stop a stream (emergency or early completion)
     * @param invoiceId ID of the invoice
     */
    function stopStream(uint256 invoiceId) external nonReentrant {
        StreamInfo storage stream = streams[invoiceId];

        if (!stream.active) revert StreamNotActive();
        if (!authorizedManagers[msg.sender] && msg.sender != stream.investor) {
            revert NotAuthorized();
        }

        // Calculate final amount
        uint256 streamedAmount = _calculateStreamedAmount(stream);
        uint256 finalClaim = streamedAmount - stream.claimedAmount;

        // Update state
        stream.active = false;
        stream.claimedAmount = streamedAmount;

        // Transfer remaining tokens if any
        if (finalClaim > 0) {
            bool success = paymentToken.transfer(stream.investor, finalClaim);
            if (!success) revert TransferFailed();
        }

        // Mark invoice as paid
        invoiceNFT.markPaid(invoiceId);

        emit StreamStopped(invoiceId, stream.investor, stream.claimedAmount);
    }

    /**
     * @notice Update stream rate (emergency only)
     * @param invoiceId ID of the invoice
     * @param newAmountPerSecond New payment rate
     */
    function updateStreamRate(
        uint256 invoiceId,
        uint256 newAmountPerSecond
    ) external {
        if (!authorizedManagers[msg.sender]) revert NotAuthorized();

        StreamInfo storage stream = streams[invoiceId];
        if (!stream.active) revert StreamNotActive();
        if (newAmountPerSecond == 0) revert InvalidParameters();

        stream.amountPerSecond = newAmountPerSecond;

        emit StreamUpdated(invoiceId, newAmountPerSecond);
    }

    /**
     * @notice Get stream information
     * @param invoiceId ID of the invoice
     * @return Stream information
     */
    function getStreamInfo(
        uint256 invoiceId
    ) external view returns (StreamInfo memory) {
        return streams[invoiceId];
    }

    /**
     * @notice Get currently streamed amount (claimable)
     * @param invoiceId ID of the invoice
     * @return Current streamed amount
     */
    function getStreamedAmount(
        uint256 invoiceId
    ) external view returns (uint256) {
        StreamInfo memory stream = streams[invoiceId];
        if (!stream.active) return stream.claimedAmount;

        return _calculateStreamedAmount(stream);
    }

    /**
     * @notice Get claimable amount (not yet claimed)
     * @param invoiceId ID of the invoice
     * @return Claimable amount
     */
    function getClaimableAmount(
        uint256 invoiceId
    ) external view returns (uint256) {
        StreamInfo memory stream = streams[invoiceId];
        if (!stream.active) return 0;

        uint256 streamedAmount = _calculateStreamedAmount(stream);
        return streamedAmount - stream.claimedAmount;
    }

    /**
     * @notice Check if stream is active
     * @param invoiceId ID of the invoice
     * @return True if active
     */
    function isStreamActive(uint256 invoiceId) external view returns (bool) {
        return streams[invoiceId].active;
    }

    /**
     * @notice Authorize/revoke manager
     * @param manager Address to authorize
     * @param status Authorization status
     */
    function setAuthorizedManager(
        address manager,
        bool status
    ) external onlyOwner {
        authorizedManagers[manager] = status;
        emit ManagerAuthorized(manager, status);
    }

    /**
     * @notice Emergency withdraw tokens
     * @param token Token address
     * @param amount Amount to withdraw
     * @param to Recipient address
     */
    function emergencyWithdraw(
        address token,
        uint256 amount,
        address to
    ) external onlyOwner {
        if (to == address(0)) revert InvalidParameters();

        bool success = IERC20(token).transfer(to, amount);
        if (!success) revert TransferFailed();

        emit EmergencyWithdraw(token, amount, to);
    }

    /**
     * @notice Fund the contract with payment tokens
     * @param amount Amount to fund
     */
    function fundContract(uint256 amount) external {
        bool success = paymentToken.transferFrom(
            msg.sender,
            address(this),
            amount
        );
        if (!success) revert TransferFailed();
    }

    /**
     * @notice Deposit repayment funds for a stream (flexible amount)
     * @param invoiceId ID of the invoice
     * @param amount Amount to deposit (can be partial, full, or multiple deposits)
     */
    function depositRepaymentFunds(
        uint256 invoiceId,
        uint256 amount
    ) external nonReentrant {
        StreamInfo storage stream = streams[invoiceId];

        if (!stream.active) revert StreamNotActive();
        if (stream.payer != msg.sender) revert NotAuthorized();
        if (amount == 0) revert InvalidParameters();

        deposits[invoiceId] += amount;

        bool success = paymentToken.transferFrom(
            msg.sender,
            address(this),
            amount
        );
        if (!success) revert TransferFailed();

        emit FundsDeposited(invoiceId, msg.sender, amount);
    }

    /**
     * @notice Get deposit status for an invoice
     * @param invoiceId ID of the invoice
     * @return totalDeposited Total amount deposited by payer
     * @return totalRequired Total amount needed for complete stream
     * @return stillNeeded Amount still needed (0 if fully funded)
     */
    function getDepositStatus(
        uint256 invoiceId
    )
        external
        view
        returns (
            uint256 totalDeposited,
            uint256 totalRequired,
            uint256 stillNeeded
        )
    {
        totalDeposited = deposits[invoiceId];
        totalRequired = streams[invoiceId].totalAmount;
        stillNeeded = totalRequired > totalDeposited
            ? totalRequired - totalDeposited
            : 0;
    }

    /**
     * @notice Get contract balance
     * @return Balance of payment token
     */
    function getBalance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }

    /**
     * @dev Calculate streamed amount based on time elapsed
     * @param stream Stream information
     * @return Streamed amount
     */
    function _calculateStreamedAmount(
        StreamInfo memory stream
    ) private view returns (uint256) {
        if (!stream.active) {
            return stream.claimedAmount;
        }

        uint256 currentTime = block.timestamp;

        // If stream hasn't started yet
        if (currentTime < stream.startTime) {
            return 0;
        }

        // If stream has ended
        if (currentTime >= stream.endTime) {
            return stream.totalAmount;
        }

        // Calculate based on elapsed time
        uint256 elapsedTime = currentTime - stream.startTime;
        uint256 streamedAmount = elapsedTime * stream.amountPerSecond;

        // Cap at total amount
        return
            streamedAmount > stream.totalAmount
                ? stream.totalAmount
                : streamedAmount;
    }
}
