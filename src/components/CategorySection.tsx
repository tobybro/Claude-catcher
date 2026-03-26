"use client";

import { useState } from "react";
import { CategorySummary } from "@/types/report";
import { ScoreBadge } from "./ScoreBadge";
import { FindingCard } from "./FindingCard";

export function CategorySection({ category }: { category: CategorySummary }) {
  const [isOpen, setIsOpen] = useState(category.findings.length > 0);

  const criticalCount = category.findings.filter((f) => f.severity === "critical").length;
  const warningCount = category.findings.filter((f) => f.severity === "warning").length;
  const infoCount = category.findings.filter((f) => f.severity === "info").length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <ScoreBadge score={category.score} size="sm" />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">{category.label}</h3>
          <div className="flex gap-3 mt-1">
            {criticalCount > 0 && (
              <span className="text-xs text-red-600 font-medium">
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-xs text-yellow-600 font-medium">
                {warningCount} warning
              </span>
            )}
            {infoCount > 0 && (
              <span className="text-xs text-blue-600 font-medium">
                {infoCount} info
              </span>
            )}
            {category.findings.length === 0 && (
              <span className="text-xs text-green-600 font-medium">
                No issues found
              </span>
            )}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && category.findings.length > 0 && (
        <div className="px-6 pb-6 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
          {category.findings
            .sort((a, b) => {
              const order = { critical: 0, warning: 1, info: 2 };
              return order[a.severity] - order[b.severity];
            })
            .map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
        </div>
      )}
    </div>
  );
}
