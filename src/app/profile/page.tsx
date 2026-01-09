"use client";
import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// I'll just use a normal button tag for now since I didn't verify ui/button exists (it doesn't, I skipped it to inline styles)
import { LogOut, User, Settings, Info, ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    if (loading || !user) return null;

    return (
        <div className="px-5 pt-3 bg-background min-h-screen pb-32 font-sans selection:bg-neon-lime/30 transition-colors duration-300">
            {/* Creative Header */}
            <div className="flex items-center justify-between mb-4 pt-3 px-4">
                <Link href="/dashboard" className="w-12 h-12 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-95 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/settings" className="w-12 h-12 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-95 group">
                    <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                </Link>
            </div>

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground tracking-tighter mb-1">My Account</h1>
                <p className="text-muted-foreground text-xs">Manage your profile and settings.</p>
            </div>

            {/* Profile Card */}
            <div className="flex items-center gap-4 mb-8 bg-card p-4 rounded-[24px] border border-border shadow-xl relative overflow-hidden group">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-neon-lime/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-neon-lime/10 transition-colors duration-500" />

                <div className="w-16 h-16 rounded-full bg-accent overflow-hidden border-2 border-card shadow-lg flex-shrink-0 relative z-10">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neon-lime text-black text-2xl font-bold">
                            {user.email?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="relative z-10">
                    <h2 className="font-bold text-lg text-foreground mb-0.5 tracking-wide">{user.displayName || 'User'}</h2>
                    <p className="text-xs text-muted-foreground font-medium">{user.email}</p>
                </div>
            </div>

            {/* Menu Options */}
            <div className="space-y-4">
                <Link href="/profile/edit" className="flex items-center justify-between p-5 bg-card rounded-[24px] border border-border hover:bg-accent/50 active:scale-[0.98] transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent rounded-2xl text-muted-foreground group-hover:text-foreground group-hover:bg-accent/80 transition-colors">
                            <User size={20} />
                        </div>
                        <span className="font-medium text-foreground group-hover:text-foreground text-sm">Edit Profile</span>
                    </div>
                    <div className="text-muted-foreground group-hover:translate-x-1 transition-transform">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </div>
                </Link>

                <Link href="/settings" className="flex items-center justify-between p-4 bg-card rounded-[20px] border border-border hover:bg-accent/50 active:scale-[0.98] transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent rounded-2xl text-muted-foreground group-hover:text-foreground group-hover:bg-accent/80 transition-colors">
                            <Settings size={20} />
                        </div>
                        <span className="font-medium text-foreground group-hover:text-foreground text-sm">App Settings</span>
                    </div>
                    <div className="text-muted-foreground group-hover:translate-x-1 transition-transform">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </div>
                </Link>

                <Link href="/support" className="flex items-center justify-between p-4 bg-card rounded-[20px] border border-border hover:bg-accent/50 active:scale-[0.98] transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent rounded-2xl text-muted-foreground group-hover:text-foreground group-hover:bg-accent/80 transition-colors">
                            <Info size={20} />
                        </div>
                        <span className="font-medium text-foreground group-hover:text-foreground text-sm">Support</span>
                    </div>
                    <div className="text-muted-foreground group-hover:translate-x-1 transition-transform">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </div>
                </Link>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-4 p-5 bg-card text-red-500 rounded-[24px] border border-border hover:bg-red-500/10 mt-8 active:scale-[0.98] transition-all group"
                >
                    <div className="p-3 bg-red-500/10 rounded-2xl group-hover:bg-red-500/20 transition-colors"><LogOut size={20} /></div>
                    <span className="font-bold text-sm">Sign Out</span>
                </button>
            </div>
        </div>
    );
}
