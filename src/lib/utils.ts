import { v4 as uuidv4 } from "uuid";

export function generateId(prefix: string): string {
  return `${prefix}-${uuidv4().substring(0, 8)}`;
}

export function generateAuditId(): string {
  return uuidv4().substring(0, 12);
}

export function extractRepoName(url: string): string {
  // Handle GitHub URLs: https://github.com/user/repo or git@github.com:user/repo.git
  const match = url.match(/(?:github\.com[/:])([^/]+\/[^/.]+)/);
  if (match) return match[1];
  // Fallback: last segment of URL
  return url.split("/").filter(Boolean).pop() || "unknown-repo";
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-score-good";
  if (score >= 50) return "text-score-okay";
  return "text-score-bad";
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-800 border-red-200";
    case "warning":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "info":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
