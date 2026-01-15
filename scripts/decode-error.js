const hre = require("hardhat");

async function main() {
    const errorData = "0xb436afbd";

    console.log("\n🔍 Decoding Error Signature...");
    console.log("=".repeat(60));
    console.log(`Error data: ${errorData}\n`);

    // Common custom errors from KYCBridge
    const errors = [
        "KYCExpiredError()",
        "KYCBlacklistedError()",
        "InsufficientKYCLevelError()",
        "ExceedsTransactionLimitError()",
        "TooManyAttemptsError()",
        "InvalidVerificationLevelError()",
        "NotAuthorizedError()",
    ];

    console.log("Checking custom errors:");
    for (const error of errors) {
        const selector = hre.ethers.utils.id(error).slice(0, 10);
        const match = selector.toLowerCase() === errorData.toLowerCase();
        console.log(`   ${error.padEnd(35)} ${selector} ${match ? '✅ MATCH!' : ''}`);
    }

    // Check if it matches ExceedsTransactionLimitError
    const exceedsLimitSelector = hre.ethers.utils.id("ExceedsTransactionLimitError()").slice(0, 10);
    console.log(`\n🎯 ExceedsTransactionLimitError selector: ${exceedsLimitSelector}`);

    if (exceedsLimitSelector.toLowerCase() === errorData.toLowerCase()) {
        console.log("\n⚠️  ERROR IDENTIFIED: ExceedsTransactionLimitError()");
        console.log("\n📋 This means:");
        console.log("   - Your transaction amount exceeds your KYC limit");
        console.log("   - Current KYC level may not support the transaction amount");
        console.log("   - Need to verify KYC level and transaction limits");
    }

    console.log("\n" + "=".repeat(60));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
