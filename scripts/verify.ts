import * as hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("🔍 Verifying contracts on MantleScan...\n");

    // Load deployment info
    const network = process.env.HARDHAT_NETWORK || "mantleSepolia";
    const deploymentsDir = path.join(__dirname, "../deployments");

    // Try to find the deployment file
    const files = fs.readdirSync(deploymentsDir);
    const deploymentFile = files.find(f => f.includes(network));

    if (!deploymentFile) {
        console.error(`❌ No deployment found for network: ${network}`);
        console.error(`   Available deployments: ${files.join(", ")}`);
        process.exit(1);
    }

    const deploymentPath = path.join(deploymentsDir, deploymentFile);
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));

    console.log(`📄 Using deployment file: ${deploymentFile}\n`);

    const contracts = [
        {
            name: "KYCBridge",
            address: deployment.contracts.kycBridge,
            constructorArgs: [],
        },
        {
            name: "MockUSDY",
            address: deployment.contracts.mockUSDY,
            constructorArgs: [],
        },
        {
            name: "InvoiceNFT",
            address: deployment.contracts.invoiceNFT,
            constructorArgs: [deployment.contracts.kycBridge],
        },
        {
            name: "InvoiceAuction",
            address: deployment.contracts.invoiceAuction,
            constructorArgs: [
                deployment.contracts.invoiceNFT,
                deployment.contracts.kycBridge,
                deployment.contracts.mockUSDY,
            ],
        },
        {
            name: "StreamingRepayment",
            address: deployment.contracts.streamingRepayment,
            constructorArgs: [
                deployment.superfluid.host,
                deployment.superfluid.cfaV1,
                deployment.superfluid.usdySuperToken,
            ],
        },
        {
            name: "InvoiceFinanceManager",
            address: deployment.contracts.invoiceFinanceManager,
            constructorArgs: [
                deployment.contracts.invoiceNFT,
                deployment.contracts.invoiceAuction,
                deployment.contracts.streamingRepayment,
                deployment.contracts.kycBridge,
            ],
        },
    ];

    for (const contract of contracts) {
        try {
            console.log(`Verifying ${contract.name} at ${contract.address}...`);

            await hre.run("verify:verify", {
                address: contract.address,
                constructorArguments: contract.constructorArgs,
            });

            console.log(`✅ ${contract.name} verified!\n`);
        } catch (error: any) {
            if (error.message.includes("Already Verified")) {
                console.log(`✅ ${contract.name} already verified\n`);
            } else {
                console.error(`❌ Error verifying ${contract.name}:`, error.message, "\n");
            }
        }
    }

    console.log("🎉 Verification complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
