#!/usr/bin/env npx tsx
/**
 * Claude Catcher CLI — Run audit agents against a local repository.
 *
 * Usage:
 *   npx tsx bin/audit.ts [path]          # Full audit
 *   npx tsx bin/audit.ts --quick [path]  # Quick audit (skip visual agent)
 *   npx tsx bin/audit.ts --json [path]   # Output raw JSON
 *   npx tsx bin/audit.ts --idea [path]   # Run idea evaluation only
 */

import * as path from "path";
import * as fs from "fs";
import { agents } from "../src/agents";
import { ideaEvaluationAgent } from "../src/agents/idea-evaluation";
import { buildCategorySummaries, computeOverallScore, computeSummary } from "../src/lib/scoring";
import { Finding, AuditReport } from "../src/types/report";

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const positional = args.filter((a) => !a.startsWith("--"));

const repoPath = path.resolve(positional[0] || ".");
const isQuick = flags.includes("--quick");
const isJson = flags.includes("--json");
const isIdeaOnly = flags.includes("--idea");
const isCommitHook = flags.includes("--hook");

// Colors for terminal output
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function severityIcon(severity: string): string {
  switch (severity) {
    case "critical": return `${RED}X${RESET}`;
    case "warning": return `${YELLOW}!${RESET}`;
    case "info": return `${BLUE}i${RESET}`;
    default: return " ";
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return GREEN;
  if (score >= 50) return YELLOW;
  return RED;
}

async function runAudit() {
  if (!fs.existsSync(repoPath)) {
    console.error(`Error: Path does not exist: ${repoPath}`);
    process.exit(1);
  }

  const startTime = Date.now();
  const allFindings: Finding[] = [];

  // Select agents to run
  const agentsToRun = isIdeaOnly
    ? [ideaEvaluationAgent]
    : isQuick
    ? agents.filter((a) => a.name !== "visual-audit")
    : agents;

  if (!isJson) {
    console.log(`\n${BOLD}Claude Catcher${RESET} — Auditing ${DIM}${repoPath}${RESET}\n`);
  }

  for (const agent of agentsToRun) {
    if (!isJson) {
      process.stdout.write(`  Running ${agent.label}...`);
    }

    try {
      const findings = await agent.run(repoPath);
      allFindings.push(...findings);

      if (!isJson) {
        const crit = findings.filter((f) => f.severity === "critical").length;
        const warn = findings.filter((f) => f.severity === "warning").length;
        const info = findings.filter((f) => f.severity === "info").length;

        const parts: string[] = [];
        if (crit > 0) parts.push(`${RED}${crit} critical${RESET}`);
        if (warn > 0) parts.push(`${YELLOW}${warn} warning${RESET}`);
        if (info > 0) parts.push(`${BLUE}${info} info${RESET}`);

        if (parts.length === 0) {
          console.log(` ${GREEN}clean${RESET}`);
        } else {
          console.log(` ${parts.join(", ")}`);
        }
      }
    } catch (err) {
      if (!isJson) {
        console.log(` ${RED}error: ${(err as Error).message}${RESET}`);
      }
    }
  }

  const durationMs = Date.now() - startTime;
  const categories = buildCategorySummaries(allFindings);
  const overallScore = computeOverallScore(categories);
  const summary = computeSummary(allFindings);

  if (isJson) {
    const report: AuditReport = {
      id: "cli",
      repoUrl: repoPath,
      repoName: path.basename(repoPath),
      createdAt: new Date().toISOString(),
      durationMs,
      overallScore,
      summary,
      categories,
    };
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  // Print summary
  console.log(`\n${"─".repeat(50)}`);
  console.log(`${BOLD}Score: ${scoreColor(overallScore)}${overallScore}/100${RESET}  ${DIM}(${(durationMs / 1000).toFixed(1)}s)${RESET}`);
  console.log(`${"─".repeat(50)}`);

  // Print category scores
  for (const cat of categories.sort((a, b) => a.score - b.score)) {
    if (cat.findings.length === 0 && !isIdeaOnly) continue;
    const bar = scoreColor(cat.score) + "█".repeat(Math.round(cat.score / 5)) + DIM + "░".repeat(20 - Math.round(cat.score / 5)) + RESET;
    console.log(`  ${bar} ${cat.score.toString().padStart(3)} ${cat.label} (${cat.findings.length})`);
  }

  // Print findings grouped by severity
  if (summary.critical > 0) {
    console.log(`\n${RED}${BOLD}Critical Issues (${summary.critical})${RESET}`);
    for (const f of allFindings.filter((f) => f.severity === "critical")) {
      console.log(`  ${severityIcon(f.severity)} ${f.title}`);
      console.log(`    ${DIM}${f.filePath}${f.lineNumber ? `:${f.lineNumber}` : ""}${RESET}`);
      console.log(`    ${f.recommendation}`);
    }
  }

  if (summary.warning > 0 && !isCommitHook) {
    console.log(`\n${YELLOW}${BOLD}Warnings (${summary.warning})${RESET}`);
    for (const f of allFindings.filter((f) => f.severity === "warning").slice(0, 15)) {
      console.log(`  ${severityIcon(f.severity)} ${f.title}`);
      console.log(`    ${DIM}${f.filePath}${f.lineNumber ? `:${f.lineNumber}` : ""}${RESET}`);
    }
    if (summary.warning > 15) {
      console.log(`  ${DIM}...and ${summary.warning - 15} more warnings${RESET}`);
    }
  }

  if (summary.info > 0 && !isCommitHook) {
    console.log(`\n${BLUE}Info (${summary.info})${RESET} ${DIM}(run without --hook to see details)${RESET}`);
  }

  console.log();

  // Exit with non-zero if critical issues found (useful for CI/hooks)
  if (summary.critical > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error(`Audit failed: ${err.message}`);
  process.exit(1);
});
