import { Finding, CategorySummary, Category } from "@/types/report";

const CATEGORY_META: Record<Category, { label: string; icon: string }> = {
  "code-quality": { label: "Code Quality", icon: "Code" },
  "ux-audit": { label: "UX Audit", icon: "Eye" },
  "bug-detection": { label: "Bug Detection", icon: "Bug" },
  security: { label: "Security", icon: "Shield" },
  "product-completeness": { label: "Product Completeness", icon: "CheckCircle" },
  performance: { label: "Performance", icon: "Zap" },
  "visual-audit": { label: "Visual & Flow Audit", icon: "Monitor" },
  "idea-evaluation": { label: "Idea & Product Evaluation", icon: "Lightbulb" },
};

export function computeCategoryScore(findings: Finding[]): number {
  let score = 100;
  for (const finding of findings) {
    switch (finding.severity) {
      case "critical":
        score -= 15;
        break;
      case "warning":
        score -= 5;
        break;
      case "info":
        score -= 1;
        break;
    }
  }
  return Math.max(0, score);
}

export function buildCategorySummaries(findings: Finding[]): CategorySummary[] {
  const categories = Object.keys(CATEGORY_META) as Category[];

  return categories.map((category) => {
    const categoryFindings = findings.filter((f) => f.category === category);
    return {
      category,
      label: CATEGORY_META[category].label,
      icon: CATEGORY_META[category].icon,
      findings: categoryFindings,
      score: computeCategoryScore(categoryFindings),
    };
  });
}

export function computeOverallScore(categories: CategorySummary[]): number {
  if (categories.length === 0) return 100;
  const total = categories.reduce((sum, c) => sum + c.score, 0);
  return Math.round(total / categories.length);
}

export function computeSummary(findings: Finding[]) {
  return {
    critical: findings.filter((f) => f.severity === "critical").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    info: findings.filter((f) => f.severity === "info").length,
    total: findings.length,
  };
}
