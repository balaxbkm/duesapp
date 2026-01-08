import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google"; // Adding Outfit for that premium feel
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";

import { AuthProvider } from "@/providers/AuthProvider";
import { BottomNav } from "@/components/layout/BottomNav";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DuesApp - Smart Loan Reminders",
  description: "Your personal money reminder that never misses a due date.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DuesApp",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans selection:bg-neon-lime/30 transition-colors duration-300`}
      >
        <ThemeProvider>
          <AuthProvider>
            <main className="min-h-screen relative overflow-x-hidden">
              {children}
            </main>
            <BottomNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
