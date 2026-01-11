const hre = require("hardhat");

async function main() {
    const { ethers } = hre;

    console.log("🧪 Testing Custom Streaming Flow via Manager\n");
    console.log("=".repeat(60));

    const [deployer] = await ethers.getSigners();
    console.log("Testing with account:", deployer.address);

    // Pull the latest addresses from the deployment file
    const deploymentPath = "./deployments/unknown-5003.json";
    const deploymentData = JSON.parse(require("fs").readFileSync(deploymentPath, "utf8"));

    const addresses = {
        mockUSDY: deploymentData.contracts.mockUSDY,
        invoiceNFT: deploymentData.contracts.invoiceNFT,
        invoiceAuction: deploymentData.contracts.invoiceAuction,
        simpleStreaming: deploymentData.contracts.simpleStreamingRepayment,
        manager: deploymentData.contracts.invoiceFinanceManager
    };

    console.log("Using addresses from deployment:", addresses);

    const manager = await ethers.getContractAt("InvoiceFinanceManager", addresses.manager);
    const usdy = await ethers.getContractAt("MockUSDY", addresses.mockUSDY);
    const nft = await ethers.getContractAt("InvoiceNFT", addresses.invoiceNFT);
    const auction = await ethers.getContractAt("InvoiceAuction", addresses.invoiceAuction);
    const streaming = await ethers.getContractAt("SimpleStreamingRepayment", addresses.simpleStreaming);

    // 1. Create Invoice and Start Auction (Single Transaction)
    console.log("\n📋 Step 1: Create Invoice & Start Auction via Manager...");
    const invoiceAmount = ethers.utils.parseEther("5000");
    const dueDate = Math.floor(Date.now() / 1000) + (30 * 86400);
    const minPrice = ethers.utils.parseEther("4000");
    const auctionDuration = 60; // 1 minute for quick test

    const createTx = await manager.createInvoiceAndStartAuction(
        invoiceAmount,
        dueDate,
        "CUSTOM-STREAM-TEST",
        "ipfs://custom-test",
        minPrice,
        auctionDuration
    );
    const createReceipt = await createTx.wait();

    const invoiceId = await nft.getTotalInvoices();
    console.log("   ✅ Created Invoice #" + invoiceId);

    // 2. Place Bid
    console.log("\n📋 Step 2: Placing bid...");
    const bidAmount = ethers.utils.parseEther("4200");
    await (await usdy.approve(addresses.invoiceAuction, bidAmount)).wait();
    await (await auction.placeBid(invoiceId, bidAmount)).wait();
    console.log("   ✅ Bid of 4200 USDY placed");

    // 3. Wait for Auction to end
    console.log("\n📋 Step 3: Waiting for auction to end (60s)...");
    await new Promise(resolve => setTimeout(resolve, 65000));
    console.log("   ✅ Auction period ended");

    // 4. Settle Auction and Start Stream (Single Transaction)
    console.log("\n📋 Step 4: Settle Auction & Start Stream via Manager...");
    const repaymentAmount = ethers.utils.parseEther("5000"); // Repaying face value
    const streamDuration = 300; // 5 minutes stream

    const settleTx = await manager.settleAuctionAndStartStream(
        invoiceId,
        repaymentAmount,
        streamDuration
    );
    await settleTx.wait();
    console.log("   ✅ Auction settled and stream started!");

    // 5. Check Initial Stream State
    console.log("\n📋 Step 5: Checking stream state...");
    const streamInfo = await streaming.getStreamInfo(invoiceId);
    console.log("   Stream Active:", streamInfo.active);
    console.log("   Investor:", streamInfo.investor);
    console.log("   Amount per second:", ethers.utils.formatEther(streamInfo.amountPerSecond), "USDY/sec");

    // 6. Wait a bit and check streamed amount
    console.log("\n📋 Step 6: Waiting 15s to check progress...");
    await new Promise(resolve => setTimeout(resolve, 15000));

    const streamed = await streaming.getStreamedAmount(invoiceId);
    console.log("   ✅ Streamed Amount after 15s:", ethers.utils.formatEther(streamed), "USDY");

    console.log("\n" + "=".repeat(60));
    console.log("✅ FULL CUSTOM STREAMING FLOW VALIDATED!");
    console.log("=".repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Test failed:");
        console.error(error);
        process.exit(1);
    });
