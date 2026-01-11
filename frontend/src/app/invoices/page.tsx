'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, DollarSign } from 'lucide-react';
import { getProvider, getContracts, formatUSDY, getCurrentAccount } from '@/lib/blockchain';

interface InvoiceData {
    id: number;
    invoiceNumber: string;
    amount: string;
    buyer: string;
    dueDate: Date;
    status: 'in_auction' | 'settled' | 'streaming' | 'completed';
    progress?: number;
    currentBid?: string;
}

const filterOptions = [
    { value: 'all', label: 'All Invoices' },
    { value: 'in_auction', label: 'In Auction' },
    { value: 'streaming', label: 'Streaming' },
    { value: 'completed', label: 'Completed' },
];

const getStatusBadge = (status: string) => {
    const config = {
        in_auction: { label: 'In Auction', className: 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border-0' },
        settled: { label: 'Settled', className: 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6] border-0' },
        streaming: { label: 'Streaming', className: 'bg-[rgba(99,102,241,0.1)] text-[#6366f1] border-0' },
        completed: { label: 'Completed', className: 'bg-[rgba(16,185,129,0.1)] text-[#10b981] border-0' },
    };
    return config[status as keyof typeof config] || config.in_auction;
};

export default function InvoicesPage() {
    const [activeFilter, setActiveFilter] = useState('all');
    const [invoices, setInvoices] = useState<InvoiceData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        inAuction: 0,
        streaming: 0,
        completed: 0,
    });

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        console.log('📋 Loading user invoices...');
        setIsLoading(true);

        try {
            const account = await getCurrentAccount();
            if (!account) {
                console.log('⚠️  No wallet connected');
                setIsLoading(false);
                return;
            }

            console.log('👤 Loading invoices for:', account);

            const provider = getProvider();
            const contracts = getContracts(provider);

            const totalInvoices = await contracts.nft.getTotalInvoices();
            console.log('📊 Total invoices in system:', totalInvoices.toString());

            const userInvoices: InvoiceData[] = [];
            let inAuctionCount = 0;
            let streamingCount = 0;
            let completedCount = 0;

            for (let tokenId = 1; tokenId <= totalInvoices.toNumber(); tokenId++) {
                try {
                    const invoice = await contracts.nft.getInvoice(tokenId);

                    // Check if user is the issuer (creator) of this invoice
                    if (invoice.issuer.toLowerCase() !== account.toLowerCase()) {
                        continue;
                    }

                    const auction = await contracts.auction.getAuction(tokenId);

                    // Determine status
                    let status: InvoiceData['status'];
                    let progress: number | undefined;
                    let currentBid: string | undefined;

                    if (invoice.isPaid) {
                        status = 'completed';
                        completedCount++;
                    } else if (invoice.isFinanced) {
                        // Check if has active stream
                        try {
                            const stream = await contracts.streaming.getStreamInfo(tokenId);
                            if (stream.active) {
                                status = 'streaming';
                                streamingCount++;

                                // Calculate progress
                                const now = Math.floor(Date.now() / 1000);
                                const elapsed = now - stream.startTime.toNumber();
                                const duration = stream.endTime.toNumber() - stream.startTime.toNumber();
                                progress = Math.min(100, Math.floor((elapsed / duration) * 100));
                            } else {
                                status = 'settled';
                            }
                        } catch {
                            status = 'settled';
                        }
                    } else if (!auction.settled && auction.endTime.toNumber() > Date.now() / 1000) {
                        status = 'in_auction';
                        inAuctionCount++;
                        if (auction.highestBid.gt(0)) {
                            currentBid = formatUSDY(auction.highestBid);
                        }
                    } else {
                        status = 'settled';
                    }

                    userInvoices.push({
                        id: tokenId,
                        invoiceNumber: tokenId.toString(),
                        amount: formatUSDY(invoice.amount),
                        buyer: invoice.buyer,
                        dueDate: new Date(invoice.dueDate.toNumber() * 1000),
                        status,
                        progress,
                        currentBid,
                    });

                    console.log(`📄 Invoice #${tokenId}:`, {
                        amount: formatUSDY(invoice.amount),
                        buyer: invoice.buyer,
                        status,
                    });
                } catch (error) {
                    console.log(`⚠️  Error loading invoice #${tokenId}:`, error);
                }
            }

            setInvoices(userInvoices);
            setStats({
                total: userInvoices.length,
                inAuction: inAuctionCount,
                streaming: streamingCount,
                completed: completedCount,
            });

            console.log('✅ Loaded', userInvoices.length, 'invoices');

        } catch (error) {
            console.error('❌ Error loading invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredInvoices = activeFilter === 'all'
        ? invoices
        : invoices.filter(inv => inv.status === activeFilter);

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

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-[32px] font-semibold text-white tracking-tight">Invoices</h1>
                    <p className="text-sm text-[#a1a1aa] mt-2">Manage your invoice financing</p>
                </div>

                <Link href="/invoices/create">
                    <Button className="h-10 px-5 bg-[#6366f1] hover:bg-[#5558e3] text-white text-sm font-medium rounded-lg">
                        <Plus size={16} className="mr-2" />
                        Create Invoice
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-5 mb-8">
                <Card className="p-6 bg-[#0f0f0f] border-[rgba(255,255,255,0.05)] h-[120px] flex flex-col justify-between">
                    <p className="text-xs font-medium text-[#71717a] uppercase tracking-wide">Total</p>
                    <p className="text-[32px] font-semibold text-white leading-none">
                        {isLoading ? '...' : stats.total}
                    </p>
                </Card>
                <Card className="p-6 bg-[#0f0f0f] border-[rgba(255,255,255,0.05)] h-[120px] flex flex-col justify-between">
                    <p className="text-xs font-medium text-[#71717a] uppercase tracking-wide">In Auction</p>
                    <p className="text-[32px] font-semibold text-[#f59e0b] leading-none">
                        {isLoading ? '...' : stats.inAuction}
                    </p>
                </Card>
                <Card className="p-6 bg-[#0f0f0f] border-[rgba(255,255,255,0.05)] h-[120px] flex flex-col justify-between">
                    <p className="text-xs font-medium text-[#71717a] uppercase tracking-wide">Streaming</p>
                    <p className="text-[32px] font-semibold text-[#6366f1] leading-none">
                        {isLoading ? '...' : stats.streaming}
                    </p>
                </Card>
                <Card className="p-6 bg-[#0f0f0f] border-[rgba(255,255,255,0.05)] h-[120px] flex flex-col justify-between">
                    <p className="text-xs font-medium text-[#71717a] uppercase tracking-wide">Completed</p>
                    <p className="text-[32px] font-semibold text-[#10b981] leading-none">
                        {isLoading ? '...' : stats.completed}
                    </p>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                {filterOptions.map((option) => (
                    <Button
                        key={option.value}
                        onClick={() => setActiveFilter(option.value)}
                        variant={activeFilter === option.value ? "default" : "outline"}
                        className={`h-9 px-4 text-sm font-medium rounded-lg ${activeFilter === option.value
                            ? 'bg-[#6366f1] hover:bg-[#5558e3] text-white'
                            : 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[#a1a1aa] hover:bg-[rgba(255,255,255,0.08)] hover:text-white'
                            }`}
                    >
                        {option.label}
                    </Button>
                ))}
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="text-center py-12">
                    <p className="text-gray-400">Loading your invoices...</p>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && invoices.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-400 mb-4">No invoices yet</p>
                    <Link href="/invoices/create">
                        <Button className="bg-purple-500 hover:bg-purple-600">
                            Create Your First Invoice
                        </Button>
                    </Link>
                </div>
            )}

            {/* Invoice Grid */}
            {!isLoading && filteredInvoices.length > 0 && (
                <div className="grid grid-cols-2 gap-6">
                    {filteredInvoices.map((invoice) => {
                        const statusConfig = getStatusBadge(invoice.status);

                        return (
                            <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                                <Card className="p-6 bg-[#0f0f0f] border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-all cursor-pointer">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-base font-semibold text-white">Invoice #{invoice.invoiceNumber}</h3>
                                            <p className="text-sm text-[#a1a1aa] mt-1">{invoice.buyer}</p>
                                        </div>
                                        <Badge className={`text-[11px] font-medium uppercase tracking-wide px-2.5 py-1 rounded-full ${statusConfig.className}`}>
                                            {statusConfig.label}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-[#a1a1aa]">
                                            <DollarSign size={16} />
                                            <span className="text-white font-medium">{formatCurrency(invoice.amount)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#a1a1aa]">
                                            <Calendar size={16} />
                                            <span className="text-white font-medium">{formatDate(invoice.dueDate)}</span>
                                        </div>
                                    </div>

                                    {invoice.status === 'streaming' && invoice.progress !== undefined && (
                                        <div className="mt-4">
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="text-[#71717a]">Progress</span>
                                                <span className="text-[#6366f1] font-medium">{invoice.progress}%</span>
                                            </div>
                                            <div className="h-1 bg-[rgba(255,255,255,0.05)] rounded-sm overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] rounded-sm"
                                                    style={{ width: `${invoice.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {invoice.status === 'in_auction' && invoice.currentBid && (
                                        <div className="mt-4 text-sm">
                                            <span className="text-[#71717a]">Current Bid: </span>
                                            <span className="text-[#f59e0b] font-medium">{formatCurrency(invoice.currentBid)}</span>
                                        </div>
                                    )}
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
