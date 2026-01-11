'use client';

import Link from 'next/link';
import CountdownTimer from './CountdownTimer';
import { ArrowRight } from 'lucide-react';

interface AuctionCardProps {
    id: string;
    invoiceNumber: string;
    amount: number;
    minBid: number;
    currentBid?: number;
    endTime: Date;
    status: 'active' | 'ending_soon' | 'ended';
}

export default function AuctionCard({
    id,
    invoiceNumber,
    amount,
    minBid,
    currentBid,
    endTime,
    status
}: AuctionCardProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getStatusColor = () => {
        switch (status) {
            case 'ending_soon':
                return 'border-yellow-500/30 bg-yellow-500/5';
            case 'ended':
                return 'border-gray-500/30 bg-gray-500/5';
            default:
                return 'border-purple-500/30 bg-purple-500/5';
        }
    };

    return (
        <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className={`relative bg-gray-900/50 backdrop-blur-sm border rounded-2xl p-6 hover:border-purple-500/50 transition-all ${getStatusColor()}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-white mb-1">
                            Invoice #{invoiceNumber}
                        </h3>
                        <p className="text-sm text-gray-400">Face Value: {formatCurrency(amount)}</p>
                    </div>

                    {status !== 'ended' && (
                        <CountdownTimer endTime={endTime} />
                    )}
                </div>

                {/* Bid Info */}
                <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Minimum Bid</span>
                        <span className="text-lg font-semibold text-white">{formatCurrency(minBid)}</span>
                    </div>

                    {currentBid && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Current Best</span>
                            <span className="text-lg font-semibold text-purple-400">{formatCurrency(currentBid)}</span>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <Link href={`/auctions/${id}`}>
                    <button className="w-full px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 rounded-lg transition-all flex items-center justify-center gap-2 group/btn">
                        <span className="text-purple-400 font-medium">
                            {status === 'ended' ? 'View Details' : 'Place Bid'}
                        </span>
                        <ArrowRight size={18} className="text-purple-400 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </Link>
            </div>
        </div>
    );
}
