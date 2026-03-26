import { Finding } from "@/types/report";

const SEVERITY_STYLES = {
  critical: {
    badge: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    dot: "bg-red-500",
  },
  warning: {
    badge: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    dot: "bg-yellow-500",
  },
  info: {
    badge: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
};

export function FindingCard({ finding }: { finding: Finding }) {
  const styles = SEVERITY_STYLES[finding.severity];

  return (
    <div className="group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-sm">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-2">
        <div className="flex items-start gap-3">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${styles.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
            {finding.severity}
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug">
              {finding.title}
            </h4>
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{finding.description}</p>
      </div>

      {/* File location */}
      <div className="px-4 pb-3">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-md px-2 py-1">
          <svg className="w-3 h-3 flex-shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-mono truncate max-w-[400px]">
            {finding.filePath}{finding.lineNumber ? `:${finding.lineNumber}` : ""}
          </span>
        </div>
      </div>

      {/* Code snippet */}
      {finding.codeSnippet && (
        <div className="mx-4 mb-3">
          <pre className="bg-gray-950 text-gray-100 rounded-lg p-3 text-xs overflow-x-auto font-mono leading-relaxed border border-gray-800">
            <code>{finding.codeSnippet}</code>
          </pre>
        </div>
      )}

      {/* Screenshot — full width, framed like a browser */}
      {finding.screenshot && (
        <div className="mx-4 mb-3">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Browser chrome */}
            <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1.5 flex items-center gap-2 border-b border-gray-200 dark:border-gray-600">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                  {finding.filePath} &mdash; {finding.viewport || "1440x900"}
                </span>
              </div>
            </div>
            <img
              src={`data:image/png;base64,${finding.screenshot}`}
              alt={`Screenshot: ${finding.title}`}
              loading="lazy"
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border-t border-indigo-100 dark:border-indigo-900 px-4 py-3">
        <div className="flex gap-2">
          <svg className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
            {finding.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}
