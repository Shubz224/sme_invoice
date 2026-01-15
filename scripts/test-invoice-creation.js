const hre = require("hardhat");

async function main() {
    const userAddress = "0xE74686Fd89ACB480B3903724C367395d86ED4519";
    const managerAddress = "0xcd7B19520002039c39A8bF5F7706232B5E5C9F45"; // NEW!

    console.log("\n🧪 Testing Invoice Creation...");
    console.log("=".repeat(60));

    const Manager = await hre.ethers.getContractFactory("InvoiceFinanceManager");
    const manager = Manager.attach(managerAddress);

    // Get contract references
    const kycBridgeAddr = await manager.kycBridge();
    console.log(`📋 Manager KYCBridge: ${kycBridgeAddr}`);

    // Check KYC status
    const KYCBridge = await hre.ethers.getContractFactory("KYCBridge");
    const kycBridge = KYCBridge.attach(kycBridgeAddr);

    const isValid = await kycBridge.isKYCValid(userAddress);
    const level = await kycBridge.getKYCLevel(userAddress);
    const maxAmount = await kycBridge.getMaxTransactionAmount(userAddress);

    console.log(`\n🔐 User KYC Status:`);
    console.log(`   Address: ${userAddress}`);
    console.log(`   Valid: ${isValid ? '✅ YES' : '❌ NO'}`);
    console.log(`   Level: ${level} (0=None, 1=Basic, 2=Standard, 3=Enhanced, 4=Institutional)`);
    console.log(`   Max Amount: $${hre.ethers.utils.formatUnits(maxAmount, 6)} USDY`);

    if (!isValid) {
        console.log("\n❌ User is NOT KYC verified!");
        return;
    }

    // Test parameters (same as frontend attempt)
    const amount = hre.ethers.utils.parseUnits("1000", 6); // 1000 USDY
    const dueDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
    const buyerId = "test";
    const documentURI = "testtest";
    const minPrice = hre.ethers.utils.parseUnits("920", 6); // 920 USDY (8% discount)
    const auctionDuration = 7 * 24 * 60 * 60; // 7 days

    console.log(`\n📊 Test Parameters:`);
    console.log(`   Amount: ${hre.ethers.utils.formatUnits(amount, 6)} USDY`);
    console.log(`   Due Date: ${new Date(dueDate * 1000).toLocaleDateString()}`);
    console.log(`   Min Price: ${hre.ethers.utils.formatUnits(minPrice, 6)} USDY`);
    console.log(`   Auction Duration: ${auctionDuration / (24 * 60 * 60)} days`);

    // Try to estimate gas (this will show if the transaction would succeed)
    console.log(`\n⚙️  Testing transaction...`);
    try {
        const gasEstimate = await manager.estimateGas.createInvoiceAndStartAuction(
            amount,
            dueDate,
            buyerId,
            documentURI,
            minPrice,
            auctionDuration,
            { from: userAddress }
        );

        console.log(`✅ SUCCESS! Transaction would work!`);
        console.log(`   Estimated gas: ${gasEstimate.toString()}`);
        console.log(`\n🎉 You can now create invoices in the frontend!`);
    } catch (error) {
        console.log(`❌ Transaction would FAIL!`);
        console.log(`   Error: ${error.reason || error.message}`);

        if (error.error && error.error.data) {
            console.log(`\n   Raw error: ${error.error.message}`);
        }
    }

    console.log("=".repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
