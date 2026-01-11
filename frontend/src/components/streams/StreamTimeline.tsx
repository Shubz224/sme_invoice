'use client';

import { CheckCircle2, TrendingUp, Wallet } from 'lucide-react';

interface StreamEvent {
    id: string;
    type: 'deposit' | 'claim';
    amount: number;
    timestamp: Date;
    txHash?: string;
}

interface StreamTimelineProps {
    events: StreamEvent[];
}

export default function StreamTimeline({ events }: StreamTimelineProps) {
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

    const getIcon = (type: StreamEvent['type']) => {
        return type === 'deposit' ? TrendingUp : Wallet;
    };

    const getColor = (type: StreamEvent['type']) => {
        return type === 'deposit'
            ? 'text-blue-400 bg-blue-500/10 border-blue-500/30'
            : 'text-green-400 bg-green-500/10 border-green-500/30';
    };

    return (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Stream Activity</h2>

            <div className="space-y-4">
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
                                    <div className="w-0.5 h-full bg-gray-800 mt-2"></div>
                                )}
                            </div>

                            {/* Event Content */}
                            <div className="flex-1 pb-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-white font-medium">
                                            {event.type === 'deposit' ? 'Stream Deposit' : 'Funds Claimed'}
                                        </h3>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {formatCurrency(event.amount)} USDY
                                        </p>
                                        {event.txHash && (
                                            <p className="text-xs text-gray-500 mt-1 font-mono">
                                                {event.txHash.slice(0, 10)}...{event.txHash.slice(-8)}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500">{formatDate(event.timestamp)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
