const hre = require("hardhat");

async function main() {
    const nftAddress = "0x6FDdD7F965B46cE78D324326F847ff91e445b4D5";
    const userAddress = "0xE74686Fd89ACB480B3903724C367395d86ED4519";
    const correctKycBridge = "0x3fD1A28087c69D922ef6FEFAe231b9226EE9F7a7";

    console.log("\n🔍 Checking InvoiceNFT KYCBridge...");
    console.log("=".repeat(70));

    const InvoiceNFT = await hre.ethers.getContractFactory("InvoiceNFT");
    const nft = InvoiceNFT.attach(nftAddress);

    try {
        const nftKycBridge = await nft.kycBridge();
        console.log(`\n📋 InvoiceNFT:`);
        console.log(`   Address: ${nftAddress}`);
        console.log(`   KYCBridge: ${nftKycBridge}`);
        console.log(`   Expected: ${correctKycBridge}`);
        console.log(`   Matches: ${nftKycBridge.toLowerCase() === correctKycBridge.toLowerCase() ? '✅' : '❌ MISMATCH!'}`);

        if (nftKycBridge.toLowerCase() !== correctKycBridge.toLowerCase()) {
            console.log(`\n⚠️  PROBLEM FOUND!`);
            console.log(`   InvoiceNFT is using the wrong KYCBridge`);
            console.log(`   Need to update InvoiceNFT's KYCBridge address`);

            // Check if there's a function to update it
            console.log(`\n🔧 Checking if we can update the KYCBridge...`);

            // Check current KYC status on both bridges
            const KYCBridge = await hre.ethers.getContractFactory("KYCBridge");

            console.log(`\n🔐 User KYC Status on OLD bridge (${nftKycBridge}):`);
            try {
                const oldBridge = KYCBridge.attach(nftKycBridge);
                const isValidOld = await oldBridge.isKYCValid(userAddress);
                const levelOld = await oldBridge.getKYCLevel(userAddress);
                console.log(`   Valid: ${isValidOld ? '✅' : '❌'}`);
                console.log(`   Level: ${levelOld}`);
            } catch (e) {
                console.log(`   ❌ Error: ${e.message}`);
            }

            console.log(`\n🔐 User KYC Status on NEW bridge (${correctKycBridge}):`);
            const newBridge = KYCBridge.attach(correctKycBridge);
            const isValidNew = await newBridge.isKYCValid(userAddress);
            const levelNew = await newBridge.getKYCLevel(userAddress);
            console.log(`   Valid: ${isValidNew ? '✅' : '❌'}`);
            console.log(`   Level: ${levelNew}`);
        }

        // Check the InvoiceNFT contract for setKycBridge function
        console.log(`\n🔧 Checking for update function...`);
        try {
            // Try to see if we have owner access
            const owner = await nft.owner();
            const [deployer] = await hre.ethers.getSigners();
            console.log(`   NFT Owner: ${owner}`);
            console.log(`   Deployer: ${deployer.address}`);
            console.log(`   Can Update: ${owner.toLowerCase() === deployer.address.toLowerCase() ? '✅ YES' : '❌ NO'}`);

            if (owner.toLowerCase() === deployer.address.toLowerCase()) {
                console.log(`\n✅ We can update the KYCBridge address!`);
            } else {
                console.log(`\n⚠️  Cannot update - not the owner`);
            }
        } catch (e) {
            console.log(`   Error checking owner: ${e.message}`);
        }

    } catch (error) {
        console.log(`\n❌ Error: ${error.message}`);
    }

    console.log("\n" + "=".repeat(70));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
