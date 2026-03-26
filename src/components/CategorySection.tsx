"use client";

import { useState } from "react";
import { CategorySummary } from "@/types/report";
import { FindingCard } from "./FindingCard";

export function CategorySection({ category }: { category: CategorySummary }) {
  const [isOpen, setIsOpen] = useState(category.findings.length > 0);
  const [showAll, setShowAll] = useState(false);

  const criticalCount = category.findings.filter((f) => f.severity === "critical").length;
  const warningCount = category.findings.filter((f) => f.severity === "warning").length;
  const infoCount = category.findings.filter((f) => f.severity === "info").length;

  const scoreColor =
    category.score >= 80 ? "text-green-600 dark:text-green-400" :
    category.score >= 50 ? "text-yellow-600 dark:text-yellow-400" :
    "text-red-600 dark:text-red-400";

  const scoreBg =
    category.score >= 80 ? "bg-green-50 dark:bg-green-900/30" :
    category.score >= 50 ? "bg-yellow-50 dark:bg-yellow-900/30" :
    "bg-red-50 dark:bg-red-900/30";

  const sortedFindings = [...category.findings].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  const INITIAL_SHOW = 8;
  const visibleFindings = showAll ? sortedFindings : sortedFindings.slice(0, INITIAL_SHOW);
  const hasMore = sortedFindings.length > INITIAL_SHOW;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-4 px-5 py-4 md:px-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        {/* Score */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${scoreBg} ${scoreColor}`}>
          {category.score}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {category.label}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            {criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {criticalCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-yellow-600 dark:text-yellow-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                {warningCount}
              </span>
            )}
            {infoCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {infoCount}
              </span>
            )}
            {category.findings.length === 0 && (
              <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                No issues
              </span>
            )}
          </div>
        </div>

        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && category.findings.length > 0 && (
        <div className="px-5 pb-5 md:px-6 md:pb-6 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
          {visibleFindings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}

          {hasMore && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors"
            >
              Show {sortedFindings.length - INITIAL_SHOW} more findings
            </button>
          )}
        </div>
      )}
    </div>
  );
}
