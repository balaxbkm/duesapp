"use client";
import { useAuth } from '@/providers/AuthProvider';
import { ArrowLeft, Bell, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Notification } from '@/types';
import { getNotifications, markAsRead, markAllAsRead, createNotification } from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        async function loadData() {
            if (!user) return;
            try {
                const data = await getNotifications(user.uid);
                if (data.length === 0) {
                    // Seed initial notifications for demo
                    const initialNotifs: Omit<Notification, 'id'>[] = [
                        {
                            userId: user.uid,
                            title: 'Welcome to DuesApp',
                            message: 'Get started by adding your first loan or debt.',
                            time: Date.now(),
                            type: 'info',
                            read: false
                        },
                        {
                            userId: user.uid,
                            title: 'Setup Profile',
                            message: 'Complete your profile to get the most out of the app.',
                            time: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
                            type: 'warning',
                            read: false
                        }
                    ];

                    for (const n of initialNotifs) {
                        await createNotification(n);
                    }
                    // Fetch again
                    const seededData = await getNotifications(user.uid);
                    setNotifications(seededData);
                } else {
                    setNotifications(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [user]);

    const handleMarkAllRead = async () => {
        if (!user) return;
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        await markAllAsRead(user.uid);
    };

    const handleRead = async (id: string) => {
        if (!id) return;
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        await markAsRead(id);
    };

    if (!user) return null;
    if (loading) return <div className="flex justify-center items-center h-screen bg-background"><Loader2 className="animate-spin text-primary" /></div>;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="p-6 bg-background min-h-screen pb-32 font-sans selection:bg-neon-lime/30 transition-colors duration-300">
            {/* Creative Header */}
            <div className="flex items-center justify-between mb-8 pt-4">
                <Link href="/dashboard" className="w-12 h-12 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-95 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </Link>
                <div className="flex gap-4 items-center">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-bold text-primary hover:opacity-80 transition-opacity uppercase tracking-wider"
                        >
                            Mark all read
                        </button>
                    )}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 relative">
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <div className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))] animate-pulse"></div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h1 className="text-4xl font-bold text-foreground tracking-tighter mb-2">Notifications</h1>
                <p className="text-muted-foreground text-sm">
                    You have <span className="text-foreground font-bold">{unreadCount > 0 ? `${unreadCount} unread` : 'no new'}</span> updates today.
                </p>
            </div>

            <div className="space-y-4">
                {notifications.map((notif) => (
                    <div
                        key={notif.id}
                        onClick={() => !notif.read && notif.id && handleRead(notif.id)}
                        className={cn(
                            "p-5 rounded-[24px] border border-border relative overflow-hidden transition-all hover:bg-accent/40 cursor-pointer",
                            notif.read ? "bg-card opacity-60" : "bg-card shadow-lg shadow-black/5 border-l-4 border-l-primary"
                        )}
                    >
                        {/* Unread Indicator */}
                        {!notif.read && (
                            <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]"></div>
                        )}

                        <div className="flex gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                notif.type === 'warning' ? 'bg-orange-500/10 text-orange-500' :
                                    notif.type === 'success' ? 'bg-green-500/10 text-green-500' :
                                        'bg-blue-500/10 text-blue-500'
                            )}>
                                {notif.type === 'warning' && <AlertCircle size={18} />}
                                {notif.type === 'success' && <CheckCircle2 size={18} />}
                                {notif.type === 'info' && <Bell size={18} />}
                            </div>
                            <div>
                                <h3 className={cn(
                                    "font-bold text-sm mb-1",
                                    !notif.read ? 'text-foreground' : 'text-muted-foreground'
                                )}>
                                    {notif.title}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed max-w-[90%]">
                                    {notif.message}
                                </p>
                                <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium uppercase tracking-wider">
                                    {formatDistanceToNow(notif.time, { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Bell size={48} className="mb-4 opacity-20" />
                        <p>No new notifications</p>
                    </div>
                )}
            </div>
        </div>
    );
}
