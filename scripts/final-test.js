const hre = require("hardhat");

async function main() {
    const userAddress = "0xE74686Fd89ACB480B3903724C367395d86ED4519";
    const managerAddress = "0xcd7B19520002039c39A8bF5F7706232B5E5C9F45";
    const usdyAddress = "0xf5A8056C0957955A6Fe972c646e80475885939A2"; // NEW
    const kycBridgeAddress = "0x3fD1A28087c69D922ef6FEFAe231b9226EE9F7a7";

    console.log("\n🧪 FINAL TEST - Invoice Creation");
    console.log("=".repeat(70));

    // Check USDY decimals
    const USDY = await hre.ethers.getContractFactory("MockUSDY");
    const usdy = USDY.attach(usdyAddress);
    const decimals = await usdy.decimals();
    console.log(`\n💵 USDY Token:`);
    console.log(`   Address: ${usdyAddress}`);
    console.log(`   Decimals: ${decimals} ${decimals === 6 ? '✅' : '❌ Should be 6!'}`);

    // Check KYC status and limits
    const KYCBridge = await hre.ethers.getContractFactory("KYCBridge");
    const kycBridge = KYCBridge.attach(kycBridgeAddress);

    const isValid = await kycBridge.isKYCValid(userAddress);
    const level = await kycBridge.getKYCLevel(userAddress);
    const maxAmount = await kycBridge.getMaxTransactionAmount(userAddress);

    console.log(`\n🔐 User KYC Status:`);
    console.log(`   Address: ${userAddress}`);
    console.log(`   Valid: ${isValid ? '✅ YES' : '❌ NO'}`);
    console.log(`   Level: ${level} (Enhanced)`);
    console.log(`   Max Amount: ${hre.ethers.utils.formatUnits(maxAmount, 6)} USDY`);

    // Test invoice creation parameters
    const invoiceAmount = hre.ethers.utils.parseUnits("1000", 6); // 1000 USDY with 6 decimals
    const dueDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
    const buyerId = "TEST";
    const documentURI = "TEST";
    const minPrice = hre.ethers.utils.parseUnits("920", 6); // 920 USDY
    const auctionDuration = 7 * 24 * 60 * 60;

    console.log(`\n📊 Test Invoice:`);
    console.log(`   Amount: ${hre.ethers.utils.formatUnits(invoiceAmount, 6)} USDY`);
    console.log(`   Amount (raw): ${invoiceAmount.toString()}`);
    console.log(`   Max Limit (raw): ${maxAmount.toString()}`);
    console.log(`   Within Limit: ${invoiceAmount.lte(maxAmount) ? '✅ YES' : '❌ NO'}`);

    // Check Manager
    const Manager = await hre.ethers.getContractFactory("InvoiceFinanceManager");
    const manager = Manager.attach(managerAddress);

    const managerKycBridge = await manager.kycBridge();
    console.log(`\n📋 Manager Contract:`);
    console.log(`   Address: ${managerAddress}`);
    console.log(`   KYCBridge: ${managerKycBridge}`);
    console.log(`   Matches: ${managerKycBridge === kycBridgeAddress ? '✅' : '❌'}`);

    // Try KYC verification
    console.log(`\n🔍 Testing KYC Verification...`);
    try {
        await kycBridge.callStatic.verifyTransaction(
            userAddress,
            invoiceAmount,
            1 // Basic level (required for invoice creation)
        );
        console.log(`   ✅ KYC verification PASSED!`);
    } catch (error) {
        console.log(`   ❌ KYC verification FAILED!`);
        console.log(`   Error: ${error.message}`);

        // Decode error
        if (error.errorName) {
            console.log(`   Error name: ${error.errorName}`);
        }
    }

    console.log("\n" + "=".repeat(70));
    console.log("🎯 VERDICT:");

    if (decimals === 6 && isValid && invoiceAmount.lte(maxAmount) && managerKycBridge === kycBridgeAddress) {
        console.log("✅✅✅ ALL CHECKS PASSED! Invoice creation should work! ✅✅✅");
    } else {
        console.log("❌ Some checks failed. Review the output above.");
    }
    console.log("=".repeat(70) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
