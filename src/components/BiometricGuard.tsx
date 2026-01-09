"use client";
import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, ChevronRight, Delete } from 'lucide-react';

export default function BiometricGuard({ children }: { children: React.ReactNode }) {
    const [isLocked, setIsLocked] = useState(false);
    const [pin, setPin] = useState("");
    const [storedPin, setStoredPin] = useState("1234");

    useEffect(() => {
        // Check if biometric/app lock is enabled
        const biometricEnabled = localStorage.getItem('settings_biometric') === 'true';
        const hasUnlocked = sessionStorage.getItem('app_unlocked') === 'true';
        const sPin = localStorage.getItem('settings_pin') || "1234";

        setStoredPin(sPin);

        if (biometricEnabled && !hasUnlocked) {
            setIsLocked(true);
            // Auto-trigger biometric prompt if possible
            triggerBiometric();
        }
    }, []);

    const unlock = () => {
        setIsLocked(false);
        sessionStorage.setItem('app_unlocked', 'true');
    };

    const triggerBiometric = async () => {
        try {
            // We use a dummy credential creation to trigger the OS authentication prompt (TouchID/FaceID/Device PIN)
            // This verifies "User Presence" locally.
            if (window.PublicKeyCredential) {
                await navigator.credentials.create({
                    publicKey: {
                        challenge: new Uint8Array([1, 2, 3, 4]),
                        rp: { name: "DuesApp Auth" },
                        user: {
                            id: new Uint8Array([1]),
                            name: "user",
                            displayName: "User"
                        },
                        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                        timeout: 60000,
                        authenticatorSelection: {
                            authenticatorAttachment: "platform", // Forces platform authenticator (FaceID/TouchID)
                            userVerification: "required" // Forces the prompt
                        },
                        attestation: "direct"
                    }
                });
                // If the promise resolves, user verified successfully
                unlock();
            }
        } catch (e) {
            console.log("Biometric check cancelled or failed", e);
            // Fallback to PIN is always available in UI
        }
    };

    const handlePinInput = (num: number) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                if (newPin === storedPin) {
                    unlock();
                } else {
                    // Shake or error effect? For now just reset
                    setTimeout(() => setPin(""), 300);
                }
            }
        }
    };

    if (!isLocked) return <>{children}</>;

    return (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-full bg-accent/50 flex items-center justify-center mb-8 shadow-2xl shadow-neon-lime/10">
                <Lock size={32} className="text-neon-lime" />
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-2">App Locked</h1>
            <p className="text-muted-foreground text-sm mb-10">Enter PIN or use Biometrics to unlock</p>

            {/* PIN Dots */}
            <div className="flex gap-4 mb-12">
                {[0, 1, 2, 3].map(i => (
                    <div
                        key={i}
                        className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-neon-lime scale-110 shadow-[0_0_10px_hsl(var(--neon-lime))]' : 'bg-accent border border-border'}`}
                    />
                ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-6 w-full max-w-[280px] mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                        key={num}
                        onClick={() => handlePinInput(num)}
                        className="w-16 h-16 rounded-full bg-accent/30 text-2xl font-bold text-foreground hover:bg-neon-lime hover:text-black transition-all active:scale-90 flex items-center justify-center"
                    >
                        {num}
                    </button>
                ))}
                <div />
                <button
                    onClick={() => handlePinInput(0)}
                    className="w-16 h-16 rounded-full bg-accent/30 text-2xl font-bold text-foreground hover:bg-neon-lime hover:text-black transition-all active:scale-90 flex items-center justify-center"
                >
                    0
                </button>
                <button
                    onClick={() => setPin(prev => prev.slice(0, -1))}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all"
                >
                    <Delete size={24} />
                </button>
            </div>

            <button
                onClick={triggerBiometric}
                className="flex items-center gap-2 text-neon-lime font-bold uppercase tracking-wider text-xs py-4 px-8 rounded-full hover:bg-neon-lime/10 transition-colors"
            >
                <Fingerprint size={16} />
                Use Biometrics
            </button>
        </div>
    );
}
