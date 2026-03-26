import { AuditAgent } from "./base";
import { Finding } from "@/types/report";
import * as fs from "fs";
import * as path from "path";
import { globSync } from "glob";
import { generateId } from "@/lib/utils";

const HEAVY_PACKAGES: Record<string, { severity: "warning" | "info"; alternative: string }> = {
  moment: { severity: "warning", alternative: "date-fns or dayjs (much smaller)" },
  lodash: { severity: "info", alternative: "lodash-es or individual lodash imports" },
  "jquery": { severity: "warning", alternative: "native DOM APIs or React patterns" },
  "underscore": { severity: "info", alternative: "native Array/Object methods" },
  "animate.css": { severity: "info", alternative: "Tailwind CSS animations or CSS @keyframes" },
};

export const performanceAgent: AuditAgent = {
  name: "performance",
  category: "performance",
  label: "Performance",
  icon: "Zap",

  async run(repoPath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    // 1. Check for heavy dependencies
    const pkgPath = path.join(repoPath, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      for (const [dep, info] of Object.entries(HEAVY_PACKAGES)) {
        if (allDeps[dep]) {
          findings.push({
            id: generateId("perf"),
            category: "performance",
            severity: info.severity,
            title: `Heavy dependency: ${dep}`,
            description: `"${dep}" is a known heavy package that can significantly increase bundle size.`,
            filePath: "package.json",
            recommendation: `Consider replacing with ${info.alternative}.`,
          });
        }
      }

      // Check for full lodash import in code
      if (allDeps["lodash"]) {
        const jsFiles = globSync("**/*.{js,jsx,ts,tsx}", {
          cwd: repoPath,
          ignore: ["node_modules/**", ".next/**"],
        });
        for (const file of jsFiles) {
          const content = fs.readFileSync(path.join(repoPath, file), "utf-8");
          if (/import\s+_?\s+from\s+['"]lodash['"]/.test(content)) {
            const lineNum = content.split("\n").findIndex((l) => /import.*from.*lodash/.test(l)) + 1;
            findings.push({
              id: generateId("perf"),
              category: "performance",
              severity: "warning",
              title: "Full lodash import",
              description: "Importing the entire lodash library bundles all utilities (~70KB).",
              filePath: file,
              lineNumber: lineNum,
              recommendation:
                'Use specific imports: import debounce from "lodash/debounce" or use lodash-es.',
            });
          }
        }
      }
    }

    // 2. Check for unoptimized images
    const imageFiles = globSync("**/*.{png,jpg,jpeg,gif,bmp,tiff,webp,svg}", {
      cwd: repoPath,
      ignore: ["node_modules/**", ".next/**", ".git/**"],
    });

    for (const img of imageFiles) {
      const imgPath = path.join(repoPath, img);
      const stats = fs.statSync(imgPath);
      const sizeKB = stats.size / 1024;

      if (sizeKB > 500) {
        findings.push({
          id: generateId("perf"),
          category: "performance",
          severity: "warning",
          title: `Large image: ${path.basename(img)} (${Math.round(sizeKB)}KB)`,
          description: `Image is ${Math.round(sizeKB)}KB. Large images slow down page loads.`,
          filePath: img,
          recommendation:
            "Compress the image, use WebP/AVIF format, or use Next.js Image component for automatic optimization.",
        });
      }

      if (/\.(bmp|tiff)$/i.test(img)) {
        findings.push({
          id: generateId("perf"),
          category: "performance",
          severity: "warning",
          title: `Unoptimized image format: ${path.basename(img)}`,
          description: `${path.extname(img)} is an uncompressed format, resulting in large file sizes.`,
          filePath: img,
          recommendation: "Convert to WebP, PNG, or JPEG for significantly smaller file sizes.",
        });
      }
    }

    // 3. Check for raw <img> tags (should use Next.js Image)
    const jsxFiles = globSync("**/*.{jsx,tsx}", {
      cwd: repoPath,
      ignore: ["node_modules/**", ".next/**"],
    });

    let usesNextImage = false;
    let usesRawImg = false;
    for (const file of jsxFiles) {
      const content = fs.readFileSync(path.join(repoPath, file), "utf-8");
      if (/from\s+['"]next\/image['"]/.test(content)) usesNextImage = true;
      if (/<img\b/i.test(content)) usesRawImg = true;
    }

    // Only flag if this is a Next.js project
    if (fs.existsSync(path.join(repoPath, "next.config.js")) || fs.existsSync(path.join(repoPath, "next.config.mjs"))) {
      if (usesRawImg && !usesNextImage) {
        findings.push({
          id: generateId("perf"),
          category: "performance",
          severity: "info",
          title: "Using <img> instead of Next.js Image",
          description: "Raw <img> tags don't get Next.js automatic image optimization.",
          filePath: "project",
          recommendation:
            'Use import Image from "next/image" for automatic lazy loading, resizing, and format optimization.',
        });
      }
    }

    // 4. Check for missing code splitting / lazy loading
    let hasLazyImports = false;
    let hasMultipleRoutes = false;
    for (const file of jsxFiles) {
      const content = fs.readFileSync(path.join(repoPath, file), "utf-8");
      if (/React\.lazy|dynamic\(|import\(/.test(content)) hasLazyImports = true;
      if (/Route|router|Link/.test(content)) hasMultipleRoutes = true;
    }

    if (hasMultipleRoutes && !hasLazyImports && jsxFiles.length > 10) {
      findings.push({
        id: generateId("perf"),
        category: "performance",
        severity: "info",
        title: "No code splitting detected",
        description:
          "The app has multiple routes but no lazy loading or dynamic imports for code splitting.",
        filePath: "project",
        recommendation:
          "Use React.lazy() or Next.js dynamic() to split code by route and reduce initial bundle size.",
      });
    }

    // 5. Check for missing meta tags
    const layoutFiles = globSync("**/layout.{jsx,tsx,js,ts}", {
      cwd: repoPath,
      ignore: ["node_modules/**"],
    });
    const htmlFiles = globSync("**/*.html", {
      cwd: repoPath,
      ignore: ["node_modules/**"],
    });

    let hasViewport = false;
    let hasDescription = false;
    let hasOG = false;

    for (const file of [...layoutFiles, ...htmlFiles]) {
      const content = fs.readFileSync(path.join(repoPath, file), "utf-8");
      if (/viewport/i.test(content)) hasViewport = true;
      if (/description/i.test(content)) hasDescription = true;
      if (/openGraph|og:/i.test(content)) hasOG = true;
    }

    if (!hasViewport && jsxFiles.length > 0) {
      findings.push({
        id: generateId("perf"),
        category: "performance",
        severity: "info",
        title: "Missing viewport meta tag",
        description: "No viewport meta tag found. Mobile rendering may not work correctly.",
        filePath: "project",
        recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1" />.',
      });
    }

    if (!hasDescription && jsxFiles.length > 0) {
      findings.push({
        id: generateId("perf"),
        category: "performance",
        severity: "info",
        title: "Missing meta description",
        description: "No meta description found. This hurts SEO.",
        filePath: "project",
        recommendation: "Add a meta description via Next.js metadata export or a <meta> tag.",
      });
    }

    if (!hasOG && jsxFiles.length > 0) {
      findings.push({
        id: generateId("perf"),
        category: "performance",
        severity: "info",
        title: "Missing Open Graph tags",
        description: "No Open Graph meta tags found. Social media shares will look plain.",
        filePath: "project",
        recommendation: "Add Open Graph tags (og:title, og:description, og:image) for rich social previews.",
      });
    }

    return findings;
  },
};
