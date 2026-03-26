import { AuditAgent } from "./base";
import { Finding } from "@/types/report";
import * as fs from "fs";
import * as path from "path";
import { generateId } from "@/lib/utils";
import { startApp, stopApp, type AppProcess } from "@/lib/app-runner";

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

export const visualAuditAgent: AuditAgent = {
  name: "visual-audit",
  category: "visual-audit",
  label: "Visual & Flow Audit",
  icon: "Monitor",

  async run(repoPath: string): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Check if the repo has a dev server
    const pkgPath = path.join(repoPath, "package.json");
    if (!fs.existsSync(pkgPath)) {
      findings.push({
        id: generateId("vis"),
        category: "visual-audit",
        severity: "info",
        title: "Visual audit skipped",
        description: "No package.json found — cannot start a dev server for visual testing.",
        filePath: "project",
        recommendation: "Add a package.json with a dev/start script to enable visual auditing.",
      });
      return findings;
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const scripts = pkg.scripts || {};
    const hasDevScript = scripts.dev || scripts.start || scripts.serve;

    if (!hasDevScript) {
      findings.push({
        id: generateId("vis"),
        category: "visual-audit",
        severity: "info",
        title: "Visual audit skipped",
        description: "No dev/start/serve script found in package.json.",
        filePath: "package.json",
        recommendation: 'Add a "dev" script to package.json to enable visual auditing.',
      });
      return findings;
    }

    let appProcess: AppProcess | null = null;
    let browser: any = null;

    try {
      // Try to start the app
      appProcess = await startApp(repoPath);

      if (!appProcess) {
        findings.push({
          id: generateId("vis"),
          category: "visual-audit",
          severity: "warning",
          title: "Could not start dev server",
          description: "The dev server failed to start within the timeout period.",
          filePath: "project",
          recommendation: "Ensure the app starts correctly with npm run dev.",
        });
        return findings;
      }

      // Import playwright dynamically
      let chromium;
      try {
        const pw = await import("playwright");
        chromium = pw.chromium;
      } catch {
        findings.push({
          id: generateId("vis"),
          category: "visual-audit",
          severity: "info",
          title: "Playwright not available",
          description: "Playwright is not installed — visual audit cannot run.",
          filePath: "project",
          recommendation: "Install playwright to enable visual auditing: npm install playwright",
        });
        return findings;
      }

      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();

      // Collect console errors and network failures
      const consoleErrors: { url: string; message: string }[] = [];
      const networkFailures: { url: string; status: number; requestUrl: string }[] = [];

      const page = await context.newPage();
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push({ url: page.url(), message: msg.text() });
        }
      });
      page.on("response", (response) => {
        if (response.status() >= 400) {
          networkFailures.push({
            url: page.url(),
            status: response.status(),
            requestUrl: response.url(),
          });
        }
      });

      const baseUrl = `http://localhost:${appProcess.port}`;

      // Discover routes from the page
      const visitedUrls = new Set<string>();
      const urlsToVisit = [baseUrl];
      const maxPages = 20;

      while (urlsToVisit.length > 0 && visitedUrls.size < maxPages) {
        const url = urlsToVisit.shift()!;
        if (visitedUrls.has(url)) continue;
        visitedUrls.add(url);

        try {
          const response = await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });

          if (!response || response.status() >= 400) {
            findings.push({
              id: generateId("vis"),
              category: "visual-audit",
              severity: "critical",
              title: `Broken page: ${new URL(url).pathname}`,
              description: `Page returned status ${response?.status() || "no response"}.`,
              filePath: new URL(url).pathname,
              recommendation: "Fix the page to return a valid response.",
            });
            continue;
          }

          // Check for blank pages
          const bodyText = await page.evaluate(() => document.body?.innerText?.trim() || "");
          const bodyChildren = await page.evaluate(() => document.body?.children?.length || 0);
          if (bodyText.length < 10 && bodyChildren < 3) {
            // Take screenshot as evidence
            const screenshot = await page.screenshot({ type: "png" });
            findings.push({
              id: generateId("vis"),
              category: "visual-audit",
              severity: "critical",
              title: `Blank/empty page: ${new URL(url).pathname}`,
              description: "This page appears to render with minimal or no content.",
              filePath: new URL(url).pathname,
              screenshot: screenshot.toString("base64"),
              viewport: "1440x900",
              recommendation: "Check that the page component renders content correctly.",
            });
          }

          // Test responsive viewports
          for (const vp of VIEWPORTS) {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            await page.waitForTimeout(500);

            // Check for horizontal overflow
            const hasOverflow = await page.evaluate(() => {
              return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });

            if (hasOverflow) {
              const screenshot = await page.screenshot({ type: "png" });
              findings.push({
                id: generateId("vis"),
                category: "visual-audit",
                severity: "warning",
                title: `Horizontal overflow at ${vp.name} (${vp.width}px)`,
                description: `Page "${new URL(url).pathname}" has horizontal scroll at ${vp.width}px width.`,
                filePath: new URL(url).pathname,
                screenshot: screenshot.toString("base64"),
                viewport: `${vp.width}x${vp.height}`,
                recommendation: "Fix layout to prevent horizontal overflow on smaller screens.",
              });
            }
          }

          // Reset viewport for link discovery
          await page.setViewportSize({ width: 1440, height: 900 });

          // Discover internal links
          const links = await page.evaluate((base) => {
            const anchors = document.querySelectorAll("a[href]");
            return Array.from(anchors)
              .map((a) => a.getAttribute("href"))
              .filter((href): href is string => {
                if (!href) return false;
                if (href.startsWith("http") && !href.startsWith(base)) return false;
                if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:"))
                  return false;
                return true;
              })
              .map((href) => (href.startsWith("/") ? `${base}${href}` : href));
          }, baseUrl);

          for (const link of links) {
            if (!visitedUrls.has(link) && link.startsWith(baseUrl)) {
              urlsToVisit.push(link);
            }
          }

          // Check for forms without validation
          const forms = await page.$$("form");
          for (const form of forms) {
            const submitBtn = await form.$('button[type="submit"], input[type="submit"], button:not([type])');
            if (submitBtn) {
              // Try submitting empty form
              try {
                await submitBtn.click();
                await page.waitForTimeout(1000);
                // Check if validation messages appeared
                const validationMessages = await page.evaluate(() => {
                  const invalids = document.querySelectorAll(":invalid, [aria-invalid], .error, .invalid");
                  return invalids.length;
                });
                if (validationMessages === 0) {
                  findings.push({
                    id: generateId("vis"),
                    category: "visual-audit",
                    severity: "warning",
                    title: `Form submits without validation on ${new URL(url).pathname}`,
                    description: "A form can be submitted empty with no validation feedback.",
                    filePath: new URL(url).pathname,
                    recommendation: "Add client-side validation to prevent empty or invalid form submissions.",
                  });
                }
              } catch {
                // Form interaction failed, skip
              }
            }
          }
        } catch (err) {
          findings.push({
            id: generateId("vis"),
            category: "visual-audit",
            severity: "warning",
            title: `Page navigation failed: ${new URL(url).pathname}`,
            description: `Could not navigate to the page: ${(err as Error).message}`,
            filePath: new URL(url).pathname,
            recommendation: "Ensure this page loads correctly and responds within a reasonable time.",
          });
        }
      }

      // Report console errors
      for (const error of consoleErrors.slice(0, 10)) {
        findings.push({
          id: generateId("vis"),
          category: "visual-audit",
          severity: "critical",
          title: "Runtime console error",
          description: error.message.substring(0, 200),
          filePath: new URL(error.url).pathname,
          recommendation: "Fix the JavaScript error causing this console error.",
        });
      }

      // Report network failures
      for (const failure of networkFailures.slice(0, 10)) {
        findings.push({
          id: generateId("vis"),
          category: "visual-audit",
          severity: "warning",
          title: `Failed network request (${failure.status})`,
          description: `Request to ${failure.requestUrl} returned ${failure.status}.`,
          filePath: new URL(failure.url).pathname,
          recommendation: "Fix the API endpoint or handle the error gracefully in the UI.",
        });
      }

      await browser.close();
      browser = null;
    } catch (err) {
      findings.push({
        id: generateId("vis"),
        category: "visual-audit",
        severity: "warning",
        title: "Visual audit encountered an error",
        description: (err as Error).message,
        filePath: "project",
        recommendation: "Check that the project can be started and accessed locally.",
      });
    } finally {
      // Always clean up browser and app process
      if (browser) {
        try { await browser.close(); } catch {}
      }
      if (appProcess) {
        await stopApp(appProcess);
      }
    }

    return findings;
  },
};
