'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { getSigner, getContracts, parseUSDY, waitForTransaction, formatAddress } from '@/lib/blockchain';
import { NETWORK_CONFIG } from '@/lib/contracts';

export interface InvoiceFormData {
    amount: string;
    buyer: string;
    buyerEmail: string;
    dueDate: string;
    description: string;
    auctionDuration: string;
    minDiscountPercent: string;
}

interface InvoiceFormProps {
    onDataChange: (data: InvoiceFormData) => void;
}

export default function InvoiceForm({ onDataChange }: InvoiceFormProps) {
    const [formData, setFormData] = useState<InvoiceFormData>({
        amount: '',
        buyer: '',
        buyerEmail: '',
        dueDate: '',
        description: '',
        auctionDuration: '7',
        minDiscountPercent: '8'
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const [txHash, setTxHash] = useState<string>('');

    const handleChange = (field: keyof InvoiceFormData, value: string) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onDataChange(newData);
    };

    const handleCreateInvoice = async () => {
        console.log('🚀 Starting invoice creation...');
        console.log('📝 Form data:', formData);

        try {
            setIsCreating(true);

            // Get signer and contracts
            console.log('🔐 Connecting wallet...');
            const signer = await getSigner();
            const address = await signer.getAddress();
            console.log('👤 Connected address:', address);

            const contracts = getContracts(signer);

            // Calculate values
            const invoiceAmount = parseUSDY(formData.amount);
            const dueDateTimestamp = Math.floor(new Date(formData.dueDate).getTime() / 1000);
            const auctionDurationSeconds = parseInt(formData.auctionDuration) * 86400; // days to seconds
            const minPrice = invoiceAmount.mul(100 - parseInt(formData.minDiscountPercent)).div(100);

            console.log('💰 Invoice amount:', ethers.utils.formatUnits(invoiceAmount, 18), 'USDY');
            console.log('📅 Due date:', new Date(dueDateTimestamp * 1000).toLocaleDateString());
            console.log('⏱️  Auction duration:', auctionDurationSeconds / 86400, 'days');
            console.log('💵 Min price (after discount):', ethers.utils.formatUnits(minPrice, 18), 'USDY');

            // Create invoice and start auction
            console.log('📤 Sending transaction...');
            const tx = await contracts.manager.createInvoiceAndStartAuction(
                invoiceAmount,
                dueDateTimestamp,
                formData.buyer,
                formData.description, // Using description as document hash
                minPrice,
                auctionDurationSeconds
            );

            setTxHash(tx.hash);
            console.log('✅ Transaction sent!');
            console.log('🔗 TX Hash:', tx.hash);
            console.log('🌐 Explorer:', `${NETWORK_CONFIG.blockExplorer}/tx/${tx.hash}`);

            // Wait for confirmation
            const receipt = await waitForTransaction(tx);

            // Get invoice ID from events - try multiple event names
            let invoiceId;
            const invoiceEvent = receipt.events?.find(
                (e) => e.event === 'InvoiceCreated' || e.event === 'Transfer'
            );

            if (invoiceEvent) {
                // If it's InvoiceCreated event
                if (invoiceEvent.event === 'InvoiceCreated') {
                    invoiceId = invoiceEvent.args?.invoiceId?.toString() || invoiceEvent.args?.[0]?.toString();
                }
                // If it's Transfer event (NFT minted), the tokenId is the invoice ID
                else if (invoiceEvent.event === 'Transfer') {
                    invoiceId = invoiceEvent.args?.tokenId?.toString() || invoiceEvent.args?.[2]?.toString();
                }
            }

            // Fallback: get total invoices count
            if (!invoiceId) {
                const totalInvoices = await contracts.nft.getTotalInvoices();
                invoiceId = totalInvoices.toString();
            }

            console.log('🎉 Invoice created successfully!');
            console.log('🆔 Invoice ID:', invoiceId);
            console.log('📦 Block number:', receipt.blockNumber);
            console.log('⛽ Gas used:', receipt.gasUsed.toString());

            alert(`Invoice #${invoiceId} created successfully! TX: ${tx.hash.slice(0, 10)}...`);

            // Reset form
            setFormData({
                amount: '',
                buyer: '',
                buyerEmail: '',
                dueDate: '',
                description: '',
                auctionDuration: '7',
                minDiscountPercent: '8'
            });
            setCurrentStep(1);

        } catch (error: any) {
            console.error('❌ Error creating invoice:', error);
            alert(`Error: ${error.message || 'Failed to create invoice'}`);
        } finally {
            setIsCreating(false);
        }
    };

    const steps = [
        { number: 1, title: 'Invoice Details', fields: ['amount', 'buyer', 'buyerEmail'] },
        { number: 2, title: 'Payment Terms', fields: ['dueDate', 'description'] },
        { number: 3, title: 'Auction Settings', fields: ['auctionDuration', 'minDiscountPercent'] }
    ];

    return (
        <div className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-8">
                {steps.map((step, index) => (
                    <div key={step.number} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep >= step.number
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-800 text-gray-500'
                                    }`}
                            >
                                {step.number}
                            </div>
                            <span className={`text-xs mt-2 ${currentStep >= step.number ? 'text-white' : 'text-gray-500'}`}>
                                {step.title}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-2 ${currentStep > step.number ? 'bg-purple-500' : 'bg-gray-800'}`}></div>
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: Invoice Details */}
            {currentStep === 1 && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Invoice Amount <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => handleChange('amount', e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 pl-8 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                                placeholder="10,000"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Total amount to be paid by the buyer</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Buyer Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.buyer}
                            onChange={(e) => handleChange('buyer', e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                            placeholder="Acme Corporation"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Buyer Email <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="email"
                            value={formData.buyerEmail}
                            onChange={(e) => handleChange('buyerEmail', e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                            placeholder="finance@acme.com"
                        />
                    </div>
                </div>
            )}

            {/* Step 2: Payment Terms */}
            {currentStep === 2 && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Due Date <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => handleChange('dueDate', e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">When the buyer is expected to pay</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={4}
                            className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                            placeholder="Payment for Q4 2025 consulting services..."
                        />
                    </div>
                </div>
            )}

            {/* Step 3: Auction Settings */}
            {currentStep === 3 && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Auction Duration (days) <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.auctionDuration}
                            onChange={(e) => handleChange('auctionDuration', e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                            placeholder="7"
                            min="1"
                            max="30"
                        />
                        <p className="text-xs text-gray-500 mt-1">How long investors can bid on this invoice</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Minimum Discount (%) <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.minDiscountPercent}
                            onChange={(e) => handleChange('minDiscountPercent', e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                            placeholder="8"
                            min="1"
                            max="20"
                            step="0.1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum discount you're willing to accept</p>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-sm text-blue-400">
                            💡 With {formData.minDiscountPercent}% discount, you'll receive approximately{' '}
                            <span className="font-semibold">
                                ${formData.amount ? (Number(formData.amount) * (1 - Number(formData.minDiscountPercent) / 100)).toFixed(0) : '0'}
                            </span>
                        </p>
                    </div>

                    {/* Transaction status */}
                    {txHash && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <p className="text-sm text-green-400">
                                ✅ Transaction sent!{' '}
                                <a
                                    href={`${NETWORK_CONFIG.blockExplorer}/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                >
                                    View on Explorer
                                </a>
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                <button
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1 || isCreating}
                    className={`px-6 py-2 rounded-lg font-medium transition-all ${currentStep === 1 || isCreating
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                        }`}
                >
                    Previous
                </button>

                {currentStep < 3 ? (
                    <button
                        onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                        disabled={isCreating}
                        className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                    >
                        Next
                    </button>
                ) : (
                    <button
                        onClick={handleCreateInvoice}
                        disabled={isCreating}
                        className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreating ? 'Creating...' : 'Create Invoice'}
                    </button>
                )}
            </div>
        </div>
    );
}
