const hre = require("hardhat");

async function main() {
    const userAddress = "0xE74686Fd89ACB480B3903724C367395d86ED4519";

    // NEW addresses
    const addresses = {
        invoiceNFT: "0x5AE9B42823982c09c082E6c0217d9A46a0b1D021",
        invoiceAuction: "0xA41d285af4c736220f1e317a7f3b53A396CD4b7E",
        simpleStreamingRepayment: "0x1e1F4AAE6dC90c7AAD8aD9e2a5af7Ed3c9b2E9D2",
        invoiceFinanceManager: "0x1964150025024604A845F0f7b85814f6237F0f40",
        mockUSDY: "0xf5A8056C0957955A6Fe972c646e80475885939A2",
        kycBridge: "0x3fD1A28087c69D922ef6FEFAe231b9226EE9F7a7"
    };

    console.log("\n🎯 ULTIMATE VERIFICATION TEST");
    console.log("=".repeat(80));

    // 1. Check all contract KYCBridge references
    console.log("\n1️⃣  Verifying KYCBridge configuration...");

    const InvoiceNFT = await hre.ethers.getContractFactory("InvoiceNFT");
    const nft = InvoiceNFT.attach(addresses.invoiceNFT);
    const nftKyc = await nft.kycBridge();

    const InvoiceAuction = await hre.ethers.getContractFactory("InvoiceAuction");
    const auction = InvoiceAuction.attach(addresses.invoiceAuction);
    const auctionKyc = await auction.kycBridge();

    const Manager = await hre.ethers.getContractFactory("InvoiceFinanceManager");
    const manager = Manager.attach(addresses.invoiceFinanceManager);
    const managerKyc = await manager.kycBridge();

    console.log(`   InvoiceNFT KYC:  ${nftKyc}`);
    console.log(`   Auction KYC:     ${auctionKyc}`);
    console.log(`   Manager KYC:     ${managerKyc}`);
    console.log(`   Expected:        ${addresses.kycBridge}`);

    const allMatch = nftKyc === addresses.kycBridge &&
                     auctionKyc === addresses.kycBridge &&
                     managerKyc === addresses.kycBridge;
    console.log(`   All Match:       ${allMatch ? '✅' : '❌'}`);

    // 2. Check USDY decimals
    console.log("\n2️⃣  Verifying USDY decimals...");
    const USDY = await hre.ethers.getContractFactory("MockUSDY");
    const usdy = USDY.attach(addresses.mockUSDY);
    const decimals = await usdy.decimals();
    console.log(`   USDY decimals:   ${decimals} ${decimals === 6 ? '✅' : '❌'}`);

    // 3. Check KYC status
    console.log("\n3️⃣  Verifying user KYC status...");
    const KYCBridge = await hre.ethers.getContractFactory("KYCBridge");
    const kycBridge = KYCBridge.attach(addresses.kycBridge);

    const isValid = await kycBridge.isKYCValid(userAddress);
    const level = await kycBridge.getKYCLevel(userAddress);
    const maxAmount = await kycBridge.getMaxTransactionAmount(userAddress);

    console.log(`   User:            ${userAddress}`);
    console.log(`   Valid:           ${isValid ? '✅' : '❌'}`);
    console.log(`   Level:           ${level} (Enhanced)`);
    console.log(`   Max Amount:      ${hre.ethers.utils.formatUnits(maxAmount, 6)} USDY`);

    // 4. Test transaction limits
    console.log("\n4️⃣  Testing transaction amounts...");
    const invoiceAmount = hre.ethers.utils.parseUnits("1000", 6);
    console.log(`   Invoice Amount:  ${hre.ethers.utils.formatUnits(invoiceAmount, 6)} USDY`);
    console.log(`   Within Limit:    ${invoiceAmount.lte(maxAmount) ? '✅' : '❌'}`);

    // 5. Test KYC verification call
    console.log("\n5️⃣  Testing KYC verification...");
    try {
        await kycBridge.callStatic.verifyTransaction(
            userAddress,
            invoiceAmount,
            1 // Basic level
        );
        console.log(`   KYC Verify:      ✅ PASSED`);
    } catch (error) {
        console.log(`   KYC Verify:      ❌ FAILED`);
        console.log(`   Error: ${error.message}`);
    }

    // 6. Test Manager authorization in NFT
    console.log("\n6️⃣  Testing Manager authorization...");
    const isAuthorized = await nft.authorizedContracts(addresses.invoiceFinanceManager);
    console.log(`   Manager Auth:    ${isAuthorized ? '✅' : '❌'}`);

    // 7. Final Verdict
    console.log("\n" + "=".repeat(80));
    console.log("🏁 FINAL VERDICT:");
    console.log("=".repeat(80));

    const allChecksPassed = allMatch &&
                           decimals === 6 &&
                           isValid &&
                           invoiceAmount.lte(maxAmount) &&
                           isAuthorized;

    if (allChecksPassed) {
        console.log("\n✅✅✅ ALL SYSTEMS GO! ✅✅✅");
        console.log("\n🎉 Invoice creation should work perfectly now!");
        console.log("\n📋 What to do next:");
        console.log("   1. Stop frontend: Ctrl+C");
        console.log("   2. Clear cache: rm -rf frontend/.next");
        console.log("   3. Restart: cd frontend && npm run dev");
        console.log("   4. Hard refresh browser: Ctrl+Shift+R");
        console.log("   5. Try creating an invoice!");
    } else {
        console.log("\n❌ SOME CHECKS FAILED!");
        console.log("   Review the output above for details.");
    }

    console.log("\n" + "=".repeat(80) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
