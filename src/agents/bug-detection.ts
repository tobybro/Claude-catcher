import { AuditAgent } from "./base";
import { Finding } from "@/types/report";
import * as fs from "fs";
import * as path from "path";
import { globSync } from "glob";
import { generateId } from "@/lib/utils";

export const bugDetectionAgent: AuditAgent = {
  name: "bug-detection",
  category: "bug-detection",
  label: "Bug Detection",
  icon: "Bug",

  async run(repoPath: string): Promise<Finding[]> {
    const findings: Finding[] = [];
    const jsFiles = globSync("**/*.{js,jsx,ts,tsx}", {
      cwd: repoPath,
      ignore: ["node_modules/**", ".next/**", "dist/**", "build/**", "**/*.test.*", "**/*.spec.*"],
    });

    for (const file of jsFiles) {
      const filePath = path.join(repoPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      // Unhandled promise rejections: .then() without .catch()
      lines.forEach((line, idx) => {
        if (/\.then\s*\(/.test(line)) {
          // Look ahead for .catch in the next few lines
          const lookAhead = lines.slice(idx, idx + 5).join("\n");
          if (!/\.catch\s*\(/.test(lookAhead) && !/try\s*{/.test(lines.slice(Math.max(0, idx - 5), idx).join("\n"))) {
            findings.push({
              id: generateId("bug"),
              category: "bug-detection",
              severity: "warning",
              title: "Unhandled promise rejection",
              description: "A .then() call without a .catch() handler may cause unhandled promise rejections.",
              filePath: file,
              lineNumber: idx + 1,
              codeSnippet: line.trim(),
              recommendation: "Add a .catch() handler or wrap in try/catch to handle errors gracefully.",
            });
          }
        }
      });

      // Async functions without try/catch (covers declarations, methods, and arrow functions)
      const asyncFnRegex = /async\s+(?:function\s+\w+|\w+)\s*\(|=\s*async\s*(?:\([^)]*\)|\w+)\s*=>/g;
      let asyncMatch;
      while ((asyncMatch = asyncFnRegex.exec(content)) !== null) {
        const startIdx = asyncMatch.index;
        const lineNum = content.substring(0, startIdx).split("\n").length;
        // Check if there's a try block within the function
        const fnBody = content.substring(startIdx, startIdx + 500);
        if (/await\s+/.test(fnBody) && !/try\s*\{/.test(fnBody)) {
          findings.push({
            id: generateId("bug"),
            category: "bug-detection",
            severity: "warning",
            title: "Async function without try/catch",
            description: "An async function uses await but has no try/catch for error handling.",
            filePath: file,
            lineNumber: lineNum,
            codeSnippet: lines[lineNum - 1]?.trim(),
            recommendation: "Wrap await calls in try/catch blocks to handle potential errors.",
          });
        }
      }

      // Array access without bounds checking
      lines.forEach((line, idx) => {
        if (/\[\d+\]/.test(line) && !/\.length/.test(line) && !line.trim().startsWith("//")) {
          const match = line.match(/(\w+)\[(\d+)\]/);
          if (match && parseInt(match[2]) > 0) {
            findings.push({
              id: generateId("bug"),
              category: "bug-detection",
              severity: "info",
              title: "Array accessed by hardcoded index",
              description: `Accessing ${match[1]}[${match[2]}] without checking array length could cause runtime errors.`,
              filePath: file,
              lineNumber: idx + 1,
              codeSnippet: line.trim(),
              recommendation: "Add a length check or use optional chaining before accessing array indices.",
            });
          }
        }
      });

      // setState in useEffect without cleanup (potential memory leak)
      const useEffectRegex = /useEffect\s*\(\s*(?:async\s+)?\(\)\s*=>\s*\{/g;
      let effectMatch;
      while ((effectMatch = useEffectRegex.exec(content)) !== null) {
        const startIdx = effectMatch.index;
        const lineNum = content.substring(0, startIdx).split("\n").length;
        const effectBody = content.substring(startIdx, startIdx + 500);

        // Check for async useEffect (common mistake)
        if (/useEffect\s*\(\s*async/.test(effectBody)) {
          findings.push({
            id: generateId("bug"),
            category: "bug-detection",
            severity: "critical",
            title: "Async function passed to useEffect",
            description: "useEffect callbacks cannot be async. This can cause memory leaks and race conditions.",
            filePath: file,
            lineNumber: lineNum,
            codeSnippet: lines[lineNum - 1]?.trim(),
            recommendation:
              "Define an async function inside the effect and call it, or use a custom hook for async effects.",
          });
        }

        // Check for fetch/setState without cleanup
        if (/set\w+\s*\(/.test(effectBody) && /fetch|axios|api/i.test(effectBody)) {
          if (!/return\s*\(\)\s*=>/.test(effectBody) && !/AbortController/.test(effectBody)) {
            findings.push({
              id: generateId("bug"),
              category: "bug-detection",
              severity: "warning",
              title: "useEffect with fetch but no cleanup",
              description:
                "A useEffect fetches data and sets state but has no cleanup function, which can cause memory leaks.",
              filePath: file,
              lineNumber: lineNum,
              codeSnippet: lines[lineNum - 1]?.trim(),
              recommendation: "Add an AbortController cleanup to cancel pending requests when the component unmounts.",
            });
          }
        }
      }

      // Comparison with == instead of ===
      lines.forEach((line, idx) => {
        if (line.trim().startsWith("//")) return;
        // Match == but not === or !==
        if (/[^!=]==[^=]/.test(line) && !/===/.test(line.replace(/==/g, ""))) {
          findings.push({
            id: generateId("bug"),
            category: "bug-detection",
            severity: "info",
            title: "Loose equality comparison (==)",
            description: "Using == instead of === can lead to unexpected type coercion bugs.",
            filePath: file,
            lineNumber: idx + 1,
            codeSnippet: line.trim(),
            recommendation: "Use strict equality (===) to avoid type coercion surprises.",
          });
        }
      });

      // Missing key prop in .map()
      const mapRegex = /\.map\s*\(\s*(?:\([^)]*\)|[^=])\s*=>/g;
      let mapMatch;
      while ((mapMatch = mapRegex.exec(content)) !== null) {
        const startIdx = mapMatch.index;
        const lineNum = content.substring(0, startIdx).split("\n").length;
        const mapBody = content.substring(startIdx, startIdx + 300);
        if (/<\w/.test(mapBody) && !/key\s*=/.test(mapBody)) {
          findings.push({
            id: generateId("bug"),
            category: "bug-detection",
            severity: "warning",
            title: "Missing key prop in list rendering",
            description: "A .map() rendering JSX elements doesn't appear to have a key prop.",
            filePath: file,
            lineNumber: lineNum,
            codeSnippet: lines[lineNum - 1]?.trim(),
            recommendation: "Add a unique key prop to each element in a .map() to help React identify changes.",
          });
        }
      }
    }

    return findings;
  },
};
