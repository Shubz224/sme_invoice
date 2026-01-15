const hre = require("hardhat");

async function main() {
    const addresses = {
        invoiceNFT: "0x5AE9B42823982c09c082E6c0217d9A46a0b1D021",
        invoiceAuction: "0xA41d285af4c736220f1e317a7f3b53A396CD4b7E",
        invoiceFinanceManager: "0x1964150025024604A845F0f7b85814f6237F0f40",
    };

    console.log("\n🔍 Checking Contract Authorizations...");
    console.log("=".repeat(70));

    const InvoiceNFT = await hre.ethers.getContractFactory("InvoiceNFT");
    const nft = InvoiceNFT.attach(addresses.invoiceNFT);

    console.log("\n📋 InvoiceNFT Authorized Contracts:");

    const managerAuth = await nft.authorizedContracts(addresses.invoiceFinanceManager);
    console.log(`   Manager (${addresses.invoiceFinanceManager}): ${managerAuth ? '✅ Authorized' : '❌ NOT Authorized'}`);

    const auctionAuth = await nft.authorizedContracts(addresses.invoiceAuction);
    console.log(`   Auction (${addresses.invoiceAuction}): ${auctionAuth ? '✅ Authorized' : '❌ NOT Authorized'}`);

    if (!auctionAuth) {
        console.log("\n⚠️  PROBLEM FOUND!");
        console.log("   The Auction contract is NOT authorized in InvoiceNFT");
        console.log("   This prevents the auction from transferring NFTs");
        console.log("\n💡 Solution: Authorize the Auction contract");

        const [deployer] = await hre.ethers.getSigners();
        const owner = await nft.owner();

        if (owner.toLowerCase() === deployer.address.toLowerCase()) {
            console.log("\n🔧 Fixing authorization...");
            const tx = await nft.setAuthorizedContract(addresses.invoiceAuction, true);
            await tx.wait();
            console.log("   ✅ Auction contract authorized!");

            // Verify
            const newAuth = await nft.authorizedContracts(addresses.invoiceAuction);
            console.log(`   Verified: ${newAuth ? '✅' : '❌'}`);
        }
    } else {
        console.log("\n✅ All necessary contracts are authorized!");
    }

    console.log("\n" + "=".repeat(70));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
