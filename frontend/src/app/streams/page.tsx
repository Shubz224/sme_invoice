'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getProvider, getContracts, formatUSDY, getCurrentAccount } from '@/lib/blockchain';

interface StreamData {
    id: number;
    invoiceNumber: string;
    totalAmount: string;
    claimedAmount: string;
    availableAmount: string;
    progress: number;
    status: 'active' | 'completed';
}

export default function StreamsPage() {
    const [streams, setStreams] = useState<StreamData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        activeStreams: 0,
        totalClaimed: '0',
        availableNow: '0',
    });

    useEffect(() => {
        loadStreams();
    }, []);

    const loadStreams = async () => {
        console.log('🌊 Loading payment streams...');

        try {
            const account = await getCurrentAccount();
            if (!account) {
                setIsLoading(false);
                return;
            }

            const provider = getProvider();
            const contracts = getContracts(provider);

            const totalInvoices = await contracts.nft.getTotalInvoices();
            const streamsList: StreamData[] = [];
            let activeCount = 0;
            let totalClaimed = 0;
            let totalAvailable = 0;

            for (let tokenId = 1; tokenId <= totalInvoices.toNumber(); tokenId++) {
                try {
                    const invoice = await contracts.nft.getInvoice(tokenId);

                    // Only show streams for invoices where user is the investor (owner)
                    const owner = await contracts.nft.ownerOf(tokenId);
                    if (owner.toLowerCase() !== account.toLowerCase()) {
                        continue;
                    }

                    // Check if has stream
                    if (!invoice.isFinanced) continue;

                    const stream = await contracts.streaming.getStreamInfo(tokenId);
                    if (!stream.active && stream.claimedAmount.eq(0)) continue;

                    const totalAmount = formatUSDY(stream.totalAmount);
                    const claimedAmount = formatUSDY(stream.claimedAmount);
                    const availableAmount = await contracts.streaming.getClaimableAmount(tokenId);
                    const availableFormatted = formatUSDY(availableAmount);

                    const progress = stream.totalAmount.gt(0)
                        ? Math.floor((parseFloat(claimedAmount) / parseFloat(totalAmount)) * 100)
                        : 0;

                    streamsList.push({
                        id: tokenId,
                        invoiceNumber: tokenId.toString(),
                        totalAmount,
                        claimedAmount,
                        availableAmount: availableFormatted,
                        progress,
                        status: stream.active ? 'active' : 'completed',
                    });

                    if (stream.active) activeCount++;
                    totalClaimed += parseFloat(claimedAmount);
                    totalAvailable += parseFloat(availableFormatted);

                    console.log(`🌊 Stream #${tokenId}:`, {
                        total: totalAmount,
                        claimed: claimedAmount,
                        available: availableFormatted,
                    });
                } catch (error) {
                    // No stream for this invoice
                }
            }

            setStreams(streamsList);
            setStats({
                activeStreams: activeCount,
                totalClaimed: totalClaimed.toFixed(0),
                availableNow: totalAvailable.toFixed(2),
            });

            console.log('✅ Loaded', streamsList.length, 'streams');

        } catch (error) {
            console.error('❌ Error loading streams:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value: string | number) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(num);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[32px] font-semibold text-white tracking-tight">Payment Streams</h1>
                <p className="text-sm text-[#a1a1aa] mt-2">Monitor your active repayment streams</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                <Card className="p-6 bg-[#0f0f0f] border-[rgba(255,255,255,0.05)] h-[120px] flex flex-col justify-between">
                    <p className="text-xs font-medium text-[#71717a] uppercase tracking-wide">Active Streams</p>
                    <p className="text-[32px] font-semibold text-white leading-none">
                        {isLoading ? '...' : stats.activeStreams}
                    </p>
                </Card>
                <Card className="p-6 bg-[#0f0f0f] border-[rgba(255,255,255,0.05)] h-[120px] flex flex-col justify-between">
                    <p className="text-xs font-medium text-[#71717a] uppercase tracking-wide">Total Claimed</p>
                    <p className="text-[32px] font-semibold text-[#10b981] leading-none">
                        {isLoading ? '...' : formatCurrency(stats.totalClaimed)}
                    </p>
                </Card>
                <Card className="p-6 bg-[#0f0f0f] border-[rgba(255,255,255,0.05)] h-[120px] flex flex-col justify-between">
                    <p className="text-xs font-medium text-[#71717a] uppercase tracking-wide">Available Now</p>
                    <p className="text-[32px] font-semibold text-[#6366f1] leading-none">
                        {isLoading ? '...' : formatCurrency(stats.availableNow)}
                    </p>
                </Card>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="text-center py-12">
                    <p className="text-gray-400">Loading streams...</p>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && streams.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-400">No active streams</p>
                </div>
            )}

            {/* Streams List */}
            {!isLoading && streams.length > 0 && (
                <div className="space-y-5">
                    {streams.map((stream) => (
                        <Link key={stream.id} href={`/streams/${stream.id}`}>
                            <Card className="p-6 bg-[#0f0f0f] border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-base font-semibold text-white">Invoice #{stream.invoiceNumber}</h3>
                                        <p className="text-sm text-[#a1a1aa] mt-1">
                                            {formatCurrency(stream.claimedAmount)} / {formatCurrency(stream.totalAmount)} claimed
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {parseFloat(stream.availableAmount) > 0 && (
                                            <Badge className="text-[11px] font-medium uppercase tracking-wide px-2.5 py-1 rounded-full bg-[rgba(99,102,241,0.1)] text-[#6366f1] border-0">
                                                {formatCurrency(stream.availableAmount)} available
                                            </Badge>
                                        )}
                                        {stream.status === 'completed' && (
                                            <Badge className="text-[11px] font-medium uppercase tracking-wide px-2.5 py-1 rounded-full bg-[rgba(16,185,129,0.1)] text-[#10b981] border-0">
                                                Completed
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#71717a]">Progress</span>
                                        <span className="text-[#6366f1] font-medium">{stream.progress}%</span>
                                    </div>
                                    <div className="h-1 bg-[rgba(255,255,255,0.05)] rounded-sm overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-sm transition-all"
                                            style={{ width: `${stream.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
