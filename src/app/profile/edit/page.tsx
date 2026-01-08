"use client";
import { useAuth } from '@/providers/AuthProvider';
import { useState } from 'react';
import { ArrowLeft, Camera, Loader2, Save, User, Mail } from 'lucide-react';
import Link from 'next/link';
import { updateProfile } from "firebase/auth";

export default function EditProfilePage() {
    const { user } = useAuth();
    const [name, setName] = useState(user?.displayName || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await updateProfile(user, { displayName: name });
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-32 px-6 pt-8 font-sans selection:bg-neon-lime/30 transition-colors duration-300">
            {/* Header */}
            {/* Creative Header */}
            <div className="flex items-center justify-between mb-8 pt-4">
                <Link href="/profile" className="w-12 h-12 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-95 group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Edit Profile</h1>
                <p className="text-muted-foreground text-sm">Update your personal information.</p>
            </div>

            <div className="flex flex-col items-center mb-10">
                <div className="relative group cursor-pointer">
                    <div className="w-28 h-28 rounded-full border-4 border-card overflow-hidden bg-accent">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neon-lime text-black text-3xl font-bold">
                                {name?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={24} />
                    </div>
                    <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-neon-lime flex items-center justify-center text-black border-2 border-background">
                        <Camera size={14} />
                    </div>
                </div>
                <p className="mt-3 text-muted-foreground text-sm">Tap to change photo</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <User size={18} />
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-card text-foreground border border-border rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-neon-lime/50 focus:ring-1 focus:ring-neon-lime/50 transition-all font-medium"
                            placeholder="Your Name"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative opacity-50">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full bg-card text-muted-foreground border border-border rounded-2xl py-4 pl-12 pr-4 cursor-not-allowed font-medium"
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 ml-1">Email cannot be changed</p>
                </div>

                <button
                    disabled={loading}
                    className="w-full bg-neon-lime text-black font-bold py-4 rounded-full mt-8 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(223,255,79,0.2)]"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    Save Changes
                </button>
            </form>
        </div>
    );
}
