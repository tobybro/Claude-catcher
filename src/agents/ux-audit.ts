import { AuditAgent } from "./base";
import { Finding } from "@/types/report";
import * as fs from "fs";
import * as path from "path";
import { globSync } from "glob";
import { generateId } from "@/lib/utils";

export const uxAuditAgent: AuditAgent = {
  name: "ux-audit",
  category: "ux-audit",
  label: "UX Audit",
  icon: "Eye",

  async run(repoPath: string): Promise<Finding[]> {
    const findings: Finding[] = [];
    const jsxFiles = globSync("**/*.{jsx,tsx}", {
      cwd: repoPath,
      ignore: ["node_modules/**", ".next/**", "dist/**", "build/**"],
    });

    for (const file of jsxFiles) {
      const filePath = path.join(repoPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      // Accessibility: missing alt on images
      lines.forEach((line, idx) => {
        if (/<img\b/i.test(line) && !/alt\s*=/i.test(line)) {
          // Check next few lines too for multi-line img tags
          const context = lines.slice(idx, idx + 3).join(" ");
          if (!/alt\s*=/i.test(context)) {
            findings.push({
              id: generateId("ux"),
              category: "ux-audit",
              severity: "warning",
              title: "Image missing alt attribute",
              description: "An <img> tag is missing the `alt` attribute, which is required for accessibility.",
              filePath: file,
              lineNumber: idx + 1,
              codeSnippet: line.trim(),
              recommendation: 'Add a descriptive alt attribute: <img alt="Description of image" />',
            });
          }
        }
      });

      // Accessibility: buttons without accessible text
      lines.forEach((line, idx) => {
        if (/<button\b/i.test(line) || /<Button\b/.test(line)) {
          const context = lines.slice(idx, idx + 3).join(" ");
          if (
            /aria-label/i.test(context) ||
            /aria-labelledby/i.test(context) ||
            />[^<{]+</.test(context)
          ) {
            return; // Has accessible text
          }
          // Check if it only contains an icon
          if (/<(Icon|svg|img)\b/i.test(context) && !/aria-label/i.test(context)) {
            findings.push({
              id: generateId("ux"),
              category: "ux-audit",
              severity: "warning",
              title: "Icon button missing accessible label",
              description: "A button appears to contain only an icon without an aria-label.",
              filePath: file,
              lineNumber: idx + 1,
              codeSnippet: line.trim(),
              recommendation: "Add aria-label to icon-only buttons for screen reader users.",
            });
          }
        }
      });

      // Accessibility: form labels
      lines.forEach((line, idx) => {
        if (/<input\b/i.test(line) && !/type\s*=\s*["']hidden["']/i.test(line)) {
          const context = lines.slice(Math.max(0, idx - 3), idx + 1).join(" ");
          if (
            !/<label\b/i.test(context) &&
            !/aria-label/i.test(line) &&
            !/aria-labelledby/i.test(line) &&
            !/placeholder/i.test(line)
          ) {
            findings.push({
              id: generateId("ux"),
              category: "ux-audit",
              severity: "warning",
              title: "Input field missing label",
              description: "An input field doesn't have an associated label, aria-label, or placeholder.",
              filePath: file,
              lineNumber: idx + 1,
              codeSnippet: line.trim(),
              recommendation: "Add a <label> element or aria-label attribute for accessibility.",
            });
          }
        }
      });

      // Responsive design: check for hardcoded pixel widths
      lines.forEach((line, idx) => {
        const hardcodedWidth = line.match(/width\s*[:=]\s*['"]?\d{4,}px/i);
        if (hardcodedWidth) {
          findings.push({
            id: generateId("ux"),
            category: "ux-audit",
            severity: "warning",
            title: "Hardcoded large pixel width",
            description: "A large hardcoded pixel width may break on smaller screens.",
            filePath: file,
            lineNumber: idx + 1,
            codeSnippet: line.trim(),
            recommendation: "Use responsive units (%, vw, rem) or Tailwind responsive classes instead.",
          });
        }
      });
    }

    // Check for responsive design patterns
    const allFiles = globSync("**/*.{jsx,tsx,css,scss}", {
      cwd: repoPath,
      ignore: ["node_modules/**", ".next/**"],
    });

    let hasResponsivePatterns = false;
    for (const file of allFiles) {
      const content = fs.readFileSync(path.join(repoPath, file), "utf-8");
      if (
        /@media/i.test(content) ||
        /\b(sm|md|lg|xl|2xl):/i.test(content) ||
        /useMediaQuery/i.test(content)
      ) {
        hasResponsivePatterns = true;
        break;
      }
    }

    if (!hasResponsivePatterns && jsxFiles.length > 0) {
      findings.push({
        id: generateId("ux"),
        category: "ux-audit",
        severity: "warning",
        title: "No responsive design detected",
        description: "No media queries, Tailwind responsive prefixes, or responsive hooks were found.",
        filePath: "project",
        recommendation:
          "Add responsive breakpoints to ensure your app works on mobile, tablet, and desktop.",
      });
    }

    // Check for navigation completeness
    const routeFiles = new Set<string>();
    const pageFiles = globSync("**/page.{jsx,tsx,js,ts}", {
      cwd: repoPath,
      ignore: ["node_modules/**"],
    });
    for (const pf of pageFiles) {
      const route = "/" + path.dirname(pf).replace(/^src\/app\/?/, "").replace(/\/?$/, "");
      routeFiles.add(route === "/." ? "/" : route);
    }

    // Find all internal links
    for (const file of jsxFiles) {
      const content = fs.readFileSync(path.join(repoPath, file), "utf-8");
      const linkMatches = content.matchAll(/(?:href|to)\s*=\s*["'](\/?[^"']*?)["']/g);
      for (const match of linkMatches) {
        const href = match[1];
        if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/api")) continue;
        const cleanHref = href.split("?")[0].split("#")[0];
        if (routeFiles.size > 0 && !routeFiles.has(cleanHref) && cleanHref !== "/") {
          // Check if it might be a dynamic route
          const isDynamic = [...routeFiles].some((r) => r.includes("["));
          if (!isDynamic) {
            findings.push({
              id: generateId("ux"),
              category: "ux-audit",
              severity: "warning",
              title: `Link to undefined route: ${cleanHref}`,
              description: `A link points to "${cleanHref}" but no matching page file was found.`,
              filePath: file,
              codeSnippet: match[0],
              recommendation: "Create the missing page or fix the link href.",
            });
          }
        }
      }
    }

    // Check for missing page title
    const layoutFiles = globSync("**/layout.{jsx,tsx,js,ts}", {
      cwd: repoPath,
      ignore: ["node_modules/**"],
    });
    let hasTitle = false;
    for (const lf of layoutFiles) {
      const content = fs.readFileSync(path.join(repoPath, lf), "utf-8");
      if (/metadata|<title/i.test(content)) {
        hasTitle = true;
        break;
      }
    }
    if (!hasTitle && jsxFiles.length > 0) {
      findings.push({
        id: generateId("ux"),
        category: "ux-audit",
        severity: "info",
        title: "Missing page title",
        description: "No <title> or metadata export was found in layout files.",
        filePath: "project",
        recommendation: "Add a metadata export or <title> tag for better SEO and user experience.",
      });
    }

    return findings;
  },
};
