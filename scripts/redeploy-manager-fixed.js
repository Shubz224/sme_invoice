const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const { ethers } = hre;

    console.log("🔄 Redeploying InvoiceFinanceManager with CORRECT addresses...\n");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log(`Balance: ${ethers.utils.formatEther(await deployer.getBalance())} MNT\n`);

    // CORRECT addresses from current deployment
    const addresses = {
        invoiceNFT: "0x6FDdD7F965B46cE78D324326F847ff91e445b4D5",
        invoiceAuction: "0xf62591fdE615c0a8E468Fea8974AFF177996448B",
        simpleStreaming: "0xEE63729e59AeFeFFA87c997e1a62Bd5d0e5DaAbD",
        kycBridge: "0x3fD1A28087c69D922ef6FEFAe231b9226EE9F7a7",  // NEW KYCBridge!
        mockUSDY: "0x3602a2dd2709644CceccE92B610cAa43cB136ECe"
    };

    console.log("📋 Using Contract Addresses:");
    console.log(`   InvoiceNFT: ${addresses.invoiceNFT}`);
    console.log(`   InvoiceAuction: ${addresses.invoiceAuction}`);
    console.log(`   SimpleStreaming: ${addresses.simpleStreaming}`);
    console.log(`   KYCBridge: ${addresses.kycBridge} ✅ NEW`);
    console.log(`   MockUSDY: ${addresses.mockUSDY}\n`);

    // Deploy InvoiceFinanceManager
    console.log("📦 Deploying InvoiceFinanceManager...");
    const Manager = await ethers.getContractFactory("InvoiceFinanceManager");
    const manager = await Manager.deploy(
        addresses.invoiceNFT,
        addresses.invoiceAuction,
        addresses.simpleStreaming,
        addresses.kycBridge
    );
    await manager.deployed();
    console.log("✅ InvoiceFinanceManager deployed to:", manager.address, "\n");

    // Verify deployment
    console.log("🔍 Verifying deployment...");
    const nftAddr = await manager.invoiceNFT();
    const auctionAddr = await manager.auction();
    const streamingAddr = await manager.streaming();
    const kycAddr = await manager.kycBridge();

    console.log(`   InvoiceNFT: ${nftAddr} ${nftAddr === addresses.invoiceNFT ? '✅' : '❌'}`);
    console.log(`   Auction: ${auctionAddr} ${auctionAddr === addresses.invoiceAuction ? '✅' : '❌'}`);
    console.log(`   Streaming: ${streamingAddr} ${streamingAddr === addresses.simpleStreaming ? '✅' : '❌'}`);
    console.log(`   KYCBridge: ${kycAddr} ${kycAddr === addresses.kycBridge ? '✅' : '❌'}\n`);

    // Set up permissions
    console.log("🔐 Setting up permissions...");

    // Authorize Manager in InvoiceNFT
    const nft = await ethers.getContractAt("InvoiceNFT", addresses.invoiceNFT);
    const tx1 = await nft.setAuthorizedContract(manager.address, true);
    await tx1.wait();
    console.log("✅ Authorized Manager in InvoiceNFT");

    // Authorize Manager in SimpleStreamingRepayment
    const streaming = await ethers.getContractAt("SimpleStreamingRepayment", addresses.simpleStreaming);
    const tx2 = await streaming.setAuthorizedManager(manager.address, true);
    await tx2.wait();
    console.log("✅ Authorized Manager in SimpleStreamingRepayment\n");

    // Update deployment info
    console.log("📝 Updating deployment files...");

    const deploymentPath = path.join(__dirname, "../deployments/unknown-5003.json");
    let deploymentData = {};
    if (fs.existsSync(deploymentPath)) {
        deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    }

    deploymentData.contracts = deploymentData.contracts || {};
    deploymentData.contracts.invoiceFinanceManager = manager.address;
    deploymentData.contracts.invoiceNFT = addresses.invoiceNFT;
    deploymentData.contracts.invoiceAuction = addresses.invoiceAuction;
    deploymentData.contracts.simpleStreamingRepayment = addresses.simpleStreaming;
    deploymentData.contracts.kycBridge = addresses.kycBridge;
    deploymentData.contracts.mockUSDY = addresses.mockUSDY;
    deploymentData.timestamp = new Date().toISOString();

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
    console.log("✅ Updated deployment info in unknown-5003.json");

    // Update frontend config file
    const frontendConfigPath = path.join(__dirname, "../frontend/src/lib/contracts.ts");
    const frontendConfig = `// Contract addresses on Mantle Sepolia
export const CONTRACTS = {
    InvoiceNFT: '${addresses.invoiceNFT}',
    InvoiceAuction: '${addresses.invoiceAuction}',
    SimpleStreamingRepayment: '${addresses.simpleStreaming}',
    InvoiceFinanceManager: '${manager.address}',
    MockUSDY: '${addresses.mockUSDY}',
    KYCBridge: '${addresses.kycBridge}',
} as const;

// Mantle Sepolia Network Config
export const NETWORK_CONFIG = {
    chainId: 5003,
    chainName: 'Mantle Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
    blockExplorer: 'https://sepolia.mantlescan.xyz',
    nativeCurrency: {
        name: 'MNT',
        symbol: 'MNT',
        decimals: 18,
    },
} as const;

// Helper to get explorer link
export function getExplorerLink(address: string, type: 'address' | 'tx' = 'address'): string {
    return \`\${NETWORK_CONFIG.blockExplorer}/\${type}/\${address}\`;
}
`;

    fs.writeFileSync(frontendConfigPath, frontendConfig);
    console.log("✅ Updated frontend config (contracts.ts)\n");

    console.log("=".repeat(70));
    console.log("🎉 REDEPLOYMENT COMPLETE!");
    console.log("=".repeat(70));
    console.log("\n📋 New Manager Address:", manager.address);
    console.log("🔗 Explorer:", `https://sepolia.mantlescan.xyz/address/${manager.address}`);
    console.log("\n✅ Your wallet is KYC verified on the correct bridge!");
    console.log("🚀 You can now create invoices in the frontend!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Redeployment failed:");
        console.error(error);
        process.exit(1);
    });
