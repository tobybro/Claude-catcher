import { AuditAgent } from "./base";
import { codeQualityAgent } from "./code-quality";
import { uxAuditAgent } from "./ux-audit";
import { bugDetectionAgent } from "./bug-detection";
import { securityAgent } from "./security";
import { productCompletenessAgent } from "./product-completeness";
import { performanceAgent } from "./performance";
import { visualAuditAgent } from "./visual-audit";

export const agents: AuditAgent[] = [
  codeQualityAgent,
  uxAuditAgent,
  bugDetectionAgent,
  securityAgent,
  productCompletenessAgent,
  performanceAgent,
  visualAuditAgent,
];
