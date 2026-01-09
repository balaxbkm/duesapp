"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthContext';
import { getDashboardStats, makePayment } from '@/services/loanService';
import { useTheme } from '@/providers/ThemeProvider';
import { Loan } from '@/types';
import { Loader2, TrendingUp, ChevronDown, CheckCircle2, Wallet, Plus, Bell, Grid, PieChart, X, Moon, Sun } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { addMonths, addWeeks } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
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

    // Toast State
    const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

    const showToast = (message: string) => {
        setToast({ message, show: true });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    // Quick Payment Logic
    const handleQuickPayment = async (loan: Loan) => {
        let amount = loan.outstanding_amount;
        if (loan.frequency === 'monthly' || loan.frequency === 'weekly') {
            if (loan.emi_amount > 0) {
                amount = Math.min(loan.emi_amount, loan.outstanding_amount);
            }
        }

        if (typeof window !== 'undefined' && window.confirm(`Are you sure you want to pay ${formatCurrency(amount)} for ${loan.title}?`)) {
            try {
                // Calculate next due date
                let nextDueDate = new Date();
                const currentDueDate = loan.next_due_date ? new Date(loan.next_due_date) : new Date(loan.due_date);

                if (loan.frequency === 'monthly') {
                    nextDueDate = addMonths(currentDueDate, 1);
                } else if (loan.frequency === 'weekly') {
                    nextDueDate = addWeeks(currentDueDate, 1);
                } else {
                    nextDueDate = currentDueDate; // For custom, maybe don't move it automatically or keep same
                }

                await makePayment(loan.id!, amount, nextDueDate);
                showToast("Payment Successful");

                // Optimistic Update
                setStats(prev => {
                    if (!prev) return null;
                    const updatedLoans = prev.allLoans.map(l =>
                        l.id === loan.id
                            ? {
                                ...l,
                                outstanding_amount: Math.max(0, l.outstanding_amount - amount),
                                next_due_date: nextDueDate.toISOString()
                            }
                            : l
                    );
                    return {
                        ...prev,
                        totalToPay: Math.max(0, prev.totalToPay - amount),
                        allLoans: updatedLoans
                    };
                });
            } catch (e) {
                console.error(e);
                alert("Payment failed");
            }
        }
    };

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
        <div className="min-h-screen bg-background pb-32 px-5 pt-4 font-sans overflow-x-hidden selection:bg-neon-lime/30 transition-colors duration-300">

            {/* Header */}
            <div className="flex items-center justify-between mb-5 relative z-50">
                <h1 className="text-lg font-medium text-foreground tracking-wide flex items-center gap-2">
                    <div className="relative w-6 h-6">
                        <Image src="/wallet-3d.png" alt="App Icon" fill className="object-contain" />
                    </div>
                    <span className="font-bold mt-0.5">DuesApp</span>
                </h1>
                <button
                    onClick={toggleTheme}
                    className="w-9 h-9 rounded-full bg-accent/50 hover:bg-accent border border-border flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                >
                    {theme === 'dark' ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-foreground" />}
                </button>
            </div>

            {/* Hero Stats */}
            <div className="mb-5 relative">
                <div className="flex items-center justify-between mt-14 mb-6">
                    <h2 className="text-4xl font-bold text-foreground tracking-tighter">{formatCurrency(stats?.totalToPay || 0)}</h2>
                    <Link href="/add" className="w-9 h-9 flex items-center justify-center btn-neon">
                        <Plus size={20} strokeWidth={2.5} />
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

                {/* Filter Dropdown (Moved) */}
                <div className="relative flex items-center justify-between mt-7">
                    <h3 className="text-xl font-bold text-foreground tracking-tight">My Loans</h3>
                    <div className="flex items-center gap-2">
                        <div className="h-8 px-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-wider min-w-[3.5rem] flex items-center justify-center uppercase">
                            {filter}
                        </div>
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className={cn(
                                "w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg",
                                showFilterMenu ? "rotate-180" : ""
                            )}
                        >
                            <ChevronDown size={14} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Creative Glass Dropdown */}
                    <div className={cn(
                        "absolute top-full right-0 mt-2.5 w-32 p-1 rounded-xl bg-popover/95 backdrop-blur-xl border border-border shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] flex flex-col gap-1 transition-all duration-300 origin-top-right z-50",
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
                                    "px-3 py-2 rounded-lg text-left text-[10px] font-medium transition-all duration-200 flex items-center justify-between group",
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

            {/* Loan List */}
            <div className="space-y-3">
                {filteredLoans.length > 0 ? (
                    filteredLoans.map((loan) => {
                        const paidPercentage = loan.principal_amount > 0
                            ? Math.max(0, Math.min(100, ((loan.principal_amount - loan.outstanding_amount) / loan.principal_amount) * 100))
                            : 0;
                        const isClosed = loan.status === 'closed' || loan.outstanding_amount <= 0;

                        let displayAmount = loan.outstanding_amount;
                        if (loan.frequency === 'monthly' || loan.frequency === 'weekly') {
                            if (loan.emi_amount > 0) {
                                displayAmount = Math.min(loan.emi_amount, loan.outstanding_amount);
                            }
                        }

                        return (
                            <div key={loan.id} className="group relative">
                                {/* Main Card Link */}
                                <Link href={`/loans/${loan.id}`} className="absolute inset-0 z-0 rounded-[24px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />

                                <div className={cn(
                                    "dark-card p-4 relative overflow-hidden bg-card group-hover:bg-accent/40 transition-all border border-border rounded-[24px] pointer-events-none",
                                    isClosed && "opacity-50 grayscale-[0.5]"
                                )}>
                                    {/* Action Button - Higher Z-Index and interactive */}
                                    {isClosed ? (
                                        <div className="absolute top-5 right-5 z-10 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                                            Completed
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault(); // Prevent Link navigation
                                                handleQuickPayment(loan);
                                            }}
                                            className="btn-neon text-[10px] w-24 px-0 py-2.5 absolute top-5 right-5 pointer-events-auto z-10 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
                                        >
                                            {formatCurrency(displayAmount)}
                                        </button>
                                    )}

                                    <div className="flex items-start gap-4">
                                        {/* Icon with Ring */}
                                        <div className="relative w-10 h-10 flex items-center justify-center">
                                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" className="stroke-gray-700" strokeWidth="2" />
                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--neon-lime))" strokeWidth="2" strokeDasharray={`${paidPercentage}, 100`} />
                                            </svg>
                                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground z-10">
                                                <Wallet size={16} />
                                            </div>
                                        </div>

                                        <div className="mt-1">
                                            <h3 className="text-base font-bold text-foreground tracking-wide">{loan.title}</h3>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Due by {formatDate(loan.next_due_date || loan.due_date)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="relative w-full flex flex-col items-center justify-center text-center min-h-[60vh]">
                        {/* Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-neon-lime/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative w-16 h-16 mb-4">
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
