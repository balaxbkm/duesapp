"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button"; // Need to create button
import Image from "next/image";
import { cn } from "@/lib/utils";

// Temporary Button Component until I create the UI library file
function SimpleButton({ onClick, children, className }: { onClick?: () => void, children: React.ReactNode, className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn("px-5 py-2.5 rounded-xl font-semibold transition-all active:scale-95 text-sm", className)}
    >
      {children}
    </button>
  )
}

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-primary">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background bg-gradient-to-br from-background via-neon-lime/5 to-neon-purple/5 transition-colors duration-300">
      <div className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="space-y-1">
          <div className="relative w-14 h-14 mx-auto mb-3 group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors duration-500 animate-pulse" />
            <div className="relative w-full h-full transform transition-transform hover:scale-110 duration-500">
              <Image
                src="/wallet-3d.png"
                alt="DuesApp Logo"
                fill
                className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                priority
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-neon-lime to-neon-purple">
            DuesApp
          </h1>
          <p className="text-muted-foreground text-base px-4">
            Your personal money reminder that never misses a due date.
          </p>
        </div>

        <div className="space-y-3 pt-6">
          <SimpleButton
            onClick={signInWithGoogle}
            className="w-full bg-card border border-border text-foreground hover:bg-accent hover:text-accent-foreground shadow-md flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </SimpleButton>

          <SimpleButton
            onClick={() => { }}
            className="w-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 opacity-80 cursor-not-allowed border border-transparent"
          >
            Start with Phone (Coming Soon)
          </SimpleButton>
        </div>

        <div className="pt-6 grid grid-cols-2 gap-3 text-left">
          <div className="p-3 rounded-xl bg-card/40 backdrop-blur border border-border/50">
            <div className="text-xl mb-1">🔔</div>
            <h3 className="font-semibold text-xs text-foreground">Smart Reminders</h3>
            <p className="text-[10px] text-muted-foreground">Never miss a payment.</p>
          </div>
          <div className="p-3 rounded-xl bg-card/40 backdrop-blur border border-border/50">
            <div className="text-xl mb-1">📊</div>
            <h3 className="font-semibold text-xs text-foreground">Track Loans</h3>
            <p className="text-[10px] text-muted-foreground">Manage what you owe.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
