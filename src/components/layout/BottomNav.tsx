"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, Bell, User, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Profile', href: '/profile', icon: User },
        { name: 'Loans', href: '/dashboard', icon: Wallet },
        { name: 'Report', href: '/reports', icon: PieChart },
        { name: 'Notifications', href: '/notifications', icon: Bell },
    ];

    if (pathname === '/' || pathname === '/login' || pathname.startsWith('/loans/') || pathname === '/add' || pathname === '/profile/edit' || pathname === '/settings' || pathname === '/support') return null;

    return (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="nav-pill pointer-events-auto h-[60px] px-1.5 flex items-center gap-0.5 overflow-hidden relative">
                {navItems.map((item) => {
                    // Force Loans to be active for the demo if in dashboard, or use logic
                    const isActive = pathname === item.href || (item.name === 'Loans' && pathname === '/dashboard');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "relative w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                        >
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
