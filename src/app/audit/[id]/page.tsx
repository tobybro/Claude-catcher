import { getReport } from "@/lib/report-store";
import { ReportHeader } from "@/components/ReportHeader";
import { CategorySection } from "@/components/CategorySection";
import { ProgressTracker } from "@/components/ProgressTracker";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = getReport(id);

  // If report isn't ready yet, show progress tracker
  if (!report) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <ProgressTracker auditId={id} />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <svg className="w-4 h-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        New Audit
      </Link>

      {/* Report header with score */}
      <ReportHeader report={report} />

      {/* Category sections */}
      <div className="space-y-4">
        {report.categories
          .sort((a, b) => a.score - b.score) // Worst first
          .map((category) => (
            <CategorySection key={category.category} category={category} />
          ))}
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-400 pt-8 pb-4">
        Claude Catcher &middot; Audit ID: {report.id} &middot;{" "}
        {new Date(report.createdAt).toISOString().split("T")[0]}
      </footer>
    </main>
  );
}
