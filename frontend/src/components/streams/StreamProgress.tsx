'use client';

import { useEffect, useState } from 'react';

interface StreamProgressProps {
    totalAmount: number;
    claimedAmount: number;
    availableAmount: number;
}

export default function StreamProgress({ totalAmount, claimedAmount, availableAmount }: StreamProgressProps) {
    const [animatedProgress, setAnimatedProgress] = useState(0);
    const progress = (claimedAmount / totalAmount) * 100;

    useEffect(() => {
        // Animate progress bar on mount
        const timer = setTimeout(() => {
            setAnimatedProgress(progress);
        }, 100);

        return () => clearTimeout(timer);
    }, [progress]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Repayment Progress</span>
                    <span className="text-lg font-semibold text-purple-400">{progress.toFixed(1)}%</span>
                </div>

                <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden">
                    {/* Animated Progress Fill */}
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${animatedProgress}%` }}
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>

                    {/* Progress Text */}
                    {progress > 10 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-semibold text-white drop-shadow-lg">
                                {formatCurrency(claimedAmount)} / {formatCurrency(totalAmount)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Amount Breakdown */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Total</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(totalAmount)}</p>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <p className="text-xs text-green-400 mb-1">Claimed</p>
                    <p className="text-lg font-bold text-green-400">{formatCurrency(claimedAmount)}</p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <p className="text-xs text-purple-400 mb-1">Available</p>
                    <p className="text-lg font-bold text-purple-400">{formatCurrency(availableAmount)}</p>
                </div>
            </div>

            <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
        </div>
    );
}
