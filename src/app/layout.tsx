import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('theme');
            const d = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
            if (d) document.documentElement.classList.add('dark');
          } catch {}
        `}} />
      </head>
      <body className="bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              <span className="text-indigo-600 dark:text-indigo-400">Claude</span> Catcher
            </Link>
            <div className="flex-1" />
            <Link
              href="/history"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              History
            </Link>
            <a
              href="https://github.com/tobybro/Claude-catcher/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Feedback
            </a>
            <ThemeToggle />
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
