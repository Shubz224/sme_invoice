'use client';

import PixelBlast from './PixelBlast';
import GooeyNav from './GooeyNav';
import BlurText from './BlurText';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';

const navItems = [
    { label: "Home", href: "#" },
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Docs", href: "#docs" },
];

export default function HeroSection() {
    const { ready, authenticated, login } = usePrivy();

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* PixelBlast Background */}
            <div className="absolute inset-0 z-0">
                <PixelBlast
                    variant="circle"
                    pixelSize={6}
                    color="#B19EEF"
                    patternScale={3}
                    patternDensity={1.2}
                    pixelSizeJitter={0.5}
                    enableRipples
                    rippleSpeed={0.4}
                    rippleThickness={0.12}
                    rippleIntensityScale={1.5}
                    liquid
                    liquidStrength={0.12}
                    liquidRadius={1.2}
                    liquidWobbleSpeed={5}
                    speed={0.6}
                    edgeFade={0.25}
                    transparent
                />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Top Bar with Login/Profile */}
                <div className="absolute top-8 right-8 z-20">
                    {authenticated ? (
                        <Link href="/dashboard">
                            <button className="px-6 py-3 bg-white/10 backdrop-blur-md text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg">
                                Dashboard →
                            </button>
                        </Link>
                    ) : (
                        <button
                            onClick={login}
                            disabled={!ready}
                            className="relative px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105 transform"
                            style={{
                                boxShadow: '0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(168, 85, 247, 0.2)'
                            }}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                {ready ? 'Connect Wallet' : 'Loading...'}
                            </span>
                            {/* Glow effect */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <div className="w-full flex justify-center pt-8">
                    <GooeyNav
                        items={navItems}
                        particleCount={15}
                        particleDistances={[90, 10]}
                        particleR={100}
                        initialActiveIndex={0}
                        animationTime={600}
                        timeVariance={300}
                        colors={[1, 2, 3, 1, 2, 3, 1, 4]}
                    />
                </div>

                {/* Hero Content */}
                <div className="flex-1 flex items-center justify-center px-8">
                    <div className="max-w-5xl mx-auto text-center">
                        {/* Dark overlay for text readability */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-black/40 blur-3xl rounded-full transform scale-110 -z-10"></div>

                            <div className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight text-center">
                                <BlurText
                                    text="Unlock Liquidity for"
                                    delay={150}
                                    animateBy="words"
                                    direction="top"
                                    className="justify-center"
                                />
                                <BlurText
                                    text="Outstanding Invoices"
                                    delay={150}
                                    animateBy="words"
                                    direction="top"
                                    className="justify-center"
                                />
                            </div>

                            <p className="text-xl md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                                Enterprise-grade invoice financing powered by smart contracts on Mantle Network.
                                Get instant liquidity with trustless collateralization and real-time repayment streaming.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                {authenticated ? (
                                    <Link href="/dashboard">
                                        <button className="px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg">
                                            Go to Dashboard
                                        </button>
                                    </Link>
                                ) : (
                                    <button
                                        onClick={login}
                                        disabled={!ready}
                                        className="px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {ready ? 'Start Here' : 'Loading...'}
                                    </button>
                                )}
                                <button className="px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white/20 hover:border-white/40 hover:bg-white/5 transition-all backdrop-blur-sm">
                                    View Documentation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
