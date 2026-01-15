const hre = require("hardhat");

async function main() {
    const userAddress = "0xE74686Fd89ACB480B3903724C367395d86ED4519";

    const addresses = {
        invoiceNFT: "0x5AE9B42823982c09c082E6c0217d9A46a0b1D021",
        invoiceAuction: "0xA41d285af4c736220f1e317a7f3b53A396CD4b7E",
        simpleStreamingRepayment: "0x1e1F4AAE6dC90c7AAD8aD9e2a5af7Ed3c9b2E9D2",
        invoiceFinanceManager: "0x1964150025024604A845F0f7b85814f6237F0f40",
        mockUSDY: "0xf5A8056C0957955A6Fe972c646e80475885939A2",
        kycBridge: "0x3fD1A28087c69D922ef6FEFAe231b9226EE9F7a7"
    };

    console.log("\n🎯 FINAL COMPLETE VERIFICATION");
    console.log("=".repeat(80));

    // 1. KYCBridge Configuration
    console.log("\n1️⃣  KYCBridge Configuration:");
    const InvoiceNFT = await hre.ethers.getContractFactory("InvoiceNFT");
    const nft = InvoiceNFT.attach(addresses.invoiceNFT);
    const nftKyc = await nft.kycBridge();

    const InvoiceAuction = await hre.ethers.getContractFactory("InvoiceAuction");
    const auction = InvoiceAuction.attach(addresses.invoiceAuction);
    const auctionKyc = await auction.kycBridge();

    const Manager = await hre.ethers.getContractFactory("InvoiceFinanceManager");
    const manager = Manager.attach(addresses.invoiceFinanceManager);
    const managerKyc = await manager.kycBridge();

    const allKycMatch = nftKyc === addresses.kycBridge &&
                        auctionKyc === addresses.kycBridge &&
                        managerKyc === addresses.kycBridge;
    console.log(`   All contracts use correct KYCBridge: ${allKycMatch ? '✅' : '❌'}`);

    // 2. USDY Decimals
    console.log("\n2️⃣  USDY Token:");
    const USDY = await hre.ethers.getContractFactory("MockUSDY");
    const usdy = USDY.attach(addresses.mockUSDY);
    const decimals = await usdy.decimals();
    console.log(`   Decimals: ${decimals} ${decimals === 6 ? '✅' : '❌'}`);

    // 3. User KYC Status
    console.log("\n3️⃣  User KYC Status:");
    const KYCBridge = await hre.ethers.getContractFactory("KYCBridge");
    const kycBridge = KYCBridge.attach(addresses.kycBridge);
    const isValid = await kycBridge.isKYCValid(userAddress);
    const level = await kycBridge.getKYCLevel(userAddress);
    const maxAmount = await kycBridge.getMaxTransactionAmount(userAddress);
    console.log(`   Valid: ${isValid ? '✅' : '❌'} | Level: ${level} | Limit: $${hre.ethers.utils.formatUnits(maxAmount, 6)}`);

    // 4. Authorization Checks
    console.log("\n4️⃣  Contract Authorizations:");
    const managerAuth = await nft.authorizedContracts(addresses.invoiceFinanceManager);
    const auctionAuth = await nft.authorizedContracts(addresses.invoiceAuction);
    console.log(`   Manager authorized in NFT: ${managerAuth ? '✅' : '❌'}`);
    console.log(`   Auction authorized in NFT: ${auctionAuth ? '✅' : '❌'}`);

    const SimpleStreaming = await hre.ethers.getContractFactory("SimpleStreamingRepayment");
    const streaming = SimpleStreaming.attach(addresses.simpleStreamingRepayment);
    const managerAuthStreaming = await streaming.authorizedManagers(addresses.invoiceFinanceManager);
    console.log(`   Manager authorized in Streaming: ${managerAuthStreaming ? '✅' : '❌'}`);

    // 5. Test Invoice Amount
    console.log("\n5️⃣  Transaction Validation:");
    const invoiceAmount = hre.ethers.utils.parseUnits("1000", 6);
    const withinLimit = invoiceAmount.lte(maxAmount);
    console.log(`   Invoice: $1,000 | Within Limit: ${withinLimit ? '✅' : '❌'}`);

    try {
        await kycBridge.callStatic.verifyTransaction(userAddress, invoiceAmount, 1);
        console.log(`   KYC Verification Call: ✅ PASSED`);
    } catch (error) {
        console.log(`   KYC Verification Call: ❌ FAILED - ${error.message}`);
    }

    // Final Verdict
    console.log("\n" + "=".repeat(80));
    console.log("🏁 FINAL VERDICT:");
    console.log("=".repeat(80));

    const allChecksPassed = allKycMatch &&
                           decimals === 6 &&
                           isValid &&
                           managerAuth &&
                           auctionAuth &&
                           managerAuthStreaming &&
                           withinLimit;

    if (allChecksPassed) {
        console.log("\n✅✅✅ ALL SYSTEMS OPERATIONAL! ✅✅✅");
        console.log("\n🎉 Invoice creation is ready!");
        console.log("\n📋 Next Steps:");
        console.log("   1. Refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)");
        console.log("   2. Try creating an invoice:");
        console.log("      - Amount: 1000");
        console.log("      - Buyer: test");
        console.log("      - Due Date: Any future date");
        console.log("   3. Click 'Create Invoice'");
        console.log("   4. Confirm the transaction in MetaMask");
        console.log("\n✨ Expected Result: Invoice created and auction started!");
    } else {
        console.log("\n❌ SOME CHECKS FAILED - Review output above");
    }

    console.log("\n" + "=".repeat(80) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
