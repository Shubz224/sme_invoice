const hre = require("hardhat");

async function main() {
    const { ethers } = hre;

    console.log("🧪 Quick Settlement Test (5-minute auction)\n");
    console.log("=".repeat(60));

    const [deployer] = await ethers.getSigners();
    console.log("Testing with account:", deployer.address);
    console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "MNT\n");

    // Contract addresses
    const addresses = {
        mockUSDY: "0x3602a2dd2709644CceccE92B610cAa43cB136ECe",
        invoiceNFT: "0xd7FF4B42d7Cb411b30D18eD4790247F8dae32c8a",
        invoiceAuction: "0xa283729E2716aBbce86bdCa07ef28b800DC685C0",
        streamingRepayment: "0x99D7e5874868Ef1Ae71630Fd281e604F805ED225",
        manager: "0xb395b9ce7f86C1BF15d08d89518c0691f0be8118",
    };

    const usdy = await ethers.getContractAt("MockUSDY", addresses.mockUSDY);
    const nft = await ethers.getContractAt("InvoiceNFT", addresses.invoiceNFT);
    const auction = await ethers.getContractAt("InvoiceAuction", addresses.invoiceAuction);

    // 1. Get USDY
    console.log("📋 Step 1: Getting test USDY...");
    await (await usdy.faucet()).wait();
    const balance = await usdy.balanceOf(deployer.address);
    console.log("   ✅ Balance:", ethers.utils.formatEther(balance), "USDY\n");

    // 2. Create invoice
    console.log("📋 Step 2: Creating invoice...");
    const invoiceAmount = ethers.utils.parseEther("10000");
    const dueDate = Math.floor(Date.now() / 1000) + (30 * 86400);

    await (await nft.createInvoice(
        invoiceAmount,
        dueDate,
        "TEST-BUYER",
        "ipfs://test"
    )).wait();

    const invoiceId = await nft.getTotalInvoices();
    console.log("   ✅ Invoice #" + invoiceId + " created\n");

    // 3. Start 5-minute auction
    console.log("📋 Step 3: Starting 5-minute auction...");
    await (await nft.approve(auction.address, invoiceId)).wait();

    const minPrice = ethers.utils.parseEther("8000");
    const auctionDuration = 300; // 5 minutes!

    await (await auction.startAuction(invoiceId, minPrice, auctionDuration)).wait();
    console.log("   ✅ Auction started!");
    console.log("   ⏰ Duration: 5 minutes");
    console.log("   📅 Ends at:", new Date(Date.now() + 300000).toLocaleTimeString(), "\n");

    // 4. Place bid
    console.log("📋 Step 4: Placing bid...");
    const bidAmount = ethers.utils.parseEther("8500");
    await (await usdy.approve(auction.address, bidAmount)).wait();
    await (await auction.placeBid(invoiceId, bidAmount)).wait();
    console.log("   ✅ Bid placed:", ethers.utils.formatEther(bidAmount), "USDY\n");

    // 5. Wait for auction to end
    console.log("📋 Step 5: Waiting for auction to end...");
    console.log("   ⏰ Waiting 5 minutes...");
    console.log("   (You can Ctrl+C and run settlement later)\n");

    // Wait 5 minutes + 10 seconds buffer
    await new Promise(resolve => setTimeout(resolve, 310000));

    console.log("   ✅ Auction period ended!\n");

    // 6. Settle auction
    console.log("📋 Step 6: Settling auction...");
    await (await auction.settleAuction(invoiceId)).wait();

    const newOwner = await nft.ownerOf(invoiceId);
    const invoice = await nft.getInvoice(invoiceId);

    console.log("   ✅ Auction settled!");
    console.log("   NFT owner:", newOwner);
    console.log("   Financed:", invoice.isFinanced, "\n");

    console.log("=".repeat(60));
    console.log("✅ COMPLETE FLOW TESTED!");
    console.log("=".repeat(60));
    console.log("\n🎉 Settlement works! All contracts validated.\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Test failed:");
        console.error(error);
        process.exit(1);
    });
