import { AuditReport } from "@/types/report";
import { ScoreBadge } from "./ScoreBadge";
import { DownloadButton } from "./DownloadButton";
import { formatDuration } from "@/lib/utils";

export function ReportHeader({ report }: { report: AuditReport }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Score */}
        <div className="flex-shrink-0">
          <ScoreBadge score={report.overallScore} size="lg" />
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Audit Report
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">
            {report.repoName}
          </p>
          <p className="text-gray-400 text-sm">
            Completed in {formatDuration(report.durationMs)} &middot;{" "}
            {new Date(report.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-4">
          {report.summary.critical > 0 && (
            <div className="text-center px-4 py-2 bg-red-50 rounded-xl border border-red-200">
              <div className="text-2xl font-bold text-red-600">{report.summary.critical}</div>
              <div className="text-xs text-red-500 font-medium">Critical</div>
            </div>
          )}
          {report.summary.warning > 0 && (
            <div className="text-center px-4 py-2 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">{report.summary.warning}</div>
              <div className="text-xs text-yellow-500 font-medium">Warning</div>
            </div>
          )}
          {report.summary.info > 0 && (
            <div className="text-center px-4 py-2 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{report.summary.info}</div>
              <div className="text-xs text-blue-500 font-medium">Info</div>
            </div>
          )}
          {report.summary.total === 0 && (
            <div className="text-center px-4 py-2 bg-green-50 rounded-xl border border-green-200">
              <div className="text-lg font-bold text-green-600">Clean!</div>
              <div className="text-xs text-green-500 font-medium">No issues</div>
            </div>
          )}
        </div>

        {/* Download */}
        <DownloadButton report={report} />
      </div>
    </div>
  );
}
