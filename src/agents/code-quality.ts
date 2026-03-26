import { AuditAgent } from "./base";
import { Finding } from "@/types/report";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { globSync } from "glob";
import { generateId } from "@/lib/utils";

export const codeQualityAgent: AuditAgent = {
  name: "code-quality",
  category: "code-quality",
  label: "Code Quality",
  icon: "Code",

  async run(repoPath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    // 1. Check for syntax errors and common issues via pattern scanning
    const jsFiles = globSync("**/*.{js,jsx,ts,tsx}", {
      cwd: repoPath,
      ignore: ["node_modules/**", ".next/**", "dist/**", "build/**"],
    });

    for (const file of jsFiles) {
      const filePath = path.join(repoPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      // Check for unused imports (basic heuristic)
      const importMatches = content.matchAll(
        /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"][^'"]+['"]/g
      );
      for (const match of importMatches) {
        const imported = match[1] || match[2];
        if (!imported) continue;
        const names = imported.split(",").map((n) => n.trim().split(" as ").pop()!.trim());
        for (const name of names) {
          if (!name) continue;
          const usageRegex = new RegExp(`\\b${name}\\b`, "g");
          const allMatches = content.match(usageRegex);
          // If the name appears only once (the import itself), it's unused
          if (allMatches && allMatches.length <= 1) {
            const lineNum = lines.findIndex((l) => l.includes(name) && l.includes("import")) + 1;
            findings.push({
              id: generateId("cq"),
              category: "code-quality",
              severity: "warning",
              title: `Unused import: ${name}`,
              description: `The import '${name}' is imported but never used in this file.`,
              filePath: file,
              lineNumber: lineNum,
              codeSnippet: lines[lineNum - 1]?.trim(),
              recommendation: `Remove the unused import '${name}' to keep the code clean.`,
            });
          }
        }
      }

      // Check for console.log statements
      lines.forEach((line, idx) => {
        if (
          line.includes("console.log") &&
          !file.includes("test") &&
          !file.includes("spec") &&
          !file.includes("__tests__")
        ) {
          findings.push({
            id: generateId("cq"),
            category: "code-quality",
            severity: "info",
            title: "console.log left in code",
            description: "A console.log statement was found in production code.",
            filePath: file,
            lineNumber: idx + 1,
            codeSnippet: line.trim(),
            recommendation: "Remove console.log statements before shipping to production.",
          });
        }
      });

      // Check for TODO/FIXME/HACK comments
      lines.forEach((line, idx) => {
        const todoMatch = line.match(/\/\/\s*(TODO|FIXME|HACK|XXX)\b[:]?\s*(.*)/i);
        if (todoMatch) {
          findings.push({
            id: generateId("cq"),
            category: "code-quality",
            severity: "info",
            title: `${todoMatch[1].toUpperCase()} comment found`,
            description: `Unresolved ${todoMatch[1]} comment: "${todoMatch[2] || "(no description)"}"`,
            filePath: file,
            lineNumber: idx + 1,
            codeSnippet: line.trim(),
            recommendation: "Address or remove this comment before shipping.",
          });
        }
      });

      // Check for very long files (>500 lines)
      if (lines.length > 500) {
        findings.push({
          id: generateId("cq"),
          category: "code-quality",
          severity: "warning",
          title: "File is very long",
          description: `This file has ${lines.length} lines. Large files are harder to maintain.`,
          filePath: file,
          recommendation: "Consider splitting this file into smaller, focused modules.",
        });
      }

      // Check for deeply nested code (>4 levels)
      lines.forEach((line, idx) => {
        const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
        const indentLevel = Math.floor(leadingSpaces / 2);
        if (indentLevel >= 6 && line.trim().length > 0) {
          findings.push({
            id: generateId("cq"),
            category: "code-quality",
            severity: "warning",
            title: "Deeply nested code",
            description: `Code is nested ${indentLevel} levels deep, which reduces readability.`,
            filePath: file,
            lineNumber: idx + 1,
            codeSnippet: line.trim(),
            recommendation: "Extract nested logic into separate functions or use early returns.",
          });
        }
      });
    }

    // 2. Check for TypeScript errors if tsconfig exists
    const tsconfigPath = path.join(repoPath, "tsconfig.json");
    if (fs.existsSync(tsconfigPath)) {
      try {
        const result = execSync("npx tsc --noEmit --pretty false 2>&1", {
          cwd: repoPath,
          timeout: 30000,
          encoding: "utf-8",
        });
      } catch (err: any) {
        const output = err.stdout || err.message || "";
        const errorLines = output.split("\n").filter((l: string) => l.includes("error TS"));
        for (const errLine of errorLines.slice(0, 20)) {
          const match = errLine.match(/^(.+?)\((\d+),\d+\):\s*error\s+TS\d+:\s*(.+)/);
          if (match) {
            findings.push({
              id: generateId("cq"),
              category: "code-quality",
              severity: "critical",
              title: "TypeScript error",
              description: match[3],
              filePath: match[1],
              lineNumber: parseInt(match[2]),
              recommendation: "Fix this TypeScript error to ensure type safety.",
            });
          }
        }
      }
    }

    // 3. Dead file detection (basic: find files not imported anywhere)
    const importedFiles = new Set<string>();
    for (const file of jsFiles) {
      const content = fs.readFileSync(path.join(repoPath, file), "utf-8");
      const imports = content.matchAll(/from\s+['"]([^'"]+)['"]/g);
      for (const imp of imports) {
        const resolved = imp[1].replace(/^[@~]\//, "src/");
        importedFiles.add(resolved);
        // Also add with common extensions
        for (const ext of [".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"]) {
          importedFiles.add(resolved + ext);
        }
      }
    }

    const entryPatterns = [
      /page\.(ts|tsx|js|jsx)$/,
      /layout\.(ts|tsx|js|jsx)$/,
      /route\.(ts|tsx|js|jsx)$/,
      /middleware\.(ts|tsx|js|jsx)$/,
      /index\.(ts|tsx|js|jsx)$/,
      /config/,
      /\.config\./,
    ];

    for (const file of jsFiles) {
      const isEntry = entryPatterns.some((p) => p.test(file));
      if (isEntry) continue;

      const normalized = file.replace(/\.(ts|tsx|js|jsx)$/, "");
      const isImported = importedFiles.has(file) || importedFiles.has(normalized) || importedFiles.has("./" + file);

      if (!isImported) {
        // Check if any file references this file's name
        const basename = path.basename(file, path.extname(file));
        const referencedAnywhere = jsFiles.some((f) => {
          if (f === file) return false;
          const content = fs.readFileSync(path.join(repoPath, f), "utf-8");
          return content.includes(basename);
        });

        if (!referencedAnywhere) {
          findings.push({
            id: generateId("cq"),
            category: "code-quality",
            severity: "info",
            title: "Potentially unused file",
            description: `This file doesn't appear to be imported by any other file.`,
            filePath: file,
            recommendation: "Verify this file is needed. Remove dead files to reduce codebase complexity.",
          });
        }
      }
    }

    return findings;
  },
};
