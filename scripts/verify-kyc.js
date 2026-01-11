const hre = require("hardhat");

async function main() {
    const { ethers } = hre;

    const kycBridgeAddress = "0x37d1f8f096aD84c052f236933f528f8b9ED80299";
    const managerAddress = "0x3d19B0C155014b20911352c9c106b01Ed867eeBc";
    const [deployer] = await ethers.getSigners();

    const kycBridge = await ethers.getContractAt("KYCBridge", kycBridgeAddress);

    console.log("🔍 Checking KYC Status:");
    console.log("   Deployer (" + deployer.address + "):", await kycBridge.isKYCd(deployer.address));
    console.log("   Manager (" + managerAddress + "):", await kycBridge.isKYCd(managerAddress));
}

main().catch(console.error);
