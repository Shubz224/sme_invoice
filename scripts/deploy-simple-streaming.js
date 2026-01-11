const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const { ethers } = hre;

    console.log("🔄 Deploying SimpleStreamingRepayment...\n");
    console.log("=".repeat(60));

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "MNT\n");

    // Existing contract addresses
    const addresses = {
        mockUSDY: "0x3602a2dd2709644CceccE92B610cAa43cB136ECe",
        invoiceNFT: "0xd7FF4B42d7Cb411b30D18eD4790247F8dae32c8a",
        manager: "0xb395b9ce7f86C1BF15d08d89518c0691f0be8118",
    };

    // Deploy SimpleStreamingRepayment
    console.log("📋 Deploying SimpleStreamingRepayment...");
    const SimpleStreamingRepayment = await ethers.getContractFactory("SimpleStreamingRepayment");
    const streaming = await SimpleStreamingRepayment.deploy(
        addresses.mockUSDY,
        addresses.invoiceNFT
    );
    await streaming.deployed();
    console.log("✅ SimpleStreamingRepayment deployed to:", streaming.address, "\n");

    // Set up permissions
    console.log("🔐 Setting up permissions...");

    // Authorize InvoiceNFT to mark invoices as paid
    const nft = await ethers.getContractAt("InvoiceNFT", addresses.invoiceNFT);
    await (await nft.setAuthorizedContract(streaming.address, true)).wait();
    console.log("✅ Authorized SimpleStreamingRepayment in InvoiceNFT");

    // Authorize Manager contract
    await (await streaming.setAuthorizedManager(addresses.manager, true)).wait();
    console.log("✅ Authorized Manager in SimpleStreamingRepayment");

    // Authorize deployer for testing
    await (await streaming.setAuthorizedManager(deployer.address, true)).wait();
    console.log("✅ Authorized deployer for testing\n");

    // Fund the contract with some USDY for testing
    console.log("💰 Funding contract with USDY...");
    const usdy = await ethers.getContractAt("MockUSDY", addresses.mockUSDY);
    const fundAmount = ethers.utils.parseEther("100000"); // 100k USDY

    await (await usdy.approve(streaming.address, fundAmount)).wait();
    await (await streaming.fundContract(fundAmount)).wait();

    const balance = await streaming.getBalance();
    console.log("✅ Contract funded with:", ethers.utils.formatEther(balance), "USDY\n");

    // Save deployment info
    const deploymentInfo = {
        network: "Mantle Sepolia",
        chainId: 5003,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        simpleStreamingRepayment: streaming.address,
        paymentToken: addresses.mockUSDY,
        invoiceNFT: addresses.invoiceNFT,
        manager: addresses.manager,
        initialFunding: ethers.utils.formatEther(fundAmount),
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    const filename = "simple-streaming-deployment.json";
    const filepath = path.join(deploymentsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

    console.log("=".repeat(60));
    console.log("✅ DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📋 New Contract:");
    console.log("   SimpleStreamingRepayment:", streaming.address);
    console.log("\n📄 Deployment info saved to:", filepath);

    console.log("\n📝 Next Steps:");
    console.log("   1. Update Manager contract to use new streaming address");
    console.log("   2. Test streaming flow");
    console.log("   3. Update frontend constants");
    console.log("\n" + "=".repeat(60) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
