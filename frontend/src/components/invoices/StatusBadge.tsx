'use client';

interface StatusBadgeProps {
    status: 'draft' | 'in_auction' | 'settled' | 'streaming' | 'completed';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'draft':
                return {
                    label: 'Draft',
                    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                };
            case 'in_auction':
                return {
                    label: 'In Auction',
                    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                };
            case 'settled':
                return {
                    label: 'Settled',
                    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                };
            case 'streaming':
                return {
                    label: 'Streaming',
                    className: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                };
            case 'completed':
                return {
                    label: 'Completed',
                    className: 'bg-green-500/20 text-green-400 border-green-500/30'
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={`px-3 py-1 rounded-lg border text-xs font-medium ${config.className}`}>
            {config.label}
        </div>
    );
}
