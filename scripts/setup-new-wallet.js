const hre = require("hardhat");

async function main() {
    console.log("\n🎯 Quick Setup for New Wallet...\n");

    const NEW_WALLET = "0xc65e5b8451d16Ac73ABDA5eb237e641be2503559";

    const CONTRACTS = {
        kyc: "0x70BCD50F210E61460A4d2d0aea6D65A67B94e7B4",
        usdy: "0xf5A8056C0957955A6Fe972c646e80475885939A2"
    };

    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Admin:", deployer.address);
    console.log("🎯 New Wallet:", NEW_WALLET);

    const kyc = await hre.ethers.getContractAt("KYCBridge", CONTRACTS.kyc);
    const usdy = await hre.ethers.getContractAt("MockUSDY", CONTRACTS.usdy);

    // Step 1: KYC
    console.log("\n1️⃣ Approving KYC...");
    const kycTx = await kyc.setKYCStatus(NEW_WALLET, true);
    await kycTx.wait();
    console.log("✅ KYC approved!");

    // Step 2: Mint USDY
    console.log("\n2️⃣ Minting USDY tokens...");
    const amount = hre.ethers.utils.parseUnits("1000000", 6); // 1M USDY
    const mintTx = await usdy.mint(NEW_WALLET, amount);
    await mintTx.wait();
    console.log("✅ Minted 1,000,000 USDY!");

    // Verify
    const isKYCd = await kyc.isKYCApproved(NEW_WALLET);
    const balance = await usdy.balanceOf(NEW_WALLET);

    console.log("\n✅ SETUP COMPLETE!");
    console.log("   KYC Status:", isKYCd);
    console.log("   USDY Balance:", hre.ethers.utils.formatUnits(balance, 6), "USDY");
    console.log("\n🎉 Wallet is ready to use!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error.message);
        process.exit(1);
    });
