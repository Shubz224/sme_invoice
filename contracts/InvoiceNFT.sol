// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./KYCBridge.sol";

/**
 * @title InvoiceNFT
 * @notice ERC-721 NFT representing SME invoices with financial metadata
 * @dev Each invoice is minted as an NFT to the issuer (SME)
 */
contract InvoiceNFT is ERC721, Ownable {
    // Invoice metadata structure
    struct Invoice {
        uint256 id; // Unique invoice ID
        address issuer; // SME who created the invoice
        uint256 amount; // Face value in base units (e.g., 10000 * 1e18)
        uint256 dueDate; // UNIX timestamp when invoice is due
        string buyerId; // Hashed buyer reference (for privacy)
        string documentURI; // IPFS URI pointing to invoice PDF
        bool isFinanced; // True after auction settled
        bool isPaid; // True after fully repaid
    }

    // State variables
    uint256 private _tokenIdCounter;
    KYCBridge public kycBridge;

    // Mappings
    mapping(uint256 => Invoice) public invoices;

    // Authorized contracts that can mark invoices as financed/paid
    mapping(address => bool) public authorizedContracts;

    // Events
    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed issuer,
        uint256 amount,
        uint256 dueDate,
        string buyerId
    );
    event InvoiceFinanced(uint256 indexed invoiceId, address indexed financier);
    event InvoicePaid(uint256 indexed invoiceId);
    event ContractAuthorized(address indexed contractAddress, bool status);

    constructor(
        address _kycBridge
    ) ERC721("Invoice Finance NFT", "INVOICE") Ownable(msg.sender) {
        require(_kycBridge != address(0), "InvoiceNFT: Invalid KYC bridge");
        kycBridge = KYCBridge(_kycBridge);
    }

    /**
     * @notice Create a new invoice NFT
     * @param amount Face value of the invoice
     * @param dueDate UNIX timestamp when invoice is due
     * @param buyerId Identifier for the buyer (can be hashed for privacy)
     * @param documentURI IPFS URI of the invoice document
     * @return invoiceId The newly created invoice ID
     */
    function createInvoice(
        address issuer,
        uint256 amount,
        uint256 dueDate,
        string calldata buyerId,
        string calldata documentURI
    ) external returns (uint256 invoiceId) {
        // Require KYC'd issuer
        require(kycBridge.isKYCd(issuer), "InvoiceNFT: Issuer not KYC'd");
        require(
            !kycBridge.isBlacklisted(issuer),
            "InvoiceNFT: Issuer is blacklisted"
        );

        // If called by manager, respect the requested issuer
        // If called directly, msg.sender MUST be the issuer
        if (msg.sender != issuer) {
            require(
                authorizedContracts[msg.sender],
                "InvoiceNFT: Not authorized to create for others"
            );
        }

        // Validate inputs
        require(amount > 0, "InvoiceNFT: Amount must be greater than 0");
        require(
            dueDate > block.timestamp,
            "InvoiceNFT: Due date must be in the future"
        );
        require(
            bytes(buyerId).length > 0,
            "InvoiceNFT: Buyer ID cannot be empty"
        );
        require(
            bytes(documentURI).length > 0,
            "InvoiceNFT: Document URI cannot be empty"
        );

        // Increment token ID
        _tokenIdCounter++;
        invoiceId = _tokenIdCounter;

        // Create invoice
        invoices[invoiceId] = Invoice({
            id: invoiceId,
            issuer: issuer, // Record the actual SME as the issuer
            amount: amount,
            dueDate: dueDate,
            buyerId: buyerId,
            documentURI: documentURI,
            isFinanced: false,
            isPaid: false
        });

        // Mint NFT to msg.sender (which could be the Manager)
        // This allows the Manager to handle approvals/transfers for the initial setup
        _safeMint(msg.sender, invoiceId);

        emit InvoiceCreated(invoiceId, msg.sender, amount, dueDate, buyerId);

        return invoiceId;
    }

    /**
     * @notice Mark an invoice as financed (called by auction contract after settlement)
     * @param invoiceId ID of the invoice to mark as financed
     */
    function markFinanced(uint256 invoiceId) external {
        require(
            authorizedContracts[msg.sender],
            "InvoiceNFT: Caller not authorized"
        );
        require(
            _ownerOf(invoiceId) != address(0),
            "InvoiceNFT: Invoice does not exist"
        );
        require(
            !invoices[invoiceId].isFinanced,
            "InvoiceNFT: Invoice already financed"
        );

        invoices[invoiceId].isFinanced = true;

        emit InvoiceFinanced(invoiceId, ownerOf(invoiceId));
    }

    /**
     * @notice Mark an invoice as paid (called by streaming contract or manager)
     * @param invoiceId ID of the invoice to mark as paid
     */
    function markPaid(uint256 invoiceId) external {
        require(
            authorizedContracts[msg.sender] || msg.sender == owner(),
            "InvoiceNFT: Caller not authorized"
        );
        require(
            _ownerOf(invoiceId) != address(0),
            "InvoiceNFT: Invoice does not exist"
        );
        require(
            invoices[invoiceId].isFinanced,
            "InvoiceNFT: Invoice not financed yet"
        );
        require(
            !invoices[invoiceId].isPaid,
            "InvoiceNFT: Invoice already paid"
        );

        invoices[invoiceId].isPaid = true;

        emit InvoicePaid(invoiceId);
    }

    /**
     * @notice Get invoice details
     * @param invoiceId ID of the invoice
     * @return Invoice struct with all details
     */
    function getInvoice(
        uint256 invoiceId
    ) external view returns (Invoice memory) {
        require(
            _ownerOf(invoiceId) != address(0),
            "InvoiceNFT: Invoice does not exist"
        );
        return invoices[invoiceId];
    }

    /**
     * @notice Get total number of invoices created
     * @return Total invoice count
     */
    function getTotalInvoices() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Authorize or revoke a contract's permission to mark invoices
     * @param contractAddress Address of the contract to authorize
     * @param status True to authorize, false to revoke
     */
    function setAuthorizedContract(
        address contractAddress,
        bool status
    ) external onlyOwner {
        authorizedContracts[contractAddress] = status;
        emit ContractAuthorized(contractAddress, status);
    }

    /**
     * @notice Override to prevent token transfers when invoice is financed
     * @dev Invoices can only be transferred via auction settlement
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from = address(0))
        if (from == address(0)) {
            return super._update(to, tokenId, auth);
        }

        // Allow transfers by authorized contracts (auction settlement)
        if (authorizedContracts[msg.sender]) {
            return super._update(to, tokenId, auth);
        }

        // Allow owner to transfer unfunded invoices
        if (!invoices[tokenId].isFinanced && from == auth) {
            return super._update(to, tokenId, auth);
        }

        revert("InvoiceNFT: Cannot transfer financed invoice");
    }
}
