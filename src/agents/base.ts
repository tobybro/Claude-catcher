import { Category, Finding } from "@/types/report";

export interface AuditAgent {
  name: string;
  category: Category;
  label: string;
  icon: string;
  run(repoPath: string): Promise<Finding[]>;
}
