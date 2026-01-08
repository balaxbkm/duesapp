"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { getDashboardStats, makePayment } from '@/services/loanService';
import { Loan } from '@/types';
import { Loader2, TrendingUp, ChevronDown, CheckCircle2, Wallet, Plus, Bell, Grid, PieChart, X } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<{
        totalToPay: number;
        totalToReceive: number;
        upcomingDues: Loan[];
        recentLoans: Loan[];
        allLoans: Loan[];
    } | null>(null);
    const [fetching, setFetching] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Active' | 'Completed'>('All');
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    // Payment Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [payAmount, setPayAmount] = useState('');

    useEffect(() => {
        async function loadStats() {
            if (user) {
                try {
                    const data = await getDashboardStats(user.uid);
                    setStats(data);
                } catch (error) {
                    console.error("Failed to load stats", error);
                } finally {
                    setFetching(false);
                }
            } else if (!loading) {
                setFetching(false);
            }
        }
        loadStats();
    }, [user, loading]);

    const handleOpenPaymentModal = (loan: Loan) => {
        setSelectedLoan(loan);
        setPayAmount(loan.emi_amount.toString());
        setPaymentModalOpen(true);
    };

    const handleProcessPayment = async () => {
        if (!selectedLoan || !payAmount || !user) return;
        const amount = Number(payAmount);
        try {
            await makePayment(selectedLoan.id!, amount, new Date());
            setPaymentModalOpen(false);

            // Optimistic Update
            setStats(prev => {
                if (!prev) return null;
                const updatedLoans = prev.allLoans.map(l =>
                    l.id === selectedLoan.id
                        ? { ...l, outstanding_amount: Math.max(0, l.outstanding_amount - amount) }
                        : l
                );
                // Simplify: Just updating the specific loan in the list and totalToPay
                return {
                    ...prev,
                    totalToPay: Math.max(0, prev.totalToPay - amount),
                    allLoans: updatedLoans
                    // upcoming/recent might need update too in a real full app, but this covers the main view
                };
            });
        } catch (e) {
            console.error(e);
            alert("Payment failed");
        }
    };

    const filteredLoans = stats?.allLoans?.filter(loan => {
        if (filter === 'All') return true;
        if (filter === 'Active') return loan.status === 'active';
        if (filter === 'Completed') return loan.status === 'closed';
        return true;
    }) || [];

    if (loading || fetching) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    // Assuming specific goal or limit for progress bar logic
    const totalPaidSoFar = 1200; // Mock data
    const totalGoal = 3000;      // Mock data
    const progressPercent = Math.min((totalPaidSoFar / totalGoal) * 100, 100);

    return (
        <div className="min-h-screen bg-background pb-32 px-6 pt-12 font-sans overflow-x-hidden selection:bg-neon-lime/30 transition-colors duration-300">

            {/* Header */}
            <div className="flex items-center justify-between mb-8 relative z-50">
                <h1 className="text-xl font-medium text-foreground tracking-wide flex items-center gap-3">
                    <div className="relative w-8 h-8">
                        <Image src="/wallet-3d.png" alt="App Icon" fill className="object-contain" />
                    </div>
                    DuesApp
                </h1>
                <div className="relative">
                    <div className="flex items-center gap-3">
                        <div className="h-10 px-6 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider min-w-[4rem] flex items-center justify-center uppercase">
                            {filter}
                        </div>
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className={cn(
                                "w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg",
                                showFilterMenu ? "rotate-180" : ""
                            )}
                        >
                            <ChevronDown size={18} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Creative Glass Dropdown */}
                    <div className={cn(
                        "absolute top-full right-0 mt-3 w-40 p-1.5 rounded-2xl bg-popover/95 backdrop-blur-xl border border-border shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] flex flex-col gap-1 transition-all duration-300 origin-top-right z-50",
                        showFilterMenu ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                    )}>
                        {['All', 'Active', 'Completed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => {
                                    setFilter(f as any);
                                    setShowFilterMenu(false);
                                }}
                                className={cn(
                                    "px-4 py-2.5 rounded-xl text-left text-xs font-medium transition-all duration-200 flex items-center justify-between group",
                                    filter === f
                                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                )}
                            >
                                {f}
                                {filter === f && <CheckCircle2 size={12} className="text-primary-foreground" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Hero Stats */}
            <div className="mb-10 relative">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-5xl font-bold text-foreground tracking-tighter">{formatCurrency(stats?.totalToPay || 0)}</h2>
                    <Link href="/add" className="w-12 h-12 flex items-center justify-center btn-neon">
                        <Plus size={24} strokeWidth={2.5} />
                    </Link>
                </div>

                {/* Progress Bar Container */}
                <div className="flex justify-between text-xs text-muted-foreground mb-2 font-medium tracking-wide">
                    <span>Paid So Far</span>
                    <span className="text-neon-purple font-bold tracking-normal">{formatCurrency(totalPaidSoFar)}</span>
                </div>
                <div className="h-3 w-full bg-card border border-border/50 rounded-full overflow-hidden relative">
                    <div
                        className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(171,211,0,0.4)]"
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                    {/* Striped Pattern Overlay */}
                    <div className="absolute top-0 right-0 h-full w-full opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, #000 4px, #000 8px)' }}></div>
                </div>
            </div>

            {/* Loan List */}
            <div className="space-y-4">
                {filteredLoans.length > 0 ? (
                    filteredLoans.map((loan) => (
                        <div key={loan.id} className="group relative">
                            {/* Main Card Link */}
                            <Link href={`/loans/${loan.id}`} className="absolute inset-0 z-0 rounded-[32px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />

                            <div className="dark-card p-5 relative overflow-hidden bg-card group-hover:bg-accent/40 transition-all border border-border rounded-[32px] pointer-events-none">

                                {/* Status Label */}
                                <div className="absolute top-6 right-6 text-neon-purple text-xs font-semibold tracking-wide">
                                    {loan.status === 'active' ? 'Active' : 'Completed'}
                                </div>

                                <div className="flex items-start gap-4 mb-8">
                                    {/* Icon with Ring */}
                                    <div className="relative w-12 h-12 flex items-center justify-center">
                                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" className="stroke-muted" strokeWidth="2" />
                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--neon-lime))" strokeWidth="2" strokeDasharray="60, 100" />
                                        </svg>
                                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground z-10">
                                            <Wallet size={16} />
                                        </div>
                                    </div>

                                    <div className="mt-1">
                                        <h3 className="text-lg font-bold text-foreground tracking-wide">{loan.title}</h3>
                                        <p className="text-[11px] text-muted-foreground mt-1 font-medium">Due by {formatDate(loan.next_due_date || loan.due_date)}</p>
                                    </div>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1 font-medium">Left: <span className="text-foreground text-xl font-bold ml-1 tracking-tight">{formatCurrency(loan.outstanding_amount)}</span></p>
                                    </div>
                                    {/* Action Button - Higher Z-Index and interactive */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault(); // Prevent Link navigation
                                            handleOpenPaymentModal(loan);
                                        }}
                                        className="btn-neon text-xs px-6 py-3 pointer-events-auto relative z-10 hover:scale-105 active:scale-95 transition-transform"
                                    >
                                        Pay Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="relative w-full flex flex-col items-center justify-center text-center min-h-[60vh]">
                        {/* Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-neon-lime/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative w-24 h-24 mb-6">
                            {/* Floating 3D Icon */}
                            <Image
                                src="/wallet-3d.png"
                                alt="Wallet Icon"
                                fill
                                className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] z-10 grayscale-[0.8] opacity-60"
                            />
                        </div>

                        <h3 className="text-foreground font-bold text-lg mb-2 relative z-10">No {filter !== 'All' ? filter.toLowerCase() : ''} loans found</h3>
                        <p className="text-muted-foreground text-sm max-w-[240px] leading-relaxed relative z-10 mb-8">
                            {filter === 'Completed'
                                ? "Looks like you haven't closed any loans yet. Keep up the good work!"
                                : "Your slate is clean! No debts to display at the moment."}
                        </p>

                        {filter !== 'Completed' && (
                            <Link href="/add" className="relative z-10 px-8 py-3 rounded-full bg-accent text-foreground text-xs font-bold hover:scale-105 active:scale-95 transition-all border border-border shadow-lg">
                                Create New Loan
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {paymentModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-border/50 relative scale-in-95 animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setPaymentModalOpen(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex flex-col items-center mb-6">
                            <div className="w-14 h-14 rounded-full bg-neon-purple/10 flex items-center justify-center text-neon-purple mb-4">
                                <Wallet size={28} />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Make Payment</h2>
                            <p className="text-sm text-muted-foreground">{selectedLoan?.title}</p>
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
