'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getSigner, getContracts, parseUSDY, waitForTransaction, formatUSDY, getCurrentAccount } from '@/lib/blockchain';
import { NETWORK_CONFIG } from '@/lib/contracts';

interface BidInterfaceProps {
    invoiceId: number;
    currentBid: string;
    minPrice: string;
    endTime: number;
    onBidPlaced?: () => void;
}

export default function BidInterface({ invoiceId, currentBid, minPrice, endTime, onBidPlaced }: BidInterfaceProps) {
    const [bidAmount, setBidAmount] = useState('');
    const [isBidding, setIsBidding] = useState(false);
    const [txHash, setTxHash] = useState('');
    const [usdyBalance, setUsdyBalance] = useState('0');
    const [usdyAllowance, setUsdyAllowance] = useState('0');
    const [isAuctionEnded, setIsAuctionEnded] = useState(false);

    useEffect(() => {
        loadBalances();

        // Check auction end status every second
        const checkAuctionStatus = () => {
            const ended = endTime * 1000 < Date.now();
            setIsAuctionEnded(ended);
        };

        checkAuctionStatus(); // Check immediately
        const interval = setInterval(checkAuctionStatus, 1000); // Check every second

        return () => clearInterval(interval);
    }, [invoiceId, endTime]);

    const loadBalances = async () => {
        try {
            const account = await getCurrentAccount();
            if (!account) return;

            console.log('💰 Loading USDY balance for:', account);
            const signer = await getSigner();
            const contracts = getContracts(signer);

            const balance = await contracts.usdy.balanceOf(account);
            const allowance = await contracts.usdy.allowance(account, contracts.auction.address);

            setUsdyBalance(formatUSDY(balance));
            setUsdyAllowance(formatUSDY(allowance));

            console.log('💵 USDY Balance:', formatUSDY(balance));
            console.log('✅ USDY Allowance:', formatUSDY(allowance));
        } catch (error) {
            console.error('❌ Error loading balances:', error);
        }
    };

    const handlePlaceBid = async () => {
        console.log('🔨 Starting bid placement...');
        console.log('📋 Invoice ID:', invoiceId);
        console.log('💰 Bid amount:', bidAmount, 'USDY');

        try {
            setIsBidding(true);
            setTxHash('');

            // Validation
            const bidValue = parseFloat(bidAmount);
            const minValue = parseFloat(currentBid || minPrice);

            if (bidValue <= minValue) {
                alert(`Bid must be higher than ${minValue} USDY`);
                return;
            }

            if (bidValue > parseFloat(usdyBalance)) {
                alert('Insufficient USDY balance');
                return;
            }

            // Get signer and contracts
            console.log('🔐 Connecting wallet...');
            const signer = await getSigner();
            const address = await signer.getAddress();
            console.log('👤 Connected address:', address);

            const contracts = getContracts(signer);
            const amount = parseUSDY(bidAmount);

            // Check and approve USDY if needed
            const currentAllowance = await contracts.usdy.allowance(address, contracts.auction.address);
            console.log('🔍 Current allowance:', formatUSDY(currentAllowance), 'USDY');

            if (currentAllowance.lt(amount)) {
                console.log('📝 Approving USDY...');
                const approveTx = await contracts.usdy.approve(contracts.auction.address, amount);
                console.log('⏳ Approval TX:', approveTx.hash);
                await waitForTransaction(approveTx);
                console.log('✅ USDY approved!');
            } else {
                console.log('✅ Sufficient allowance already exists');
            }

            // Place bid
            console.log('📤 Placing bid...');
            const bidTx = await contracts.auction.placeBid(invoiceId, amount);
            setTxHash(bidTx.hash);

            console.log('✅ Bid transaction sent!');
            console.log('🔗 TX Hash:', bidTx.hash);
            console.log('🌐 Explorer:', `${NETWORK_CONFIG.blockExplorer}/tx/${bidTx.hash}`);

            const receipt = await waitForTransaction(bidTx);

            console.log('🎉 Bid placed successfully!');
            console.log('📦 Block:', receipt.blockNumber);
            console.log('⛽ Gas used:', receipt.gasUsed.toString());

            alert(`Bid placed successfully! TX: ${bidTx.hash.slice(0, 10)}...`);
            setBidAmount('');
            loadBalances();
            onBidPlaced?.();

        } catch (error: any) {
            console.error('❌ Error placing bid:', error);
            alert(`Error: ${error.message || 'Failed to place bid'}`);
        } finally {
            setIsBidding(false);
        }
    };

    const handleSettleAuction = async () => {
        console.log('⚡ Starting auction settlement with auto-deposit...');
        console.log('📋 Invoice ID:', invoiceId);

        try {
            setIsBidding(true);
            setTxHash('');

            // Get signer and contracts
            console.log('🔐 Connecting wallet...');
            const signer = await getSigner();
            const address = await signer.getAddress();
            console.log('👤 Connected address:', address);

            const contracts = getContracts(signer);

            // Get auction data to find bid amount
            const auction = await contracts.auction.getAuction(invoiceId);
            const bidAmount = auction.highestBid;

            console.log('💰 Bid Amount:', formatUSDY(bidAmount), 'USDY');
            console.log('💡 Using bid amount for repayment stream...');

            // Step 1: Approve USDY for streaming contract
            console.log('\n📝 Step 1/3: Approving USDY for streaming...');
            const allowance = await contracts.usdy.allowance(address, contracts.streaming.address);

            if (allowance.lt(bidAmount)) {
                const approveTx = await contracts.usdy.approve(contracts.streaming.address, bidAmount);
                console.log('⏳ Approval TX:', approveTx.hash);
                await waitForTransaction(approveTx);
                console.log('✅ USDY approved for streaming');
            } else {
                console.log('✅ Already approved');
            }

            // Step 2: Deposit bid amount for repayment stream
            console.log('\n💰 Step 2/3: Depositing repayment funds...');
            const depositTx = await contracts.streaming.depositRepaymentFunds(invoiceId, bidAmount);
            console.log('⏳ Deposit TX:', depositTx.hash);
            await waitForTransaction(depositTx);
            console.log('✅ Repayment funds deposited:', formatUSDY(bidAmount), 'USDY');

            // Step 3: Settle auction and start stream
            console.log('\n🔨 Step 3/3: Settling auction and starting stream...');
            const settleTx = await contracts.manager.settleAuctionAndStartStream(invoiceId);
            setTxHash(settleTx.hash);

            console.log('✅ Settlement transaction sent!');
            console.log('🔗 TX Hash:', settleTx.hash);
            console.log('🌐 Explorer:', `${NETWORK_CONFIG.blockExplorer}/tx/${settleTx.hash}`);

            const receipt = await waitForTransaction(settleTx);

            console.log('\n🎉 SUCCESS! Auction settled and stream started!');
            console.log('📦 Block:', receipt.blockNumber);
            console.log('⛽ Gas used:', receipt.gasUsed.toString());
            console.log('🌊 Payment stream is now ACTIVE!');

            alert(`✅ Settlement Complete!\n\n🌊 Payment stream started!\n💰 ${formatUSDY(bidAmount)} USDY streaming to investor\n\nTX: ${settleTx.hash.slice(0, 10)}...`);
            onBidPlaced?.(); // Refresh data

        } catch (error: any) {
            console.error('❌ Error settling auction:', error);
            const errorMsg = error.reason || error.message || 'Failed to settle auction';
            alert(`Error: ${errorMsg}\n\nCheck console for details.`);
        } finally {
            setIsBidding(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Current bid info */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-400">Current Bid</p>
                        <p className="text-lg font-semibold text-white">${currentBid || '0'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Minimum Price</p>
                        <p className="text-lg font-semibold text-white">${minPrice}</p>
                    </div>
                </div>
            </div>

            {/* User balance */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-blue-400">
                    💰 Your USDY Balance: <span className="font-semibold">{usdyBalance}</span>
                </p>
            </div>

            {/* Bid input */}
            {!isAuctionEnded ? (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Your Bid Amount (USDY)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                type="number"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 pl-8 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                                placeholder={`Min: ${parseFloat(currentBid || minPrice) + 1}`}
                                disabled={isBidding}
                            />
                        </div>
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
                        onClick={handlePlaceBid}
                        disabled={isBidding || !bidAmount || isAuctionEnded}
                        className="w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isBidding ? 'Placing Bid...' : 'Place Bid'}
                    </button>
                </>
            ) : (
                <div className="space-y-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                        <p className="text-yellow-400 font-medium text-sm">⏰ Auction Has Ended!</p>
                        <p className="text-gray-400 text-xs mt-1">Settlement required to start payment stream</p>
                    </div>

                    <button
                        onClick={handleSettleAuction}
                        disabled={isBidding}
                        className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isBidding ? '⏳ Settling (3 steps)...' : '🌊 Settle & Start Stream (One Click!)'}
                    </button>

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
                </div>
            )}
        </div>
    );
}
