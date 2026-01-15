/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { ethers } from 'ethers';
import { CONTRACTS, NETWORK_CONFIG } from './contracts';
import { ABIS } from './abis';

// Types
export interface Invoice {
    id: number;
    issuer: string;
    amount: string;
    dueDate: number;
    buyer: string;
    documentHash: string;
    isFinanced: boolean;
    isPaid: boolean;
}

export interface Auction {
    invoiceId: number;
    issuer: string;
    minPrice: string;
    highestBid: string;
    highestBidder: string;
    endTime: number;
    settled: boolean;
}

export interface Stream {
    invoiceId: number;
    payer: string;
    investor: string;
    totalAmount: string;
    claimedAmount: string;
    amountPerSecond: string;
    startTime: number;
    endTime: number;
    active: boolean;
}

// Get provider (read-only)
export function getProvider(): ethers.providers.JsonRpcProvider {
    return new ethers.providers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
}

// Get signer (requires wallet connection)
export async function getSigner(): Promise<ethers.Signer> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
    }

    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    await provider.send('eth_requestAccounts', []);

    console.log('🔗 Wallet connected');

    // Check network
    const network = await provider.getNetwork();
    console.log('📍 Current Network:', network);

    // If not on Mantle Sepolia, switch automatically
    if (network.chainId !== NETWORK_CONFIG.chainId) {
        console.log('⚠️  Wrong network! Switching to Mantle Sepolia...');
        await switchToMantleSepolia();

        // Refresh provider after network switch
        const newProvider = new ethers.providers.Web3Provider((window as any).ethereum);
        const newNetwork = await newProvider.getNetwork();
        console.log('✅ Switched to:', newNetwork);

        return newProvider.getSigner();
    }

    return provider.getSigner();
}

// Get contract instances
export function getContracts(signerOrProvider: ethers.Signer | ethers.providers.Provider) {
    console.log('📜 Initializing contracts...');

    const contracts = {
        manager: new ethers.Contract(
            CONTRACTS.InvoiceFinanceManager,
            ABIS.InvoiceFinanceManager,
            signerOrProvider
        ),
        nft: new ethers.Contract(
            CONTRACTS.InvoiceNFT,
            ABIS.InvoiceNFT,
            signerOrProvider
        ),
        auction: new ethers.Contract(
            CONTRACTS.InvoiceAuction,
            ABIS.InvoiceAuction,
            signerOrProvider
        ),
        streaming: new ethers.Contract(
            CONTRACTS.SimpleStreamingRepayment,
            ABIS.SimpleStreamingRepayment,
            signerOrProvider
        ),
        usdy: new ethers.Contract(
            CONTRACTS.MockUSDY,
            ABIS.MockUSDY,
            signerOrProvider
        ),
        kycBridge: CONTRACTS.KYCBridge ? new ethers.Contract(
            CONTRACTS.KYCBridge,
            ABIS.KYCBridge,
            signerOrProvider
        ) : null,
    };

    console.log('✅ Contracts initialized:', {
        manager: contracts.manager.address,
        nft: contracts.nft.address,
        auction: contracts.auction.address,
        streaming: contracts.streaming.address,
        usdy: contracts.usdy.address,
        kycBridge: contracts.kycBridge?.address || 'Not deployed',
    });

    return contracts;
}

// Helper: Format USDY amount (6 decimals)
export function formatUSDY(amount: ethers.BigNumberish): string {
    return ethers.utils.formatUnits(amount, 6);
}

// Helper: Parse USDY amount
export function parseUSDY(amount: string): ethers.BigNumber {
    return ethers.utils.parseUnits(amount, 6);
}

// Helper: Format address
export function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Helper: Wait for transaction
export async function waitForTransaction(
    tx: ethers.ContractTransaction,
    confirmations = 1
): Promise<ethers.ContractReceipt> {
    console.log('⏳ Transaction sent:', tx.hash);
    console.log('🔗 Explorer:', `${NETWORK_CONFIG.blockExplorer}/tx/${tx.hash}`);

    const receipt = await tx.wait(confirmations);

    console.log('✅ Transaction confirmed!');
    console.log('📦 Block:', receipt.blockNumber);
    console.log('⛽ Gas used:', receipt.gasUsed.toString());

    return receipt;
}

// Check if wallet is connected
export async function isWalletConnected(): Promise<boolean> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
        return false;
    }

    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    const accounts = await provider.listAccounts();
    return accounts.length > 0;
}

// Get current account
export async function getCurrentAccount(): Promise<string | null> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
        return null;
    }

    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    const accounts = await provider.listAccounts();
    return accounts[0] || null;
}

// Switch to Mantle Sepolia network
export async function switchToMantleSepolia(): Promise<void> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('No wallet detected');
    }

    try {
        await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
        });
        console.log('✅ Switched to Mantle Sepolia');
    } catch (error: any) {
        // Chain not added, add it
        if (error.code === 4902) {
            await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                    {
                        chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
                        chainName: NETWORK_CONFIG.chainName,
                        nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                        rpcUrls: [NETWORK_CONFIG.rpcUrl],
                        blockExplorerUrls: [NETWORK_CONFIG.blockExplorer],
                    },
                ],
            });
            console.log('✅ Added and switched to Mantle Sepolia');
        } else {
            throw error;
        }
    }
}
