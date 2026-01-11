'use client';

import { useState, useEffect } from 'react';
import MetricCard from '@/components/dashboard/MetricCard';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import { getProvider, getContracts, formatUSDY, getCurrentAccount } from '@/lib/blockchain';

export default function SMEDashboard() {
    const [metrics, setMetrics] = useState({
        totalInvoices: 0,
        capitalRaised: '0',
        activeStreams: 0,
        avgDiscount: '0',
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        console.log('📊 Loading dashboard data...');
        setIsLoading(true);

        try {
            const account = await getCurrentAccount();
            if (!account) {
                console.log('⚠️  No wallet connected');
                setIsLoading(false);
                return;
            }

            console.log('👤 Loading data for:', account);

            const provider = getProvider();
            const contracts = getContracts(provider);

            // Get total invoices in system
            const totalInvoices = await contracts.nft.getTotalInvoices();
            console.log('📋 Total invoices in system:', totalInvoices.toString());

            let userInvoiceCount = 0;
            let totalRaised = 0;
            let totalDiscount = 0;
            let discountCount = 0;
            let activeStreamCount = 0;

            // Check each invoice to see if user is the issuer
            for (let tokenId = 1; tokenId <= totalInvoices.toNumber(); tokenId++) {
                try {
                    const invoice = await contracts.nft.getInvoice(tokenId);

                    // Check if user is the issuer (creator) of this invoice
                    if (invoice.issuer.toLowerCase() !== account.toLowerCase()) {
                        continue;
                    }

                    userInvoiceCount++;

                    console.log(`📄 Invoice #${tokenId}:`, {
                        amount: formatUSDY(invoice.amount),
                        isFinanced: invoice.isFinanced,
                        isPaid: invoice.isPaid,
                    });

                    // If financed, get auction data to calculate capital raised
                    if (invoice.isFinanced) {
                        const auction = await contracts.auction.getAuction(tokenId);
                        const raised = parseFloat(formatUSDY(auction.highestBid));
                        totalRaised += raised;

                        // Calculate discount
                        const invoiceAmount = parseFloat(formatUSDY(invoice.amount));
                        const discount = ((invoiceAmount - raised) / invoiceAmount) * 100;
                        totalDiscount += discount;
                        discountCount++;

                        console.log(`💰 Invoice #${tokenId} raised:`, raised, 'USDY');
                    }

                    // Check if has active stream
                    if (invoice.isFinanced && !invoice.isPaid) {
                        try {
                            const stream = await contracts.streaming.getStreamInfo(tokenId);
                            if (stream.active) {
                                activeStreamCount++;
                                console.log(`🌊 Active stream for invoice #${tokenId}`);
                            }
                        } catch (e) {
                            // No stream or error
                        }
                    }
                } catch (error) {
                    console.log(`⚠️  Error loading invoice #${tokenId}:`, error);
                }
            }

            console.log('📊 User owns', userInvoiceCount, 'invoices');

            const avgDiscount = discountCount > 0 ? (totalDiscount / discountCount).toFixed(1) : '0';

            setMetrics({
                totalInvoices: userInvoiceCount,
                capitalRaised: totalRaised.toFixed(0),
                activeStreams: activeStreamCount,
                avgDiscount,
            });

            console.log('✅ Dashboard data loaded:', {
                totalInvoices: userInvoiceCount,
                capitalRaised: totalRaised.toFixed(0),
                activeStreams: activeStreamCount,
                avgDiscount: avgDiscount + '%',
            });

        } catch (error) {
            console.error('❌ Error loading dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-gray-400">
                        Overview of your invoice financing activity
                    </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Invoices"
                        value={isLoading ? '...' : metrics.totalInvoices.toString()}
                        subtitle={`${metrics.activeStreams} active streams`}
                    />

                    <MetricCard
                        title="Capital Raised"
                        value={isLoading ? '...' : `$${metrics.capitalRaised}`}
                        subtitle="Total financed"
                    />

                    <MetricCard
                        title="Active Streams"
                        value={isLoading ? '...' : metrics.activeStreams.toString()}
                        subtitle="Repayments in progress"
                    />

                    <MetricCard
                        title="Avg Cost of Capital"
                        value={isLoading ? '...' : `${metrics.avgDiscount}%`}
                        subtitle="Average discount rate"
                    />
                </div>

                {/* Activity Timeline */}
                <ActivityTimeline />
            </div>
        </div>
    );
}
