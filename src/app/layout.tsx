import type { Metadata } from "next";
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
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
