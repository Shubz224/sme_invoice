// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./InvoiceNFT.sol";
import "./KYCBridge.sol";

/**
 * @title InvoiceAuction
 * @notice English auction system for invoice financing with USDY
 * @dev Investors bid USDY to finance SME invoices, winner gets NFT and receives future repayment stream
 */
contract InvoiceAuction is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Auction structure
    struct Auction {
        uint256 invoiceId; // Invoice NFT ID
        address issuer; // SME who created the auction
        uint256 minPrice; // Minimum financing amount in USDY
        uint256 highestBid; // Current highest bid
        address highestBidder; // Current highest bidder
        uint256 startTime; // When auction started
        uint256 endTime; // When auction ends
        bool settled; // Whether auction has been settled
        bool cancelled; // Whether auction was cancelled
    }

    // State variables
    InvoiceNFT public invoiceNFT;
    KYCBridge public kycBridge;
    IERC20 public usdy;

    // Mappings
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => mapping(address => uint256)) public bids; // Track all bids per address

    // Events
    event AuctionStarted(
        uint256 indexed invoiceId,
        address indexed issuer,
        uint256 minPrice,
        uint256 endTime
    );
    event BidPlaced(
        uint256 indexed invoiceId,
        address indexed bidder,
        uint256 bidAmount
    );
    event AuctionSettled(
        uint256 indexed invoiceId,
        address indexed winner,
        uint256 winningBid
    );
    event AuctionCancelled(uint256 indexed invoiceId);
    event BidRefunded(
        uint256 indexed invoiceId,
        address indexed bidder,
        uint256 amount
    );

    constructor(
        address _invoiceNFT,
        address _kycBridge,
        address _usdy
    ) Ownable(msg.sender) {
        require(
            _invoiceNFT != address(0),
            "InvoiceAuction: Invalid NFT contract"
        );
        require(_kycBridge != address(0), "InvoiceAuction: Invalid KYC bridge");
        require(_usdy != address(0), "InvoiceAuction: Invalid USDY address");

        invoiceNFT = InvoiceNFT(_invoiceNFT);
        kycBridge = KYCBridge(_kycBridge);
        usdy = IERC20(_usdy);
    }

    /**
     * @notice Start an auction for an invoice
     * @param invoiceId ID of the invoice NFT
     * @param minPrice Minimum acceptable financing amount
     * @param durationSeconds How long the auction runs
     */
    function startAuction(
        uint256 invoiceId,
        uint256 minPrice,
        uint256 durationSeconds
    ) external nonReentrant {
        // Get invoice details
        InvoiceNFT.Invoice memory invoice = invoiceNFT.getInvoice(invoiceId);

        // Validations
        require(
            invoice.issuer == msg.sender ||
                invoiceNFT.authorizedContracts(msg.sender),
            "InvoiceAuction: Not authorized to start auction"
        );
        require(
            !invoice.isFinanced,
            "InvoiceAuction: Invoice already financed"
        );
        require(
            invoiceNFT.ownerOf(invoiceId) == msg.sender,
            "InvoiceAuction: Must own invoice NFT"
        );
        require(minPrice > 0, "InvoiceAuction: Min price must be > 0");
        require(
            minPrice <= invoice.amount,
            "InvoiceAuction: Min price exceeds invoice amount"
        );
        require(
            durationSeconds >= 60,
            "InvoiceAuction: Duration must be at least 1 minute"
        );
        require(
            durationSeconds <= 30 days,
            "InvoiceAuction: Duration too long"
        );
        require(
            auctions[invoiceId].startTime == 0,
            "InvoiceAuction: Auction already exists"
        );

        // Transfer NFT to this contract for escrow
        invoiceNFT.transferFrom(msg.sender, address(this), invoiceId);

        // Create auction
        auctions[invoiceId] = Auction({
            invoiceId: invoiceId,
            issuer: msg.sender,
            minPrice: minPrice,
            highestBid: 0,
            highestBidder: address(0),
            startTime: block.timestamp,
            endTime: block.timestamp + durationSeconds,
            settled: false,
            cancelled: false
        });

        emit AuctionStarted(
            invoiceId,
            msg.sender,
            minPrice,
            block.timestamp + durationSeconds
        );
    }

    /**
     * @notice Place a bid on an active auction
     * @param invoiceId ID of the invoice to bid on
     * @param bidAmount Amount of USDY to bid
     */
    function placeBid(
        uint256 invoiceId,
        uint256 bidAmount
    ) external nonReentrant {
        Auction storage auction = auctions[invoiceId];

        // Validations
        require(
            auction.startTime > 0,
            "InvoiceAuction: Auction does not exist"
        );
        require(!auction.settled, "InvoiceAuction: Auction already settled");
        require(!auction.cancelled, "InvoiceAuction: Auction cancelled");
        require(
            block.timestamp < auction.endTime,
            "InvoiceAuction: Auction ended"
        );
        // Check KYC - require Standard level for bidding
        kycBridge.verifyTransaction(
            msg.sender,
            bidAmount,
            KYCBridge.VerificationLevel.Standard
        );
        require(
            bidAmount >= auction.minPrice,
            "InvoiceAuction: Bid below minimum"
        );
        require(
            bidAmount > auction.highestBid,
            "InvoiceAuction: Bid not higher than current highest"
        );

        // Transfer USDY from bidder to this contract
        usdy.safeTransferFrom(msg.sender, address(this), bidAmount);

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            uint256 refundAmount = auction.highestBid;
            address previousBidder = auction.highestBidder;

            usdy.safeTransfer(previousBidder, refundAmount);
            emit BidRefunded(invoiceId, previousBidder, refundAmount);
        }

        // Update auction state
        auction.highestBid = bidAmount;
        auction.highestBidder = msg.sender;
        bids[invoiceId][msg.sender] = bidAmount;

        emit BidPlaced(invoiceId, msg.sender, bidAmount);
    }

    /**
     * @notice Settle an auction after it ends
     * @param invoiceId ID of the invoice auction to settle
     */
    function settleAuction(uint256 invoiceId) external nonReentrant {
        Auction storage auction = auctions[invoiceId];

        // Validations
        require(
            auction.startTime > 0,
            "InvoiceAuction: Auction does not exist"
        );
        require(!auction.settled, "InvoiceAuction: Auction already settled");
        require(!auction.cancelled, "InvoiceAuction: Auction cancelled");
        require(
            block.timestamp >= auction.endTime,
            "InvoiceAuction: Auction not ended yet"
        );

        auction.settled = true;

        // Get the real issuer from NFT metadata
        address realIssuer = invoiceNFT.getInvoice(invoiceId).issuer;

        // If no bids, return NFT to issuer
        if (auction.highestBidder == address(0)) {
            invoiceNFT.transferFrom(address(this), realIssuer, invoiceId);
            emit AuctionCancelled(invoiceId);
            return;
        }

        // Transfer USDY to issuer (SME gets cash now)
        usdy.safeTransfer(realIssuer, auction.highestBid);

        // Transfer NFT to winner (investor gets invoice NFT)
        invoiceNFT.transferFrom(
            address(this),
            auction.highestBidder,
            invoiceId
        );

        // Mark invoice as financed
        invoiceNFT.markFinanced(invoiceId);

        emit AuctionSettled(
            invoiceId,
            auction.highestBidder,
            auction.highestBid
        );
    }

    /**
     * @notice Cancel an auction (only issuer, only before any bids)
     * @param invoiceId ID of the invoice auction to cancel
     */
    function cancelAuction(uint256 invoiceId) external nonReentrant {
        Auction storage auction = auctions[invoiceId];

        // Validations
        require(
            auction.startTime > 0,
            "InvoiceAuction: Auction does not exist"
        );
        // Get the real issuer from NFT metadata
        address realIssuer = invoiceNFT.getInvoice(invoiceId).issuer;

        require(
            msg.sender == realIssuer || msg.sender == auction.issuer,
            "InvoiceAuction: Not authorized to cancel"
        );
        require(!auction.settled, "InvoiceAuction: Auction already settled");
        require(
            !auction.cancelled,
            "InvoiceAuction: Auction already cancelled"
        );
        require(
            auction.highestBidder == address(0),
            "InvoiceAuction: Cannot cancel with active bids"
        );

        auction.cancelled = true;

        // Return NFT to real issuer
        invoiceNFT.transferFrom(address(this), realIssuer, invoiceId);

        emit AuctionCancelled(invoiceId);
    }

    /**
     * @notice Get auction details
     * @param invoiceId ID of the invoice
     * @return Auction struct with all details
     */
    function getAuction(
        uint256 invoiceId
    ) external view returns (Auction memory) {
        return auctions[invoiceId];
    }

    /**
     * @notice Get winner info for settled auction
     * @param invoiceId ID of the invoice
     * @return winner Address of the winning bidder
     * @return winningBid Amount of the winning bid
     */
    function getWinnerInfo(
        uint256 invoiceId
    ) external view returns (address winner, uint256 winningBid) {
        Auction memory auction = auctions[invoiceId];
        require(auction.settled, "InvoiceAuction: Auction not settled");
        return (auction.highestBidder, auction.highestBid);
    }

    /**
     * @notice Check if auction is active
     * @param invoiceId ID of the invoice
     * @return bool True if auction is active and accepting bids
     */
    function isAuctionActive(uint256 invoiceId) external view returns (bool) {
        Auction memory auction = auctions[invoiceId];
        return
            auction.startTime > 0 &&
            !auction.settled &&
            !auction.cancelled &&
            block.timestamp < auction.endTime;
    }
}
