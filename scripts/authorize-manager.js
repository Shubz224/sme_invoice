const hre = require("hardhat");

async function main() {
    console.log("\n🔐 Authorizing Manager Contract...\n");

    const CONTRACTS = {
        manager: "0x1964150025024604A845F0f7b85814f6237F0f40",
        streaming: "0x1e1F4AAE6dC90c7AAD8aD9e2a5af7Ed3c9b2E9D2"
    };

    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Deployer:", deployer.address);

    const streaming = await hre.ethers.getContractAt("SimpleStreamingRepayment", CONTRACTS.streaming);

    console.log("📝 Authorizing manager:", CONTRACTS.manager);

    const tx = await streaming.setAuthorizedManager(CONTRACTS.manager, true);
    console.log("⏳ Transaction sent:", tx.hash);

    await tx.wait();
    console.log("✅ Manager authorized!");

    // Verify
    const isAuthorized = await streaming.authorizedManagers(CONTRACTS.manager);
    console.log("\n🔍 Verification - Manager authorized:", isAuthorized);

    console.log("\n✨ Done! Manager can now start streams.\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Error:", error.message);
        process.exit(1);
    });
