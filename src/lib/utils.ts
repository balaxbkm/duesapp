import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
    let currency = 'INR';
    let locale = 'en-IN';

    if (typeof window !== 'undefined') {
        const savedCurrency = localStorage.getItem('settings_currency');
        if (savedCurrency === 'USD') { currency = 'USD'; locale = 'en-US'; }
        else if (savedCurrency === 'EUR') { currency = 'EUR'; locale = 'de-DE'; }
        else if (savedCurrency === 'GBP') { currency = 'GBP'; locale = 'en-GB'; }
    }

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatCompactCurrency = (amount: number) => {
    let currency = 'INR';
    // We use en-US to ensure "K" notation for thousands, which is what the user asked for.
    // Other locales might use 'Tsd' or other suffixes.
    let locale = 'en-US';

    if (typeof window !== 'undefined') {
        const savedCurrency = localStorage.getItem('settings_currency');
        if (savedCurrency) currency = savedCurrency;
    }

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1
    }).format(amount);
};

export const formatDate = (date: Date | string | number | undefined | null) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(d);
}

export const formatDateTime = (date: Date | string | number | undefined | null) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(d);
}
