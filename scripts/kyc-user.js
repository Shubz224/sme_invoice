const hre = require("hardhat");

async function main() {
    console.log("\n✅ Approving KYC for Wallet...\n");

    // YOU CAN CHANGE THIS ADDRESS!
    const WALLET_TO_KYC = "0xc65e5b8451d16Ac73ABDA5eb237e641be2503559";

    // FIXED: Correct checksummed address from contracts.ts
    const KYC_CONTRACT = "0x3fD1A28087c69D922ef6FEFAe231b9226EE9F7a7";

    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Admin:", deployer.address);
    console.log("🎯 Wallet to KYC:", WALLET_TO_KYC);

    const kyc = await hre.ethers.getContractAt("KYCBridge", KYC_CONTRACT);

    // Approve KYC - using updateKYC function
    console.log("\n📝 Approving KYC...");
    // Parameters: address user, VerificationLevel level (1=Basic, 2=Standard, 3=Enhanced, 4=Institutional), string documentHash, string jurisdictionCode
    const tx = await kyc.updateKYC(
        WALLET_TO_KYC,
        2, // Standard level (ID verified, $10k limit)
        "QmDemo123", // Document hash (IPFS)
        "US" // Jurisdiction
    );
    console.log("⏳ TX:", tx.hash);
    await tx.wait();

    // Verify
    const isApproved = await kyc.isKYCValid(WALLET_TO_KYC);
    const level = await kyc.getKYCLevel(WALLET_TO_KYC);

    console.log("\n✅ KYC APPROVED!");
    console.log("   Valid:", isApproved);
    console.log("   Level:", level, "(0=None, 1=Basic, 2=Standard, 3=Enhanced, 4=Institutional)");
    console.log("\n🎉 Wallet is ready to use!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error.message);
        process.exit(1);
    });
