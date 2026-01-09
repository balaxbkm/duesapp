"use client";
import { ArrowLeft, MessageSquare, Mail, Phone, ExternalLink, HelpCircle, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function SupportPage() {
    const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <div className="bg-card border border-border rounded-2xl overflow-hidden mb-3">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between p-4 text-left"
                >
                    <span className="text-foreground font-medium text-sm">{question}</span>
                    <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", isOpen ? "rotate-180" : "")} />
                </button>
                {isOpen && (
                    <div className="px-4 pb-4 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border mt-2 pt-3">
                        {answer}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-32 px-5 pt-4 font-sans selection:bg-neon-lime/30 transition-colors duration-300">
            {/* Creative Header */}
            <div className="flex items-center gap-4 mb-6 pt-0 px-0">
                <Link href="/profile" className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all active:scale-95 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">Help & Support</h1>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <button className="bg-card p-5 rounded-2xl border border-border flex flex-col items-center justify-center gap-3 hover:bg-accent/40 transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-neon-lime/10 flex items-center justify-center text-neon-lime group-hover:scale-110 transition-transform">
                        <MessageSquare size={24} />
                    </div>
                    <span className="text-foreground font-medium text-sm">Live Chat</span>
                </button>
                <button className="bg-card p-5 rounded-2xl border border-border flex flex-col items-center justify-center gap-3 hover:bg-accent/40 transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-neon-purple/10 flex items-center justify-center text-neon-purple group-hover:scale-110 transition-transform">
                        <Mail size={24} />
                    </div>
                    <span className="text-foreground font-medium text-sm">Email Us</span>
                </button>
            </div>

            <div>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <HelpCircle size={14} /> Frequently Asked Questions
                </h2>

                <div className="space-y-1">
                    <FaqItem
                        question="How do I add a new loan?"
                        answer="To add a new loan, navigate to the Dashboard and tap the neon '+' button in the top right. Fill in the details like lender name, amount, and due date."
                    />
                    <FaqItem
                        question="Is my data secure?"
                        answer="Yes, your data is securely stored using Google Firebase Authentication and Firestore security rules. We use industry-standard encryption."
                    />
                    <FaqItem
                        question="Can I change my currency?"
                        answer="Currently, the app defaults to your locale's currency. You can adjust this in the Settings page under General > Currency."
                    />
                    <FaqItem
                        question="How do I delete my account?"
                        answer="Please contact us via email support to request account deletion. We process these requests within 48 hours."
                    />
                </div>
            </div>
        </div>
    );
}
