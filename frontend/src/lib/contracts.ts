// Contract addresses on Mantle Sepolia
export const CONTRACTS = {
    InvoiceNFT: '0x6FDdD7F965B46cE78D324326F847ff91e445b4D5',
    InvoiceAuction: '0xf62591fdE615c0a8E468Fea8974AFF177996448B',
    SimpleStreamingRepayment: '0xEE63729e59AeFeFFA87c997e1a62Bd5d0e5DaAbD',
    InvoiceFinanceManager: '0x7a7935c6E2E498df4bb382041647Ce4CC8DC5051',
    MockUSDY: '0x3602a2dd2709644CceccE92B610cAa43cB136ECe',
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
