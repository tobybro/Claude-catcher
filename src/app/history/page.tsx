import Link from "next/link";
import { listReports, getReportCount } from "@/lib/report-store";
import { formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  const reports = listReports(50);
  const totalCount = getReportCount();

  return (
    <main className="min-h-screen px-4 py-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalCount} audit{totalCount !== 1 ? "s" : ""} completed
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          New Audit
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 dark:text-gray-500 text-lg">No audits yet.</p>
          <Link href="/" className="text-indigo-600 hover:underline mt-2 inline-block">
            Run your first audit
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const scoreColor =
              report.overallScore >= 80
                ? "text-green-600 bg-green-50 dark:bg-green-900/30"
                : report.overallScore >= 50
                ? "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30"
                : "text-red-600 bg-red-50 dark:bg-red-900/30";

            return (
              <Link
                key={report.id}
                href={`/audit/${report.id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold ${scoreColor}`}>
                    {report.overallScore}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {report.repoName}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-1">
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      <span>{formatDuration(report.durationMs)}</span>
                      {report.criticalCount > 0 && (
                        <span className="text-red-500">{report.criticalCount} critical</span>
                      )}
                      {report.warningCount > 0 && (
                        <span className="text-yellow-500">{report.warningCount} warnings</span>
                      )}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
