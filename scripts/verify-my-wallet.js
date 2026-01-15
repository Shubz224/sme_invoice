const hre = require("hardhat");

async function main() {
  // Your wallet address from the error
  const walletToVerify = "0xE74686Fd89ACB480B3903724C367395d86ED4519";

  // KYCBridge contract address
  const kycBridgeAddress = "0x3fD1A28087c69D922ef6FEFAe231b9226EE9F7a7";

  console.log("\n🔐 KYC Verification Script");
  console.log("=" .repeat(50));
  console.log(`📍 Wallet to verify: ${walletToVerify}`);
  console.log(`📋 KYCBridge contract: ${kycBridgeAddress}`);

  // Get the signer (deployer account)
  const [deployer] = await hre.ethers.getSigners();
  console.log(`🔑 Deployer address: ${deployer.address}`);
  console.log(`💰 Deployer balance: ${hre.ethers.utils.formatEther(await deployer.getBalance())} MNT`);

  // Get KYCBridge contract
  const KYCBridge = await hre.ethers.getContractFactory("KYCBridge");
  const kycBridge = KYCBridge.attach(kycBridgeAddress);

  // Check current KYC status
  console.log("\n📊 Current KYC Status:");
  const isValid = await kycBridge.isKYCValid(walletToVerify);
  const level = await kycBridge.getKYCLevel(walletToVerify);
  console.log(`   Valid: ${isValid}`);
  console.log(`   Level: ${level} (0=None, 1=Basic, 2=Standard, 3=Enhanced, 4=Institutional)`);

  if (isValid) {
    console.log("\n✅ Wallet is already KYC verified!");
    const profile = await kycBridge.getKYCProfile(walletToVerify);
    console.log(`   Expires: ${new Date(profile.expiresAt.toNumber() * 1000).toLocaleDateString()}`);
    console.log(`   Jurisdiction: ${profile.jurisdictionCode}`);
    return;
  }

  // Verify the wallet with Enhanced level (level 3)
  console.log("\n🚀 Verifying wallet with Enhanced KYC (Level 3 - $50K limit)...");

  const tx = await kycBridge.updateKYC(
    walletToVerify,
    3, // Enhanced level
    "QmTestDocumentHash123", // Dummy IPFS hash for testing
    "US" // Jurisdiction code
  );

  console.log(`📝 Transaction sent: ${tx.hash}`);
  console.log("⏳ Waiting for confirmation...");

  await tx.wait();

  console.log("\n✅ KYC Verification Complete!");

  // Verify it worked
  const newIsValid = await kycBridge.isKYCValid(walletToVerify);
  const newLevel = await kycBridge.getKYCLevel(walletToVerify);
  const maxAmount = await kycBridge.getMaxTransactionAmount(walletToVerify);
  const profile = await kycBridge.getKYCProfile(walletToVerify);

  console.log("\n📊 New KYC Status:");
  console.log(`   ✓ Valid: ${newIsValid}`);
  console.log(`   ✓ Level: ${newLevel} (Enhanced)`);
  console.log(`   ✓ Max Transaction: $${hre.ethers.utils.formatUnits(maxAmount, 6)} USDY`);
  console.log(`   ✓ Expires: ${new Date(profile.expiresAt.toNumber() * 1000).toLocaleDateString()}`);
  console.log(`   ✓ Jurisdiction: ${profile.jurisdictionCode}`);

  console.log("\n🎉 You can now create invoices!");
  console.log("=" .repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
