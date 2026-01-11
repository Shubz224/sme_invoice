// Privy Provider Wrapper
'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { ReactNode } from 'react';

export default function PrivyAuthProvider({ children }: { children: ReactNode }) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

    if (!appId) {
        console.warn('⚠️ NEXT_PUBLIC_PRIVY_APP_ID not set - Privy disabled');
        return <>{children}</>;
    }

    return (
        <PrivyProvider
            appId={appId}
            config={{
                loginMethods: ['email', 'wallet', 'google'],
                appearance: {
                    theme: 'dark',
                    accentColor: '#6366f1',
                },
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets',
                    },
                },
            }}
        >
            {children}
        </PrivyProvider>
    );
}
