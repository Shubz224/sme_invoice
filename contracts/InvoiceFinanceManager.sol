// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./InvoiceNFT.sol";
import "./InvoiceAuction.sol";
import "./SimpleStreamingRepayment.sol";
import "./KYCBridge.sol";

/**
 * @title InvoiceFinanceManager
 * @notice Orchestration contract that simplifies frontend integration
 * @dev Combines multiple operations into single transactions
 */
contract InvoiceFinanceManager is Ownable, ReentrancyGuard, IERC721Receiver {
    // Contract references
    InvoiceNFT public invoiceNFT;
    InvoiceAuction public auction;
    SimpleStreamingRepayment public streaming;
    KYCBridge public kycBridge;

    // Events
    event InvoiceCreatedAndAuctionStarted(
        uint256 indexed invoiceId,
        address indexed issuer,
        uint256 amount,
        uint256 minPrice,
        uint256 auctionEndTime
    );
    event AuctionSettledAndStreamStarted(
        uint256 indexed invoiceId,
        address indexed investor,
        uint256 amount,
        int96 flowRate
    );

    constructor(
        address _invoiceNFT,
        address _auction,
        address _streaming,
        address _kycBridge
    ) Ownable(msg.sender) {
        require(_invoiceNFT != address(0), "Manager: Invalid NFT contract");
        require(_auction != address(0), "Manager: Invalid auction contract");
        require(
            _streaming != address(0),
            "Manager: Invalid streaming contract"
        );
        require(_kycBridge != address(0), "Manager: Invalid KYC bridge");

        invoiceNFT = InvoiceNFT(_invoiceNFT);
        auction = InvoiceAuction(_auction);
        streaming = SimpleStreamingRepayment(_streaming);
        kycBridge = KYCBridge(_kycBridge);
    }

    /**
     * @notice SME: Create invoice and start auction in one transaction
     * @param amount Invoice face value
     * @param dueDate Invoice due date
     * @param buyerId Buyer identifier
     * @param documentURI IPFS URI of invoice document
     * @param minPrice Minimum auction price
     * @param auctionDuration Auction duration in seconds
     * @return invoiceId The created invoice ID
     */
    function createInvoiceAndStartAuction(
        uint256 amount,
        uint256 dueDate,
        string calldata buyerId,
        string calldata documentURI,
        uint256 minPrice,
        uint256 auctionDuration
    ) external nonReentrant returns (uint256 invoiceId) {
        // Check KYC - require at least Basic level for invoice creation
        kycBridge.verifyTransaction(
            msg.sender,
            amount,
            KYCBridge.VerificationLevel.Basic
        );

        // Create invoice
        // The NFT is minted to the Manager contract (address(this)),
        // but the original SME (msg.sender) is recorded as the issuer in the NFT's metadata.
        invoiceId = invoiceNFT.createInvoice(
            msg.sender, // The SME is recorded as the issuer in metadata
            amount,
            dueDate,
            buyerId,
            documentURI
        );

        // Approve auction contract to transfer the NFT (owned by Manager currently)
        invoiceNFT.approve(address(auction), invoiceId);

        // Start auction
        // The auction contract will record the Manager as the 'issuer' for its internal logic (e.g., for settlement payout).
        // This is because the Manager is the one calling startAuction and is the current owner of the NFT.
        // The actual SME (msg.sender of this function) is stored in the NFT's metadata.
        auction.startAuction(invoiceId, minPrice, auctionDuration);

        emit InvoiceCreatedAndAuctionStarted(
            invoiceId,
            msg.sender, // Emit the actual SME as the issuer for external tracking
            amount,
            minPrice,
            block.timestamp + auctionDuration
        );

        return invoiceId;
    }

    /**
     * @notice Settle auction and start repayment stream (anyone can call after auction ends)
     * @param invoiceId ID of the invoice
     */
    function settleAuctionAndStartStream(
        uint256 invoiceId
    ) external nonReentrant {
        // Get auction info
        InvoiceAuction.Auction memory auc = auction.getAuction(invoiceId);

        // Validations (anyone can call, but only after auction ends)
        require(
            block.timestamp >= auc.endTime,
            "Manager: Auction not ended yet"
        );
        require(!auc.settled, "Manager: Already settled");
        require(auc.highestBidder != address(0), "Manager: No bids placed");

        // Settle the auction (transfers USDY to SME, NFT to winner)
        auction.settleAuction(invoiceId);

        // Get invoice and winner details
        InvoiceNFT.Invoice memory invoice = invoiceNFT.getInvoice(invoiceId);
        (address investor, ) = auction.getWinnerInfo(invoiceId);

        // Auto-calculate stream parameters from invoice
        uint256 repaymentAmount = invoice.amount; // Full face value
        uint256 durationSeconds = invoice.dueDate > block.timestamp
            ? invoice.dueDate - block.timestamp // Time until invoice due date
            : 30 days; // Fallback to 30 days if past due (shouldn't happen)

        // Start repayment stream with SME as payer
        streaming.startStream(
            invoiceId,
            invoice.issuer, // ✅ SME is the payer (not address(this))
            investor, // Investor receives payments
            repaymentAmount,
            durationSeconds
        );

        int96 flowRate = int96(int256(repaymentAmount / durationSeconds));

        emit AuctionSettledAndStreamStarted(
            invoiceId,
            investor,
            repaymentAmount,
            flowRate
        );
    }

    /**
     * @notice Get complete invoice status
     * @param invoiceId ID of the invoice
     * @return invoice Invoice details
     * @return auctionData Auction details
     * @return streamData Stream details
     */
    function getInvoiceStatus(
        uint256 invoiceId
    )
        external
        view
        returns (
            InvoiceNFT.Invoice memory invoice,
            InvoiceAuction.Auction memory auctionData,
            SimpleStreamingRepayment.StreamInfo memory streamData
        )
    {
        invoice = invoiceNFT.getInvoice(invoiceId);
        auctionData = auction.getAuction(invoiceId);
        streamData = streaming.getStreamInfo(invoiceId);

        return (invoice, auctionData, streamData);
    }

    /**
     * @notice Emergency stop stream and mark invoice paid
     * @param invoiceId ID of the invoice
     */
    function emergencyStopStream(uint256 invoiceId) external onlyOwner {
        streaming.stopStream(invoiceId);
        invoiceNFT.markPaid(invoiceId);
    }

    /**
     * @notice Handle the receipt of an NFT
     * @return The selector of this function to confirm receipt
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
