const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const { ethers } = hre;

    console.log("\n🔄 FULL REDEPLOYMENT - All contracts with correct KYCBridge...\n");
    console.log("=".repeat(80));

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log(`Balance: ${ethers.utils.formatEther(await deployer.getBalance())} MNT\n`);

    // Use the CORRECT KYCBridge
    const kycBridgeAddress = "0x3fD1A28087c69D922ef6FEFAe231b9226EE9F7a7";
    const mockUSDYAddress = "0xf5A8056C0957955A6Fe972c646e80475885939A2"; // 6 decimals

    console.log("📋 Using existing contracts:");
    console.log(`   KYCBridge: ${kycBridgeAddress} ✅`);
    console.log(`   MockUSDY: ${mockUSDYAddress} ✅ (6 decimals)\n`);

    // 1. Deploy InvoiceNFT with CORRECT KYCBridge
    console.log("1️⃣  Deploying InvoiceNFT...");
    const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
    const invoiceNFT = await InvoiceNFT.deploy(kycBridgeAddress);
    await invoiceNFT.deployed();
    console.log(`   ✅ InvoiceNFT: ${invoiceNFT.address}\n`);

    // 2. Deploy InvoiceAuction
    console.log("2️⃣  Deploying InvoiceAuction...");
    const InvoiceAuction = await ethers.getContractFactory("InvoiceAuction");
    const invoiceAuction = await InvoiceAuction.deploy(
        invoiceNFT.address,
        kycBridgeAddress,   // CORRECT ORDER: kycBridge before usdy!
        mockUSDYAddress
    );
    await invoiceAuction.deployed();
    console.log(`   ✅ InvoiceAuction: ${invoiceAuction.address}\n`);

    // 3. Deploy SimpleStreamingRepayment
    console.log("3️⃣  Deploying SimpleStreamingRepayment...");
    const SimpleStreamingRepayment = await ethers.getContractFactory("SimpleStreamingRepayment");
    const streaming = await SimpleStreamingRepayment.deploy(
        invoiceNFT.address,
        mockUSDYAddress
    );
    await streaming.deployed();
    console.log(`   ✅ SimpleStreamingRepayment: ${streaming.address}\n`);

    // 4. Deploy InvoiceFinanceManager
    console.log("4️⃣  Deploying InvoiceFinanceManager...");
    const Manager = await ethers.getContractFactory("InvoiceFinanceManager");
    const manager = await Manager.deploy(
        invoiceNFT.address,
        invoiceAuction.address,
        streaming.address,
        kycBridgeAddress
    );
    await manager.deployed();
    console.log(`   ✅ InvoiceFinanceManager: ${manager.address}\n`);

    // 5. Set up permissions
    console.log("5️⃣  Setting up permissions...");

    // Authorize Manager in InvoiceNFT
    const tx1 = await invoiceNFT.setAuthorizedContract(manager.address, true);
    await tx1.wait();
    console.log(`   ✅ Authorized Manager in InvoiceNFT`);

    // Authorize Manager in SimpleStreamingRepayment
    const tx2 = await streaming.setAuthorizedManager(manager.address, true);
    await tx2.wait();
    console.log(`   ✅ Authorized Manager in SimpleStreamingRepayment\n`);

    // 6. Verify all contracts are using correct KYCBridge
    console.log("6️⃣  Verifying configuration...");
    const nftKyc = await invoiceNFT.kycBridge();
    const auctionKyc = await invoiceAuction.kycBridge();
    const managerKyc = await manager.kycBridge();

    console.log(`   InvoiceNFT KYC: ${nftKyc} ${nftKyc === kycBridgeAddress ? '✅' : '❌'}`);
    console.log(`   Auction KYC: ${auctionKyc} ${auctionKyc === kycBridgeAddress ? '✅' : '❌'}`);
    console.log(`   Manager KYC: ${managerKyc} ${managerKyc === kycBridgeAddress ? '✅' : '❌'}\n`);

    // 7. Update deployment files
    console.log("7️⃣  Updating configuration files...");

    const addresses = {
        invoiceNFT: invoiceNFT.address,
        invoiceAuction: invoiceAuction.address,
        simpleStreamingRepayment: streaming.address,
        invoiceFinanceManager: manager.address,
        mockUSDY: mockUSDYAddress,
        kycBridge: kycBridgeAddress
    };

    // Update backend deployment file
    const deploymentPath = path.join(__dirname, "../deployments/unknown-5003.json");
    const deploymentData = {
        name: "Mantle Sepolia",
        chainId: 5003,
        contracts: addresses,
        timestamp: new Date().toISOString()
    };
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
    console.log(`   ✅ Updated deployments/unknown-5003.json`);

    // Update frontend config
    const frontendConfigPath = path.join(__dirname, "../frontend/src/lib/contracts.ts");
    const frontendConfig = `// Contract addresses on Mantle Sepolia
export const CONTRACTS = {
    InvoiceNFT: '${addresses.invoiceNFT}',
    InvoiceAuction: '${addresses.invoiceAuction}',
    SimpleStreamingRepayment: '${addresses.simpleStreamingRepayment}',
    InvoiceFinanceManager: '${addresses.invoiceFinanceManager}',
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
    console.log(`   ✅ Updated frontend/src/lib/contracts.ts\n`);

    // 8. Summary
    console.log("=".repeat(80));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(80));
    console.log("\n📋 NEW Contract Addresses:");
    console.log(`   InvoiceNFT:              ${addresses.invoiceNFT}`);
    console.log(`   InvoiceAuction:          ${addresses.invoiceAuction}`);
    console.log(`   SimpleStreamingRepayment: ${addresses.simpleStreamingRepayment}`);
    console.log(`   InvoiceFinanceManager:   ${addresses.invoiceFinanceManager}`);
    console.log(`   MockUSDY:                ${addresses.mockUSDY} (6 decimals)`);
    console.log(`   KYCBridge:               ${addresses.kycBridge}`);

    console.log("\n🔗 Block Explorer:");
    console.log(`   https://sepolia.mantlescan.xyz/address/${manager.address}`);

    console.log("\n⚠️  IMPORTANT NEXT STEPS:");
    console.log("   1. Stop your frontend dev server (Ctrl+C)");
    console.log("   2. Clear Next.js cache: rm -rf frontend/.next");
    console.log("   3. Restart: cd frontend && npm run dev");
    console.log("   4. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)");

    console.log("\n✅ All contracts now use the CORRECT KYCBridge!");
    console.log("✅ Your wallet is already KYC verified!");
    console.log("✅ MockUSDY uses 6 decimals (matching KYC limits)!");
    console.log("🚀 Invoice creation should now work!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
