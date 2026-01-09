"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthContext';
import { getUserLoans } from '@/services/loanService';
import { Loan } from '@/types';
import { Loader2, Search, Filter, ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoansPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            getUserLoans(user.uid).then(setLoans).catch(console.error).finally(() => setLoading(false));
        }
    }, [user]);

    const filteredLoans = loans.filter(loan => {
        if (filter !== 'all' && loan.status !== filter) return false;
        if (search && !loan.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="px-5 pt-4 pb-32 space-y-6 min-h-screen bg-background font-sans selection:bg-primary/30">
            {/* Header */}
            <div className="flex items-center gap-4 mb-0 pt-0 px-0">
                <Link href="/dashboard" className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-95 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">All Loans</h1>
                </div>
            </div>

            <div className="flex items-center gap-3 bg-card p-4 rounded-full border border-border sticky top-4 z-10 shadow-lg shadow-black/20">
                <Search className="text-muted-foreground" size={20} />
                <input
                    placeholder="Search loans..."
                    className="bg-transparent flex-1 outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {['all', 'active', 'closed'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={cn(
                            "px-5 py-2.5 rounded-full text-xs font-medium whitespace-nowrap capitalize transition-all",
                            filter === f
                                ? "bg-primary text-primary-foreground font-bold shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                    >
                        {f} Loans
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-neon-lime" /></div>
            ) : (
                <div className="space-y-4">
                    {filteredLoans.map(loan => (
                        <Link href={`/loans/${loan.id}`} key={loan.id} className="block group">
                            <div className="p-5 rounded-[32px] bg-card border border-border relative overflow-hidden transition-all hover:bg-accent/40 group-active:scale-[0.98]">
                                {/* Accent bar */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                                <div className="flex justify-between items-start mb-3 pl-3">
                                    <div>
                                        <h3 className="font-bold text-foreground text-lg tracking-wide">{loan.title}</h3>
                                        <p className="text-xs text-muted-foreground font-medium mt-0.5">Due: {formatDate(loan.next_due_date || loan.due_date)}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-bold text-foreground tracking-tight">
                                            {formatCurrency(loan.outstanding_amount)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pl-3">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        loan.status === 'active' ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground border border-border"
                                    )}>
                                        {loan.status}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium">
                                        EMI: <span className="text-foreground/80">{formatCurrency(loan.emi_amount)}</span>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {filteredLoans.length === 0 && (
                        <div className="text-center py-20 text-zinc-600 text-sm">
                            <p>No loans found matching your criteria.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
