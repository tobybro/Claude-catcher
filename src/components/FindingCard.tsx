import { Finding } from "@/types/report";
import { getSeverityColor } from "@/lib/utils";

export function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(finding.severity)}`}
        >
          {finding.severity}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm">
            {finding.title}
          </h4>
          <p className="text-gray-500 text-sm mt-1">{finding.description}</p>
        </div>
      </div>

      {/* File location */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="font-mono truncate">
          {finding.filePath}
          {finding.lineNumber ? `:${finding.lineNumber}` : ""}
        </span>
      </div>

      {/* Code snippet */}
      {finding.codeSnippet && (
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs overflow-x-auto font-mono">
          <code>{finding.codeSnippet}</code>
        </pre>
      )}

      {/* Screenshot */}
      {finding.screenshot && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400">
            Screenshot ({finding.viewport})
          </p>
          <img
            src={`data:image/png;base64,${finding.screenshot}`}
            alt={`Screenshot of ${finding.title}`}
            loading="lazy"
            className="rounded-lg border border-gray-200 max-w-full"
          />
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
        <p className="text-sm text-indigo-800">
          <span className="font-semibold">Fix: </span>
          {finding.recommendation}
        </p>
      </div>
    </div>
  );
}
