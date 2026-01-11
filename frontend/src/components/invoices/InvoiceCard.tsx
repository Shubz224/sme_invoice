'use client';

import Link from 'next/link';
import StatusBadge from './StatusBadge';
import { Calendar, DollarSign, ArrowRight } from 'lucide-react';

interface InvoiceCardProps {
    id: string;
    invoiceNumber: string;
    amount: number;
    buyer: string;
    dueDate: Date;
    status: 'draft' | 'in_auction' | 'settled' | 'streaming' | 'completed';
    currentBid?: number;
    progress?: number;
}

export default function InvoiceCard({
    id,
    invoiceNumber,
    amount,
    buyer,
    dueDate,
    status,
    currentBid,
    progress
}: InvoiceCardProps) {
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
        <Link href={`/invoices/${id}`}>
            <div className="bg-gray-900/50 border border-gray-800 hover:border-purple-500/30 rounded-2xl p-6 transition-all group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-white mb-1">
                            Invoice #{invoiceNumber}
                        </h3>
                        <p className="text-sm text-gray-400">{buyer}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <StatusBadge status={status} />
                        <ArrowRight size={20} className="text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-400">Amount</p>
                            <p className="text-lg font-semibold text-white">{formatCurrency(amount)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <div>
                            <p className="text-xs text-gray-400">Due Date</p>
                            <p className="text-sm font-medium text-white">{formatDate(dueDate)}</p>
                        </div>
                    </div>
                </div>

                {/* Status-specific Info */}
                {status === 'in_auction' && currentBid && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-xs text-yellow-400">Current Best Bid</p>
                        <p className="text-lg font-bold text-yellow-400">{formatCurrency(currentBid)}</p>
                    </div>
                )}

                {status === 'streaming' && progress !== undefined && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Repayment Progress</span>
                            <span className="text-purple-400 font-medium">{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {status === 'completed' && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <p className="text-sm text-green-400 font-medium">✓ Fully Repaid</p>
                    </div>
                )}
            </div>
        </Link>
    );
}
