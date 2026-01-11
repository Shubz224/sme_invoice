'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getSigner, getContracts, waitForTransaction, formatUSDY } from '@/lib/blockchain';
import { NETWORK_CONFIG } from '@/lib/contracts';

interface ClaimButtonProps {
    invoiceId: number;
    onClaimed?: () => void;
}

export default function ClaimButton({ invoiceId, onClaimed }: ClaimButtonProps) {
    const [isClaiming, setIsClaiming] = useState(false);
    const [claimableAmount, setClaimableAmount] = useState('0');
    const [txHash, setTxHash] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadClaimableAmount();
        const interval = setInterval(loadClaimableAmount, 5000); // Update every 5 seconds
        return () => clearInterval(interval);
    }, [invoiceId]);

    const loadClaimableAmount = async () => {
        try {
            console.log('🔍 Checking claimable amount for invoice #' + invoiceId);
            const signer = await getSigner();
            const contracts = getContracts(signer);

            const amount = await contracts.streaming.getClaimableAmount(invoiceId);
            const formatted = formatUSDY(amount);
            setClaimableAmount(formatted);

            console.log('💰 Claimable amount:', formatted, 'USDY');
            setIsLoading(false);
        } catch (error) {
            console.error('❌ Error loading claimable amount:', error);
            setIsLoading(false);
        }
    };

    const handleClaim = async () => {
        console.log('🌊 Starting stream claim...');
        console.log('📋 Invoice ID:', invoiceId);

        try {
            setIsClaiming(true);
            setTxHash('');

            if (parseFloat(claimableAmount) === 0) {
                alert('No funds available to claim yet');
                return;
            }

            // Get signer and contracts
            console.log('🔐 Connecting wallet...');
            const signer = await getSigner();
            const address = await signer.getAddress();
            console.log('👤 Connected address:', address);

            const contracts = getContracts(signer);

            // Get stream info
            const stream = await contracts.streaming.getStreamInfo(invoiceId);
            console.log('📊 Stream info:', {
                totalAmount: formatUSDY(stream.totalAmount),
                claimedAmount: formatUSDY(stream.claimedAmount),
                active: stream.active,
            });

            // Claim
            console.log('📤 Claiming stream...');
            const tx = await contracts.streaming.claimStream(invoiceId);
            setTxHash(tx.hash);

            console.log('✅ Claim transaction sent!');
            console.log('🔗 TX Hash:', tx.hash);
            console.log('🌐 Explorer:', `${NETWORK_CONFIG.blockExplorer}/tx/${tx.hash}`);

            const receipt = await waitForTransaction(tx);

            // Get claimed amount from event
            const claimEvent = receipt.events?.find((e) => e.event === 'StreamClaimed');
            const claimed = claimEvent?.args?.claimedAmount;

            console.log('🎉 Stream claimed successfully!');
            console.log('💰 Claimed amount:', formatUSDY(claimed), 'USDY');
            console.log('📦 Block:', receipt.blockNumber);
            console.log('⛽ Gas used:', receipt.gasUsed.toString());

            alert(`Claimed ${formatUSDY(claimed)} USDY! TX: ${tx.hash.slice(0, 10)}...`);

            loadClaimableAmount();
            onClaimed?.();

        } catch (error: any) {
            console.error('❌ Error claiming stream:', error);
            alert(`Error: ${error.message || 'Failed to claim stream'}`);
        } finally {
            setIsClaiming(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Claimable amount display */}
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-1">Available to Claim</p>
                <p className="text-3xl font-bold text-white">
                    {isLoading ? '...' : `$${claimableAmount}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">Updates every 5 seconds</p>
            </div>

            {txHash && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-sm text-green-400">
                        ✅ Transaction sent!{' '}
                        <a
                            href={`${NETWORK_CONFIG.blockExplorer}/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                        >
                            View on Explorer
                        </a>
                    </p>
                </div>
            )}

            <button
                onClick={handleClaim}
                disabled={isClaiming || parseFloat(claimableAmount) === 0 || isLoading}
                className="w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isClaiming ? 'Claiming...' : parseFloat(claimableAmount) === 0 ? 'Nothing to Claim' : 'Claim Now'}
            </button>
        </div>
    );
}
