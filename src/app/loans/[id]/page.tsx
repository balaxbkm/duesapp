"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthContext';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loan, Payment } from '@/types';
import { makePayment, deleteLoan, getLoanPayments } from '@/services/loanService';
import { Loader2, ArrowLeft, Wallet, Trash2, History, ChevronRight, X, CheckCircle2, Calendar, Coins, Flag, Layers, Percent } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, cn } from '@/lib/utils';
import { addMonths, addWeeks, differenceInMonths, differenceInWeeks } from 'date-fns';
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
    const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

    const showToast = (message: string) => {
        setToast({ message, show: true });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

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
                    const formattedLoan = {
                        id: loanSnap.id,
                        ...data,
                        start_date: data.start_date?.toDate ? data.start_date.toDate().toISOString() : data.start_date,
                        due_date: data.due_date?.toDate ? data.due_date.toDate().toISOString() : data.due_date,
                        next_due_date: data.next_due_date?.toDate ? data.next_due_date.toDate().toISOString() : data.next_due_date,
                        created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
                    } as Loan;
                    setLoan(formattedLoan);

                    // Fetch Payments
                    const paymentHistory = await getLoanPayments(id, user.uid);
                    setPayments(paymentHistory);
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
            // Calculate next due date
            let nextDueDate = new Date();
            const currentDueDate = loan.next_due_date ? new Date(loan.next_due_date) : new Date(loan.due_date);

            if (loan.frequency === 'monthly') {
                nextDueDate = addMonths(currentDueDate, 1);
            } else if (loan.frequency === 'weekly') {
                nextDueDate = addWeeks(currentDueDate, 1);
            } else {
                nextDueDate = currentDueDate;
            }

            if (isNaN(nextDueDate.getTime())) {
                nextDueDate = new Date();
            }

            await makePayment(loan.id!, amount, nextDueDate);
            setShowPaymentModal(false);
            showToast("Payment Successful");

            // Explicitly update local state to reflect change immediately
            setLoan(prev => {
                if (!prev) return null;
                const newOutstanding = Math.max(0, prev.outstanding_amount - amount);
                return {
                    ...prev,
                    outstanding_amount: newOutstanding,
                    next_due_date: nextDueDate.toISOString()
                };
            });

            // Re-fetch payments or add optimistically
            const newPayment: Payment = {
                id: 'temp-' + Date.now(),
                loan_id: loan.id!,
                amount: amount,
                paid_on: new Date().toISOString(),
                next_due_date: nextDueDate.toISOString()
            };
            setPayments(prev => [newPayment, ...prev]);
        } catch (e) { console.error(e) }
    };

    const handleDelete = async () => {
        if (!loan) return;
        if (typeof window !== 'undefined' && window.confirm('Are you sure you want to delete this loan? This action cannot be undone.')) {
            try {
                await deleteLoan(loan.id!);
                router.push('/dashboard');
            } catch (error) {
                console.error("Error deleting loan:", error);
                alert("Failed to delete loan");
            }
        }
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

    // Interest Calculation
    let interestRate = 0;
    if (loan.frequency === 'monthly' || loan.frequency === 'weekly') {
        const tenure = loan.frequency === 'monthly'
            ? differenceInMonths(new Date(loan.due_date), new Date(loan.start_date))
            : differenceInWeeks(new Date(loan.due_date), new Date(loan.start_date));

        const totalPayable = tenure > 0 ? loan.emi_amount * tenure : 0;
        const interestAmount = totalPayable > loan.principal_amount ? totalPayable - loan.principal_amount : 0;
        interestRate = loan.principal_amount > 0 ? (interestAmount / loan.principal_amount) * 100 : 0;
    }

    return (
        <div className="bg-background min-h-screen text-foreground font-sans flex flex-col transition-colors duration-300 px-5 pt-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pt-0 px-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-95 group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">Loan Detail</h1>
                    </div>
                </div>
                <button
                    onClick={handleDelete}
                    className="w-9 h-9 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all active:scale-95 group"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-32">

                {/* Main Info Card */}
                <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-6 mb-8 relative overflow-hidden border border-white/10 shadow-2xl rounded-[32px]">
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-neon-lime/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    {/* Header */}
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-bold text-white tracking-tight">{loan.title}</h2>
                            <span className={cn(
                                "text-[10px] font-bold tracking-widest uppercase mt-1 px-2 py-0.5 rounded-full w-fit border",
                                loan.outstanding_amount <= 0
                                    ? "bg-neon-lime/10 text-neon-lime border-neon-lime/20"
                                    : "bg-neon-purple/10 text-neon-purple border-neon-purple/20"
                            )}>
                                {loan.outstanding_amount <= 0 ? "Completed" : "Active"}
                            </span>
                        </div>
                        {/* Circular Progress */}
                        <div className="w-16 h-16 relative">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" className="stroke-white/10" strokeWidth="3" />
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke={loan.outstanding_amount <= 0 ? "hsl(var(--neon-lime))" : "hsl(var(--neon-purple))"}
                                    strokeWidth="3"
                                    strokeDasharray={`${paidPercentage}, 100`}
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                                {Math.round(paidPercentage)}%
                            </div>
                        </div>
                    </div>

                    {/* Main Balance */}
                    <div className="relative z-10 mb-6">
                        <p className="text-sm text-zinc-400 font-medium mb-1">Remaining Balance</p>
                        <p className="text-4xl font-black text-white tracking-tighter">
                            {formatCurrency(loan.outstanding_amount)}
                        </p>
                    </div>

                    {/* Footer Stats inside Card */}
                    <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-white/10">
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Next Due</p>
                            <div className="flex items-center gap-1.5 text-zinc-200">
                                <Calendar size={14} className="text-neon-purple" />
                                <span className="font-bold text-sm">
                                    {loan.outstanding_amount <= 0 ? "All Paid" : (formatDate(loan.next_due_date) || formatDate(loan.due_date))}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Installment</p>
                            <div className="flex items-center gap-1.5 text-zinc-200">
                                <Coins size={14} className="text-neon-lime" />
                                <span className="font-bold text-sm">{formatCurrency(loan.emi_amount)} <span className="text-[10px] text-zinc-500 font-normal">/ {loan.frequency}</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {[
                        { label: 'Principal', value: formatCurrency(loan.principal_amount), icon: Wallet, color: 'text-blue-400' },
                        { label: 'Frequency', value: loan.frequency.charAt(0).toUpperCase() + loan.frequency.slice(1), icon: Layers, color: 'text-orange-400' },
                        { label: 'Start Date', value: formatDate(loan.start_date), icon: Flag, color: 'text-emerald-400' },
                        {
                            label: 'Interest Rate',
                            value: `${Math.round(interestRate)}%`,
                            icon: Percent,
                            color: 'text-pink-400'
                        },
                    ].map((stat, i) => (
                        <div key={i} className="bg-card/50 p-4 rounded-2xl border border-border/50 flex flex-col gap-3 hover:bg-card transition-colors">
                            <div className={cn("w-8 h-8 rounded-full bg-zinc-900/50 flex items-center justify-center", stat.color)}>
                                <stat.icon size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">{stat.label}</p>
                                <p className="text-sm font-bold text-foreground">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>



                {/* Payment History Timeline */}
                {payments.length > 0 || loan ? (
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-foreground mb-6 pl-2 flex items-center gap-2">
                            <History size={16} className="text-neon-purple" />
                            Timeline history
                        </h3>
                        <div className="relative pl-4 space-y-8">
                            {/* Vertical Line */}
                            <div className="absolute left-[27px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-neon-purple via-zinc-800 to-transparent opacity-30" />

                            {/* Loan Closed Node */}
                            {loan.outstanding_amount <= 0 && (
                                <div className="relative flex items-start gap-4">
                                    {/* Timeline Node */}
                                    <div className="relative z-10 w-6 h-6 rounded-full bg-neon-lime border-2 border-neon-lime flex items-center justify-center shrink-0 mt-1 shadow-[0_0_15px_rgba(132,204,22,0.5)]">
                                        <CheckCircle2 size={12} className="text-black" strokeWidth={4} />
                                    </div>

                                    {/* Content Card */}
                                    <div className="flex-1 bg-neon-lime/10 border border-neon-lime/20 p-4 rounded-2xl -mt-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-sm text-neon-lime uppercase tracking-wider">Loan Closed</p>
                                                <p className="text-[10px] text-zinc-400 font-medium">
                                                    {payments.length > 0 ? formatDateTime(payments[0].paid_on) : formatDateTime(new Date())}
                                                </p>
                                            </div>
                                            <div className="px-2 py-0.5 rounded bg-neon-lime text-black text-[10px] font-bold uppercase tracking-widest">
                                                Paid Off
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payments Map */}
                            {payments.map((payment, index) => (
                                <div key={payment.id || index} className="relative flex items-start gap-4 group">
                                    {/* Timeline Node */}
                                    <div className="relative z-10 w-6 h-6 rounded-full bg-background border-2 border-neon-purple flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(171,211,0,0.3)]">
                                        <div className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" />
                                    </div>

                                    {/* Content Card */}
                                    <div className="flex-1 bg-card/40 border border-white/5 p-4 rounded-2xl hover:bg-card/60 transition-colors -mt-2">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <p className="font-bold text-sm text-foreground">Payment Received</p>
                                                <p className="text-[10px] text-muted-foreground font-medium">{formatDateTime(payment.paid_on)}</p>
                                            </div>
                                            <span className="font-bold text-sm text-neon-purple bg-neon-purple/10 px-2 py-0.5 rounded-md">
                                                +{formatCurrency(payment.amount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Loan Initiated Node (End of Timeline) */}
                            <div className="relative flex items-start gap-4">
                                {/* Timeline Node */}
                                <div className="relative z-10 w-6 h-6 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center shrink-0 mt-1">
                                    <Flag size={10} className="text-zinc-400" />
                                </div>

                                {/* Content Card */}
                                <div className="flex-1 bg-card/20 border border-white/5 p-4 rounded-2xl -mt-2 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <p className="font-bold text-sm text-zinc-300">Loan Initiated</p>
                                            <p className="text-[10px] text-zinc-500 font-medium">{formatDateTime(loan.start_date || loan.created_at)}</p>
                                        </div>
                                        <span className="font-bold text-sm text-zinc-400">
                                            {formatCurrency(loan.principal_amount)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

            </div>

            {/* Sticky Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-10 pb-8 z-20">
                <button
                    onClick={openPaymentModal}
                    disabled={loan.outstanding_amount <= 0}
                    className={cn(
                        "w-full py-3 rounded-full font-bold text-lg shadow-[0_8px_30px_rgba(171,211,0,0.4)] hover:shadow-[0_8px_40px_rgba(171,211,0,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2",
                        loan.outstanding_amount <= 0
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none hover:shadow-none hover:scale-100"
                            : "bg-primary text-black"
                    )}
                >
                    <Wallet size={20} />
                    {loan.outstanding_amount <= 0 ? "Loan Fully Paid" : "Pay Now"}
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

                            {/* Quick Select Buttons */}
                            <div className="flex gap-2 mt-3 px-1">
                                {loan.emi_amount > 0 && (
                                    <button
                                        onClick={() => setPayAmount(loan.emi_amount.toString())}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95",
                                            payAmount === loan.emi_amount.toString()
                                                ? "bg-neon-purple text-white border-neon-purple shadow-sm"
                                                : "bg-accent/50 text-muted-foreground border-transparent hover:bg-accent hover:text-foreground"
                                        )}
                                    >
                                        EMI: {formatCurrency(loan.emi_amount)}
                                    </button>
                                )}
                                <button
                                    onClick={() => setPayAmount(loan.outstanding_amount.toString())}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95",
                                        payAmount === loan.outstanding_amount.toString()
                                            ? "bg-neon-purple text-white border-neon-purple shadow-sm"
                                            : "bg-accent/50 text-muted-foreground border-transparent hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    Full: {formatCurrency(loan.outstanding_amount)}
                                </button>
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

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 font-bold text-sm tracking-wide flex items-center gap-3 border border-zinc-800 whitespace-nowrap">
                    <div className="w-5 h-5 rounded-full bg-neon-lime text-black flex items-center justify-center">
                        <CheckCircle2 size={12} strokeWidth={4} />
                    </div>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
