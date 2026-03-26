import * as fs from "fs";
import * as path from "path";
import { AuditReport } from "@/types/report";

const REPORTS_DIR = "/tmp/claude-catcher/reports";

function ensureDir(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

export function saveReport(report: AuditReport): void {
  ensureDir();
  const filePath = path.join(REPORTS_DIR, `${report.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
}

function sanitizeId(id: string): string | null {
  // Only allow alphanumeric and hyphens — prevent path traversal
  if (!/^[a-zA-Z0-9-]+$/.test(id)) return null;
  return id;
}

export function getReport(id: string): AuditReport | null {
  const safeId = sanitizeId(id);
  if (!safeId) return null;
  const filePath = path.join(REPORTS_DIR, `${safeId}.json`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content) as AuditReport;
}

export function reportExists(id: string): boolean {
  const safeId = sanitizeId(id);
  if (!safeId) return false;
  return fs.existsSync(path.join(REPORTS_DIR, `${safeId}.json`));
}
