'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CountdownTimer from '@/components/auctions/CountdownTimer';
import BidInterface from '@/components/auctions/BidInterface';
import { ArrowLeft, FileText, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { getProvider, getContracts, formatUSDY } from '@/lib/blockchain';

interface AuctionData {
    invoiceNumber: string;
    amount: string;
    minBid: string;
    currentBid: string;
    endTime: Date;
    buyer: string;
    dueDate: Date;
    description: string;
    isLoading: boolean;
}

export default function AuctionDetailPage() {
    const params = useParams();
    const invoiceId = params.id as string;

    const [auctionData, setAuctionData] = useState<AuctionData>({
        invoiceNumber: invoiceId,
        amount: '0',
        minBid: '0',
        currentBid: '0',
        endTime: new Date(),
        buyer: '',
        dueDate: new Date(),
        description: '',
        isLoading: true,
    });

    useEffect(() => {
        loadAuctionData();
    }, [invoiceId]);

    const loadAuctionData = async () => {
        console.log('🔨 Loading auction details for invoice #' + invoiceId);

        try {
            const provider = getProvider();
            const contracts = getContracts(provider);

            // Load invoice data
            const invoice = await contracts.nft.getInvoice(invoiceId);
            const auction = await contracts.auction.getAuction(invoiceId);

            console.log('📄 Invoice data:', {
                amount: formatUSDY(invoice.amount),
                buyer: invoice.buyer,
                dueDate: new Date(invoice.dueDate.toNumber() * 1000).toLocaleDateString(),
            });

            console.log('🔨 Auction data:', {
                minPrice: formatUSDY(auction.minPrice),
                highestBid: formatUSDY(auction.highestBid),
                endTime: new Date(auction.endTime.toNumber() * 1000).toLocaleString(),
            });

            setAuctionData({
                invoiceNumber: invoiceId,
                amount: formatUSDY(invoice.amount),
                minBid: formatUSDY(auction.minPrice),
                currentBid: auction.highestBid.gt(0) ? formatUSDY(auction.highestBid) : '0',
                endTime: new Date(auction.endTime.toNumber() * 1000),
                buyer: invoice.buyer,
                dueDate: new Date(invoice.dueDate.toNumber() * 1000),
                description: invoice.documentHash, // Using documentHash as description
                isLoading: false,
            });

            console.log('✅ Auction details loaded');

        } catch (error) {
            console.error('❌ Error loading auction:', error);
            setAuctionData(prev => ({ ...prev, isLoading: false }));
        }
    };

    const formatCurrency = (value: string | number) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    };

    if (auctionData.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-400">Loading auction details...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Back Button */}
            <Link href="/auctions" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
                <span>Back to Auctions</span>
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Invoice #{auctionData.invoiceNumber}
                    </h1>
                    <p className="text-gray-400">{auctionData.description}</p>
                </div>

                <CountdownTimer endTime={auctionData.endTime} />
            </div>

            {/* Main Content - Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Invoice Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Invoice Info Card */}
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Invoice Details</h2>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <DollarSign size={24} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Face Value</p>
                                    <p className="text-2xl font-bold text-white">{formatCurrency(auctionData.amount)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Calendar size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Due Date</p>
                                    <p className="text-lg font-semibold text-white">{formatDate(auctionData.dueDate)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <FileText size={24} className="text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Buyer</p>
                                    <p className="text-lg font-semibold text-white">{auctionData.buyer}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">⏰</span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Auction Ends</p>
                                    <p className="text-lg font-semibold text-white">{formatDate(auctionData.endTime)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Current Auction Status */}
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Auction Status</h2>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Minimum Bid</span>
                                <span className="text-lg font-semibold text-white">{formatCurrency(auctionData.minBid)}</span>
                            </div>

                            {parseFloat(auctionData.currentBid) > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Current Best Bid</span>
                                    <span className="text-xl font-bold text-purple-400">{formatCurrency(auctionData.currentBid)}</span>
                                </div>
                            )}

                            {parseFloat(auctionData.currentBid) === 0 && (
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                    <p className="text-sm text-blue-400">
                                        💡 No bids yet! Be the first to bid on this invoice.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Bid Interface */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sticky top-24">
                        <h2 className="text-xl font-semibold text-white mb-6">Place Your Bid</h2>

                        <BidInterface
                            invoiceId={parseInt(invoiceId)}
                            currentBid={auctionData.currentBid}
                            minPrice={auctionData.minBid}
                            endTime={Math.floor(auctionData.endTime.getTime() / 1000)}
                            onBidPlaced={loadAuctionData}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
