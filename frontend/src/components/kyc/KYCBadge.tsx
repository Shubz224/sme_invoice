// KYC Level Badge Component
import React from 'react';
import { Badge } from '@/components/ui/badge';

export enum KYCLevel {
    None = 0,
    Basic = 1,
    Standard = 2,
    Enhanced = 3,
    Institutional = 4,
}

interface KYCBadgeProps {
    level: KYCLevel;
    showLimit?: boolean;
}

const KYC_CONFIG = {
    [KYCLevel.None]: {
        label: 'No KYC',
        color: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
        limit: '$0',
    },
    [KYCLevel.Basic]: {
        label: 'Basic',
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        limit: '$1,000',
    },
    [KYCLevel.Standard]: {
        label: 'Standard',
        color: 'bg-green-500/10 text-green-400 border-green-500/30',
        limit: '$10,000',
    },
    [KYCLevel.Enhanced]: {
        label: 'Enhanced',
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        limit: '$50,000',
    },
    [KYCLevel.Institutional]: {
        label: 'Institutional',
        color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        limit: 'Unlimited',
    },
};

export default function KYCBadge({ level, showLimit = false }: KYCBadgeProps) {
    const config = KYC_CONFIG[level];

    return (
        <div className="flex items-center gap-2">
            <Badge className={`text-xs font-medium px-3 py-1 ${config.color}`}>
                {config.label}
            </Badge>
            {showLimit && (
                <span className="text-sm text-gray-400">
                    Limit: {config.limit}
                </span>
            )}
        </div>
    );
}

export function KYCLevelIcon({ level }: { level: KYCLevel }) {
    const icons = {
        [KYCLevel.None]: '🔒',
        [KYCLevel.Basic]: '📧',
        [KYCLevel.Standard]: '🆔',
        [KYCLevel.Enhanced]: '✅',
        [KYCLevel.Institutional]: '🏢',
    };

    return <span className="text-2xl">{icons[level]}</span>;
}
