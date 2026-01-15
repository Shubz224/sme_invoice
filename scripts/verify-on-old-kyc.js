const hre = require("hardhat");

async function main() {
  const walletToVerify = "0xE74686Fd89ACB480B3903724C367395d86ED4519";
  const oldKycBridgeAddress = "0x37d1f8f096aD84c052f236933f528f8b9ED80299";

  console.log("\n🔐 Verifying on OLD KYCBridge");
  console.log("=".repeat(50));
  console.log(`📍 Wallet: ${walletToVerify}`);
  console.log(`📋 OLD KYCBridge: ${oldKycBridgeAddress}`);

  const [deployer] = await hre.ethers.getSigners();
  console.log(`🔑 Deployer: ${deployer.address}`);

  const KYCBridge = await hre.ethers.getContractFactory("KYCBridge");
  const kycBridge = KYCBridge.attach(oldKycBridgeAddress);

  // Check current status
  console.log("\n📊 Current KYC Status (OLD bridge):");
  try {
    const isValid = await kycBridge.isKYCValid(walletToVerify);
    const level = await kycBridge.getKYCLevel(walletToVerify);
    console.log(`   Valid: ${isValid}`);
    console.log(`   Level: ${level}`);

    if (isValid) {
      console.log("\n✅ Already verified on old bridge!");
      return;
    }
  } catch (error) {
    console.log(`   ❌ Error checking status: ${error.message}`);
  }

  // Verify the wallet
  console.log("\n🚀 Verifying wallet with Enhanced KYC (Level 3)...");

  try {
    const tx = await kycBridge.updateKYC(
      walletToVerify,
      3, // Enhanced level
      "QmTestDocumentHash123",
      "US"
    );

    console.log(`📝 Transaction: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");

    await tx.wait();

    console.log("\n✅ KYC Verification Complete on OLD bridge!");

    // Verify it worked
    const newIsValid = await kycBridge.isKYCValid(walletToVerify);
    const newLevel = await kycBridge.getKYCLevel(walletToVerify);
    const maxAmount = await kycBridge.getMaxTransactionAmount(walletToVerify);

    console.log("\n📊 New KYC Status:");
    console.log(`   ✓ Valid: ${newIsValid}`);
    console.log(`   ✓ Level: ${newLevel} (Enhanced)`);
    console.log(`   ✓ Max Amount: $${hre.ethers.utils.formatUnits(maxAmount, 6)} USDY`);

    console.log("\n🎉 You can now create invoices!");
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.error) {
      console.error(`   Details: ${JSON.stringify(error.error, null, 2)}`);
    }
  }

  console.log("=".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
