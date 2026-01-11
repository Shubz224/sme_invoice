'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: {
        value: number;
        isPositive: boolean;
    };
    subtitle?: string;
}

export default function MetricCard({ title, value, change, subtitle }: MetricCardProps) {
    return (
        <Card className="p-6 bg-[#0f0f0f] border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.08)] transition-all">
            <div className="space-y-3">
                <p className="text-xs font-medium text-[#71717a] uppercase tracking-wide">{title}</p>
                <div className="flex items-baseline justify-between">
                    <h3 className="text-[32px] font-semibold text-white tracking-tight">{value}</h3>
                    {change && (
                        <div className={`flex items-center gap-1 text-xs font-medium ${change.isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'
                            }`}>
                            {change.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(change.value)}%
                        </div>
                    )}
                </div>
                {subtitle && <p className="text-xs text-[#71717a]">{subtitle}</p>}
            </div>
        </Card>
    );
}
