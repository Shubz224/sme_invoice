'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import FinancialTimeline from '@/components/transactions/FinancialTimeline';
import ComplianceBadge from '@/components/transactions/ComplianceBadge';

// Mock transaction data
const mockTransactionData = {
    '1': {
        invoiceNumber: '12',
        amount: 10000,
        buyer: 'Acme Corp',
        status: 'streaming',
        timeline: [
            {
                id: '1',
                type: 'auction_start' as const,
                title: 'Auction Started',
                description: 'Invoice submitted for financing',
                timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                txHash: '0x1234567890abcdef1234567890abcdef12345678'
            },
            {
                id: '2',
                type: 'bid_placed' as const,
                title: 'Bid Placed',
                description: 'Investor placed winning bid',
                amount: 9200,
                timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                txHash: '0xabcdef1234567890abcdef1234567890abcdef12'
            },
            {
                id: '3',
                type: 'auction_settled' as const,
                title: 'Auction Settled',
                description: 'Funds transferred to SME',
                amount: 9200,
                timestamp: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
                txHash: '0x567890abcdef1234567890abcdef1234567890ab'
            },
            {
                id: '4',
                type: 'stream_start' as const,
                title: 'Stream Started',
                description: 'Repayment stream activated',
                timestamp: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
                txHash: '0xcdef1234567890abcdef1234567890abcdef1234'
            },
            {
                id: '5',
                type: 'deposit' as const,
                title: 'Stream Deposit',
                description: 'Buyer deposited repayment',
                amount: 2000,
                timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                txHash: '0x234567890abcdef1234567890abcdef1234567890'
            },
            {
                id: '6',
                type: 'claim' as const,
                title: 'Funds Claimed',
                description: 'Investor claimed streaming payment',
                amount: 1667,
                timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
                txHash: '0x7890abcdef1234567890abcdef1234567890abcd'
            }
        ],
        compliance: [
            { label: 'Auction Settled', status: 'verified' as const },
            { label: 'Stream Funded', status: 'verified' as const },
            { label: 'Claims Active', status: 'verified' as const },
            { label: 'Contract Verified', status: 'verified' as const },
            { label: 'KYC Complete', status: 'verified' as const },
            { label: 'AML Verified', status: 'pending' as const }
        ]
    }
};

export default function TransactionDetailPage() {
    const params = useParams();
    const txId = params?.id as string;
    const transaction = mockTransactionData[txId as keyof typeof mockTransactionData];

    if (!transaction) {
        return (
            <div className="space-y-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                    <span>Back to Dashboard</span>
                </Link>
                <div className="text-center py-12">
                    <h1 className="text-2xl font-bold text-white mb-2">Transaction Not Found</h1>
                    <p className="text-gray-400">The transaction you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Back Button */}
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors">
                <ArrowLeft size={18} />
                <span className="text-sm">Back to Dashboard</span>
            </Link>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[32px] font-semibold text-white tracking-tight">
                    Transaction Details - Invoice #{transaction.invoiceNumber}
                </h1>
                <p className="text-sm text-[#a1a1aa] mt-2">Complete transaction history and compliance status</p>
            </div>

            {/* Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Financial Timeline */}
                <div className="bg-[#0f0f0f] border border-[rgba(255,255,255,0.05)] rounded-xl p-6">
                    <FinancialTimeline events={transaction.timeline} />
                </div>

                {/* Right Column - Compliance & Trust */}
                <div className="bg-[#0f0f0f] border border-[rgba(255,255,255,0.05)] rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Compliance & Integrity</h2>

                    <div className="space-y-3">
                        {transaction.compliance.map((item, index) => (
                            <ComplianceBadge
                                key={index}
                                label={item.label}
                                status={item.status}
                            />
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.05)]">
                        <h3 className="text-sm font-medium text-[#71717a] uppercase tracking-wide mb-4">Trust Indicators</h3>
                        <div className="space-y-3 text-sm text-[#a1a1aa]">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#10b981] rounded-full"></div>
                                <span>Smart contract verified on Mantle</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#10b981] rounded-full"></div>
                                <span>All transactions on-chain</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#10b981] rounded-full"></div>
                                <span>Automated escrow protection</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-[#f59e0b] rounded-full"></div>
                                <span>Compliance audit in progress</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
