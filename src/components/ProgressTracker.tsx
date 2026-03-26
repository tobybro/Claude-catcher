"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentProgress } from "@/types/report";

const AGENT_LABELS: Record<string, string> = {
  "code-quality": "Code Quality",
  "ux-audit": "UX Audit",
  "bug-detection": "Bug Detection",
  security: "Security",
  "product-completeness": "Product Completeness",
  performance: "Performance",
  "visual-audit": "Visual & Flow Audit",
};

export function ProgressTracker({ auditId }: { auditId: string }) {
  const [progress, setProgress] = useState<AgentProgress[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const eventSource = new EventSource(`/api/audit-stream?id=${auditId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === "complete" && data.reportId) {
        setIsComplete(true);
        eventSource.close();
        // Small delay for UX, then navigate
        setTimeout(() => {
          router.refresh();
        }, 500);
        return;
      }

      if (data.agent) {
        setProgress((prev) => {
          const existing = prev.findIndex((p) => p.agent === data.agent);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = data;
            return updated;
          }
          return [...prev, data];
        });
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [auditId, router]);

  const totalAgents = Object.keys(AGENT_LABELS).length;
  const completedAgents = progress.filter(
    (p) => p.status === "complete" || p.status === "error"
  ).length;
  const percentComplete = Math.round((completedAgents / totalAgents) * 100);

  return (
    <div className="w-full max-w-xl space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          {isComplete ? "Audit Complete!" : "Auditing your repository..."}
        </h2>
        <p className="text-gray-500">
          {isComplete
            ? "Generating your report..."
            : `${completedAgents} of ${totalAgents} agents complete`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* Agent checklist */}
      <div className="space-y-3">
        {Object.entries(AGENT_LABELS).map(([key, label]) => {
          const agentProgress = progress.find((p) => p.agent === key);
          const status = agentProgress?.status;

          return (
            <div
              key={key}
              className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm"
            >
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {status === "complete" ? (
                  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : status === "error" ? (
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : status === "running" ? (
                  <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <span className={`font-medium ${status === "complete" ? "text-gray-900" : status === "running" ? "text-indigo-600" : "text-gray-400"}`}>
                {label}
              </span>
              {agentProgress?.findingCount !== undefined && (
                <span className="ml-auto text-sm text-gray-500">
                  {agentProgress.findingCount} finding{agentProgress.findingCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
