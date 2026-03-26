export type Severity = "critical" | "warning" | "info";

export type Category =
  | "code-quality"
  | "ux-audit"
  | "bug-detection"
  | "security"
  | "product-completeness"
  | "performance"
  | "visual-audit";

export interface Finding {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  description: string;
  filePath: string;
  lineNumber?: number;
  codeSnippet?: string;
  screenshot?: string;
  viewport?: string;
  recommendation: string;
}

export interface CategorySummary {
  category: Category;
  label: string;
  icon: string;
  findings: Finding[];
  score: number;
}

export interface AuditReport {
  id: string;
  repoUrl: string;
  repoName: string;
  createdAt: string;
  durationMs: number;
  overallScore: number;
  summary: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
  categories: CategorySummary[];
}

export interface AgentProgress {
  agent: string;
  status: "running" | "complete" | "error";
  findingCount?: number;
  error?: string;
}

export interface AuditStatus {
  id: string;
  status: "processing" | "complete" | "error";
  progress: AgentProgress[];
}
