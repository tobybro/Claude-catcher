import { EventEmitter } from "events";
import { agents } from "@/agents";
import { AuditReport, AgentProgress, Finding } from "@/types/report";
import { buildCategorySummaries, computeOverallScore, computeSummary } from "./scoring";
import { saveReport } from "./report-store";
import { extractRepoName } from "./utils";

// In-memory store for audit progress
const auditEmitters = new Map<string, EventEmitter>();
const auditStatuses = new Map<string, AgentProgress[]>();

export function getAuditEmitter(auditId: string): EventEmitter {
  if (!auditEmitters.has(auditId)) {
    auditEmitters.set(auditId, new EventEmitter());
  }
  return auditEmitters.get(auditId)!;
}

export function getAuditProgress(auditId: string): AgentProgress[] {
  return auditStatuses.get(auditId) || [];
}

export async function runAudit(
  auditId: string,
  repoPath: string,
  repoUrl: string
): Promise<AuditReport> {
  const emitter = getAuditEmitter(auditId);
  const progress: AgentProgress[] = [];
  auditStatuses.set(auditId, progress);

  const startTime = Date.now();
  const allFindings: Finding[] = [];

  for (const agent of agents) {
    const agentProgress: AgentProgress = {
      agent: agent.name,
      status: "running",
    };
    progress.push(agentProgress);
    emitter.emit("progress", { ...agentProgress });

    try {
      const findings = await agent.run(repoPath);
      allFindings.push(...findings);
      agentProgress.status = "complete";
      agentProgress.findingCount = findings.length;
    } catch (err) {
      agentProgress.status = "error";
      agentProgress.error = (err as Error).message;
    }

    emitter.emit("progress", { ...agentProgress });
  }

  const categories = buildCategorySummaries(allFindings);
  const report: AuditReport = {
    id: auditId,
    repoUrl,
    repoName: extractRepoName(repoUrl),
    createdAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    overallScore: computeOverallScore(categories),
    summary: computeSummary(allFindings),
    categories,
  };

  saveReport(report);
  emitter.emit("complete", { reportId: auditId });

  // Cleanup emitter after a delay
  setTimeout(() => {
    auditEmitters.delete(auditId);
    auditStatuses.delete(auditId);
  }, 300000); // 5 minutes

  return report;
}
