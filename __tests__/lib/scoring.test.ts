import { describe, it, expect } from "vitest";
import {
  computeCategoryScore,
  buildCategorySummaries,
  computeOverallScore,
  computeSummary,
} from "@/lib/scoring";
import { Finding, CategorySummary } from "@/types/report";

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: "test-001",
    category: "security",
    severity: "warning",
    title: "Test finding",
    description: "Test description",
    filePath: "test.ts",
    recommendation: "Fix it",
    ...overrides,
  };
}

describe("computeCategoryScore", () => {
  it("returns 100 for no findings", () => {
    expect(computeCategoryScore([])).toBe(100);
  });

  it("subtracts 15 for critical findings", () => {
    const findings = [makeFinding({ severity: "critical" })];
    expect(computeCategoryScore(findings)).toBe(85);
  });

  it("subtracts 5 for warning findings", () => {
    const findings = [makeFinding({ severity: "warning" })];
    expect(computeCategoryScore(findings)).toBe(95);
  });

  it("subtracts 1 for info findings", () => {
    const findings = [makeFinding({ severity: "info" })];
    expect(computeCategoryScore(findings)).toBe(99);
  });

  it("floors at 0", () => {
    const findings = Array(10).fill(null).map(() => makeFinding({ severity: "critical" }));
    expect(computeCategoryScore(findings)).toBe(0);
  });

  it("handles mixed severities", () => {
    const findings = [
      makeFinding({ severity: "critical" }),
      makeFinding({ severity: "warning" }),
      makeFinding({ severity: "info" }),
    ];
    expect(computeCategoryScore(findings)).toBe(79); // 100 - 15 - 5 - 1
  });
});

describe("computeSummary", () => {
  it("counts findings by severity", () => {
    const findings = [
      makeFinding({ severity: "critical" }),
      makeFinding({ severity: "critical" }),
      makeFinding({ severity: "warning" }),
      makeFinding({ severity: "info" }),
    ];
    const summary = computeSummary(findings);
    expect(summary.critical).toBe(2);
    expect(summary.warning).toBe(1);
    expect(summary.info).toBe(1);
    expect(summary.total).toBe(4);
  });

  it("returns zeros for empty findings", () => {
    const summary = computeSummary([]);
    expect(summary.critical).toBe(0);
    expect(summary.warning).toBe(0);
    expect(summary.info).toBe(0);
    expect(summary.total).toBe(0);
  });
});

describe("computeOverallScore", () => {
  it("returns 100 for empty categories", () => {
    expect(computeOverallScore([])).toBe(100);
  });

  it("averages category scores", () => {
    const categories: CategorySummary[] = [
      { category: "security", label: "Security", icon: "Shield", findings: [], score: 80 },
      { category: "performance", label: "Performance", icon: "Zap", findings: [], score: 60 },
    ];
    expect(computeOverallScore(categories)).toBe(70);
  });

  it("rounds to nearest integer", () => {
    const categories: CategorySummary[] = [
      { category: "security", label: "Security", icon: "Shield", findings: [], score: 33 },
      { category: "performance", label: "Performance", icon: "Zap", findings: [], score: 33 },
      { category: "code-quality", label: "Code Quality", icon: "Code", findings: [], score: 34 },
    ];
    expect(computeOverallScore(categories)).toBe(33);
  });
});

describe("buildCategorySummaries", () => {
  it("creates summaries for all 8 categories", () => {
    const summaries = buildCategorySummaries([]);
    expect(summaries).toHaveLength(8);
    expect(summaries.map((s) => s.category)).toContain("security");
    expect(summaries.map((s) => s.category)).toContain("visual-audit");
    expect(summaries.map((s) => s.category)).toContain("idea-evaluation");
  });

  it("groups findings by category", () => {
    const findings = [
      makeFinding({ category: "security", severity: "critical" }),
      makeFinding({ category: "security", severity: "warning" }),
      makeFinding({ category: "performance", severity: "info" }),
    ];
    const summaries = buildCategorySummaries(findings);
    const security = summaries.find((s) => s.category === "security")!;
    const performance = summaries.find((s) => s.category === "performance")!;
    expect(security.findings).toHaveLength(2);
    expect(performance.findings).toHaveLength(1);
    expect(security.score).toBe(80); // 100 - 15 - 5
    expect(performance.score).toBe(99); // 100 - 1
  });
});
