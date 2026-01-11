// Navbar with Privy Authentication
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import {
    User,
    LogOut,
    FileText,
    TrendingUp,
    Wallet,
    Menu,
    X,
    Shield
} from 'lucide-react';

export default function Navbar() {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Privy hooks
    const { ready, authenticated, user, login, logout } = usePrivy();

    const handleLogin = () => {
        login();
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: TrendingUp },
        { href: '/invoices', label: 'Invoices', icon: FileText },
        { href: '/auctions', label: 'Auctions', icon: TrendingUp },
        { href: '/streams', label: 'Streams', icon: Wallet },
    ];

    return (
        <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">I</span>
                        </div>
                        <span className="text-xl font-bold text-white">InvoiceStream</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {authenticated && navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <Icon size={18} />
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        {!ready ? (
                            <div className="text-gray-400 text-sm">Loading...</div>
                        ) : authenticated ? (
                            <>
                                {/* User Menu */}
                                <Link href="/profile">
                                    <Button variant="ghost" className="flex items-center gap-2">
                                        <User size={18} />
                                        <span className="text-sm">
                                            {user?.email?.address || user?.wallet?.address?.slice(0, 6) + '...' || 'Profile'}
                                        </span>
                                    </Button>
                                </Link>

                                <Button
                                    onClick={handleLogout}
                                    variant="outline"
                                    className="flex items-center gap-2 border-gray-700 hover:bg-gray-800"
                                >
                                    <LogOut size={18} />
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={handleLogin}
                                className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2"
                            >
                                <Shield size={18} />
                                Connect Wallet
                            </Button>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden text-gray-400 hover:text-white"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-800">
                    <div className="px-4 py-4 space-y-3">
                        {authenticated && navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 text-gray-400 hover:text-white py-2"
                                >
                                    <Icon size={18} />
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}

                        <div className="pt-3 border-t border-gray-800 space-y-2">
                            {authenticated ? (
                                <>
                                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                                        <Button variant="ghost" className="w-full justify-start">
                                            <User size={18} className="mr-2" />
                                            Profile
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={() => {
                                            handleLogout();
                                            setMobileMenuOpen(false);
                                        }}
                                        variant="outline"
                                        className="w-full justify-start border-gray-700"
                                    >
                                        <LogOut size={18} className="mr-2" />
                                        Logout
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={() => {
                                        handleLogin();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full bg-purple-500 hover:bg-purple-600"
                                >
                                    <Shield size={18} className="mr-2" />
                                    Connect Wallet
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
