'use client';

import HeroSection from '@/components/HeroSection';
import MagicBento from '@/components/MagicBento';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      <HeroSection />

      {/* Platform Features Section */}
      <section id="features" className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Platform Features</h2>
            <p className="text-gray-400 text-lg">Enterprise-grade tools for decentralized invoice financing</p>
          </div>
          <MagicBento
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={false}
            clickEffect={true}
            enableMagnetism={true}
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-black to-purple-900/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg">Four simple steps to unlock liquidity from your invoices</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-purple-500/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-purple-400">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-400">
                    Use Privy to connect via social login or existing wallet. Get instant access with seamless embedded wallet creation.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-purple-500/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-purple-400">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Complete KYC</h3>
                  <p className="text-gray-400">
                    Quick verification process to ensure regulatory compliance. Your business identity verified in minutes.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-purple-500/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-purple-400">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Submit Invoice</h3>
                  <p className="text-gray-400">
                    Upload your outstanding invoice and receive instant liquidity offer. Smart contracts handle the escrow automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-purple-500/30 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-purple-400">4</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Get Paid</h3>
                  <p className="text-gray-400">
                    Receive funds immediately. As your customer pays the invoice, repayments stream back in real-time through payment channels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
