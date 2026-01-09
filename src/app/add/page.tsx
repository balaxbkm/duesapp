"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { createLoan } from '@/services/loanService';
import { LoanType, PaymentFrequency } from '@/types';
import { Loader2, ArrowLeft, Check, Calendar as CalendarIcon, DollarSign, User, Repeat } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

export default function AddLoanPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const [formData, setFormData] = useState({
        title: '',
        loan_type: 'i_owe' as LoanType,
        principal_amount: '',
        emi_amount: '',
        start_date: new Date().toISOString().split('T')[0],
        due_date: '',
        frequency: 'monthly' as PaymentFrequency,
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmitting(true);
        try {
            await createLoan({
                user_id: user.uid,
                title: formData.title,
                loan_type: 'i_owe', // Enforce I Owe
                principal_amount: Number(formData.principal_amount),
                emi_amount: Number(formData.emi_amount) || Number(formData.principal_amount), // Default to full amount if not EMI
                outstanding_amount: Number(formData.principal_amount),
                // Use formData dates directly if they are YYYY-MM-DD
                start_date: formData.start_date,
                due_date: formData.due_date,
                next_due_date: formData.due_date, // Initial next due date is the first due date
                frequency: formData.frequency,
                status: 'active',
                notes: formData.notes
            });
            router.push('/dashboard');
        } catch (error) {
            console.error(error);
            alert("Failed to create loan");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-24 font-sans selection:bg-neon-lime/30 transition-colors duration-300">
            {/* Creative Header */}
            <div className="flex items-center justify-between mb-4 pt-2 px-4">
                <Link href="/dashboard" className="w-12 h-12 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-95 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </Link>
            </div>

            <div className="mb-6 px-4">
                <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Add New Loan</h1>
                <p className="text-muted-foreground text-xs">Enter the details of the loan you owe.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-5 max-w-lg mx-auto">


                {/* Inputs */}
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-muted-foreground ml-1 tracking-wider">Title / Person Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <input
                                required
                                type="text"
                                placeholder="Lender Name (e.g. HDFC, John)"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 font-medium transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground ml-1 tracking-wider">Principal Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">
                                    {(() => {
                                        const c = typeof window !== 'undefined' ? localStorage.getItem('settings_currency') : 'INR';
                                        if (c === 'USD') return '$';
                                        if (c === 'EUR') return '€';
                                        if (c === 'GBP') return '£';
                                        return '₹';
                                    })()}
                                </span>
                                <input
                                    required
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.principal_amount}
                                    onChange={e => setFormData({ ...formData, principal_amount: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 font-medium transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground ml-1 tracking-wider">EMI / Installment</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">
                                    {(() => {
                                        const c = typeof window !== 'undefined' ? localStorage.getItem('settings_currency') : 'INR';
                                        if (c === 'USD') return '$';
                                        if (c === 'EUR') return '€';
                                        if (c === 'GBP') return '£';
                                        return '₹';
                                    })()}
                                </span>
                                <input
                                    type="number"
                                    placeholder="Optional"
                                    value={formData.emi_amount}
                                    onChange={e => setFormData({ ...formData, emi_amount: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 font-medium transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-muted-foreground ml-1 tracking-wider">Repayment Frequency</label>
                        <div className="relative">
                            <Repeat className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <select
                                value={formData.frequency}
                                onChange={e => setFormData({ ...formData, frequency: e.target.value as PaymentFrequency })}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 font-medium appearance-none transition-all"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                                <option value="custom">One-time / Custom</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground ml-1 tracking-wider">Start Date</label>
                            <div className="relative">
                                <input
                                    required
                                    type="date"
                                    value={formData.start_date}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 font-medium text-sm transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-muted-foreground ml-1 tracking-wider">First Due Date</label>
                            <div className="relative">
                                <input
                                    required
                                    type="date"
                                    value={formData.due_date}
                                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 font-medium text-sm transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase text-muted-foreground ml-1 tracking-wider">Notes (Optional)</label>
                        <textarea
                            rows={3}
                            placeholder="Any usage details..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 font-medium resize-none transition-all"
                        />
                    </div>

                </div>

                <button
                    disabled={submitting}
                    type="submit"
                    className="btn-neon w-full py-3.5 text-base flex items-center justify-center gap-2"
                >
                    {submitting ? <Loader2 className="animate-spin" /> : <Check size={18} strokeWidth={3} />}
                    Save Loan
                </button>

            </form >
        </div >
    );
}
