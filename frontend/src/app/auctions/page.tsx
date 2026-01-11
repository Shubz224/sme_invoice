'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CountdownTimer from '@/components/auctions/CountdownTimer';
import { Clock } from 'lucide-react';
import { getProvider, getContracts, formatUSDY } from '@/lib/blockchain';

interface AuctionData {
    id: number;
    invoiceNumber: string;
    amount: string;
    minBid: string;
    currentBid: string;
    endTime: Date;
    status: 'active' | 'ending_soon';
    settled: boolean;
}

export default function AuctionsPage() {
    const [auctions, setAuctions] = useState<AuctionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalValue, setTotalValue] = useState('0');

    useEffect(() => {
        loadAuctions();
    }, []);

    const loadAuctions = async () => {
        console.log('🔨 Loading active auctions...');
        setIsLoading(true);

        try {
            const provider = getProvider();
            const contracts = getContracts(provider);

            // Get total invoices
            const totalInvoices = await contracts.nft.getTotalInvoices();
            console.log('📋 Total invoices:', totalInvoices.toString());

            const auctionsList: AuctionData[] = [];
            let total = 0;

            // Load each invoice and check if auction is active
            for (let i = 1; i <= totalInvoices.toNumber(); i++) {
                try {
                    const auction = await contracts.auction.getAuction(i);
                    const invoice = await contracts.nft.getInvoice(i);

                    const endTimeSeconds = auction.endTime.toNumber();
                    const now = Math.floor(Date.now() / 1000);

                    // Only show active auctions
                    if (!auction.settled && endTimeSeconds > now) {
                        const timeLeft = endTimeSeconds - now;
                        const isEndingSoon = timeLeft < 3600; // Less than 1 hour

                        const auctionData: AuctionData = {
                            id: i,
                            invoiceNumber: i.toString(),
                            amount: formatUSDY(invoice.amount),
                            minBid: formatUSDY(auction.minPrice),
                            currentBid: auction.highestBid.gt(0) ? formatUSDY(auction.highestBid) : '0',
                            endTime: new Date(endTimeSeconds * 1000),
                            status: isEndingSoon ? 'ending_soon' : 'active',
                            settled: auction.settled,
                        };

                        auctionsList.push(auctionData);
                        total += parseFloat(auctionData.amount);

                        console.log(`📄 Auction #${i}:`, {
                            amount: auctionData.amount,
                            minBid: auctionData.minBid,
                            currentBid: auctionData.currentBid,
                            endTime: auctionData.endTime.toLocaleString(),
                        });
                    }
                } catch (error) {
                    console.log(`⚠️  Invoice #${i} has no auction or error:`, error);
                }
            }

            setAuctions(auctionsList);
            setTotalValue(total.toFixed(0));
            console.log('✅ Loaded', auctionsList.length, 'active auctions');
            console.log('💰 Total value:', total.toFixed(0), 'USDY');

        } catch (error) {
            console.error('❌ Error loading auctions:', error);
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

    const calculateAvgDiscount = () => {
        if (auctions.length === 0) return '0';

        const totalDiscount = auctions.reduce((sum, auction) => {
            const amount = parseFloat(auction.amount);
            const minBid = parseFloat(auction.minBid);
            const discount = ((amount - minBid) / amount) * 100;
            return sum + discount;
        }, 0);

        return (totalDiscount / auctions.length).toFixed(1);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[32px] font-semibold text-white tracking-tight">Active Auctions</h1>
                <p className="text-sm text-[#a1a1aa] mt-2">Browse and bid on invoice financing opportunities</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
                <Card className="p-6 bg-[#0f0f0f] border-[rgba(255,255,255,0.05)] h-[120px] flex flex-col justify-between">
                    <p className="text-xs font-medium text-[#71717a] uppercase tracking-wide">Active Auctions</p>
                    <p className="text-[32px] font-semibold text-white leading-none">
                        {isLoading ? '...' : auctions.length}
                    </p>
                </Card>
                <Card className="p-6 bg-[#0f0f0f] border-[rgba(255,255,255,0.05)] h-[120px] flex flex-col justify-between">
                    <p className="text-xs font-medium text-[#71717a] uppercase tracking-wide">Total Value</p>
                    <p className="text-[32px] font-semibold text-white leading-none">
                        {isLoading ? '...' : formatCurrency(totalValue)}
                    </p>
                </Card>
                <Card className="p-6 bg-[#0f0f0f] border-[rgba(255,255,255,0.05)] h-[120px] flex flex-col justify-between">
                    <p className="text-xs font-medium text-[#71717a] uppercase tracking-wide">Avg Discount</p>
                    <p className="text-[32px] font-semibold text-[#6366f1] leading-none">
                        {isLoading ? '...' : `${calculateAvgDiscount()}%`}
                    </p>
                </Card>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="text-center py-12">
                    <p className="text-gray-400">Loading auctions from blockchain...</p>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && auctions.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-400">No active auctions at the moment</p>
                    <Link href="/invoices/create">
                        <Button className="mt-4 bg-purple-500 hover:bg-purple-600">
                            Create First Invoice
                        </Button>
                    </Link>
                </div>
            )}

            {/* Auction Grid */}
            {!isLoading && auctions.length > 0 && (
                <div className="grid grid-cols-3 gap-6">
                    {auctions.map((auction) => (
                        <Link key={auction.id} href={`/auctions/${auction.id}`}>
                            <Card className="p-6 bg-[#0f0f0f] border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-base font-semibold text-white">Invoice #{auction.invoiceNumber}</h3>
                                        <p className="text-sm text-[#a1a1aa] mt-1">{formatCurrency(auction.amount)}</p>
                                    </div>
                                    {auction.status === 'ending_soon' && (
                                        <Badge className="text-[11px] font-medium uppercase tracking-wide px-2.5 py-1 rounded-full bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border-0">
                                            Ending Soon
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#71717a]">Minimum Bid</span>
                                        <span className="text-white font-medium">{formatCurrency(auction.minBid)}</span>
                                    </div>

                                    {parseFloat(auction.currentBid) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[#71717a]">Current Best</span>
                                            <span className="text-[#6366f1] font-medium">{formatCurrency(auction.currentBid)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.05)]">
                                    <div className="flex items-center gap-2 text-sm text-[#a1a1aa]">
                                        <Clock size={14} />
                                        <CountdownTimer endTime={auction.endTime} />
                                    </div>
                                    <Button className="h-9 px-4 bg-[#6366f1] hover:bg-[#5558e3] text-white text-sm font-medium rounded-lg">
                                        Place Bid
                                    </Button>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
