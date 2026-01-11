const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Superfluid addresses (same across all EVM chains)
const SUPERFLUID_ADDRESSES = {
    host: "0x4E583d9390082B65Bef884b629DFA426114CED6d",
    cfaV1: "0x2844c1BBdA121E9E43105630b9C8310e5c72744b",
};

async function main() {
    const { ethers } = hre;
    console.log("🚀 Deploying Invoice Finance Streams to Mantle...\n");

    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();

    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "MNT");
    console.log("Network:", network.name, "- Chain ID:", network.chainId, "\n");

    // ========================================
    // 1. Deploy KYCBridge
    // ========================================
    console.log("📋 Deploying KYCBridge...");
    const KYCBridge = await ethers.getContractFactory("KYCBridge");
    const kycBridge = await KYCBridge.deploy();
    await kycBridge.deployed();
    console.log("✅ KYCBridge deployed to:", kycBridge.address, "\n");

    // ========================================
    // 2. Deploy MockUSDY (for testing)
    // ========================================
    console.log("💵 Deploying MockUSDY...");
    const MockUSDY = await ethers.getContractFactory("MockUSDY");
    const mockUSDY = await MockUSDY.deploy();
    await mockUSDY.deployed();
    console.log("✅ MockUSDY deployed to:", mockUSDY.address);
    console.log("   Initial supply:", ethers.utils.formatEther(await mockUSDY.totalSupply()), "USDY\n");

    // ========================================
    // 3. Deploy InvoiceNFT
    // ========================================
    console.log("🎫 Deploying InvoiceNFT...");
    const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
    const invoiceNFT = await InvoiceNFT.deploy(kycBridge.address);
    await invoiceNFT.deployed();
    console.log("✅ InvoiceNFT deployed to:", invoiceNFT.address, "\n");

    // ========================================
    // 4. Deploy InvoiceAuction
    // ========================================
    console.log("🔨 Deploying InvoiceAuction...");
    const InvoiceAuction = await ethers.getContractFactory("InvoiceAuction");
    const invoiceAuction = await InvoiceAuction.deploy(
        invoiceNFT.address,
        kycBridge.address,
        mockUSDY.address
    );
    await invoiceAuction.deployed();
    console.log("✅ InvoiceAuction deployed to:", invoiceAuction.address, "\n");

    // ========================================
    // 5. Deploy StreamingRepayment
    // ========================================
    console.log("🌊 Deploying StreamingRepayment...");

    // Placeholder for USDY SuperToken - using MockUSDY address to pass validation
    // TODO: In production, wrap USDY as a proper SuperToken
    const usdySuperToken = mockUSDY.address;

    const StreamingRepayment = await ethers.getContractFactory("StreamingRepayment");
    const streamingRepayment = await StreamingRepayment.deploy(
        usdySuperToken,        // ISuperToken _superToken
        invoiceNFT.address     // address _invoiceNFT
    );
    await streamingRepayment.deployed();
    console.log("✅ StreamingRepayment deployed to:", streamingRepayment.address);
    console.log("   Superfluid Host:", SUPERFLUID_ADDRESSES.host);
    console.log("   Superfluid CFAv1:", SUPERFLUID_ADDRESSES.cfaV1, "\n");

    // ========================================
    // 6. Deploy InvoiceFinanceManager
    // ========================================
    console.log("🎯 Deploying InvoiceFinanceManager...");
    const InvoiceFinanceManager = await ethers.getContractFactory("InvoiceFinanceManager");
    const manager = await InvoiceFinanceManager.deploy(
        invoiceNFT.address,
        invoiceAuction.address,
        streamingRepayment.address,
        kycBridge.address
    );
    await manager.deployed();
    console.log("✅ InvoiceFinanceManager deployed to:", manager.address, "\n");

    // ========================================
    // 7. Set up permissions
    // ========================================
    console.log("🔐 Setting up contract permissions...");

    // Authorize auction contract to mark invoices as financed
    await invoiceNFT.setAuthorizedContract(invoiceAuction.address, true);
    console.log("✅ Authorized InvoiceAuction");

    // Authorize streaming contract to mark invoices as paid
    await invoiceNFT.setAuthorizedContract(streamingRepayment.address, true);
    console.log("✅ Authorized StreamingRepayment");

    // Authorize manager contract
    await invoiceNFT.setAuthorizedContract(manager.address, true);
    console.log("✅ Authorized Manager\n");

    // ========================================
    // 8. KYC the deployer for testing
    // ========================================
    console.log("✅ Adding deployer to KYC whitelist for testing...");
    await kycBridge.setKYC(deployer.address, true);
    console.log("✅ Deployer KYC'd:", deployer.address, "\n");

    // ========================================
    // 9. Save deployment info
    // ========================================
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            kycBridge: kycBridge.address,
            mockUSDY: mockUSDY.address,
            invoiceNFT: invoiceNFT.address,
            invoiceAuction: invoiceAuction.address,
            streamingRepayment: streamingRepayment.address,
            invoiceFinanceManager: manager.address,
        },
        superfluid: {
            host: SUPERFLUID_ADDRESSES.host,
            cfaV1: SUPERFLUID_ADDRESSES.cfaV1,
            usdySuperToken: usdySuperToken,
        },
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `${network.name}-${network.chainId}.json`;
    const filepath = path.join(deploymentsDir, filename);

    fs.writeFileSync(
        filepath,
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📄 Deployment info saved to:", filepath);
    console.log("\n📋 Contract Addresses:");
    console.log("─".repeat(60));
    Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
        console.log(`  ${name.padEnd(25)}: ${address}`);
    });
    console.log("\n🌊 Superfluid:");
    console.log("─".repeat(60));
    Object.entries(deploymentInfo.superfluid).forEach(([name, address]) => {
        console.log(`  ${name.padEnd(25)}: ${address}`);
    });

    console.log("\n📝 Next Steps:");
    console.log("─".repeat(60));
    console.log("  1. Verify contracts on MantleScan:");
    console.log("     npx hardhat verify --network mantleSepolia <ADDRESS>");
    console.log("\n  2. Update frontend constants with these addresses");
    console.log("\n  3. Test the flow:");
    console.log("     - Create invoice");
    console.log("     - Start auction");
    console.log("     - Place bid");
    console.log("     - Settle and start stream");
    console.log("\n" + "=".repeat(60) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
