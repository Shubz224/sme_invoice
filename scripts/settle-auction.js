const hre = require("hardhat");

async function main() {
    const { ethers } = hre;

    // Get invoice ID from command line argument
    const invoiceId = process.argv[2] || "5"; // Default to invoice #5

    console.log("🔨 Settling Auction for Invoice #" + invoiceId + "\n");
    console.log("=".repeat(60));

    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address, "\n");

    // Contract addresses
    const auctionAddress = "0xa283729E2716aBbce86bdCa07ef28b800DC685C0";
    const nftAddress = "0xd7FF4B42d7Cb411b30D18eD4790247F8dae32c8a";

    const auction = await ethers.getContractAt("InvoiceAuction", auctionAddress);
    const nft = await ethers.getContractAt("InvoiceNFT", nftAddress);

    // Check auction status
    console.log("📋 Checking auction status...");
    const auctionInfo = await auction.auctions(invoiceId);

    const endTime = auctionInfo.endTime.toNumber();
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = endTime - now;

    console.log("   Highest bid:", ethers.utils.formatEther(auctionInfo.highestBid), "USDY");
    console.log("   Highest bidder:", auctionInfo.highestBidder);
    console.log("   Settled:", auctionInfo.settled);
    console.log("   End time:", new Date(endTime * 1000).toLocaleTimeString());
    console.log("   Current time:", new Date().toLocaleTimeString());

    if (timeLeft > 0) {
        console.log("\n⏰ Auction still active!");
        console.log("   Time remaining:", Math.floor(timeLeft / 60), "minutes", timeLeft % 60, "seconds");
        console.log("   Please wait until", new Date(endTime * 1000).toLocaleTimeString());
        return;
    }

    if (auctionInfo.settled) {
        console.log("\n✅ Auction already settled!");
        const owner = await nft.ownerOf(invoiceId);
        console.log("   NFT owner:", owner);
        return;
    }

    // Settle the auction
    console.log("\n🔨 Settling auction...");
    const tx = await auction.settleAuction(invoiceId);
    console.log("   Transaction sent:", tx.hash);

    await tx.wait();
    console.log("   ✅ Transaction confirmed!\n");

    // Check final state
    const newOwner = await nft.ownerOf(invoiceId);
    const invoice = await nft.getInvoice(invoiceId);
    const settledAuction = await auction.auctions(invoiceId);

    console.log("=".repeat(60));
    console.log("✅ AUCTION SETTLED!");
    console.log("=".repeat(60));
    console.log("\n📊 Final State:");
    console.log("   NFT transferred to:", newOwner);
    console.log("   Invoice financed:", invoice.isFinanced);
    console.log("   Auction settled:", settledAuction.settled);
    console.log("\n🎉 Complete flow validated!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Settlement failed:");
        console.error(error);
        process.exit(1);
    });
