import { AuditForm } from "@/components/AuditForm";
import { ExampleRepos } from "@/components/ExampleRepos";

const CATEGORIES = [
  { icon: "🔍", label: "Code Quality", items: ["Syntax errors", "Dead code", "Type safety", "Deep nesting"] },
  { icon: "👁", label: "UX & Accessibility", items: ["Missing alt text", "No labels", "Responsive gaps", "Broken links"] },
  { icon: "🐛", label: "Bug Detection", items: ["Unhandled promises", "Race conditions", "Missing keys", "Memory leaks"] },
  { icon: "🔒", label: "Security", items: ["Hardcoded secrets", "XSS vectors", "SQL injection", "Exposed .env"] },
  { icon: "✅", label: "Product Completeness", items: ["Loading states", "Error states", "Empty states", "404 page"] },
  { icon: "⚡", label: "Performance", items: ["Heavy deps", "Large images", "Code splitting", "Meta tags"] },
  { icon: "🖥", label: "Visual & Flow", items: ["Runtime errors", "Blank pages", "Responsive overflow", "Form validation"] },
  { icon: "💡", label: "Idea Evaluation", items: ["Product maturity", "Feature gaps", "Ops readiness", "Documentation"] },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero section */}
      <section className="px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium border border-indigo-100 dark:border-indigo-800">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              8 audit agents &middot; 50+ checks
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-[1.1]">
              Catch what Claude<br className="hidden sm:block" /> missed in your code
            </h1>

            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
              Paste a GitHub repo URL. Get a scored audit across code quality, UX, bugs, security, completeness, performance, visual flows, and product idea health.
            </p>
          </div>

          {/* Form */}
          <div className="max-w-2xl mx-auto">
            <AuditForm />
          </div>

          {/* Example repos */}
          <ExampleRepos />
        </div>
      </section>

      {/* What we check */}
      <section className="px-4 pb-20 md:pb-28">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-8">
            What we check
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className="p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 space-y-3 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{cat.label}</h3>
                </div>
                <ul className="space-y-1">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 pb-20 md:pb-28">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-8">
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Paste URL", desc: "Drop any public GitHub repository URL. We shallow-clone it in seconds." },
              { step: "02", title: "8 Agents Scan", desc: "Code quality, UX, bugs, security, completeness, performance, visual flows, and idea health run in parallel." },
              { step: "03", title: "Get Report", desc: "Scored report with actionable fix recommendations. Download as JSON or share via URL." },
            ].map((item) => (
              <div key={item.step} className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 px-4 py-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400 dark:text-gray-500">
          <span>Built for the Claude Code community</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/tobybro/Claude-catcher" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              GitHub
            </a>
            <a href="https://github.com/tobybro/Claude-catcher/issues" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Feedback
            </a>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
