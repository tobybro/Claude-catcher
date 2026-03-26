import { AuditForm } from "@/components/AuditForm";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="text-center space-y-6 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-800">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          AI-Powered Code Audit
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
          Claude <span className="text-indigo-600 dark:text-indigo-400">Catcher</span>
        </h1>

        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
          Paste your GitHub repo URL and get an instant health report.
          We check code quality, UX, bugs, security, completeness, and performance.
        </p>
      </div>

      {/* Form */}
      <AuditForm />

      {/* Features grid */}
      <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full">
        {[
          { icon: "🔍", label: "Code Quality", desc: "Syntax, dead code, types" },
          { icon: "👁", label: "UX Audit", desc: "Accessibility, responsive" },
          { icon: "🐛", label: "Bug Detection", desc: "Runtime errors, edge cases" },
          { icon: "🔒", label: "Security", desc: "Secrets, XSS, injection" },
          { icon: "✅", label: "Completeness", desc: "Loading, error, empty states" },
          { icon: "⚡", label: "Performance", desc: "Bundle size, images, SEO" },
          { icon: "🖥", label: "Visual Audit", desc: "Playwright screen testing" },
          { icon: "💡", label: "Idea Evaluation", desc: "Product gaps & features" },
        ].map((feature) => (
          <div
            key={feature.label}
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center space-y-2 hover:border-indigo-200 dark:hover:border-indigo-600 hover:shadow-sm transition-all"
          >
            <div className="text-2xl">{feature.icon}</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{feature.label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{feature.desc}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-20 text-center text-sm text-gray-400 dark:text-gray-500">
        Built for the Claude Code community.{" "}
        <a href="https://github.com/tobybro/Claude-catcher" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
          Open source (MIT)
        </a>.
      </footer>
    </main>
  );
}
