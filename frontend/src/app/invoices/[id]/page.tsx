'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, DollarSign, User, FileText, Clock } from 'lucide-react';
import StatusBadge from '@/components/invoices/StatusBadge';

// Mock data - will be replaced with contract data
const mockInvoiceData = {
    '1': {
        invoiceNumber: '12',
        amount: 10000,
        buyer: 'Acme Corp',
        buyerEmail: 'finance@acme.com',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        description: 'Payment for Q4 2025 consulting services',
        status: 'streaming' as const,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        auctionDuration: 7,
        minDiscount: 8,
        settledAmount: 9200,
        progress: 45
    },
    '2': {
        invoiceNumber: '11',
        amount: 15000,
        buyer: 'TechStart Inc',
        buyerEmail: 'ap@techstart.io',
        dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        description: 'Software development services - Phase 2',
        status: 'in_auction' as const,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        auctionDuration: 7,
        minDiscount: 6,
        currentBid: 14100
    },
    '3': {
        invoiceNumber: '10',
        amount: 8000,
        buyer: 'Global Solutions',
        buyerEmail: 'billing@global.com',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        description: 'Marketing campaign execution',
        status: 'completed' as const,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        auctionDuration: 5,
        minDiscount: 10,
        settledAmount: 7200,
        progress: 100
    },
    '4': {
        invoiceNumber: '9',
        amount: 12000,
        buyer: 'Enterprise Co',
        buyerEmail: 'finance@enterprise.com',
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        description: 'Annual maintenance contract',
        status: 'settled' as const,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        auctionDuration: 7,
        minDiscount: 7,
        settledAmount: 11160
    }
};

export default function InvoiceDetailPage() {
    const params = useParams();
    const invoiceId = params?.id as string;
    const invoice = mockInvoiceData[invoiceId as keyof typeof mockInvoiceData];

    if (!invoice) {
        return (
            <div className="space-y-8">
                <Link href="/invoices" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                    <span>Back to Invoices</span>
                </Link>
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-white mb-2">Invoice Not Found</h1>
                    <p className="text-gray-400">The invoice you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    };

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

            {/* Main Content */}
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
                                    <p className="text-xs text-gray-500">{invoice.buyerEmail}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Clock size={24} className="text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Created</p>
                                    <p className="text-lg font-semibold text-white">{formatDate(invoice.createdAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-800">
                            <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                            <p className="text-white">{invoice.description}</p>
                        </div>
                    </div>

                    {/* Auction/Financing Details */}
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">Financing Details</h2>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Auction Duration</span>
                                <span className="text-white font-medium">{invoice.auctionDuration} days</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Minimum Discount</span>
                                <span className="text-white font-medium">{invoice.minDiscount}%</span>
                            </div>

                            {invoice.settledAmount && (
                                <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                                    <span className="text-gray-400">Settled Amount</span>
                                    <span className="text-xl font-bold text-green-400">{formatCurrency(invoice.settledAmount)}</span>
                                </div>
                            )}

                            {invoice.currentBid && (
                                <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                                    <span className="text-gray-400">Current Best Bid</span>
                                    <span className="text-xl font-bold text-yellow-400">{formatCurrency(invoice.currentBid)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Progress for Streaming */}
                    {invoice.status === 'streaming' && invoice.progress !== undefined && (
                        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
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
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 sticky top-24 space-y-4">
                        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>

                        {invoice.status === 'in_auction' && (
                            <Link href={`/auctions/${invoiceId}`}>
                                <button className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-all">
                                    View Auction
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

                        <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-all">
                            Download Invoice
                        </button>

                        <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-all">
                            View Contract
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
