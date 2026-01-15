// Contract addresses on Mantle Sepolia
export const CONTRACTS = {
    InvoiceNFT: '0x5AE9B42823982c09c082E6c0217d9A46a0b1D021',
    InvoiceAuction: '0xA41d285af4c736220f1e317a7f3b53A396CD4b7E',
    SimpleStreamingRepayment: '0x1e1F4AAE6dC90c7AAD8aD9e2a5af7Ed3c9b2E9D2',
    InvoiceFinanceManager: '0x1964150025024604A845F0f7b85814f6237F0f40',
    MockUSDY: '0xf5A8056C0957955A6Fe972c646e80475885939A2',
    KYCBridge: '0x3fD1A28087c69D922ef6FEFAe231b9226EE9F7a7',
} as const;

// Mantle Sepolia Network Config
export const NETWORK_CONFIG = {
    chainId: 5003,
    chainName: 'Mantle Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
    blockExplorer: 'https://sepolia.mantlescan.xyz',
    nativeCurrency: {
        name: 'MNT',
        symbol: 'MNT',
        decimals: 18,
    },
} as const;

// Helper to get explorer link
export function getExplorerLink(address: string, type: 'address' | 'tx' = 'address'): string {
    return `${NETWORK_CONFIG.blockExplorer}/${type}/${address}`;
}
