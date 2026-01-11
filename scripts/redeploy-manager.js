const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const { ethers } = hre;

    console.log("🔄 Redeploying InvoiceFinanceManager with SimpleStreamingRepayment...\n");
    console.log("=".repeat(60));

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Addresses from previous deployments
    const addresses = {
        kycBridge: "0x37d1f8f096aD84c052f236933f528f8b9ED80299",
        mockUSDY: "0x3602a2dd2709644CceccE92B610cAa43cB136ECe",
        invoiceNFT: "0xd7FF4B42d7Cb411b30D18eD4790247F8dae32c8a",
        invoiceAuction: "0xa283729E2716aBbce86bdCa07ef28b800DC685C0",
        simpleStreaming: "0x43b1bF479aD1a6a77B6Ad47dd0db79bbD5670C91"
    };

    // Deploy InvoiceFinanceManager
    console.log("📋 Deploying InvoiceFinanceManager...");
    const Manager = await ethers.getContractFactory("InvoiceFinanceManager");
    const manager = await Manager.deploy(
        addresses.invoiceNFT,
        addresses.invoiceAuction,
        addresses.simpleStreaming,
        addresses.kycBridge
    );
    await manager.deployed();
    console.log("✅ InvoiceFinanceManager redeployed to:", manager.address, "\n");

    // Set up permissions
    console.log("🔐 Setting up permissions...");

    // Authorize Manager in InvoiceNFT
    const nft = await ethers.getContractAt("InvoiceNFT", addresses.invoiceNFT);
    await (await nft.setAuthorizedContract(manager.address, true)).wait();
    console.log("✅ Authorized Manager in InvoiceNFT");

    // Authorize Manager in SimpleStreamingRepayment
    const streaming = await ethers.getContractAt("SimpleStreamingRepayment", addresses.simpleStreaming);
    await (await streaming.setAuthorizedManager(manager.address, true)).wait();
    console.log("✅ Authorized Manager in SimpleStreamingRepayment");

    // Update deployment info
    const deploymentPath = path.join(__dirname, "../deployments/unknown-5003.json");
    let deploymentData = {};
    if (fs.existsSync(deploymentPath)) {
        deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    }

    deploymentData.contracts.invoiceFinanceManager = manager.address;
    deploymentData.contracts.simpleStreamingRepayment = addresses.simpleStreaming;
    deploymentData.timestamp = new Date().toISOString();

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
    console.log("✅ Updated deployment info in unknown-5003.json");

    console.log("=".repeat(60));
    console.log("🎉 REDEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📋 New Manager Address:", manager.address);
    console.log("\n🚀 Ready for testing the full flow!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Redeployment failed:");
        console.error(error);
        process.exit(1);
    });
