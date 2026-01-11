'use client';

import { CheckCircle2, TrendingUp, Wallet, FileText, Shield } from 'lucide-react';

interface TimelineEvent {
    id: string;
    type: 'auction_start' | 'bid_placed' | 'auction_settled' | 'stream_start' | 'deposit' | 'claim';
    title: string;
    description: string;
    amount?: number;
    timestamp: Date;
    txHash?: string;
}

interface FinancialTimelineProps {
    events: TimelineEvent[];
}

export default function FinancialTimeline({ events }: FinancialTimelineProps) {
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
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const getIcon = (type: TimelineEvent['type']) => {
        switch (type) {
            case 'auction_start':
                return FileText;
            case 'bid_placed':
                return TrendingUp;
            case 'auction_settled':
                return CheckCircle2;
            case 'stream_start':
                return Shield;
            case 'deposit':
                return TrendingUp;
            case 'claim':
                return Wallet;
            default:
                return CheckCircle2;
        }
    };

    const getColor = (type: TimelineEvent['type']) => {
        switch (type) {
            case 'auction_start':
                return 'text-[#3b82f6] bg-[rgba(59,130,246,0.1)] border-[rgba(59,130,246,0.3)]';
            case 'bid_placed':
                return 'text-[#f59e0b] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.3)]';
            case 'auction_settled':
                return 'text-[#10b981] bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.3)]';
            case 'stream_start':
                return 'text-[#8b5cf6] bg-[rgba(139,92,246,0.1)] border-[rgba(139,92,246,0.3)]';
            case 'deposit':
                return 'text-[#3b82f6] bg-[rgba(59,130,246,0.1)] border-[rgba(59,130,246,0.3)]';
            case 'claim':
                return 'text-[#10b981] bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.3)]';
            default:
                return 'text-[#a1a1aa] bg-[rgba(161,161,170,0.1)] border-[rgba(161,161,170,0.3)]';
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-6">Financial Timeline</h2>

            <div className="space-y-5">
                {events.map((event, index) => {
                    const Icon = getIcon(event.type);
                    const colorClass = getColor(event.type);

                    return (
                        <div key={event.id} className="flex gap-4">
                            {/* Timeline Icon */}
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorClass}`}>
                                    <Icon size={18} />
                                </div>
                                {index < events.length - 1 && (
                                    <div className="w-0.5 h-full bg-[rgba(255,255,255,0.05)] mt-2"></div>
                                )}
                            </div>

                            {/* Event Content */}
                            <div className="flex-1 pb-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-white font-medium">{event.title}</h3>
                                        <p className="text-sm text-[#a1a1aa] mt-1">{event.description}</p>
                                        {event.amount && (
                                            <p className="text-lg font-semibold text-[#6366f1] mt-2">
                                                {formatCurrency(event.amount)}
                                            </p>
                                        )}
                                        {event.txHash && (
                                            <p className="text-xs text-[#71717a] mt-2 font-mono">
                                                Tx: {event.txHash.slice(0, 10)}...{event.txHash.slice(-8)}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-xs text-[#71717a]">{formatDate(event.timestamp)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
