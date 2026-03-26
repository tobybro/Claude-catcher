import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude Catcher — AI Code Audit for Your Projects",
  description:
    "Paste a GitHub repo URL and get an instant audit report covering code quality, UX, bugs, security, completeness, and performance.",
  openGraph: {
    title: "Claude Catcher",
    description: "AI-powered code audit for projects built with Claude",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 hover:text-indigo-600 transition-colors">
              <span className="text-indigo-600">Claude</span> Catcher
            </Link>
            <span className="text-xs text-gray-400 hidden sm:block">AI-Powered Code Audit</span>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
