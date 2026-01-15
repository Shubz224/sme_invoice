// Script to mint test USDY tokens for users
const hre = require("hardhat");

async function main() {
    console.log("💰 Minting test USDY tokens...\n");

    // Get deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log("👤 Minting from:", deployer.address);

    // Get MockUSDY contract
    const usdyAddress = "0x3602a2dd2709644CceccE92B610cAa43cB136ECe";
    const MockUSDY = await hre.ethers.getContractAt("MockUSDY", usdyAddress);

    // Users to give tokens
    const users = [
        {
            address: "0xEF8b133D82dF774Ccc0Ed4337Ac5d91Ff5755340", // Your wallet
            amount: "1000000", // 1M USDY
        },
        {
            address: "0xE74686Fd89ACB480B3903724C367395d86ED4519", // Friend's wallet
            amount: "1000000", // 1M USDY
        },
    ];

    console.log("\n💸 Minting USDY tokens...\n");

    for (const user of users) {
        try {
            // Amount in 18 decimals (USDY has 18 decimals)
            const amount = hre.ethers.utils.parseUnits(user.amount, 18);

            const tx = await MockUSDY.mint(user.address, amount);
            console.log(`⏳ Minting ${user.amount} USDY for ${user.address}...`);
            await tx.wait();

            const balance = await MockUSDY.balanceOf(user.address);
            const balanceFormatted = hre.ethers.utils.formatUnits(balance, 18);

            console.log(`✅ Success!`);
            console.log(`   New Balance: ${parseFloat(balanceFormatted).toLocaleString()} USDY\n`);
        } catch (error) {
            console.error(`❌ Error minting for ${user.address}:`, error.message);
        }
    }

    console.log("🎉 USDY minting complete!");
    console.log("\nUsers can now:");
    console.log("- Create invoices");
    console.log("- Bid on auctions");
    console.log("- Test the full platform");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
