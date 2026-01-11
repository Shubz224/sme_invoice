'use client';

import { useState } from 'react';
import InvoiceForm, { InvoiceFormData } from '@/components/invoices/InvoiceForm';
import InvoicePreview from '@/components/invoices/InvoicePreview';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateInvoicePage() {
    const [formData, setFormData] = useState<InvoiceFormData>({
        amount: '',
        buyer: '',
        buyerEmail: '',
        dueDate: '',
        description: '',
        auctionDuration: '7',
        minDiscountPercent: '8'
    });

    return (
        <div className="space-y-8">
            {/* Back Button */}
            <Link href="/invoices" className="inline-flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors">
                <ArrowLeft size={18} />
                <span className="text-sm">Back to Invoices</span>
            </Link>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-[32px] font-semibold text-white tracking-tight">Create New Invoice</h1>
                <p className="text-sm text-[#a1a1aa] mt-2">Submit your invoice for financing</p>
            </div>

            {/* Split Layout: Form (Left) + Preview (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Form (2/3 width) */}
                <div className="lg:col-span-2">
                    <div className="bg-[#0f0f0f] border border-[rgba(255,255,255,0.05)] rounded-xl p-8">
                        <InvoiceForm onDataChange={setFormData} />
                    </div>
                </div>

                {/* Right Column - Preview (1/3 width) */}
                <div className="lg:col-span-1">
                    <InvoicePreview data={formData} />
                </div>
            </div>
        </div>
    );
}
