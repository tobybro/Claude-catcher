import { AuditAgent } from "./base";
import { Finding } from "@/types/report";
import * as fs from "fs";
import * as path from "path";
import { globSync } from "glob";
import { generateId } from "@/lib/utils";

const SECRET_PATTERNS = [
  { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["'][A-Za-z0-9_\-]{20,}["']/gi, name: "API key" },
  { pattern: /(?:secret|token|password|passwd|pwd)\s*[:=]\s*["'][^"']{8,}["']/gi, name: "Secret/password" },
  { pattern: /\bsk[-_](?:live|test)[-_][A-Za-z0-9]{20,}\b/g, name: "Stripe secret key" },
  { pattern: /\bAKIA[A-Z0-9]{16}\b/g, name: "AWS access key" },
  { pattern: /\bghp_[A-Za-z0-9]{36,}\b/g, name: "GitHub personal access token" },
  { pattern: /\bxox[bpas]-[A-Za-z0-9\-]{10,}\b/g, name: "Slack token" },
  { pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g, name: "Private key" },
  { pattern: /\bBearer\s+[A-Za-z0-9\-._~+\/]{20,}\b/g, name: "Bearer token" },
];

export const securityAgent: AuditAgent = {
  name: "security",
  category: "security",
  label: "Security",
  icon: "Shield",

  async run(repoPath: string): Promise<Finding[]> {
    const findings: Finding[] = [];
    const allFiles = globSync("**/*.{js,jsx,ts,tsx,json,env,yaml,yml,toml}", {
      cwd: repoPath,
      ignore: [
        "node_modules/**",
        ".next/**",
        "dist/**",
        "build/**",
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
      ],
    });

    for (const file of allFiles) {
      const filePath = path.join(repoPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      // 1. Hardcoded secrets
      for (const { pattern, name } of SECRET_PATTERNS) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(content)) !== null) {
          // Skip .env.example files
          if (file.includes(".example") || file.includes(".sample")) continue;
          const lineNum = content.substring(0, match.index).split("\n").length;
          findings.push({
            id: generateId("sec"),
            category: "security",
            severity: "critical",
            title: `Hardcoded ${name} detected`,
            description: `A ${name} appears to be hardcoded in the source code.`,
            filePath: file,
            lineNumber: lineNum,
            codeSnippet: lines[lineNum - 1]?.trim().substring(0, 80) + "...",
            recommendation: "Move secrets to environment variables (.env) and add .env to .gitignore.",
          });
        }
      }

      // Skip non-JS files for remaining checks
      if (!/\.(js|jsx|ts|tsx)$/.test(file)) continue;

      // 2. Dangerous HTML injection
      lines.forEach((line, idx) => {
        if (/dangerouslySetInnerHTML/i.test(line)) {
          findings.push({
            id: generateId("sec"),
            category: "security",
            severity: "critical",
            title: "dangerouslySetInnerHTML usage",
            description: "Using dangerouslySetInnerHTML can expose your app to XSS attacks.",
            filePath: file,
            lineNumber: idx + 1,
            codeSnippet: line.trim(),
            recommendation: "Sanitize HTML content with a library like DOMPurify before rendering.",
          });
        }

        if (/\.innerHTML\s*=/.test(line)) {
          findings.push({
            id: generateId("sec"),
            category: "security",
            severity: "critical",
            title: "Direct innerHTML assignment",
            description: "Setting innerHTML directly can lead to XSS vulnerabilities.",
            filePath: file,
            lineNumber: idx + 1,
            codeSnippet: line.trim(),
            recommendation: "Use textContent instead, or sanitize with DOMPurify.",
          });
        }

        if (/document\.write\s*\(/.test(line)) {
          findings.push({
            id: generateId("sec"),
            category: "security",
            severity: "warning",
            title: "document.write usage",
            description: "document.write can be exploited for XSS and causes performance issues.",
            filePath: file,
            lineNumber: idx + 1,
            codeSnippet: line.trim(),
            recommendation: "Use DOM manipulation methods (createElement, appendChild) instead.",
          });
        }
      });

      // 3. SQL injection
      lines.forEach((line, idx) => {
        if (/(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+/i.test(line)) {
          if (/\$\{|\+\s*\w+|\'\s*\+\s*\w+/.test(line)) {
            findings.push({
              id: generateId("sec"),
              category: "security",
              severity: "critical",
              title: "Potential SQL injection",
              description: "SQL query appears to use string concatenation/interpolation with variables.",
              filePath: file,
              lineNumber: idx + 1,
              codeSnippet: line.trim(),
              recommendation: "Use parameterized queries or an ORM to prevent SQL injection.",
            });
          }
        }
      });

      // 4. eval() usage
      lines.forEach((line, idx) => {
        if (/\beval\s*\(/.test(line) && !line.trim().startsWith("//")) {
          findings.push({
            id: generateId("sec"),
            category: "security",
            severity: "critical",
            title: "eval() usage detected",
            description: "eval() executes arbitrary code and is a major security risk.",
            filePath: file,
            lineNumber: idx + 1,
            codeSnippet: line.trim(),
            recommendation: "Replace eval() with safer alternatives like JSON.parse() or Function constructors.",
          });
        }
      });

      // 5. Unprotected API routes (Next.js specific)
      if (file.includes("api/") && /route\.(ts|js)/.test(file)) {
        const hasMutationHandler = /export\s+async\s+function\s+(POST|PUT|DELETE|PATCH)/i.test(content);
        if (hasMutationHandler) {
          const hasAuthCheck =
            /auth|session|token|cookie|getServerSession|getToken|middleware/i.test(content);
          if (!hasAuthCheck) {
            findings.push({
              id: generateId("sec"),
              category: "security",
              severity: "warning",
              title: "API route without authentication check",
              description: `This API route handles mutations (POST/PUT/DELETE) but has no visible auth check.`,
              filePath: file,
              recommendation: "Add authentication/authorization middleware to protect mutation endpoints.",
            });
          }
        }
      }

      // 6. CORS misconfiguration
      lines.forEach((line, idx) => {
        if (/Access-Control-Allow-Origin.*\*/.test(line)) {
          findings.push({
            id: generateId("sec"),
            category: "security",
            severity: "warning",
            title: "Wildcard CORS configuration",
            description: "Access-Control-Allow-Origin is set to *, allowing any domain.",
            filePath: file,
            lineNumber: idx + 1,
            codeSnippet: line.trim(),
            recommendation: "Restrict CORS to specific trusted domains in production.",
          });
        }
      });
    }

    // 7. Check for .env files committed
    const envFiles = globSync(".env*", { cwd: repoPath, dot: true });
    for (const envFile of envFiles) {
      if (envFile.includes(".example") || envFile.includes(".sample")) continue;
      if (envFile === ".env.local" || envFile === ".env") {
        const content = fs.readFileSync(path.join(repoPath, envFile), "utf-8");
        if (content.trim().length > 0) {
          findings.push({
            id: generateId("sec"),
            category: "security",
            severity: "critical",
            title: `Environment file committed: ${envFile}`,
            description: "An .env file with content is present in the repository.",
            filePath: envFile,
            recommendation: "Add .env files to .gitignore and use .env.example for documentation.",
          });
        }
      }
    }

    return findings;
  },
};
