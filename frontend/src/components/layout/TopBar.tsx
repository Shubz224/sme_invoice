'use client';

import { Wallet } from 'lucide-react';

interface TopBarProps {
    role?: 'SME' | 'Investor';
}

export default function TopBar({ role = 'SME' }: TopBarProps) {
    return (
        <header className="fixed top-0 left-20 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-gray-800 flex items-center justify-between px-8 z-40">
            {/* Logo & Product Name */}
            <div className="flex items-center gap-3">
                <span className="text-white text-lg font-semibold">Mantle Finance</span>
            </div>

            {/* Network Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400">Mantle Sepolia</span>
            </div>

            {/* Wallet & Role */}
            <div className="flex items-center gap-4">
                {/* Role Badge */}
                <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${role === 'SME'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }`}>
                    {role}
                </div>

                {/* Wallet Button */}
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-all">
                    <Wallet size={16} className="text-purple-400" />
                    <span className="text-sm text-white font-medium">0x1234...5678</span>
                </button>
            </div>
        </header>
    );
}
