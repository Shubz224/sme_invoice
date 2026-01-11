'use client';

import { InvoiceFormData } from './InvoiceForm';
import { Calendar, DollarSign, User, Clock, Percent } from 'lucide-react';

interface InvoicePreviewProps {
    data: InvoiceFormData;
}

export default function InvoicePreview({ data }: InvoicePreviewProps) {
    const formatCurrency = (value: string) => {
        const num = Number(value);
        if (isNaN(num)) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const calculateMinBid = () => {
        const amount = Number(data.amount) || 0;
        const discount = Number(data.minDiscountPercent) || 0;
        return amount * (1 - discount / 100);
    };

    const calculateCostOfCapital = () => {
        const dueDate = new Date(data.dueDate);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue <= 0) return 0;

        const discount = Number(data.minDiscountPercent) || 0;
        const annualizedRate = (discount / daysUntilDue) * 365;
        return annualizedRate;
    };

    return (
        <div className="sticky top-24">
            <div className="bg-gradient-to-br from-[rgba(99,102,241,0.1)] to-transparent border border-[rgba(99,102,241,0.3)] rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Live Preview</h3>
                    <div className="px-3 py-1 bg-[rgba(16,185,129,0.2)] border border-[rgba(16,185,129,0.3)] rounded-lg">
                        <span className="text-xs text-[#10b981] font-medium">Draft</span>
                    </div>
                </div>

                {/* Invoice Amount - Prominent */}
                <div className="bg-[#0f0f0f] rounded-xl p-4 border border-[rgba(255,255,255,0.05)]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[rgba(99,102,241,0.2)] rounded-lg flex items-center justify-center">
                            <DollarSign size={20} className="text-[#6366f1]" />
                        </div>
                        <div>
                            <p className="text-xs text-[#71717a]">Invoice Amount</p>
                            <p className="text-2xl font-bold text-white">
                                {data.amount ? formatCurrency(data.amount) : '$0'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <User size={16} className="text-[#71717a] mt-1" />
                        <div className="flex-1">
                            <p className="text-xs text-[#71717a]">Buyer</p>
                            <p className="text-sm text-white font-medium">
                                {data.buyer || 'Not specified'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Calendar size={16} className="text-[#71717a] mt-1" />
                        <div className="flex-1">
                            <p className="text-xs text-[#71717a]">Due Date</p>
                            <p className="text-sm text-white font-medium">
                                {formatDate(data.dueDate)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Clock size={16} className="text-[#71717a] mt-1" />
                        <div className="flex-1">
                            <p className="text-xs text-[#71717a]">Auction Duration</p>
                            <p className="text-sm text-white font-medium">
                                {data.auctionDuration || '0'} days
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Percent size={16} className="text-[#71717a] mt-1" />
                        <div className="flex-1">
                            <p className="text-xs text-[#71717a]">Min Discount</p>
                            <p className="text-sm text-white font-medium">
                                {data.minDiscountPercent || '0'}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Calculated Values */}
                {data.amount && data.minDiscountPercent && (
                    <div className="border-t border-[rgba(255,255,255,0.05)] pt-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-[#a1a1aa]">You'll Receive (min)</span>
                            <span className="text-lg font-semibold text-[#10b981]">
                                {formatCurrency(calculateMinBid().toString())}
                            </span>
                        </div>

                        {data.dueDate && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[#a1a1aa]">Est. Annual Cost</span>
                                <span className="text-lg font-semibold text-[#f59e0b]">
                                    ~{calculateCostOfCapital().toFixed(1)}%
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Description Preview */}
                {data.description && (
                    <div className="border-t border-[rgba(255,255,255,0.05)] pt-4">
                        <p className="text-xs text-[#71717a] mb-2">Description</p>
                        <p className="text-sm text-[#a1a1aa] line-clamp-3">
                            {data.description}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
