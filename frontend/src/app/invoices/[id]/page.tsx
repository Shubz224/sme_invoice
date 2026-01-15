'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, DollarSign, User, Clock, Timer } from 'lucide-react';
import StatusBadge from '@/components/invoices/StatusBadge';
import { getProvider, getContracts, formatUSDY } from '@/lib/blockchain';
import CountdownTimer from '@/components/auctions/CountdownTimer';

interface InvoiceDetail {
    id: number;
    invoiceNumber: string;
    amount: string;
    buyer: string;
    dueDate: Date;
    description: string;
    status: 'draft' | 'in_auction' | 'settled' | 'streaming' | 'completed';
    isFinanced: boolean;
    isPaid: boolean;
    auctionEndTime?: Date;
    currentBid?: string;
    minBid?: string;
    settledAmount?: string;
    progress?: number;
}

export default function InvoiceDetailPage() {
    const params = useParams();
    const invoiceId = params?.id as string;
    const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (invoiceId) {
            loadInvoiceDetails();
        }
    }, [invoiceId]);

    const loadInvoiceDetails = async () => {
        console.log(`📄 Loading invoice #${invoiceId} details...`);
        setIsLoading(true);
        setError(null);

        try {
            const provider = getProvider();
            const contracts = getContracts(provider);

            // Fetch invoice data
            const invoiceData = await contracts.nft.getInvoice(parseInt(invoiceId));
            const auctionData = await contracts.auction.getAuction(parseInt(invoiceId));

            // Determine status
            let status: InvoiceDetail['status'] = 'draft';
            let progress: number | undefined;
            let currentBid: string | undefined;
            let settledAmount: string | undefined;

            if (invoiceData.isPaid) {
                status = 'completed';
            } else if (invoiceData.isFinanced) {
                // Check for active stream
                try {
                    const stream = await contracts.streaming.getStreamInfo(parseInt(invoiceId));
                    if (stream.active) {
                        status = 'streaming';
                        const now = Math.floor(Date.now() / 1000);
                        const elapsed = now - stream.startTime.toNumber();
                        const duration = stream.endTime.toNumber() - stream.startTime.toNumber();
                        progress = Math.min(100, Math.floor((elapsed / duration) * 100));
                    } else {
                        status = 'settled';
                    }
                    settledAmount = formatUSDY(stream.totalAmount);
                } catch {
                    status = 'settled';
                }
            } else if (!auctionData.settled && auctionData.endTime.toNumber() > Date.now() / 1000) {
                status = 'in_auction';
                if (auctionData.highestBid.gt(0)) {
                    currentBid = formatUSDY(auctionData.highestBid);
                }
            } else if (auctionData.settled) {
                status = 'settled';
                settledAmount = formatUSDY(auctionData.highestBid);
            }

            const invoiceDetails: InvoiceDetail = {
                id: parseInt(invoiceId),
                invoiceNumber: invoiceId,
                amount: formatUSDY(invoiceData.amount),
                buyer: invoiceData.buyerId, // Using buyerId from contract
                dueDate: new Date(invoiceData.dueDate.toNumber() * 1000),
                description: invoiceData.documentURI,
                status,
                isFinanced: invoiceData.isFinanced,
                isPaid: invoiceData.isPaid,
                auctionEndTime: new Date(auctionData.endTime.toNumber() * 1000),
                currentBid,
                minBid: formatUSDY(auctionData.minPrice),
                settledAmount,
                progress,
            };

            setInvoice(invoiceDetails);
            console.log('✅ Invoice details loaded:', invoiceDetails);

        } catch (err: any) {
            console.error('❌ Error loading invoice:', err);
            setError(err.message || 'Failed to load invoice');
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

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Link href="/invoices" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                    <span>Back to Invoices</span>
                </Link>
                <div className="text-center py-12">
                    <p className="text-gray-400">Loading invoice details...</p>
                </div>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="space-y-8">
                <Link href="/invoices" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                    <span>Back to Invoices</span>
                </Link>
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-white mb-2">Invoice Not Found</h1>
                    <p className="text-gray-400">{error || "The invoice you're looking for doesn't exist."}</p>
                </div>
            </div>
        );
    }

    const isAuctionActive = invoice.status === 'in_auction' && invoice.auctionEndTime && invoice.auctionEndTime > new Date();

    return (
        <div className="space-y-8">
            {/* Back Button */}
            <Link href="/invoices" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
                <span>Back to Invoices</span>
            </Link>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Invoice #{invoice.invoiceNumber}
                    </h1>
                    <p className="text-gray-400">{invoice.description}</p>
                </div>

                <StatusBadge status={invoice.status} />
            </div>

            {/* Auction Countdown - Prominent if active */}
            {isAuctionActive && invoice.auctionEndTime && (
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-2 border-purple-500/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Timer size={32} className="text-purple-400" />
                            <div>
                                <h3 className="text-lg font-semibold text-white">Auction Ending In</h3>
                                <p className="text-sm text-gray-400">Place your bid before time runs out</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-purple-400">
                                <CountdownTimer endTime={invoice.auctionEndTime} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Invoice Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Invoice Info Card */}
                    <div className="bg-[#0f0f0f] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Invoice Details</h2>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <DollarSign size={24} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Invoice Amount</p>
                                    <p className="text-2xl font-bold text-white">{formatCurrency(invoice.amount)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Calendar size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Due Date</p>
                                    <p className="text-lg font-semibold text-white">{formatDate(invoice.dueDate)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <User size={24} className="text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Buyer</p>
                                    <p className="text-lg font-semibold text-white">{invoice.buyer}</p>
                                </div>
                            </div>

                            {invoice.auctionEndTime && (
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Clock size={24} className="text-yellow-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">Auction Ends</p>
                                        <p className="text-lg font-semibold text-white">{formatDate(invoice.auctionEndTime)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Auction Details */}
                    {invoice.status === 'in_auction' && (
                        <div className="bg-[#0f0f0f] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-6">Auction Details</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Minimum Bid</span>
                                    <span className="text-white font-medium">{formatCurrency(invoice.minBid || '0')}</span>
                                </div>

                                {invoice.currentBid && (
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                                        <span className="text-gray-400">Current Best Bid</span>
                                        <span className="text-xl font-bold text-yellow-400">{formatCurrency(invoice.currentBid)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Streaming Progress */}
                    {invoice.status === 'streaming' && invoice.progress !== undefined && (
                        <div className="bg-[#0f0f0f] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6">
                            <h2 className="text-xl font-semibold text-white mb-6">Repayment Progress</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Progress</span>
                                    <span className="text-purple-400 font-medium">{invoice.progress}%</span>
                                </div>

                                <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all"
                                        style={{ width: `${invoice.progress}%` }}
                                    ></div>
                                </div>

                                <Link href={`/streams/${invoiceId}`}>
                                    <button className="w-full mt-4 px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 font-medium transition-all">
                                        View Stream Details →
                                    </button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Quick Actions */}
                <div className="lg:col-span-1">
                    <div className="bg-[#0f0f0f] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 sticky top-24 space-y-4">
                        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>

                        {invoice.status === 'in_auction' && (
                            <Link href={`/auctions/${invoiceId}`}>
                                <button className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-all">
                                    View Auction & Bid
                                </button>
                            </Link>
                        )}

                        {invoice.status === 'streaming' && (
                            <Link href={`/streams/${invoiceId}`}>
                                <button className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-all">
                                    Manage Stream
                                </button>
                            </Link>
                        )}

                        <Link href="/invoices">
                            <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-all">
                                Back to All Invoices
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
