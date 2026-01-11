const hre = require("hardhat");

async function main() {
    const { ethers } = hre;

    console.log("🔐 KYC-ing Manager Contract\n");
    console.log("=".repeat(60));

    const [deployer] = await ethers.getSigners();

    // Addresses
    const kycBridgeAddress = "0x37d1f8f096aD84c052f236933f528f8b9ED80299";
    const managerAddress = "0x3d19B0C155014b20911352c9c106b01Ed867eeBc";

    const kycBridge = await ethers.getContractAt("KYCBridge", kycBridgeAddress);

    console.log("📋 KYC-ing Manager at:", managerAddress);
    const tx = await kycBridge.setKYC(managerAddress, true);
    await tx.wait();

    console.log("✅ Manager contract KYC'd!");

    // Also KYC the deployer just in case
    if (!(await kycBridge.isKYCd(deployer.address))) {
        console.log("📋 KYC-ing Deployer at:", deployer.address);
        const tx2 = await kycBridge.setKYC(deployer.address, true);
        await tx2.wait();
        console.log("✅ Deployer KYC'd!");
    }

    console.log("\n🚀 All set! Run the custom flow test again.\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
