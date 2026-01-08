"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loan, Payment } from '@/types';
import { makePayment } from '@/services/loanService';
import { Loader2, ArrowLeft, Wallet, Clock, Trash2, History, ChevronRight, X } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis } from 'recharts';

export default function LoanDetailsPage() {
    const { id } = useParams() as { id: string };
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    const [loan, setLoan] = useState<Loan | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [payAmount, setPayAmount] = useState('');

    useEffect(() => {
        if (searchParams.get('action') === 'pay' && loan) {
            setShowPaymentModal(true);
        }
    }, [searchParams, loan]);

    useEffect(() => {
        async function fetchLoanData() {
            // ...
            if (!user || !id) return;
            try {
                const loanRef = doc(db, 'loans', id);
                const loanSnap = await getDoc(loanRef);
                if (loanSnap.exists()) {
                    const data = loanSnap.data();
                    setLoan({ id: loanSnap.id, ...data } as Loan);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchLoanData();
    }, [user, id]);

    const openPaymentModal = () => {
        if (!loan) return;
        setPayAmount(loan.emi_amount.toString());
        setShowPaymentModal(true);
    };

    const handleProcessPayment = async () => {
        if (!loan || !payAmount) return;
        const amount = Number(payAmount);
        try {
            await makePayment(loan.id!, amount, new Date());
            setShowPaymentModal(false);

            // Explicitly update local state to reflect change immediately
            setLoan(prev => {
                if (!prev) return null;
                const newOutstanding = Math.max(0, prev.outstanding_amount - amount);
                return {
                    ...prev,
                    outstanding_amount: newOutstanding
                };
            });
        } catch (e) { console.error(e) }
    };

    if (authLoading || loading) return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>;
    if (!user || !loan) return <div className="flex h-screen items-center justify-center bg-background">Loan not found or Access Denied</div>;

    // Chart Data Mock
    const paidPercentage = Math.min(((loan.principal_amount - loan.outstanding_amount) / loan.principal_amount) * 100, 100);
    const pieData = [
        { name: 'Paid', value: paidPercentage },
        { name: 'Remaining', value: 100 - paidPercentage },
    ];
    // Use standard colors that work in inline styles with CSS variables if possible, 
    // or hardcoded approximations. Recharts doesn't fully support CSS var() in 'fill' 
    // without some tricks in older versions, but 'hsl(var(--...))' works in modern browsers.
    const COLORS = ['hsl(var(--neon-purple))', 'hsl(var(--accent))'];

    const barData = [
        { name: 'Jan', value: 2000 },
        { name: 'Feb', value: 3000 },
        { name: 'Mar', value: 1500 },
        { name: 'Apr', value: 2780 },
        { name: 'May', value: 1890 },
        { name: 'Jun', value: 2390 },
    ];

    return (
        <div className="bg-background min-h-screen text-foreground font-sans flex flex-col transition-colors duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pt-8">
                <Link href="/dashboard" className="w-12 h-12 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-95">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="font-bold text-xl text-foreground tracking-tight">Loan Detail</h1>
                <button className="w-12 h-12 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all active:scale-95">
                    <Trash2 size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-32">

                {/* Main Info Card */}
                <div className="bg-card p-6 mb-6 relative overflow-hidden border border-border/50 shadow-xl rounded-[40px]">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-neon-purple/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="flex items-center gap-3 bg-accent/50 pr-4 pl-2 py-1.5 rounded-full border border-border/50">
                            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-neon-purple shadow-sm">
                                <Wallet size={16} />
                            </div>
                            <span className="font-bold text-sm text-foreground">{loan.title}</span>
                        </div>
                        <span className="text-neon-purple font-bold text-xs tracking-wider uppercase">Active</span>
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                        {/* Circular Chart */}
                        <div className="w-32 h-32 relative flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={55}
                                        startAngle={90}
                                        endAngle={-270}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={10}
                                        paddingAngle={5}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--neon-purple))' : 'hsl(var(--accent))'} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground leading-tight">
                                <span className="text-foreground text-2xl font-bold tracking-tighter">{Math.round(paidPercentage)}%</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Paid</span>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="text-right flex flex-col items-end">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Left to pay:</p>
                            <p className="text-3xl font-bold text-foreground tracking-tighter mb-2">{formatCurrency(loan.outstanding_amount)}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                Monthly: <span className="text-neon-purple font-bold bg-neon-purple/10 px-1.5 py-0.5 rounded">{formatCurrency(loan.emi_amount)}</span>
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">Payoff Date: 22.02.2026</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-5 mb-8">
                    <div className="bg-card p-5 rounded-[32px] border border-border/50 shadow-sm flex flex-col justify-center">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Total Amount</p>
                        <p className="text-xl font-bold text-foreground tracking-tight">{formatCurrency(loan.principal_amount)}</p>
                    </div>
                    <div className="bg-card p-5 rounded-[32px] border border-border/50 shadow-sm flex flex-col justify-center">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Interest Paid</p>
                        <p className="text-xl font-bold text-foreground tracking-tight">{formatCurrency(100)}</p>
                    </div>
                </div>

                {/* Repayment Chart */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-foreground mb-4 pl-2">Repayment Chart</h3>
                    <div className="bg-card p-6 rounded-[32px] border border-border/50 shadow-sm h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} barSize={32}>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
                                    dy={10}
                                />
                                <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                                    {barData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index % 2 === 0 ? 'hsl(var(--neon-purple))' : 'hsl(var(--muted))'}
                                            fillOpacity={index % 2 === 0 ? 1 : 0.3}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* History Link */}
                <div className="bg-card p-5 rounded-[32px] border border-border/50 shadow-sm flex items-center justify-between group cursor-pointer hover:bg-accent/50 transition-all active:scale-[0.99] mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                            <History size={20} />
                        </div>
                        <span className="font-bold text-sm text-foreground">Payments History</span>
                    </div>
                    <ChevronRight size={20} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>

            </div>

            {/* Sticky Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-10 pb-8 z-20">
                <button
                    onClick={openPaymentModal}
                    className="w-full py-4 rounded-full bg-primary text-black font-bold text-lg shadow-[0_8px_30px_rgba(171,211,0,0.4)] hover:shadow-[0_8px_40px_rgba(171,211,0,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <Wallet size={20} />
                    Pay Now
                </button>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-border/50 relative scale-in-95 animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowPaymentModal(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex flex-col items-center mb-6">
                            <div className="w-14 h-14 rounded-full bg-neon-purple/10 flex items-center justify-center text-neon-purple mb-4">
                                <Wallet size={28} />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Make Payment</h2>
                            <p className="text-sm text-muted-foreground">Enter the amount you paid</p>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 mb-2 block">Amount</label>
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                                    {/* Try to reuse symbol logic broadly or default */}
                                    {(() => {
                                        if (typeof window === 'undefined') return '₹';
                                        const c = localStorage.getItem('settings_currency');
                                        if (c === 'USD') return '$';
                                        if (c === 'EUR') return '€';
                                        if (c === 'GBP') return '£';
                                        return '₹';
                                    })()}
                                </div>
                                <input
                                    type="number"
                                    className="w-full bg-accent/50 border border-border/50 rounded-[20px] py-4 pl-12 pr-4 text-center text-3xl font-bold text-foreground focus:outline-none focus:border-neon-purple/50 focus:ring-4 focus:ring-neon-purple/10 transition-all placeholder:text-muted-foreground/20"
                                    placeholder="0"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleProcessPayment}
                            className="w-full py-4 rounded-2xl bg-neon-purple text-white font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-[0_8px_20px_-4px_rgba(124,58,237,0.5)]"
                        >
                            Confirm Payment
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
