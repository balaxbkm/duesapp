"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthContext';
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
        <div className="min-h-screen bg-background pb-10 px-5 pt-4 font-sans selection:bg-neon-lime/30 transition-colors duration-300 flex flex-col">
            {/* Creative Header */}
            <div className="flex items-center gap-4 mb-6 pt-0 px-0">
                <Link href="/dashboard" className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-95 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">Add New Loan</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-0 flex-1 flex flex-col max-w-lg mx-auto w-full">
                {/* Inputs */}
                <div className="space-y-4 flex-1">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 tracking-wider">Title / Person Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                required
                                type="text"
                                placeholder="Lender Name (e.g. HDFC, John)"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 font-medium transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 tracking-wider">Principal Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-base">
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
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 font-medium transition-all text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 tracking-wider">EMI / Installment</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-base">
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
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 font-medium transition-all text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 tracking-wider">Repayment Frequency</label>
                        <div className="relative">
                            <Repeat className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <select
                                value={formData.frequency}
                                onChange={e => setFormData({ ...formData, frequency: e.target.value as PaymentFrequency })}
                                className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 font-medium appearance-none transition-all text-sm"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                                <option value="custom">One-time / Custom</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 tracking-wider">Start Date</label>
                            <div className="relative">
                                <input
                                    required
                                    type="date"
                                    value={formData.start_date}
                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 font-medium text-xs transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 tracking-wider">First Due Date</label>
                            <div className="relative">
                                <input
                                    required
                                    type="date"
                                    value={formData.due_date}
                                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 font-medium text-xs transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 tracking-wider">Notes (Optional)</label>
                        <textarea
                            rows={2}
                            placeholder="Any usage details..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 font-medium resize-none transition-all text-sm"
                        />
                    </div>
                </div>

                <button
                    disabled={submitting}
                    type="submit"
                    className="btn-neon w-full py-3 text-base flex items-center justify-center gap-2 mt-auto"
                >
                    {submitting ? <Loader2 className="animate-spin" /> : <Check size={18} strokeWidth={3} />}
                    Save Loan
                </button>
            </form>
        </div >
    );
}
