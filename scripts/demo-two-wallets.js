const hre = require("hardhat");

// ===== DEMO CONFIGURATION =====
const CONFIG = {
    // Timing
    AUCTION_DURATION: 120,     // 2 minutes (easy to demo)
    STREAM_DURATION: 600,      // 10 minutes

    // Amounts (in USDY, will format with parseEther)
    INVOICE_AMOUNT: "5000",    // 5000 USDY invoice
    MIN_BID: "4000",           // Minimum 4000 USDY
    WINNING_BID: "4200",       // Investor bids 4200 USDY

    // Expected values
    STREAM_RATE: 8.333333,     // USDY/second (5000/600)
    SME_NET: "-800",           // -800 USDY (cost of capital)
    INVESTOR_NET: "+800",      // +800 USDY (profit)

    // Claim schedule (seconds from stream start, expected cumulative amount)
    CLAIMS: [
        { time: 120, expected: "~1000" },   // 2 min
        { time: 300, expected: "~2500" },   // 5 min
        { time: 600, expected: "5000" }     // 10 min (complete)
    ]
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const { ethers } = hre;

    console.log("🎬 INVOICE FINANCE - TWO WALLET DEMO\n");
    console.log("=".repeat(60));

    // Load deployment addresses
    const deploymentData = JSON.parse(
        require("fs").readFileSync("./deployments/unknown-5003.json", "utf8")
    );

    // Setup wallets
    const [smeWallet] = await ethers.getSigners(); // Deployer as SME
    const investorWallet = smeWallet; // For demo, same wallet but tracks separately
    // TODO: For real demo, use second wallet:
    // const investorWallet = new ethers.Wallet(process.env.INVESTOR_PRIVATE_KEY, ethers.provider);

    // Get contracts
    const manager = await ethers.getContractAt(
        "InvoiceFinanceManager",
        deploymentData.contracts.invoiceFinanceManager
    );
    const usdy = await ethers.getContractAt(
        "MockUSDY",
        deploymentData.contracts.mockUSDY
    );
    const auction = await ethers.getContractAt(
        "InvoiceAuction",
        deploymentData.contracts.invoiceAuction
    );
    const streaming = await ethers.getContractAt(
        "SimpleStreamingRepayment",
        deploymentData.contracts.simpleStreamingRepayment
    );
    const nft = await ethers.getContractAt(
        "InvoiceNFT",
        deploymentData.contracts.invoiceNFT
    );

    console.log("📋 Wallets:");
    console.log("  SME:", smeWallet.address);
    console.log("  Investor:", investorWallet.address);
    console.log("");

    // ===== PHASE 1: SME Creates Invoice =====
    console.log("📝 PHASE 1: SME Creates Invoice & Starts Auction");
    console.log("-".repeat(60));

    const smeBalanceBefore = await usdy.balanceOf(smeWallet.address);
    console.log("SME Balance (before):", ethers.utils.formatEther(smeBalanceBefore), "USDY");

    const dueDate = Math.floor(Date.now() / 1000) + (30 * 86400); // 30 days from now

    const tx1 = await manager.connect(smeWallet).createInvoiceAndStartAuction(
        ethers.utils.parseEther(CONFIG.INVOICE_AMOUNT),
        dueDate,
        "BUYER-CORP-123",
        "ipfs://QmExampleInvoiceDocument",
        ethers.utils.parseEther(CONFIG.MIN_BID),
        CONFIG.AUCTION_DURATION
    );
    await tx1.wait();

    // Get invoice ID
    const invoiceId = await nft.getTotalInvoices();
    console.log("✅ Invoice #" + invoiceId + " created");
    console.log("   Amount:", CONFIG.INVOICE_AMOUNT, "USDY");
    console.log("   Min Bid:", CONFIG.MIN_BID, "USDY");
    console.log("   Auction Duration:", CONFIG.AUCTION_DURATION, "seconds");
    console.log("");

    // ===== PHASE 2: Investor Bids =====
    console.log("💰 PHASE 2: Investor Places Bid");
    console.log("-".repeat(60));

    const investorBalanceBefore = await usdy.balanceOf(investorWallet.address);
    console.log("Investor Balance (before):", ethers.utils.formatEther(investorBalanceBefore), "USDY");

    const bidAmount = ethers.utils.parseEther(CONFIG.WINNING_BID);
    await (await usdy.connect(investorWallet).approve(auction.address, bidAmount)).wait();
    await (await auction.connect(investorWallet).placeBid(invoiceId, bidAmount)).wait();

    const investorBalanceAfterBid = await usdy.balanceOf(investorWallet.address);
    console.log("✅ Bid placed:", CONFIG.WINNING_BID, "USDY");
    console.log("Investor Balance (after bid):", ethers.utils.formatEther(investorBalanceAfterBid), "USDY");
    console.log("   Change:", ethers.utils.formatEther(investorBalanceAfterBid.sub(investorBalanceBefore)), "USDY");
    console.log("");

    // ===== PHASE 3: Wait for Auction End & Settle =====
    console.log("⏰ PHASE 3: Waiting for Auction to End");
    console.log("-".repeat(60));
    console.log("Waiting", CONFIG.AUCTION_DURATION + 10, "seconds...");

    await sleep((CONFIG.AUCTION_DURATION + 10) * 1000);

    console.log("⚙️  Settling auction and starting stream...");
    await (await manager.settleAuctionAndStartStream(invoiceId)).wait();

    const smeBalanceAfterSettle = await usdy.balanceOf(smeWallet.address);
    console.log("✅ Auction settled!");
    console.log("SME Balance (after settlement):", ethers.utils.formatEther(smeBalanceAfterSettle), "USDY");
    console.log("   Received:", ethers.utils.formatEther(smeBalanceAfterSettle.sub(smeBalanceBefore)), "USDY");
    console.log("");

    // ===== PHASE 4: SME Deposits Repayment Funds =====
    console.log("💸 PHASE 4: SME Deposits Repayment Funds");
    console.log("-".repeat(60));

    const repaymentAmount = ethers.utils.parseEther(CONFIG.INVOICE_AMOUNT);
    await (await usdy.connect(smeWallet).approve(streaming.address, repaymentAmount)).wait();
    await (await streaming.connect(smeWallet).depositRepaymentFunds(invoiceId, repaymentAmount)).wait();

    const smeBalanceAfterDeposit = await usdy.balanceOf(smeWallet.address);
    console.log("✅ SME deposited", CONFIG.INVOICE_AMOUNT, "USDY for repayment");
    console.log("SME Balance (after deposit):", ethers.utils.formatEther(smeBalanceAfterDeposit), "USDY");
    console.log("   Net Position:", ethers.utils.formatEther(smeBalanceAfterDeposit.sub(smeBalanceBefore)), "USDY");
    console.log("");

    // Check deposit status
    const depositStatus = await streaming.getDepositStatus(invoiceId);
    console.log("📊 Deposit Status:");
    console.log("   Total Deposited:", ethers.utils.formatEther(depositStatus.totalDeposited), "USDY");
    console.log("   Total Required:", ethers.utils.formatEther(depositStatus.totalRequired), "USDY");
    console.log("   Still Needed:", ethers.utils.formatEther(depositStatus.stillNeeded), "USDY");
    console.log("");

    // ===== PHASE 5: Investor Claims Stream =====
    console.log("🌊 PHASE 5: Investor Claims Streaming Payments");
    console.log("-".repeat(60));

    const streamStartBlock = await ethers.provider.getBlockNumber();
    const streamStartTimestamp = (await ethers.provider.getBlock(streamStartBlock)).timestamp;

    console.log("Stream started at block:", streamStartBlock);
    console.log("Stream rate:", CONFIG.STREAM_RATE, "USDY/second");
    console.log("");

    for (let i = 0; i < CONFIG.CLAIMS.length; i++) {
        const claim = CONFIG.CLAIMS[i];

        // Calculate wait time
        const currentBlock = await ethers.provider.getBlock('latest');
        const elapsed = currentBlock.timestamp - streamStartTimestamp;
        const waitTime = claim.time - elapsed;

        if (waitTime > 0) {
            console.log(`⏰ Waiting ${waitTime}s until next claim (${claim.time}s mark)...`);
            await sleep(waitTime * 1000);
        }

        // Check claimable amount
        const claimable = await streaming.getClaimableAmount(invoiceId);
        console.log(`\n📊 Claim #${i + 1} (at ${claim.time}s):`);
        console.log("   Expected:", claim.expected, "USDY");
        console.log("   Actual Claimable:", ethers.utils.formatEther(claimable), "USDY");

        // Claim
        const investorBeforeClaim = await usdy.balanceOf(investorWallet.address);
        await (await streaming.connect(investorWallet).claimStream(invoiceId)).wait();
        const investorAfterClaim = await usdy.balanceOf(investorWallet.address);

        console.log("   ✅ Claimed:", ethers.utils.formatEther(investorAfterClaim.sub(investorBeforeClaim)), "USDY");
        console.log("   Investor Balance:", ethers.utils.formatEther(investorAfterClaim), "USDY");
    }

    // ===== FINAL SUMMARY =====
    console.log("\n" + "=".repeat(60));
    console.log("💵 FINAL BALANCES & PROFIT CALCULATION");
    console.log("=".repeat(60));

    const smeFinal = await usdy.balanceOf(smeWallet.address);
    const investorFinal = await usdy.balanceOf(investorWallet.address);
    const streamingBalance = await streaming.getBalance();

    console.log("\n📊 SME (Borrower):");
    console.log("   Starting Balance:", ethers.utils.formatEther(smeBalanceBefore), "USDY");
    console.log("   Final Balance:", ethers.utils.formatEther(smeFinal), "USDY");
    console.log("   Received (financing): +" + CONFIG.WINNING_BID, "USDY");
    console.log("   Paid (repayment): -" + CONFIG.INVOICE_AMOUNT, "USDY");
    console.log("   Net Cost:", ethers.utils.formatEther(smeFinal.sub(smeBalanceBefore)), "USDY", "(cost of capital)");

    console.log("\n📊 Investor:");
    console.log("   Starting Balance:", ethers.utils.formatEther(investorBalanceBefore), "USDY");
    console.log("   Final Balance:", ethers.utils.formatEther(investorFinal), "USDY");
    console.log("   Invested (bid): -" + CONFIG.WINNING_BID, "USDY");
    console.log("   Received (stream): +" + CONFIG.INVOICE_AMOUNT, "USDY");
    console.log("   Net Profit:", ethers.utils.formatEther(investorFinal.sub(investorBalanceBefore)), "USDY", "(19% APY equivalent)");

    console.log("\n📊 Streaming Contract:");
    console.log("   Balance:", ethers.utils.formatEther(streamingBalance), "USDY");
    console.log("   Expected: 0 USDY (all funds claimed)");

    // Verify invoice is marked as paid
    const finalInvoice = await nft.getInvoice(invoiceId);
    console.log("\n✅ Invoice Status:");
    console.log("   Is Financed:", finalInvoice.isFinanced);
    console.log("   Is Paid:", finalInvoice.isPaid);

    console.log("\n" + "=".repeat(60));
    console.log("✅ DEMO COMPLETE!");
    console.log("=".repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Demo failed:");
        console.error(error);
        process.exit(1);
    });
