"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuditForm() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    if (!repoUrl.startsWith("https://github.com/")) {
      setError("Please enter a valid GitHub URL (https://github.com/user/repo)");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start audit");
        setIsLoading(false);
        return;
      }

      router.push(`/audit/${data.id}`);
    } catch {
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
      <div className="relative">
        <input
          type="url"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/username/repository"
          aria-label="GitHub repository URL"
          aria-describedby={error ? "audit-error" : undefined}
          className="w-full px-6 py-4 text-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100"
          disabled={isLoading}
        />
      </div>

      {error && (
        <p id="audit-error" role="alert" className="text-red-600 text-sm px-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 px-8 text-lg font-semibold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Cloning & Starting Audit...
          </span>
        ) : (
          "Run Audit"
        )}
      </button>
    </form>
  );
}
