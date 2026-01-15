// User Profile Page - Show KYC status and verification details
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import KYCBadge, { KYCLevel, KYCLevelIcon } from '@/components/kyc/KYCBadge';
import { useKYCStatus } from '@/hooks/useKYCStatus';
import { getCurrentAccount } from '@/lib/blockchain';
import { Calendar, Shield, TrendingUp, AlertCircle } from 'lucide-react';
import AccountSetup from '@/components/AccountSetup';

export default function ProfilePage() {
    const { kycStatus, refreshKYCStatus } = useKYCStatus();
    const [address, setAddress] = useState<string>('');

    useEffect(() => {
        loadAddress();
    }, []);

    const loadAddress = async () => {
        const account = await getCurrentAccount();
        if (account) setAddress(account);
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    };

    const formatCurrency = (value: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(Number(value));
    };

    const getUpgradePath = () => {
        const paths = {
            [KYCLevel.None]: {
                next: 'Basic',
                requirement: 'Email verification',
                limit: '$1,000',
            },
            [KYCLevel.Basic]: {
                next: 'Standard',
                requirement: 'ID verification',
                limit: '$10,000',
            },
            [KYCLevel.Standard]: {
                next: 'Enhanced',
                requirement: 'Full KYC',
                limit: '$50,000',
            },
            [KYCLevel.Enhanced]: {
                next: 'Institutional',
                requirement: 'Business verification (KYB)',
                limit: 'Unlimited',
            },
            [KYCLevel.Institutional]: null,
        };

        return paths[kycStatus.level];
    };

    const upgradePath = getUpgradePath();

    if (kycStatus.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-400">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
                <p className="text-gray-400">Manage your verification and account settings</p>
            </div>

            {/* Quick Account Setup - NEW! */}
            <AccountSetup />

            {/* Blacklist Warning */}
            {kycStatus.isBlacklisted && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="text-red-400 mt-1" size={24} />
                        <div>
                            <h3 className="text-lg font-semibold text-red-400 mb-2">Account Restricted</h3>
                            <p className="text-red-300">
                                Your account has been restricted due to compliance issues. Please contact support.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - KYC Status */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Current KYC Level */}
                    <Card className="p-6 bg-gray-900/50 border-gray-800">
                        <h2 className="text-xl font-semibold text-white mb-6">Verification Status</h2>

                        <div className="flex items-center gap-6 mb-6">
                            <KYCLevelIcon level={kycStatus.level} />
                            <div className="flex-1">
                                <KYCBadge level={kycStatus.level} showLimit />
                                <p className="text-sm text-gray-400 mt-2">
                                    {kycStatus.isValid ? 'Active' : 'Expired or Invalid'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                    <TrendingUp size={24} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Transaction Limit</p>
                                    <p className="text-xl font-bold text-white">
                                        {formatCurrency(kycStatus.maxAmount)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                    <Calendar size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Expires</p>
                                    <p className="text-lg font-semibold text-white">
                                        {formatDate(kycStatus.expiresAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Upgrade Path */}
                    {upgradePath && (
                        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/30">
                            <h2 className="text-xl font-semibold text-white mb-4">Upgrade Your Verification</h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-lg font-semibold text-white">
                                            {upgradePath.next} KYC
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            {upgradePath.requirement}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400">New Limit</p>
                                        <p className="text-lg font-bold text-purple-400">
                                            {upgradePath.limit}
                                        </p>
                                    </div>
                                </div>

                                <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                                    Start {upgradePath.next} Verification
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Account Info */}
                    <Card className="p-6 bg-gray-900/50 border-gray-800">
                        <h2 className="text-xl font-semibold text-white mb-6">Account Information</h2>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Wallet Address</p>
                                <p className="text-white font-mono text-sm break-all">
                                    {address || 'Not connected'}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-400 mb-1">Network</p>
                                <p className="text-white">Mantle Sepolia Testnet</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column - Quick Actions */}
                <div className="space-y-6">
                    <Card className="p-6 bg-gray-900/50 border-gray-800">
                        <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>

                        <div className="space-y-3">
                            <Button
                                className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                                onClick={refreshKYCStatus}
                            >
                                <Shield size={18} className="mr-2" />
                                Refresh Status
                            </Button>

                            <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white">
                                View Documents
                            </Button>

                            <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white">
                                Download Data (GDPR)
                            </Button>

                            <Button className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30">
                                Delete Account
                            </Button>
                        </div>
                    </Card>

                    {/* Verification Levels Guide */}
                    <Card className="p-6 bg-gray-900/50 border-gray-800">
                        <h2 className="text-lg font-semibold text-white mb-4">Verification Levels</h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">📧 Basic</span>
                                <span className="text-white">$1k</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">🆔 Standard</span>
                                <span className="text-white">$10k</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">✅ Enhanced</span>
                                <span className="text-white">$50k</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">🏢 Institutional</span>
                                <span className="text-white">Unlimited</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
