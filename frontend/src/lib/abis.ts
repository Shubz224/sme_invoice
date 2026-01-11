import InvoiceFinanceManagerABI from './abis/InvoiceFinanceManager.json';
import InvoiceNFTABI from './abis/InvoiceNFT.json';
import InvoiceAuctionABI from './abis/InvoiceAuction.json';
import SimpleStreamingRepaymentABI from './abis/SimpleStreamingRepayment.json';
import MockUSDYABI from './abis/MockUSDY.json';
import KYCBridgeABI from './abis/KYCBridge.json';

// Export ABIs
export const ABIS = {
    InvoiceFinanceManager: InvoiceFinanceManagerABI.abi,
    InvoiceNFT: InvoiceNFTABI.abi,
    InvoiceAuction: InvoiceAuctionABI.abi,
    SimpleStreamingRepayment: SimpleStreamingRepaymentABI.abi,
    MockUSDY: MockUSDYABI.abi,
    KYCBridge: KYCBridgeABI.abi,
} as const;
