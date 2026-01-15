const hre = require("hardhat");

async function main() {
    console.log("\n🔍 Checking Manager Authorization...\n");

    const CONTRACTS = {
        manager: "0x1964150025024604A845F0f7b85814f6237F0f40",
        streaming: "0x1e1F4AAE6dC90c7AAD8aD9e2a5af7Ed3c9b2E9D2"
    };

    const streaming = await hre.ethers.getContractAt("SimpleStreamingRepayment", CONTRACTS.streaming);

    const isAuthorized = await streaming.authorizedManagers(CONTRACTS.manager);

    console.log("📋 Manager Contract:", CONTRACTS.manager);
    console.log("🌊 Streaming Contract:", CONTRACTS.streaming);
    console.log("\n✅ Manager Authorized:", isAuthorized);

    if (!isAuthorized) {
        console.log("\n⚠️  Manager is NOT authorized!");
        console.log("💡 Run: npx hardhat run scripts/authorize-manager.js --network mantleSepolia");
    } else {
        console.log("\n✅ Manager is authorized to start streams!");
    }

    console.log("\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
