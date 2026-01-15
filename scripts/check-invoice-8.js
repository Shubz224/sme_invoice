const hre = require("hardhat");

async function main() {
    console.log("\n🔍 Checking Invoice #8 Status...\n");

    const CONTRACTS = {
        manager: "0x1964150025024604A845F0f7b85814f6237F0f40",
        nft: "0x5AE9B42823982c09c082E6c0217d9A46a0b1D021",
        auction: "0xA41d285af4c736220f1e317a7f3b53A396CD4b7E",
        streaming: "0x1e1F4AAE6dC90c7AAD8aD9e2a5af7Ed3c9b2E9D2",
        usdy: "0xf5A8056C0957955A6Fe972c646e80475885939A2"
    };

    const invoiceId = 8;

    const nft = await hre.ethers.getContractAt("InvoiceNFT", CONTRACTS.nft);
    const auction = await hre.ethers.getContractAt("InvoiceAuction", CONTRACTS.auction);
    const streaming = await hre.ethers.getContractAt("SimpleStreamingRepayment", CONTRACTS.streaming);
    const usdy = await hre.ethers.getContractAt("MockUSDY", CONTRACTS.usdy);

    // Get invoice details
    const invoice = await nft.getInvoice(invoiceId);
    const auctionData = await auction.getAuction(invoiceId);

    console.log("📄 Invoice Details:");
    console.log("  Amount:", hre.ethers.utils.formatUnits(invoice.amount, 6), "USDY");
    console.log("  Issuer:", invoice.issuer);
    console.log("  Is Financed:", invoice.isFinanced);

    console.log("\n🔨 Auction Details:");
    console.log("  Highest Bid:", hre.ethers.utils.formatUnits(auctionData.highestBid, 6), "USDY");
    console.log("  Highest Bidder:", auctionData.highestBidder);
    console.log("  End Time:", new Date(auctionData.endTime.toNumber() * 1000).toLocaleString());
    console.log("  Settled:", auctionData.settled);

    // Check if auction has ended
    const now = Math.floor(Date.now() / 1000);
    const hasEnded = now > auctionData.endTime.toNumber();
    console.log("\n⏰ Auction Status:");
    console.log("  Has Ended:", hasEnded);

    // Check SME balance
    const smeBalance = await usdy.balanceOf(invoice.issuer);
    console.log("\n💰 SME USDY Balance:", hre.ethers.utils.formatUnits(smeBalance, 6), "USDY");

    // Check streaming contract balance for this invoice
    try {
        const streamBalance = await streaming.depositBalance(invoice.issuer, invoiceId);
        console.log("🌊 Deposited for Stream:", hre.ethers.utils.formatUnits(streamBalance, 6), "USDY");
    } catch (e) {
        console.log("🌊 No deposits for stream yet");
    }

    // Calculate required repayment amount
    const requiredAmount = invoice.amount; // Full invoice amount needs to be deposited
    console.log("\n📊 Required for Stream:", hre.ethers.utils.formatUnits(requiredAmount, 6), "USDY");

    console.log("\n⚠️  ISSUE: SME must deposit repayment funds BEFORE settling!");
    console.log("💡 Solution: Run deposit-repayment.js to fix this\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
