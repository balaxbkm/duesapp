import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Roboto_Condensed } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";

import { AuthProvider } from "@/providers/AuthProvider";
import { BottomNav } from "@/components/layout/BottomNav";

const titleFont = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-title",
});

const bodyFont = Roboto_Condensed({
  subsets: ["latin"],
  variable: "--font-body",
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
        className={`${titleFont.variable} ${bodyFont.variable} antialiased bg-background text-foreground transition-colors duration-300`}
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
