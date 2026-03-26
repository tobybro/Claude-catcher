import { getReport } from "@/lib/report-store";
import { ReportHeader } from "@/components/ReportHeader";
import { CategorySection } from "@/components/CategorySection";
import { ProgressTracker } from "@/components/ProgressTracker";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = getReport(id);

  if (!report) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <ProgressTracker auditId={id} />
      </main>
    );
  }

  // Group categories: worst scores first, but separate zero-findings categories
  const withIssues = report.categories
    .filter((c) => c.findings.length > 0)
    .sort((a, b) => a.score - b.score);
  const clean = report.categories
    .filter((c) => c.findings.length === 0)
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <main className="min-h-screen px-4 py-6 max-w-5xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/"
          className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          Home
        </Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <Link
          href="/history"
          className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          History
        </Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-gray-600 dark:text-gray-400 font-medium truncate">{report.repoName}</span>
      </div>

      {/* Dashboard header with all scores + top issues */}
      <ReportHeader report={report} />

      {/* Category detail sections */}
      <div className="space-y-3">
        {/* Sections with findings first */}
        {withIssues.map((category) => (
          <CategorySection key={category.category} category={category} />
        ))}

        {/* Clean sections collapsed */}
        {clean.length > 0 && (
          <div className="space-y-3">
            {clean.map((category) => (
              <CategorySection key={category.category} category={category} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 dark:text-gray-500 pt-6 pb-4 space-y-1">
        <p>Audit ID: <span className="font-mono">{report.id}</span></p>
        <p>{new Date(report.createdAt).toISOString().split("T")[0]}</p>
      </footer>
    </main>
  );
}
