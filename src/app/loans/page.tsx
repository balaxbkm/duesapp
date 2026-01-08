"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { getUserLoans } from '@/services/loanService';
import { Loan } from '@/types';
import { Loader2, Search, Filter } from 'lucide-react';
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
        <div className="p-6 pb-32 space-y-6 min-h-screen bg-black font-sans selection:bg-neon-lime/30">
            <h1 className="text-xl font-medium text-white tracking-wide mb-4">All Loans</h1>

            <div className="flex items-center gap-3 bg-[#1C1C1E] p-4 rounded-full border border-white/5 sticky top-4 z-10 shadow-lg shadow-black/20">
                <Search className="text-zinc-500" size={20} />
                <input
                    placeholder="Search loans..."
                    className="bg-transparent flex-1 outline-none text-sm text-white placeholder:text-zinc-600"
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
                                ? "bg-neon-lime text-black font-bold shadow-[0_0_15px_rgba(223,255,79,0.2)]"
                                : "bg-[#1C1C1E] border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
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
                            <div className="p-5 rounded-[24px] bg-[#1C1C1E] border border-white/5 relative overflow-hidden transition-all hover:bg-[#252527] hover:border-white/10 group-active:scale-[0.98]">
                                {/* Accent bar - Neon Lime for all */}
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-neon-lime" />
                                <div className="flex justify-between items-start mb-3 pl-3">
                                    <div>
                                        <h3 className="font-bold text-white text-lg tracking-wide">{loan.title}</h3>
                                        <p className="text-xs text-zinc-500 font-medium mt-0.5">Due: {formatDate(loan.next_due_date || loan.due_date)}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-bold text-white tracking-tight">
                                            {formatCurrency(loan.outstanding_amount)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pl-3">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        loan.status === 'active' ? "bg-neon-purple/10 text-neon-purple border border-neon-purple/20" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                    )}>
                                        {loan.status}
                                    </span>
                                    <span className="text-xs text-zinc-500 font-medium">
                                        EMI: <span className="text-zinc-300">{formatCurrency(loan.emi_amount)}</span>
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
