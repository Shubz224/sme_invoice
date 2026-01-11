'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import StreamProgress from '@/components/streams/StreamProgress';
import ClaimButton from '@/components/streams/ClaimButton';
import { getProvider, getContracts, formatUSDY } from '@/lib/blockchain';

interface StreamData {
    invoiceNumber: string;
    totalAmount: string;
    claimedAmount: string;
    availableAmount: string;
    buyer: string;
    startDate: Date;
    status: string;
    isLoading: boolean;
}

export default function StreamDetailPage() {
    const params = useParams();
    const invoiceId = params.id as string;

    const [streamData, setStreamData] = useState<StreamData>({
        invoiceNumber: invoiceId,
        totalAmount: '0',
        claimedAmount: '0',
        availableAmount: '0',
        buyer: '',
        startDate: new Date(),
        status: 'Active',
        isLoading: true,
    });

    useEffect(() => {
        loadStreamData();
    }, [invoiceId]);

    const loadStreamData = async () => {
        console.log('🌊 Loading stream details for invoice #' + invoiceId);

        try {
            const provider = getProvider();
            const contracts = getContracts(provider);

            const invoice = await contracts.nft.getInvoice(invoiceId);
            const stream = await contracts.streaming.getStreamInfo(invoiceId);
            const availableAmount = await contracts.streaming.getClaimableAmount(invoiceId);

            console.log('📊 Stream data:', {
                total: formatUSDY(stream.totalAmount),
                claimed: formatUSDY(stream.claimedAmount),
                available: formatUSDY(availableAmount),
                active: stream.active,
            });

            setStreamData({
                invoiceNumber: invoiceId,
                totalAmount: formatUSDY(stream.totalAmount),
                claimedAmount: formatUSDY(stream.claimedAmount),
                availableAmount: formatUSDY(availableAmount),
                buyer: invoice.buyer,
                startDate: new Date(stream.startTime.toNumber() * 1000),
                status: stream.active ? 'Active' : 'Completed',
                isLoading: false,
            });

            console.log('✅ Stream details loaded');

        } catch (error) {
            console.error('❌ Error loading stream:', error);
            setStreamData(prev => ({ ...prev, isLoading: false }));
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

    if (streamData.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-400">Loading stream details...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Back Button */}
            <Link href="/streams" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
                <span>Back to Streams</span>
            </Link>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                    Invoice #{streamData.invoiceNumber} - Streaming Repayment
                </h1>
                <p className="text-gray-400">Monitor and claim your streaming payments</p>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Stream Visualization */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Progress Card */}
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Repayment Stream</h2>

                        <StreamProgress
                            totalAmount={parseFloat(streamData.totalAmount)}
                            claimedAmount={parseFloat(streamData.claimedAmount)}
                            availableAmount={parseFloat(streamData.availableAmount)}
                        />
                    </div>

                    {/* Invoice Info */}
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Invoice Details</h2>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <DollarSign size={24} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Total Value</p>
                                    <p className="text-xl font-bold text-white">{formatCurrency(streamData.totalAmount)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Calendar size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Started</p>
                                    <p className="text-lg font-semibold text-white">{formatDate(streamData.startDate)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <FileText size={24} className="text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Buyer</p>
                                    <p className="text-lg font-semibold text-white">{streamData.buyer}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <TrendingUp size={24} className="text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Status</p>
                                    <p className={`text-lg font-semibold ${streamData.status === 'Active' ? 'text-green-400' : 'text-gray-400'}`}>
                                        {streamData.status}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Stream Statistics</h2>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Total Amount</p>
                                <p className="text-lg font-semibold text-white">{formatCurrency(streamData.totalAmount)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Claimed</p>
                                <p className="text-lg font-semibold text-green-400">{formatCurrency(streamData.claimedAmount)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Remaining</p>
                                <p className="text-lg font-semibold text-purple-400">
                                    {formatCurrency(parseFloat(streamData.totalAmount) - parseFloat(streamData.claimedAmount))}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Claim Interface */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sticky top-24 space-y-6">
                        <h2 className="text-xl font-semibold text-white">Claim Funds</h2>

                        <ClaimButton
                            invoiceId={parseInt(invoiceId)}
                            onClaimed={loadStreamData}
                        />

                        <div className="text-xs text-gray-500 text-center">
                            Funds stream continuously. Claim anytime to receive accumulated payments.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
