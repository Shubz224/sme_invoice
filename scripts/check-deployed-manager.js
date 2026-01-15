const hre = require("hardhat");

async function main() {
  const managerAddress = "0x7a7935c6E2E498df4bb382041647Ce4CC8DC5051";
  const userAddress = "0xE74686Fd89ACB480B3903724C367395d86ED4519";

  console.log("\n🔍 Checking deployed Manager contract...");
  console.log("=" .repeat(60));

  // Get contract code
  const code = await hre.ethers.provider.getCode(managerAddress);
  console.log(`📋 Contract deployed: ${code !== '0x' ? 'YES' : 'NO'}`);
  console.log(`📏 Bytecode length: ${code.length} bytes`);

  // Try to attach and call the contract
  const Manager = await hre.ethers.getContractFactory("InvoiceFinanceManager");
  const manager = Manager.attach(managerAddress);

  try {
    console.log("\n🔗 Reading contract state...");
    const nftAddress = await manager.invoiceNFT();
    const auctionAddress = await manager.auction();
    const streamingAddress = await manager.streaming();
    const kycBridgeAddress = await manager.kycBridge();

    console.log(`   InvoiceNFT: ${nftAddress}`);
    console.log(`   Auction: ${auctionAddress}`);
    console.log(`   Streaming: ${streamingAddress}`);
    console.log(`   KYCBridge: ${kycBridgeAddress}`);

    // Test create invoice params
    const amount = hre.ethers.utils.parseUnits("1000", 6); // 1000 USDY
    const dueDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
    const buyerId = "test";
    const documentURI = "testtest";
    const minPrice = hre.ethers.utils.parseUnits("920", 6); // 920 USDY
    const auctionDuration = 7 * 24 * 60 * 60; // 7 days

    console.log("\n🧪 Testing createInvoiceAndStartAuction call...");
    console.log(`   Amount: ${hre.ethers.utils.formatUnits(amount, 6)} USDY`);
    console.log(`   User: ${userAddress}`);

    // Try to estimate gas (will fail and show us the exact error)
    try {
      const gasEstimate = await manager.estimateGas.createInvoiceAndStartAuction(
        amount,
        dueDate,
        buyerId,
        documentURI,
        minPrice,
        auctionDuration,
        { from: userAddress }
      );
      console.log(`   ✅ Gas estimate: ${gasEstimate.toString()}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.reason || error.message}`);

      // Try to decode the error data
      if (error.error && error.error.data) {
        console.log(`\n   Raw error data: ${error.error.data}`);

        // Try to decode common errors
        const errorData = error.error.data;
        if (errorData.includes("4d616e616765723a2055736572206e6f74204b59432764")) {
          console.log("   📝 Decoded: 'Manager: User not KYC'd'");
        }
      }
    }

    // Check KYC status
    console.log("\n🔐 Checking KYC status...");
    const KYCBridge = await hre.ethers.getContractFactory("KYCBridge");
    const kycBridge = KYCBridge.attach(kycBridgeAddress);

    const isValid = await kycBridge.isKYCValid(userAddress);
    const level = await kycBridge.getKYCLevel(userAddress);
    const maxAmount = await kycBridge.getMaxTransactionAmount(userAddress);

    console.log(`   Valid: ${isValid}`);
    console.log(`   Level: ${level}`);
    console.log(`   Max Amount: ${hre.ethers.utils.formatUnits(maxAmount, 6)} USDY`);

    // Check if it's using old boolean check
    console.log("\n⚙️  Checking Manager implementation...");
    try {
      const isKYCd = await kycBridge.isKYCd(userAddress);
      console.log(`   isKYCd(${userAddress}): ${isKYCd}`);

      if (!isKYCd) {
        console.log("\n   ⚠️  ISSUE FOUND: The deployed Manager contract might be checking");
        console.log("   isKYCd() instead of verifyTransaction()");
      }
    } catch (e) {
      console.log(`   Error checking isKYCd: ${e.message}`);
    }

  } catch (error) {
    console.log(`\n❌ Error reading contract: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
