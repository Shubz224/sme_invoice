'use client';

interface ComplianceBadgeProps {
    label: string;
    status: 'verified' | 'pending' | 'failed';
    icon?: string;
}

export default function ComplianceBadge({ label, status, icon = '✓' }: ComplianceBadgeProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'verified':
                return {
                    className: 'bg-green-500/10 text-green-400 border-green-500/30',
                    icon: '✓'
                };
            case 'pending':
                return {
                    className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
                    icon: '⏳'
                };
            case 'failed':
                return {
                    className: 'bg-red-500/10 text-red-400 border-red-500/30',
                    icon: '✗'
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${config.className}`}>
            <span className="text-lg">{config.icon}</span>
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
}
