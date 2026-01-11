// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ISuperfluid, ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./InvoiceNFT.sol";

/**
 * @title StreamingRepayment
 * @notice Manages Superfluid money streams for real-time invoice repayments
 * @dev Creates per-second token streams from payer to investor (invoice NFT owner)
 */
contract StreamingRepayment is Ownable {
    using SuperTokenV1Library for ISuperToken;

    // Superfluid Super Token (e.g., USDYx)
    ISuperToken public superToken;

    // Stream metadata structure
    struct StreamInfo {
        uint256 invoiceId; // Associated invoice ID
        address payer; // Who is streaming the repayment
        address investor; // Who receives the stream (investor)
        int96 flowRate; // Tokens per second (int96 required by Superfluid)
        uint256 totalAmount; // Total amount to be streamed
        uint256 startTime; // When stream started
        uint256 expectedEndTime; // When stream should complete
        bool active; // Whether stream is currently active
    }

    // State variables
    InvoiceNFT public invoiceNFT;
    mapping(uint256 => StreamInfo) public streams;
    mapping(address => bool) public authorizedManagers;

    // Events
    event StreamStarted(
        uint256 indexed invoiceId,
        address indexed payer,
        address indexed investor,
        int96 flowRate,
        uint256 totalAmount,
        uint256 duration
    );
    event StreamStopped(uint256 indexed invoiceId, address indexed investor);
    event StreamUpdated(uint256 indexed invoiceId, int96 newFlowRate);
    event ManagerAuthorized(address indexed manager, bool status);

    constructor(
        ISuperToken _superToken,
        address _invoiceNFT
    ) Ownable(msg.sender) {
        require(
            address(_superToken) != address(0),
            "StreamingRepayment: Invalid super token"
        );
        require(
            _invoiceNFT != address(0),
            "StreamingRepayment: Invalid NFT contract"
        );

        superToken = _superToken;
        invoiceNFT = InvoiceNFT(_invoiceNFT);

        // Authorize owner as manager by default
        authorizedManagers[msg.sender] = true;
    }

    /**
     * @notice Start a streaming repayment for an invoice
     * @param invoiceId ID of the invoice being repaid
     * @param investor Address that will receive the stream
     * @param totalAmount Total amount to stream (in base units)
     * @param durationSeconds Duration of the stream in seconds
     */
    function startStream(
        uint256 invoiceId,
        address investor,
        uint256 totalAmount,
        uint256 durationSeconds
    ) external {
        require(
            authorizedManagers[msg.sender],
            "StreamingRepayment: Not authorized"
        );

        // Validations
        InvoiceNFT.Invoice memory invoice = invoiceNFT.getInvoice(invoiceId);
        require(invoice.isFinanced, "StreamingRepayment: Invoice not financed");
        require(!invoice.isPaid, "StreamingRepayment: Invoice already paid");
        require(
            !streams[invoiceId].active,
            "StreamingRepayment: Stream already active"
        );
        require(totalAmount > 0, "StreamingRepayment: Amount must be > 0");
        require(
            durationSeconds > 0,
            "StreamingRepayment: Duration must be > 0"
        );
        require(investor != address(0), "StreamingRepayment: Invalid investor");

        // Calculate flow rate (tokens per second)
        // Flow rate must be int96 for Superfluid
        int96 flowRate = int96(int256(totalAmount / durationSeconds));
        require(flowRate > 0, "StreamingRepayment: Flow rate too low");

        // Create the stream using Superfluid SuperTokenV1Library
        // This contract needs to be the sender, so it must have enough super tokens
        superToken.createFlow(investor, flowRate);

        // Store stream info
        streams[invoiceId] = StreamInfo({
            invoiceId: invoiceId,
            payer: address(this),
            investor: investor,
            flowRate: flowRate,
            totalAmount: totalAmount,
            startTime: block.timestamp,
            expectedEndTime: block.timestamp + durationSeconds,
            active: true
        });

        emit StreamStarted(
            invoiceId,
            address(this),
            investor,
            flowRate,
            totalAmount,
            durationSeconds
        );
    }

    /**
     * @notice Stop a streaming repayment
     * @param invoiceId ID of the invoice to stop streaming for
     */
    function stopStream(uint256 invoiceId) external {
        StreamInfo storage stream = streams[invoiceId];

        require(stream.active, "StreamingRepayment: Stream not active");
        require(
            authorizedManagers[msg.sender] || msg.sender == stream.investor,
            "StreamingRepayment: Not authorized to stop"
        );

        // Delete the stream using Superfluid
        superToken.deleteFlow(address(this), stream.investor);

        // Update state
        stream.active = false;

        // Mark invoice as paid if stream completed successfully
        if (block.timestamp >= stream.expectedEndTime) {
            invoiceNFT.markPaid(invoiceId);
        }

        emit StreamStopped(invoiceId, stream.investor);
    }

    /**
     * @notice Update an existing stream's flow rate
     * @param invoiceId ID of the invoice
     * @param newFlowRate New flow rate in tokens per second
     */
    function updateStream(uint256 invoiceId, int96 newFlowRate) external {
        require(
            authorizedManagers[msg.sender],
            "StreamingRepayment: Not authorized"
        );

        StreamInfo storage stream = streams[invoiceId];
        require(stream.active, "StreamingRepayment: Stream not active");
        require(newFlowRate > 0, "StreamingRepayment: Flow rate must be > 0");

        // Update the stream using Superfluid
        superToken.updateFlow(stream.investor, newFlowRate);

        // Update stored flow rate
        stream.flowRate = newFlowRate;

        emit StreamUpdated(invoiceId, newFlowRate);
    }

    /**
     * @notice Get stream information
     * @param invoiceId ID of the invoice
     * @return StreamInfo struct with all stream details
     */
    function getStreamInfo(
        uint256 invoiceId
    ) external view returns (StreamInfo memory) {
        return streams[invoiceId];
    }

    /**
     * @notice Calculate current streamed amount
     * @param invoiceId ID of the invoice
     * @return amount Amount streamed so far
     */
    function getStreamedAmount(
        uint256 invoiceId
    ) external view returns (uint256) {
        StreamInfo memory stream = streams[invoiceId];

        if (!stream.active) {
            return 0;
        }

        uint256 elapsed = block.timestamp - stream.startTime;
        uint256 streamed = uint256(uint96(stream.flowRate)) * elapsed;

        // Cap at total amount
        if (streamed > stream.totalAmount) {
            return stream.totalAmount;
        }

        return streamed;
    }

    /**
     * @notice Check if a stream is complete
     * @param invoiceId ID of the invoice
     * @return bool True if stream has completed
     */
    function isStreamComplete(uint256 invoiceId) external view returns (bool) {
        StreamInfo memory stream = streams[invoiceId];

        if (!stream.active) {
            return false;
        }

        return block.timestamp >= stream.expectedEndTime;
    }

    /**
     * @notice Get real-time flow rate from Superfluid
     * @param invoiceId ID of the invoice
     * @return flowRate Current flow rate from Superfluid
     */
    function getRealtimeFlowRate(
        uint256 invoiceId
    ) external view returns (int96) {
        StreamInfo memory stream = streams[invoiceId];
        if (!stream.active) {
            return 0;
        }
        return superToken.getFlowRate(address(this), stream.investor);
    }

    /**
     * @notice Authorize or revoke a manager
     * @param manager Address to authorize/revoke
     * @param status True to authorize, false to revoke
     */
    function setAuthorizedManager(
        address manager,
        bool status
    ) external onlyOwner {
        authorizedManagers[manager] = status;
        emit ManagerAuthorized(manager, status);
    }

    /**
     * @notice Deposit super tokens into this contract to fund streams
     * @param amount Amount of super tokens to deposit
     */
    function depositSuperTokens(uint256 amount) external {
        superToken.transferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Withdraw excess super tokens (owner only)
     * @param amount Amount to withdraw
     * @param to Recipient address
     */
    function withdrawSuperTokens(
        uint256 amount,
        address to
    ) external onlyOwner {
        superToken.transfer(to, amount);
    }
}
