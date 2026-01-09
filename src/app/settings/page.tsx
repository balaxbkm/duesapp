"use client";
import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Moon, Shield, Lock, ChevronRight, Globe, Smartphone, X, Check } from 'lucide-react';
import Link from 'next/link';

import { useTheme } from '@/providers/ThemeProvider';

interface SettingsState {
    notifications: boolean;
    biometric: boolean;
    currency: string;
    pin: string;
}

export default function SettingsPage() {
    const { theme, toggleTheme } = useTheme();

    const [settings, setSettings] = useState<SettingsState>({
        notifications: true,
        biometric: false,
        currency: 'INR',
        pin: '1234'
    });

    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // PIN States
    const [pinInput, setPinInput] = useState("");
    const [pinStep, setPinStep] = useState<'verify' | 'new' | 'confirm'>('verify');
    const [tempNewPin, setTempNewPin] = useState("");

    // Load settings on mount
    useEffect(() => {
        const loadSettings = () => {
            if (typeof window === 'undefined') return;

            const storedCurrency = localStorage.getItem('settings_currency') || 'INR';
            const storedNotif = localStorage.getItem('settings_notifications') === 'true';
            const storedBio = localStorage.getItem('settings_biometric') === 'true';
            const storedPin = localStorage.getItem('settings_pin') || '1234';

            setSettings({
                notifications: localStorage.getItem('settings_notifications') !== null ? storedNotif : true,
                biometric: storedBio,
                currency: storedCurrency,
                pin: storedPin
            });
        };
        loadSettings();
    }, []);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const updateSetting = (key: keyof SettingsState, value: any) => {
        if (key === 'notifications' || key === 'biometric') { // Boolean toggle handled by generic logic if keys match
            // logic is generic below
        }

        setSettings(prev => ({ ...prev, [key]: value }));
        localStorage.setItem(`settings_${key}`, String(value));

        if (key !== 'pin') {
            showToast(`${key.charAt(0).toUpperCase() + key.slice(1)} updated`);
        }
    };

    const handlePinInput = (num: number) => {
        if (pinInput.length < 4) {
            setPinInput(prev => prev + num);
        }
    };

    const handlePinBackspace = () => {
        setPinInput(prev => prev.slice(0, -1));
    };

    const handlePinSubmit = () => {
        if (pinInput.length !== 4) return;

        if (pinStep === 'verify') {
            if (pinInput === settings.pin) {
                setPinStep('new');
                setPinInput("");
            } else {
                showToast("Incorrect PIN");
                setPinInput("");
            }
        } else if (pinStep === 'new') {
            setTempNewPin(pinInput);
            setPinStep('confirm');
            setPinInput("");
        } else if (pinStep === 'confirm') {
            if (pinInput === tempNewPin) {
                updateSetting('pin', pinInput);
                showToast("PIN Updated Successfully");
                setShowPinModal(false);
                resetPinState();
            } else {
                showToast("PINs do not match. Try again.");
                setPinStep('new');
                setPinInput("");
                setTempNewPin("");
            }
        }
    };

    const resetPinState = () => {
        setPinInput("");
        setPinStep("verify");
        setTempNewPin("");
    }

    const currencies = [
        { code: 'USD', name: 'US Dollar ($)' },
        { code: 'INR', name: 'Indian Rupee (₹)' },
        { code: 'EUR', name: 'Euro (€)' },
        { code: 'GBP', name: 'British Pound (£)' },
    ];

    const SettingItem = ({ icon: Icon, title, subtitle, type = 'toggle', value, onClick }: any) => (
        <div
            onClick={type === 'link' || type === 'modal' ? onClick : undefined}
            className={`flex items-center justify-between pl-2.5 pr-4 py-3 bg-card border border-border rounded-[18px] mb-2 ${type !== 'toggle' ? 'active:scale-[0.98] cursor-pointer hover:bg-accent/50' : ''} transition-all`}
        >
            <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-muted-foreground shrink-0">
                    <Icon size={18} />
                </div>
                <div>
                    <h3 className="text-foreground font-medium text-sm">{title}</h3>
                    {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
            </div>

            {type === 'toggle' ? (
                <button
                    onClick={(e) => { e.stopPropagation(); onClick(!value); }}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 relative ${value ? 'bg-neon-lime' : 'bg-muted'}`}
                >
                    <div className={`w-4 h-4 rounded-full bg-background shadow-sm transition-transform duration-300 ${value ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            ) : (
                <ChevronRight size={18} className="text-muted-foreground" />
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-background pb-32 px-5 pt-4 font-sans selection:bg-neon-lime/30 relative transition-colors duration-300">

            {/* Toast */}
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-neon-lime text-black px-6 py-3 rounded-full font-bold shadow-lg animate-in fade-in slide-in-from-top-4 whitespace-nowrap">
                    {toastMessage}
                </div>
            )}

            {/* Creative Header */}
            <div className="flex items-center gap-4 mb-6 pt-0 px-0">
                <Link href="/profile" className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-95 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">App Settings</h1>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">General</h2>
                    <SettingItem
                        icon={Bell}
                        title="Notifications"
                        subtitle={settings.notifications ? "On" : "Off"}
                        value={settings.notifications}
                        onClick={(val: boolean) => updateSetting('notifications', val)}
                    />
                    <SettingItem
                        icon={Globe}
                        title="Currency"
                        subtitle={currencies.find(c => c.code === settings.currency)?.name || settings.currency}
                        type="modal"
                        onClick={() => setShowCurrencyModal(true)}
                    />
                </div>

                <div>
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">Security</h2>
                    <SettingItem
                        icon={Smartphone}
                        title="Biometric Login"
                        subtitle={settings.biometric ? "Enabled" : "Disabled"}
                        value={settings.biometric}
                        onClick={(val: boolean) => updateSetting('biometric', val)}
                    />
                    <SettingItem
                        icon={Lock}
                        title="Change PIN"
                        type="modal"
                        onClick={() => {
                            resetPinState();
                            setShowPinModal(true);
                        }}
                    />
                </div>

                <div>
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">Appearance</h2>
                    <SettingItem
                        icon={Moon}
                        title="Dark Mode"
                        subtitle={theme === 'dark' ? "On" : "Off"}
                        value={theme === 'dark'}
                        onClick={(val: boolean) => {
                            toggleTheme();
                            // Optionally save per intent if needed, but ThemeProvider usually handles it
                        }}
                    />
                </div>
            </div>

            {/* Currency Modal */}
            {showCurrencyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card w-full max-w-sm rounded-[32px] border border-border p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-foreground">Select Currency</h3>
                            <button onClick={() => setShowCurrencyModal(false)} className="p-2 bg-accent rounded-full text-muted-foreground hover:text-foreground"><X size={18} /></button>
                        </div>
                        <div className="space-y-2">
                            {currencies.map(c => (
                                <button
                                    key={c.code}
                                    onClick={() => {
                                        updateSetting('currency', c.code);
                                        setShowCurrencyModal(false);
                                    }}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.currency === c.code ? 'bg-neon-lime/10 border-neon-lime text-neon-lime' : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-muted'}`}
                                >
                                    <span className="font-bold">{c.code}</span>
                                    <span className="text-sm opacity-70">{c.name}</span>
                                    {settings.currency === c.code && <Check size={18} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* PIN Modal */}
            {showPinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card w-full max-w-xs rounded-[32px] border border-border p-6 shadow-2xl text-center">
                        <div className="w-12 h-12 rounded-full bg-accent mx-auto flex items-center justify-center mb-4 text-muted-foreground">
                            <Lock size={24} />
                        </div>

                        <h3 className="text-xl font-bold text-foreground mb-2">
                            {pinStep === 'verify' ? "Enter Current PIN" : pinStep === 'new' ? "Set New PIN" : "Confirm New PIN"}
                        </h3>
                        <p className="text-muted-foreground text-xs mb-6 h-4">
                            {pinStep === 'verify' ? "Enter your current 4-digit PIN" : pinStep === 'new' ? "Enter a 4-digit PIN" : "Re-enter to confirm"}
                        </p>

                        {/* Dots */}
                        <div className="flex justify-center gap-4 mb-8">
                            {[0, 1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${i < pinInput.length ? 'bg-neon-lime scale-110 shadow-[0_0_8px_hsl(var(--neon-lime))]' : 'bg-muted'}`}
                                />
                            ))}
                        </div>

                        {/* Keypad */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button
                                    key={num}
                                    onClick={() => handlePinInput(num)}
                                    className="h-12 rounded-full bg-accent text-foreground font-bold text-lg hover:bg-muted active:scale-95 transition-all"
                                >
                                    {num}
                                </button>
                            ))}
                            <div />
                            <button
                                onClick={() => handlePinInput(0)}
                                className="h-12 rounded-full bg-accent text-foreground font-bold text-lg hover:bg-muted active:scale-95 transition-all"
                            >
                                0
                            </button>
                            <button
                                onClick={handlePinBackspace}
                                className="h-12 rounded-full bg-transparent text-muted-foreground flex items-center justify-center hover:text-foreground active:scale-95 transition-all"
                            >
                                <ArrowLeft size={24} />
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowPinModal(false);
                                    resetPinState();
                                }}
                                className="flex-1 py-3 rounded-full bg-accent text-foreground font-bold text-sm hover:bg-muted"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePinSubmit}
                                disabled={pinInput.length !== 4}
                                className={`flex-1 py-3 rounded-full font-bold text-sm transition-all ${pinInput.length === 4 ? 'bg-neon-lime text-black hover:brightness-110 shadow-[0_0_15px_rgba(223,255,79,0.3)]' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                            >
                                {pinStep === 'confirm' ? 'Confirm' : 'Next'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
