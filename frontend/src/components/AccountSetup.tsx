'use client';

import { useState, useEffect } from 'react';
import { getSigner, getContracts, formatUSDY, getCurrentAccount } from '@/lib/blockchain';
import { NETWORK_CONFIG } from '@/lib/contracts';

export default function AccountSetup() {
    const [isKYCd, setIsKYCd] = useState(false);
    const [usdyBalance, setUsdyBalance] = useState('0');
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [txHash, setTxHash] = useState('');

    useEffect(() => {
        checkAccountStatus();
    }, []);

    const checkAccountStatus = async () => {
        console.log('🔍 Checking account status...');
        setIsLoading(true);

        try {
            const account = await getCurrentAccount();
            if (!account) {
                setIsLoading(false);
                return;
            }

            const signer = await getSigner();
            const contracts = getContracts(signer);

            // Check KYC
            const kycStatus = await contracts.kycBridge.isKYCValid(account);
            setIsKYCd(kycStatus);

            // Check USDY balance
            const balance = await contracts.usdy.balanceOf(account);
            setUsdyBalance(formatUSDY(balance));

            console.log('✅ Status:', { kyc: kycStatus, balance: formatUSDY(balance) });

        } catch (error) {
            console.error('❌ Error checking status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoSetup = async () => {
        console.log('🚀 Starting auto-setup...');
        setIsSettingUp(true);
        setTxHash('');

        try {
            const account = await getCurrentAccount();
            if (!account) {
                alert('Please connect your wallet first!');
                return;
            }

            const signer = await getSigner();
            const contracts = getContracts(signer);

            // Step 1: Get USDY from faucet
            console.log('💰 Step 1/2: Getting USDY from faucet...');
            const faucetTx = await contracts.usdy.faucet();
            setTxHash(faucetTx.hash);
            console.log('⏳ Faucet TX:', faucetTx.hash);
            await faucetTx.wait();
            console.log('✅ Received 10,000 USDY!');

            // Step 2: KYC (user needs to be admin or this will fail)
            // For demo purposes, show instructions instead
            console.log('📝 Step 2/2: KYC Status');

            alert(`✅ Setup Complete!\n\n💰 Received 10,000 USDY\n🔗 TX: ${faucetTx.hash.slice(0, 10)}...\n\n⚠️ Note: KYC must be approved by admin\nRun: npx hardhat run scripts/kyc-user.js --network mantleSepolia`);

            // Refresh status
            await checkAccountStatus();

        } catch (error: any) {
            console.error('❌ Error during setup:', error);
            alert(`Error: ${error.message || 'Setup failed'}\n\nCheck console for details.`);
        } finally {
            setIsSettingUp(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-gray-400">Loading account status...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Status Card */}
            <div className="bg-[#0f0f0f] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Account Status</h2>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">KYC Status</span>
                        <div className="flex items-center gap-2">
                            {isKYCd ? (
                                <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-medium">
                                    ✅ Approved
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm font-medium">
                                    ❌ Not Approved
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">USDY Balance</span>
                        <span className="text-white font-semibold text-lg">{usdyBalance} USDY</span>
                    </div>
                </div>
            </div>

            {/* Quick Setup Card */}
            {!isKYCd || parseFloat(usdyBalance) < 1000 ? (
                <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-purple-500/30 rounded-2xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-2">🚀 Quick Setup</h3>
                    <p className="text-gray-300 text-sm mb-4">
                        Get started instantly! Click the button below to receive test USDY tokens.
                    </p>

                    <button
                        onClick={handleAutoSetup}
                        disabled={isSettingUp}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSettingUp ? '⏳ Setting up...' : '🎁 Get 10,000 USDY (Faucet)'}
                    </button>

                    {txHash && (
                        <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                            <p className="text-sm text-green-400">
                                ✅ Transaction sent!{' '}
                                <a
                                    href={`${NETWORK_CONFIG.blockExplorer}/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                >
                                    View on Explorer
                                </a>
                            </p>
                        </div>
                    )}

                    {!isKYCd && (
                        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                            <p className="text-sm text-yellow-400 font-medium mb-2">⚠️ KYC Required</p>
                            <p className="text-xs text-gray-400">
                                For demo purposes, run this command to approve your wallet:
                            </p>
                            <code className="block mt-2 p-2 bg-black/50 rounded text-xs text-purple-400">
                                npx hardhat run scripts/kyc-user.js --network mantleSepolia
                            </code>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                    <p className="text-2xl mb-2">🎉</p>
                    <h3 className="text-xl font-semibold text-white mb-2">You're All Set!</h3>
                    <p className="text-gray-300">Your account is ready to use the platform.</p>
                </div>
            )}

            {/* Instructions */}
            <div className="bg-[#0f0f0f] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">📋 Next Steps</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                        <span className="text-purple-400">1.</span>
                        <span>Get USDY tokens using the faucet button above</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-purple-400">2.</span>
                        <span>Get KYC approved (admin only for demo)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-purple-400">3.</span>
                        <span>Start creating invoices or bidding on auctions!</span>
                    </li>
                </ul>
            </div>

            {/* Refresh Button */}
            <button
                onClick={checkAccountStatus}
                className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
            >
                🔄 Refresh Status
            </button>
        </div>
    );
}
