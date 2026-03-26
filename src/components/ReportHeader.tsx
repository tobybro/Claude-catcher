import { AuditReport, CategorySummary, Finding } from "@/types/report";
import { ScoreBadge } from "./ScoreBadge";
import { DownloadButton } from "./DownloadButton";
import { formatDuration } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, string> = {
  "code-quality": "01",
  "ux-audit": "02",
  "bug-detection": "03",
  security: "04",
  "product-completeness": "05",
  performance: "06",
  "visual-audit": "07",
  "idea-evaluation": "08",
};

function ScoreBar({ score, label, findingCount }: { score: number; label: string; findingCount: number }) {
  const color =
    score >= 80 ? "bg-green-500 dark:bg-green-400" :
    score >= 50 ? "bg-yellow-500 dark:bg-yellow-400" :
    "bg-red-500 dark:bg-red-400";

  const textColor =
    score >= 80 ? "text-green-600 dark:text-green-400" :
    score >= 50 ? "text-yellow-600 dark:text-yellow-400" :
    "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{label}</span>
        <div className="flex items-center gap-2">
          {findingCount > 0 && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{findingCount}</span>
          )}
          <span className={`text-xs font-bold tabular-nums ${textColor}`}>{score}</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function TopIssue({ finding, index }: { finding: Finding; index: number }) {
  const severityStyles = {
    critical: "border-l-red-500 bg-red-50/50 dark:bg-red-950/30",
    warning: "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/30",
    info: "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/30",
  };

  return (
    <div className={`border-l-4 rounded-r-lg px-4 py-3 ${severityStyles[finding.severity]}`}>
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-0.5 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{finding.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono truncate">
            {finding.filePath}{finding.lineNumber ? `:${finding.lineNumber}` : ""}
          </p>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
          finding.severity === "critical" ? "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50" :
          finding.severity === "warning" ? "text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/50" :
          "text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50"
        }`}>
          {finding.severity}
        </span>
      </div>
    </div>
  );
}

export function ReportHeader({ report }: { report: AuditReport }) {
  const allFindings = report.categories.flatMap((c) => c.findings);
  const topIssues = allFindings
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 5);

  const scoreLabel =
    report.overallScore >= 90 ? "Excellent" :
    report.overallScore >= 75 ? "Good" :
    report.overallScore >= 50 ? "Needs Work" :
    report.overallScore >= 25 ? "Poor" :
    "Critical";

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Score strip */}
        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 px-6 py-6 md:px-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0 text-center">
            <ScoreBadge score={report.overallScore} size="lg" />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-wider">
              {scoreLabel}
            </p>
          </div>

          <div className="flex-1 text-center md:text-left space-y-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {report.repoName}
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-mono truncate">
              {report.repoUrl}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {formatDuration(report.durationMs)} &middot; {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Severity pills */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {report.summary.critical > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/40 rounded-full">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm font-bold text-red-700 dark:text-red-300">{report.summary.critical}</span>
                <span className="text-xs text-red-500 dark:text-red-400 hidden sm:inline">critical</span>
              </div>
            )}
            {report.summary.warning > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/40 rounded-full">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">{report.summary.warning}</span>
                <span className="text-xs text-yellow-500 dark:text-yellow-400 hidden sm:inline">warnings</span>
              </div>
            )}
            {report.summary.info > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{report.summary.info}</span>
                <span className="text-xs text-blue-500 dark:text-blue-400 hidden sm:inline">info</span>
              </div>
            )}
            {report.summary.total === 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/40 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-bold text-green-700 dark:text-green-300">Clean</span>
              </div>
            )}
            <DownloadButton report={report} />
          </div>
        </div>

        {/* Category dashboard grid */}
        <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-5 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {report.categories.map((cat) => (
              <ScoreBar
                key={cat.category}
                score={cat.score}
                label={cat.label}
                findingCount={cat.findings.length}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Top issues */}
      {topIssues.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:px-8">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Top Issues
          </h2>
          <div className="space-y-2">
            {topIssues.map((finding, i) => (
              <TopIssue key={finding.id} finding={finding} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
