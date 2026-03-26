import { AuditAgent } from "./base";
import { Finding } from "@/types/report";
import * as fs from "fs";
import * as path from "path";
import { globSync } from "glob";
import { generateId } from "@/lib/utils";

export const productCompletenessAgent: AuditAgent = {
  name: "product-completeness",
  category: "product-completeness",
  label: "Product Completeness",
  icon: "CheckCircle",

  async run(repoPath: string): Promise<Finding[]> {
    const findings: Finding[] = [];
    const jsxFiles = globSync("**/*.{jsx,tsx}", {
      cwd: repoPath,
      ignore: ["node_modules/**", ".next/**", "dist/**", "build/**", "**/*.test.*", "**/*.spec.*"],
    });
    const jsFiles = globSync("**/*.{js,jsx,ts,tsx}", {
      cwd: repoPath,
      ignore: ["node_modules/**", ".next/**", "dist/**", "build/**", "**/*.test.*", "**/*.spec.*"],
    });

    for (const file of jsxFiles) {
      const filePath = path.join(repoPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      // 1. Missing loading states
      const fetchPatterns = /\b(useSWR|useQuery|fetch\(|axios\.|api\.|\.get\(|\.post\()/g;
      let fetchMatch;
      fetchPatterns.lastIndex = 0;
      while ((fetchMatch = fetchPatterns.exec(content)) !== null) {
        const lineNum = content.substring(0, fetchMatch.index).split("\n").length;
        const surroundingCode = content.substring(
          Math.max(0, fetchMatch.index - 500),
          fetchMatch.index + 500
        );

        if (!/loading|isLoading|isFetching|pending|spinner|skeleton/i.test(surroundingCode)) {
          findings.push({
            id: generateId("pc"),
            category: "product-completeness",
            severity: "warning",
            title: "Missing loading state",
            description: `Data fetching found near line ${lineNum} but no loading state is handled.`,
            filePath: file,
            lineNumber: lineNum,
            codeSnippet: lines[lineNum - 1]?.trim(),
            recommendation:
              "Add a loading indicator (spinner, skeleton) while data is being fetched.",
          });
          break; // One finding per file for this check
        }
      }

      // 2. Missing error states
      fetchPatterns.lastIndex = 0;
      while ((fetchMatch = fetchPatterns.exec(content)) !== null) {
        const lineNum = content.substring(0, fetchMatch.index).split("\n").length;
        const surroundingCode = content.substring(
          Math.max(0, fetchMatch.index - 500),
          fetchMatch.index + 500
        );

        if (!/error|isError|Error|onError|errorMessage|catch/i.test(surroundingCode)) {
          findings.push({
            id: generateId("pc"),
            category: "product-completeness",
            severity: "warning",
            title: "Missing error state",
            description: `Data fetching found near line ${lineNum} but no error handling UI is present.`,
            filePath: file,
            lineNumber: lineNum,
            codeSnippet: lines[lineNum - 1]?.trim(),
            recommendation: "Add error state UI to inform users when data fetching fails.",
          });
          break;
        }
      }

      // 3. Missing empty states
      const mapCalls = content.matchAll(/(\w+)\.map\s*\(/g);
      for (const mapCall of mapCalls) {
        const varName = mapCall[1];
        const lineNum = content.substring(0, mapCall.index!).split("\n").length;
        const surroundingCode = content.substring(
          Math.max(0, mapCall.index! - 300),
          mapCall.index! + 100
        );

        if (
          !new RegExp(`${varName}\\.length|${varName}\\s*&&|${varName}\\?|!${varName}|empty`, "i").test(
            surroundingCode
          )
        ) {
          findings.push({
            id: generateId("pc"),
            category: "product-completeness",
            severity: "info",
            title: "Missing empty state for list",
            description: `"${varName}.map()" is used without checking for an empty array.`,
            filePath: file,
            lineNumber: lineNum,
            codeSnippet: lines[lineNum - 1]?.trim(),
            recommendation: `Add an empty state: {${varName}.length === 0 ? <EmptyState /> : ${varName}.map(...)}`,
          });
        }
      }

      // 4. Missing form validation
      if (/<form\b/i.test(content) || /onSubmit/i.test(content) || /handleSubmit/i.test(content)) {
        const hasValidation =
          /required|pattern=|minLength|maxLength|validate|yup|zod|validator|formik|react-hook-form|useForm/i.test(
            content
          );
        if (!hasValidation) {
          const formLine = lines.findIndex(
            (l) => /<form\b/i.test(l) || /onSubmit/i.test(l)
          );
          findings.push({
            id: generateId("pc"),
            category: "product-completeness",
            severity: "warning",
            title: "Form without validation",
            description: "A form handler is present but no validation logic was detected.",
            filePath: file,
            lineNumber: formLine + 1,
            codeSnippet: lines[formLine]?.trim(),
            recommendation:
              "Add form validation using HTML5 attributes (required, pattern) or a library (zod, yup, react-hook-form).",
          });
        }
      }
    }

    // 5. Missing 404 page
    const notFoundPages = globSync("**/not-found.{jsx,tsx,js,ts}", {
      cwd: repoPath,
      ignore: ["node_modules/**"],
    });
    const custom404 = globSync("**/404.{jsx,tsx,js,ts}", {
      cwd: repoPath,
      ignore: ["node_modules/**"],
    });
    if (notFoundPages.length === 0 && custom404.length === 0 && jsxFiles.length > 0) {
      findings.push({
        id: generateId("pc"),
        category: "product-completeness",
        severity: "warning",
        title: "Missing 404 page",
        description: "No custom 404/not-found page was detected.",
        filePath: "project",
        recommendation:
          "Create a src/app/not-found.tsx file to provide a helpful 404 page for users.",
      });
    }

    // 6. Missing favicon
    const favicons = globSync("**/favicon.{ico,png,svg}", {
      cwd: repoPath,
      ignore: ["node_modules/**"],
    });
    if (favicons.length === 0 && jsxFiles.length > 0) {
      findings.push({
        id: generateId("pc"),
        category: "product-completeness",
        severity: "info",
        title: "Missing favicon",
        description: "No favicon was found in the project.",
        filePath: "project",
        recommendation: "Add a favicon.ico to the public/ or app/ directory for browser tab branding.",
      });
    }

    // 7. Missing error boundary
    let hasErrorBoundary = false;
    for (const file of jsFiles) {
      const content = fs.readFileSync(path.join(repoPath, file), "utf-8");
      if (/ErrorBoundary|error\.(tsx|jsx|ts|js)$|componentDidCatch|getDerivedStateFromError/i.test(content) ||
          /error\.tsx$/.test(file)) {
        hasErrorBoundary = true;
        break;
      }
    }
    if (!hasErrorBoundary && jsxFiles.length > 3) {
      findings.push({
        id: generateId("pc"),
        category: "product-completeness",
        severity: "warning",
        title: "No error boundary detected",
        description: "The app has no error boundary to catch and display runtime errors gracefully.",
        filePath: "project",
        recommendation:
          "Add an error.tsx file in your app directory or create an ErrorBoundary component.",
      });
    }

    return findings;
  },
};
