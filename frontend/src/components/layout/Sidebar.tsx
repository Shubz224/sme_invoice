'use client';

import { Home, FileText, Gavel, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: FileText, label: 'Invoices', href: '/invoices' },
    { icon: Gavel, label: 'Auctions', href: '/auctions' },
    { icon: TrendingUp, label: 'Streams', href: '/streams' },
    { icon: Activity, label: 'Transactions', href: '/transactions/1' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-20 bg-black border-r border-gray-800 flex flex-col items-center py-8 z-50">
            {/* Logo */}
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-12">
                <span className="text-white font-bold text-xl">M</span>
            </div>

            {/* Navigation Icons */}
            <nav className="flex-1 flex flex-col gap-6">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname?.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group relative"
                            title={item.label}
                        >
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isActive
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'text-gray-500 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} />
                            </div>

                            {/* Tooltip */}
                            <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
