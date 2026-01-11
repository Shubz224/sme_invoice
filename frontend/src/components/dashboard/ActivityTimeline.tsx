'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Clock, TrendingUp, FileText } from 'lucide-react';
import { getProvider, getContracts, formatUSDY, getCurrentAccount } from '@/lib/blockchain';

interface Activity {
    id: string;
    type: 'invoice_created' | 'auction_start' | 'auction_settled' | 'stream_start';
    title: string;
    description: string;
    timestamp: string;
    status: 'success' | 'pending' | 'info';
    invoiceId: number;
}

const getIcon = (type: Activity['type']) => {
    switch (type) {
        case 'invoice_created': return FileText;
        case 'auction_start': return Clock;
        case 'auction_settled': return CheckCircle2;
        case 'stream_start': return TrendingUp;
        default: return CheckCircle2;
    }
};

const getStatusColor = (status: Activity['status']) => {
    switch (status) {
        case 'success': return 'text-[#10b981]';
        case 'pending': return 'text-[#f59e0b]';
        case 'info': return 'text-[#3b82f6]';
        default: return 'text-[#a1a1aa]';
    }
};

const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

export default function ActivityTimeline() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadActivities();
    }, []);

    const loadActivities = async () => {
        console.log('📊 Loading recent activities...');

        try {
            const account = await getCurrentAccount();
            if (!account) {
                setIsLoading(false);
                return;
            }

            const provider = getProvider();
            const contracts = getContracts(provider);

            const totalInvoices = await contracts.nft.getTotalInvoices();
            const activityList: Activity[] = [];

            // Load recent invoices (last 5)
            const startId = Math.max(1, totalInvoices.toNumber() - 4);

            for (let tokenId = totalInvoices.toNumber(); tokenId >= startId; tokenId--) {
                try {
                    const invoice = await contracts.nft.getInvoice(tokenId);

                    // Only show user's invoices
                    if (invoice.issuer.toLowerCase() !== account.toLowerCase()) {
                        continue;
                    }

                    const auction = await contracts.auction.getAuction(tokenId);
                    const createdDate = new Date(); // Approximate - would need block timestamp

                    // Invoice created
                    activityList.push({
                        id: `invoice-${tokenId}`,
                        type: 'invoice_created',
                        title: 'Invoice Created',
                        description: `Invoice #${tokenId} for ${formatUSDY(invoice.amount)} USDY`,
                        timestamp: formatTimestamp(createdDate),
                        status: 'success',
                        invoiceId: tokenId,
                    });

                    // Auction settled
                    if (auction.settled) {
                        activityList.push({
                            id: `settled-${tokenId}`,
                            type: 'auction_settled',
                            title: 'Auction Settled',
                            description: `Invoice #${tokenId} sold for ${formatUSDY(auction.highestBid)} USDY`,
                            timestamp: formatTimestamp(createdDate),
                            status: 'success',
                            invoiceId: tokenId,
                        });
                    }

                    // Stream started
                    if (invoice.isFinanced) {
                        try {
                            const stream = await contracts.streaming.getStreamInfo(tokenId);
                            if (stream.active) {
                                activityList.push({
                                    id: `stream-${tokenId}`,
                                    type: 'stream_start',
                                    title: 'Stream Started',
                                    description: `Repayment stream for Invoice #${tokenId} activated`,
                                    timestamp: formatTimestamp(createdDate),
                                    status: 'info',
                                    invoiceId: tokenId,
                                });
                            }
                        } catch (e) {
                            // No stream
                        }
                    }

                    // Auction active
                    if (!auction.settled && auction.endTime.toNumber() > Date.now() / 1000) {
                        activityList.push({
                            id: `auction-${tokenId}`,
                            type: 'auction_start',
                            title: 'Auction Active',
                            description: `Invoice #${tokenId} accepting bids`,
                            timestamp: formatTimestamp(createdDate),
                            status: 'pending',
                            invoiceId: tokenId,
                        });
                    }
                } catch (error) {
                    console.log(`⚠️  Error loading activity for invoice #${tokenId}:`, error);
                }
            }

            // Sort by most recent first
            activityList.sort((a, b) => b.invoiceId - a.invoiceId);

            setActivities(activityList.slice(0, 5)); // Show last 5 activities
            console.log('✅ Loaded', activityList.length, 'activities');

        } catch (error) {
            console.error('❌ Error loading activities:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="p-6 bg-[#0f0f0f] border-[rgba(255,255,255,0.05)]">
            <h2 className="text-lg font-semibold text-white mb-6">Recent Activity</h2>

            {isLoading && (
                <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">Loading activities...</p>
                </div>
            )}

            {!isLoading && activities.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">No recent activity</p>
                </div>
            )}

            {!isLoading && activities.length > 0 && (
                <div className="space-y-4">
                    {activities.map((activity) => {
                        const Icon = getIcon(activity.type);
                        const colorClass = getStatusColor(activity.status);

                        return (
                            <Link key={activity.id} href={`/invoices/${activity.invoiceId}`}>
                                <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-[#1a1a1a] transition-colors cursor-pointer group">
                                    <div className={`mt-0.5 ${colorClass}`}>
                                        <Icon size={18} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium text-white group-hover:text-[#6366f1] transition-colors">
                                            {activity.title}
                                        </h3>
                                        <p className="text-xs text-[#a1a1aa] mt-1">{activity.description}</p>
                                    </div>

                                    <span className="text-xs text-[#71717a] whitespace-nowrap">{activity.timestamp}</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
