// KYC Status Hook - Check user's KYC level and limits
'use client';

import { useState, useEffect } from 'react';
import { getProvider, getContracts, getCurrentAccount } from '@/lib/blockchain';
import { KYCLevel } from '@/components/kyc/KYCBadge';

interface KYCStatus {
    level: KYCLevel;
    isValid: boolean;
    maxAmount: string;
    expiresAt: Date | null;
    isBlacklisted: boolean;
    isLoading: boolean;
}

export function useKYCStatus() {
    const [kycStatus, setKYCStatus] = useState<KYCStatus>({
        level: KYCLevel.None,
        isValid: false,
        maxAmount: '0',
        expiresAt: null,
        isBlacklisted: false,
        isLoading: true,
    });

    useEffect(() => {
        loadKYCStatus();
    }, []);

    const loadKYCStatus = async () => {
        console.log('🔐 Loading KYC status...');

        try {
            const account = await getCurrentAccount();
            if (!account) {
                setKYCStatus(prev => ({ ...prev, isLoading: false }));
                return;
            }

            const provider = getProvider();
            const contracts = getContracts(provider);

            // Check if KYCBridge exists in contracts
            if (!contracts.kycBridge) {
                console.log('⚠️ KYCBridge not configured - KYC features disabled');
                setKYCStatus(prev => ({ ...prev, isLoading: false }));
                return;
            }

            // Get KYC profile
            const profile = await contracts.kycBridge.getKYCProfile(account);
            const isValid = await contracts.kycBridge.isKYCValid(account);
            const maxAmount = await contracts.kycBridge.getMaxTransactionAmount(account);

            console.log('📊 KYC Profile:', {
                level: profile.level,
                isValid,
                maxAmount: maxAmount.toString(),
                expiresAt: new Date(profile.expiresAt.toNumber() * 1000),
            });

            setKYCStatus({
                level: profile.level as KYCLevel,
                isValid,
                maxAmount: (Number(maxAmount) / 1e6).toFixed(0), // Convert from 6 decimals
                expiresAt: profile.expiresAt.toNumber() > 0
                    ? new Date(profile.expiresAt.toNumber() * 1000)
                    : null,
                isBlacklisted: profile.isBlacklisted,
                isLoading: false,
            });

            console.log('✅ KYC status loaded');

        } catch (error: any) {
            console.error('❌ Error loading KYC status:', error.message || error);
            // Set default state on error
            setKYCStatus({
                level: KYCLevel.None,
                isValid: false,
                maxAmount: '0',
                expiresAt: null,
                isBlacklisted: false,
                isLoading: false,
            });
        }
    };

    const refreshKYCStatus = () => {
        setKYCStatus(prev => ({ ...prev, isLoading: true }));
        loadKYCStatus();
    };

    return { kycStatus, refreshKYCStatus };
}
