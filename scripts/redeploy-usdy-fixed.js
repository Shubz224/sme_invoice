const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const { ethers } = hre;

    console.log("\n🔄 Redeploying MockUSDY with CORRECT decimals (6)...\n");
    console.log("=".repeat(70));

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log(`Balance: ${ethers.utils.formatEther(await deployer.getBalance())} MNT\n`);

    // Deploy MockUSDY with 6 decimals
    console.log("📦 Deploying MockUSDY (6 decimals)...");
    const MockUSDY = await ethers.getContractFactory("MockUSDY");
    const usdy = await MockUSDY.deploy();
    await usdy.deployed();
    console.log("✅ MockUSDY deployed to:", usdy.address);

    // Verify decimals
    const decimals = await usdy.decimals();
    console.log(`   Decimals: ${decimals} ${decimals === 6 ? '✅' : '❌ Should be 6!'}`);

    // Get some USDY for deployer
    console.log("\n💰 Minting test USDY...");
    const faucetTx = await usdy.faucet();
    await faucetTx.wait();
    const balance = await usdy.balanceOf(deployer.address);
    console.log(`   Balance: ${ethers.utils.formatUnits(balance, 6)} USDY`);

    // Current contract addresses (keeping the same)
    const addresses = {
        invoiceNFT: "0x6FDdD7F965B46cE78D324326F847ff91e445b4D5",
        invoiceAuction: "0xf62591fdE615c0a8E468Fea8974AFF177996448B",
        simpleStreaming: "0xEE63729e59AeFeFFA87c997e1a62Bd5d0e5DaAbD",
        manager: "0xcd7B19520002039c39A8bF5F7706232B5E5C9F45",
        kycBridge: "0x3fD1A28087c69D922ef6FEFAe231b9226EE9F7a7",
        mockUSDY: usdy.address  // NEW!
    };

    console.log("\n📋 Updated Contract Addresses:");
    console.log(`   InvoiceNFT: ${addresses.invoiceNFT}`);
    console.log(`   InvoiceAuction: ${addresses.invoiceAuction}`);
    console.log(`   SimpleStreaming: ${addresses.simpleStreaming}`);
    console.log(`   Manager: ${addresses.manager}`);
    console.log(`   KYCBridge: ${addresses.kycBridge}`);
    console.log(`   MockUSDY: ${addresses.mockUSDY} ✅ NEW (6 decimals)\n`);

    // Update deployment info
    console.log("📝 Updating deployment files...");

    const deploymentPath = path.join(__dirname, "../deployments/unknown-5003.json");
    let deploymentData = {};
    if (fs.existsSync(deploymentPath)) {
        deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    }

    deploymentData.contracts = deploymentData.contracts || {};
    deploymentData.contracts.mockUSDY = addresses.mockUSDY;
    deploymentData.contracts.invoiceFinanceManager = addresses.manager;
    deploymentData.contracts.invoiceNFT = addresses.invoiceNFT;
    deploymentData.contracts.invoiceAuction = addresses.invoiceAuction;
    deploymentData.contracts.simpleStreamingRepayment = addresses.simpleStreaming;
    deploymentData.contracts.kycBridge = addresses.kycBridge;
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
    InvoiceFinanceManager: '${addresses.manager}',
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
    console.log("✅ Updated frontend config (contracts.ts)");

    // Update frontend blockchain.ts to use 6 decimals
    const blockchainPath = path.join(__dirname, "../frontend/src/lib/blockchain.ts");
    let blockchainContent = fs.readFileSync(blockchainPath, "utf8");

    // Replace 18 decimals with 6 for USDY
    blockchainContent = blockchainContent.replace(
        /\/\/ Helper: Format USDY amount \(18 decimals\)/g,
        "// Helper: Format USDY amount (6 decimals)"
    );
    blockchainContent = blockchainContent.replace(
        /formatUnits\(amount, 18\)/g,
        "formatUnits(amount, 6)"
    );
    blockchainContent = blockchainContent.replace(
        /parseUnits\(amount, 18\)/g,
        "parseUnits(amount, 6)"
    );

    fs.writeFileSync(blockchainPath, blockchainContent);
    console.log("✅ Updated frontend blockchain.ts (6 decimals)\n");

    console.log("=".repeat(70));
    console.log("🎉 REDEPLOYMENT COMPLETE!");
    console.log("=".repeat(70));
    console.log("\n📋 New MockUSDY Address:", usdy.address);
    console.log("🔗 Explorer:", `https://sepolia.mantlescan.xyz/address/${usdy.address}`);
    console.log("\n⚠️  IMPORTANT: Restart your frontend dev server!");
    console.log("   cd frontend && npm run dev");
    console.log("\n✅ MockUSDY now uses 6 decimals (matching KYCBridge limits)");
    console.log("🚀 You can now create invoices!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
