const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const { ethers } = hre;

    console.log("🚀 CLEAN REDEPLOYMENT OF CORE STACK\n");
    console.log("=".repeat(60));

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Constants
    const BRIDGE_ADDR = "0x37d1f8f096aD84c052f236933f528f8b9ED80299";
    const USDY_ADDR = "0x3602a2dd2709644CceccE92B610cAa43cB136ECe";

    // 1. Deploy InvoiceNFT
    console.log("\n📋 Deploying InvoiceNFT...");
    const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
    const nft = await InvoiceNFT.deploy(BRIDGE_ADDR);
    await nft.deployed();
    console.log("✅ InvoiceNFT deployed to:", nft.address);

    // 2. Deploy InvoiceAuction
    console.log("\n📋 Deploying InvoiceAuction...");
    const InvoiceAuction = await ethers.getContractFactory("InvoiceAuction");
    const auction = await InvoiceAuction.deploy(nft.address, BRIDGE_ADDR, USDY_ADDR);
    await auction.deployed();
    console.log("✅ InvoiceAuction deployed to:", auction.address);

    // 3. Deploy SimpleStreamingRepayment
    console.log("\n📋 Deploying SimpleStreamingRepayment...");
    const SimpleStreaming = await ethers.getContractFactory("SimpleStreamingRepayment");
    const streaming = await SimpleStreaming.deploy(USDY_ADDR, nft.address);
    await streaming.deployed();
    console.log("✅ SimpleStreamingRepayment deployed to:", streaming.address);

    // 4. Deploy InvoiceFinanceManager
    console.log("\n📋 Deploying InvoiceFinanceManager...");
    const Manager = await ethers.getContractFactory("InvoiceFinanceManager");
    const manager = await Manager.deploy(nft.address, auction.address, streaming.address, BRIDGE_ADDR);
    await manager.deployed();
    console.log("✅ InvoiceFinanceManager deployed to:", manager.address);

    // --- SET UP PERMISSIONS ---
    console.log("\n🔐 Setting up permissions...");

    // Authorize contracts in InvoiceNFT
    await (await nft.setAuthorizedContract(auction.address, true)).wait();
    await (await nft.setAuthorizedContract(streaming.address, true)).wait();
    await (await nft.setAuthorizedContract(manager.address, true)).wait();
    console.log("✅ Authorized contracts in InvoiceNFT");

    // Authorize manager in SimpleStreaming
    await (await streaming.setAuthorizedManager(manager.address, true)).wait();
    console.log("✅ Authorized manager in SimpleStreamingRepayment");

    // KYC the manager and deployer
    const kycBridge = await ethers.getContractAt("KYCBridge", BRIDGE_ADDR);
    await (await kycBridge.setKYC(manager.address, true)).wait();
    await (await kycBridge.setKYC(deployer.address, true)).wait();
    console.log("✅ Manager and Deployer KYC'd");

    // Fund streaming contract
    const usdy = await ethers.getContractAt("MockUSDY", USDY_ADDR);
    const fundAmount = ethers.utils.parseEther("100000");
    await (await usdy.approve(streaming.address, fundAmount)).wait();
    await (await streaming.fundContract(fundAmount)).wait();
    console.log("✅ Streaming contract funded with 100k USDY");

    // Save updated deployment info
    const deploymentData = {
        network: "Mantle Sepolia",
        chainId: 5003,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            kycBridge: BRIDGE_ADDR,
            mockUSDY: USDY_ADDR,
            invoiceNFT: nft.address,
            invoiceAuction: auction.address,
            simpleStreamingRepayment: streaming.address,
            invoiceFinanceManager: manager.address
        }
    };

    fs.writeFileSync(
        path.join(__dirname, "../deployments/unknown-5003.json"),
        JSON.stringify(deploymentData, null, 2)
    );

    console.log("\n" + "=".repeat(60));
    console.log("🎉 ALL CORE CONTRACTS REDEPLOYED AND LINKED!");
    console.log("=".repeat(60) + "\n");
}

main().catch(console.error);
