import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";
import { AuditReport } from "@/types/report";

const DB_DIR = process.env.DB_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "claude-catcher.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(DB_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      repo_url TEXT NOT NULL,
      repo_name TEXT NOT NULL,
      overall_score INTEGER NOT NULL,
      critical_count INTEGER NOT NULL DEFAULT 0,
      warning_count INTEGER NOT NULL DEFAULT 0,
      info_count INTEGER NOT NULL DEFAULT 0,
      duration_ms INTEGER NOT NULL,
      report_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reports_repo_name ON reports(repo_name);
  `);
  return db;
}

function sanitizeId(id: string): string | null {
  if (!/^[a-zA-Z0-9-]+$/.test(id)) return null;
  return id;
}

export function saveReport(report: AuditReport): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO reports (id, repo_url, repo_name, overall_score, critical_count, warning_count, info_count, duration_ms, report_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    report.id,
    report.repoUrl,
    report.repoName,
    report.overallScore,
    report.summary.critical,
    report.summary.warning,
    report.summary.info,
    report.durationMs,
    JSON.stringify(report),
    report.createdAt
  );
}

export function getReport(id: string): AuditReport | null {
  const safeId = sanitizeId(id);
  if (!safeId) return null;
  const database = getDb();
  const row = database.prepare("SELECT report_json FROM reports WHERE id = ?").get(safeId) as { report_json: string } | undefined;
  if (!row) return null;
  return JSON.parse(row.report_json) as AuditReport;
}

export function reportExists(id: string): boolean {
  const safeId = sanitizeId(id);
  if (!safeId) return false;
  const database = getDb();
  const row = database.prepare("SELECT 1 FROM reports WHERE id = ?").get(safeId);
  return !!row;
}

export interface ReportListItem {
  id: string;
  repoName: string;
  repoUrl: string;
  overallScore: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  durationMs: number;
  createdAt: string;
}

export function listReports(limit: number = 50, offset: number = 0): ReportListItem[] {
  const database = getDb();
  const rows = database.prepare(`
    SELECT id, repo_name, repo_url, overall_score, critical_count, warning_count, info_count, duration_ms, created_at
    FROM reports ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset) as any[];
  return rows.map((r) => ({
    id: r.id,
    repoName: r.repo_name,
    repoUrl: r.repo_url,
    overallScore: r.overall_score,
    criticalCount: r.critical_count,
    warningCount: r.warning_count,
    infoCount: r.info_count,
    durationMs: r.duration_ms,
    createdAt: r.created_at,
  }));
}

export function getReportCount(): number {
  const database = getDb();
  const row = database.prepare("SELECT COUNT(*) as count FROM reports").get() as { count: number };
  return row.count;
}
