const hre = require("hardhat");

async function main() {
    console.log("\n💰 Depositing Repayment Funds for Invoice #8...\n");

    const CONTRACTS = {
        streaming: "0x1e1F4AAE6dC90c7AAD8aD9e2a5af7Ed3c9b2E9D2",
        usdy: "0xf5A8056C0957955A6Fe972c646e80475885939A2",
        nft: "0x5AE9B42823982c09c082E6c0217d9A46a0b1D021"
    };

    const invoiceId = 8;

    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Wallet:", deployer.address);

    const streaming = await hre.ethers.getContractAt("SimpleStreamingRepayment", CONTRACTS.streaming);
    const usdy = await hre.ethers.getContractAt("MockUSDY", CONTRACTS.usdy);
    const nft = await hre.ethers.getContractAt("InvoiceNFT", CONTRACTS.nft);

    // Get invoice amount
    const invoice = await nft.getInvoice(invoiceId);
    const amount = invoice.amount;

    console.log("📄 Invoice Amount:", hre.ethers.utils.formatUnits(amount, 6), "USDY");

    // Check balance
    const balance = await usdy.balanceOf(deployer.address);
    console.log("💵 Your Balance:", hre.ethers.utils.formatUnits(balance, 6), "USDY");

    if (balance.lt(amount)) {
        console.log("\n⚠️  Insufficient balance! Minting USDY...");
        const mintTx = await usdy.mint(deployer.address, amount);
        await mintTx.wait();
        console.log("✅ Minted USDY");
    }

    // Approve streaming contract
    console.log("\n📝 Approving USDY...");
    const approveTx = await usdy.approve(CONTRACTS.streaming, amount);
    await approveTx.wait();
    console.log("✅ USDY approved");

    // Deposit funds
    console.log("\n💰 Depositing repayment funds...");
    const depositTx = await streaming.depositRepaymentFunds(invoiceId, amount);
    console.log("⏳ TX:", depositTx.hash);
    await depositTx.wait();

    console.log("\n✅ Repayment funds deposited!");
    console.log("🎉 Now you can settle the auction!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error.message);
        process.exit(1);
    });
