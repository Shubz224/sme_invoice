const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying KYCBridge contract...");

    // Deploy KYCBridge
    const KYCBridge = await hre.ethers.getContractFactory("KYCBridge");
    const kycBridge = await KYCBridge.deploy();
    await kycBridge.deployed();

    const kycBridgeAddress = kycBridge.address;
    console.log("✅ KYCBridge deployed to:", kycBridgeAddress);

    // Save deployment info
    const fs = require('fs');
    const deploymentPath = './deployments/kyc-bridge-deployment.json';

    const deployment = {
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        kycBridge: kycBridgeAddress,
        deployedAt: new Date().toISOString(),
    };

    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    console.log("📝 Deployment info saved to:", deploymentPath);

    console.log("\n🎉 Deployment complete!");
    console.log("\nNext steps:");
    console.log("1. Update InvoiceFinanceManager with new KYCBridge address");
    console.log("2. Update InvoiceAuction with new KYCBridge address");
    console.log("3. Copy ABI to frontend");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
