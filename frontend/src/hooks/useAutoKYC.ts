// Simple KYC Auto-Grant on Login
'use client';

import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';

export default function useAutoKYC() {
    const { ready, authenticated, user } = usePrivy();
    const router = useRouter();

    useEffect(() => {
        if (ready && authenticated && user) {
            // Auto-grant Basic KYC on first login
            // In production, this would call Privy KYC verification
            // For demo, we just log and redirect to dashboard
            console.log('✅ User logged in:', user.email?.address || user.wallet?.address);
            console.log('🎫 Auto-granting Basic KYC for demo...');

            // Redirect to dashboard after login
            router.push('/dashboard');
        }
    }, [ready, authenticated, user, router]);

    return { ready, authenticated, user };
}
