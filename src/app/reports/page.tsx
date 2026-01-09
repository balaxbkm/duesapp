"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthContext';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ArrowLeft, TrendingUp, DollarSign, Calendar, IndianRupee, Euro, PoundSterling } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/providers/ThemeProvider';
import { formatCurrency } from '@/lib/utils';

const data = [
    { name: 'Jan', total: 1200 },
    { name: 'Feb', total: 900 },
    { name: 'Mar', total: 1600 },
    { name: 'Apr', total: 1100 },
    { name: 'May', total: 2000 },
    { name: 'Jun', total: 800 },
];

export default function ReportsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const [currency, setCurrency] = useState('INR');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('settings_currency');
            if (saved) setCurrency(saved);
        }
    }, []);

    if (!user) return null;

    return (
        <div className="px-5 pt-4 bg-background min-h-screen pb-32 font-sans selection:bg-neon-lime/30 transition-colors duration-300">
            {/* Creative Header */}
            <div className="flex items-center gap-4 mb-6 pt-0 px-0">
                <Link href="/dashboard" className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-95 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">Financial Reports</h1>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-card p-4 rounded-[18px] border border-border">
                    <div className="w-8 h-8 rounded-full bg-neon-lime/10 flex items-center justify-center text-neon-lime mb-2">
                        <TrendingUp size={16} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">Total Paid</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(4200)}</p>
                </div>
                <div className="bg-card p-4 rounded-[18px] border border-border">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                        {currency === 'INR' ? <IndianRupee size={16} /> :
                            currency === 'EUR' ? <Euro size={16} /> :
                                currency === 'GBP' ? <PoundSterling size={16} /> :
                                    <DollarSign size={16} />}
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">Pending</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(12800)}</p>
                </div>
            </div>

            <div className="bg-card p-6 rounded-[32px] border border-border mb-8">
                <h2 className="text-foreground font-bold mb-6 flex items-center gap-2">
                    <Calendar size={18} className="text-muted-foreground" />
                    Monthly Payments
                </h2>
                <div className="h-[250px] w-full *:focus:outline-none focus:outline-none [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none" style={{ outline: 'none' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 0, left: -24, bottom: 0 }}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => formatCurrency(value)}
                                dx={-4}
                                width={60}
                            />
                            <Tooltip
                                trigger="click"
                                cursor={false}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-background/90 backdrop-blur-xl border border-border/50 p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)]">
                                                <p className="text-foreground font-bold text-lg mb-1">{label}</p>
                                                <p className="text-primary text-sm font-medium">
                                                    Total: <span className="font-bold text-foreground ml-1">{formatCurrency(payload[0].value as number)}</span>
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="total"
                                fill="url(#barGradient)"
                                radius={[12, 12, 12, 12]}
                                activeBar={{ fill: 'hsl(var(--foreground))', strokeWidth: 0 }}
                                animationDuration={1500}
                                barSize={32}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-card p-6 rounded-[32px] border border-border">
                <h2 className="text-foreground font-bold mb-4">Insights</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    You have paid <strong className="text-foreground">25%</strong> of your total debt this year. At this rate, you will stand debt-free by <strong className="text-foreground">August 2026</strong>. Great job keeping up with your EMIs!
                </p>
            </div>
        </div>
    );
}
