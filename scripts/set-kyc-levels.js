// Admin script to set KYC levels for testing
const hre = require("hardhat");

async function main() {
    console.log("🔐 Setting up KYC levels for testing...\n");

    // Get deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Admin:", deployer.address);

    // Get KYCBridge contract
    const kycBridgeAddress = "0x3fD1A28087c69D922ef6FEFAe231b9226EE9F7a7";
    const KYCBridge = await hre.ethers.getContractAt("KYCBridge", kycBridgeAddress);

    // Test addresses - replace with your actual wallet addresses
    const testUsers = [
        {
            address: deployer.address, // Your wallet
            level: 3, // Enhanced KYC
            documentHash: "QmTest123", // IPFS hash
            jurisdiction: "US",
        },
    ];

    console.log("\n📝 Setting KYC levels...\n");

    for (const user of testUsers) {
        try {
            const tx = await KYCBridge.updateKYC(
                user.address,
                user.level,
                user.documentHash,
                user.jurisdiction
            );

            console.log(`⏳ Setting KYC for ${user.address}...`);
            await tx.wait();

            const profile = await KYCBridge.getKYCProfile(user.address);
            const maxAmount = await KYCBridge.getMaxTransactionAmount(user.address);

            console.log(`✅ KYC Set Successfully!`);
            console.log(`   Level: ${profile.level}`);
            console.log(`   Max Amount: $${hre.ethers.utils.formatUnits(maxAmount, 6)}`);
            console.log(`   Expires: ${new Date(profile.expiresAt.toNumber() * 1000).toLocaleDateString()}\n`);
        } catch (error) {
            console.error(`❌ Error setting KYC for ${user.address}:`, error.message);
        }
    }

    console.log("\n🎉 KYC setup complete!");
    console.log("\nKYC Levels:");
    console.log("0 = None ($0)");
    console.log("1 = Basic ($1,000)");
    console.log("2 = Standard ($10,000)");
    console.log("3 = Enhanced ($50,000)");
    console.log("4 = Institutional (Unlimited)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
