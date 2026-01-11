'use client';

export default function Footer() {
    return (
        <footer className="w-full bg-black border-t border-gray-800 py-12">
            <div className="max-w-7xl mx-auto px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Logo and Description */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">M</span>
                            </div>
                            <span className="text-white text-2xl font-semibold">Mantle Finance</span>
                        </div>
                        <p className="text-gray-400 text-sm max-w-md leading-relaxed">
                            Decentralized invoice financing powered by smart contracts.
                            Unlock liquidity for your outstanding invoices with trustless security and real-time payments.
                        </p>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Product</h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="#features" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    Features
                                </a>
                            </li>
                            <li>
                                <a href="#how-it-works" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    How It Works
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    Pricing
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    Security
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Resources</h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="#docs" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    Documentation
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    API Reference
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    GitHub
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors text-sm">
                                    Community
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-500 text-sm mb-4 md:mb-0">
                        © 2026 Mantle Finance. All rights reserved.
                    </p>
                    <div className="flex space-x-6">
                        <a href="#" className="text-gray-500 hover:text-purple-400 transition-colors text-sm">
                            Privacy Policy
                        </a>
                        <a href="#" className="text-gray-500 hover:text-purple-400 transition-colors text-sm">
                            Terms of Service
                        </a>
                        <a href="#" className="text-gray-500 hover:text-purple-400 transition-colors text-sm">
                            Contact
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
