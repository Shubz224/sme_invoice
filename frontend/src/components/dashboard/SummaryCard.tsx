'use client';

import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    subtitle?: string;
}

export default function SummaryCard({ title, value, icon: Icon, trend, subtitle }: SummaryCardProps) {
    return (
        <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-purple-500/30 transition-all">
                {/* Icon */}
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={24} className="text-purple-400" />
                </div>

                {/* Title */}
                <h3 className="text-sm text-gray-400 mb-2">{title}</h3>

                {/* Value */}
                <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-white">{value}</p>

                    {/* Trend Indicator */}
                    {trend && (
                        <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'
                            }`}>
                            <span>{trend.isPositive ? '↑' : '↓'}</span>
                            <span>{Math.abs(trend.value)}%</span>
                        </div>
                    )}
                </div>

                {/* Subtitle */}
                {subtitle && (
                    <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
                )}
            </div>
        </div>
    );
}
