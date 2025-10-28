import type { Metadata } from "next";
import Link from "next/link";
import AuthMenu from "@/components/auth/AuthMenu";
import ClientNavLinks from "@/components/auth/ClientNavLinks";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Job Apply | Centralized Applications",
  description: "A centralized, standardized job application platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold">JobApply</Link>
            <nav className="flex items-center gap-4 text-sm">
              <ClientNavLinks />
              <div className="ml-4 pl-4 border-l">
                <AuthMenu />
              </div>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
