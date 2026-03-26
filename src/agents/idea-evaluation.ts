import { AuditAgent } from "./base";
import { Finding } from "@/types/report";
import * as fs from "fs";
import * as path from "path";
import { globSync } from "glob";
import { generateId } from "@/lib/utils";

/**
 * Idea Evaluation Agent
 *
 * Unlike code-scanning agents, this agent analyzes the *product* itself:
 * - Does it have a clear value proposition?
 * - Is the user journey complete?
 * - What features are missing for the target audience?
 * - How does it compare to what users would expect?
 * - Is it production-ready or still prototype-grade?
 */

interface ProductSignals {
  name: string;
  description: string;
  hasAuth: boolean;
  hasDatabase: boolean;
  hasPayments: boolean;
  hasAnalytics: boolean;
  hasSearch: boolean;
  hasI18n: boolean;
  hasDarkMode: boolean;
  hasOnboarding: boolean;
  hasFeedback: boolean;
  hasNotifications: boolean;
  hasRateLimiting: boolean;
  hasCaching: boolean;
  hasLogging: boolean;
  hasMonitoring: boolean;
  hasCI: boolean;
  hasDocker: boolean;
  hasLicense: boolean;
  hasContributing: boolean;
  hasDocs: boolean;
  hasChangelog: boolean;
  routeCount: number;
  componentCount: number;
  apiRouteCount: number;
  testCount: number;
  dependencies: string[];
  scripts: Record<string, string>;
  techStack: string[];
}

function detectProductSignals(repoPath: string): ProductSignals {
  const signals: ProductSignals = {
    name: "",
    description: "",
    hasAuth: false,
    hasDatabase: false,
    hasPayments: false,
    hasAnalytics: false,
    hasSearch: false,
    hasI18n: false,
    hasDarkMode: false,
    hasOnboarding: false,
    hasFeedback: false,
    hasNotifications: false,
    hasRateLimiting: false,
    hasCaching: false,
    hasLogging: false,
    hasMonitoring: false,
    hasCI: false,
    hasDocker: false,
    hasLicense: false,
    hasContributing: false,
    hasDocs: false,
    hasChangelog: false,
    routeCount: 0,
    componentCount: 0,
    apiRouteCount: 0,
    testCount: 0,
    dependencies: [],
    scripts: {},
    techStack: [],
  };

  // Read package.json
  const pkgPath = path.join(repoPath, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    signals.name = pkg.name || "";
    signals.description = pkg.description || "";
    signals.scripts = pkg.scripts || {};
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    signals.dependencies = Object.keys(allDeps);

    // Detect tech stack
    if (allDeps["next"]) signals.techStack.push("Next.js");
    if (allDeps["react"]) signals.techStack.push("React");
    if (allDeps["vue"]) signals.techStack.push("Vue");
    if (allDeps["svelte"] || allDeps["@sveltejs/kit"]) signals.techStack.push("Svelte");
    if (allDeps["express"]) signals.techStack.push("Express");
    if (allDeps["fastify"]) signals.techStack.push("Fastify");
    if (allDeps["tailwindcss"]) signals.techStack.push("Tailwind CSS");
    if (allDeps["prisma"] || allDeps["@prisma/client"]) signals.techStack.push("Prisma");
    if (allDeps["drizzle-orm"]) signals.techStack.push("Drizzle");
    if (allDeps["mongoose"]) signals.techStack.push("MongoDB/Mongoose");
    if (allDeps["stripe"]) signals.techStack.push("Stripe");
    if (allDeps["supabase"] || allDeps["@supabase/supabase-js"]) signals.techStack.push("Supabase");
    if (allDeps["firebase"] || allDeps["firebase-admin"]) signals.techStack.push("Firebase");

    // Feature detection from dependencies
    signals.hasAuth = !!(allDeps["next-auth"] || allDeps["@auth/core"] || allDeps["passport"] || allDeps["@clerk/nextjs"] || allDeps["@supabase/auth-helpers-nextjs"] || allDeps["firebase-admin"]);
    signals.hasDatabase = !!(allDeps["prisma"] || allDeps["@prisma/client"] || allDeps["drizzle-orm"] || allDeps["mongoose"] || allDeps["pg"] || allDeps["mysql2"] || allDeps["better-sqlite3"] || allDeps["@supabase/supabase-js"]);
    signals.hasPayments = !!(allDeps["stripe"] || allDeps["@stripe/stripe-js"] || allDeps["@paypal/react-paypal-js"]);
    signals.hasAnalytics = !!(allDeps["@vercel/analytics"] || allDeps["posthog-js"] || allDeps["@segment/analytics-next"] || allDeps["mixpanel-browser"]);
    signals.hasSearch = !!(allDeps["algoliasearch"] || allDeps["meilisearch"] || allDeps["fuse.js"]);
    signals.hasI18n = !!(allDeps["next-intl"] || allDeps["i18next"] || allDeps["react-i18next"] || allDeps["next-i18next"]);
    signals.hasNotifications = !!(allDeps["@novu/node"] || allDeps["web-push"] || allDeps["firebase-admin"]);
    signals.hasMonitoring = !!(allDeps["@sentry/nextjs"] || allDeps["@sentry/node"] || allDeps["datadog-metrics"]);
  }

  // Scan all source files for signals
  const allFiles = globSync("**/*.{js,jsx,ts,tsx,css,scss}", {
    cwd: repoPath,
    ignore: ["node_modules/**", ".next/**", "dist/**", "build/**"],
  });

  const allContent = allFiles.map((f) => {
    try {
      return fs.readFileSync(path.join(repoPath, f), "utf-8");
    } catch {
      return "";
    }
  }).join("\n");

  // Feature detection from code patterns
  if (!signals.hasAuth) {
    signals.hasAuth = /auth|login|signup|sign.?in|sign.?up|session|getServerSession/i.test(allContent);
  }
  signals.hasDarkMode = /dark.?mode|dark.?theme|theme.?toggle|class.*dark/i.test(allContent);
  signals.hasOnboarding = /onboard|welcome|getting.?started|tutorial|walkthrough/i.test(allContent);
  signals.hasFeedback = /feedback|contact.?us|support|help.?center/i.test(allContent);
  signals.hasRateLimiting = /rate.?limit|throttle|too.?many.?requests|429/i.test(allContent);
  signals.hasCaching = /cache|redis|memcached|stale.?while.?revalidate|revalidate/i.test(allContent);
  signals.hasLogging = /winston|pino|bunyan|logger|log.?level/i.test(allContent);

  // Count structural elements
  signals.routeCount = globSync("**/page.{js,jsx,ts,tsx}", {
    cwd: repoPath,
    ignore: ["node_modules/**"],
  }).length;

  signals.componentCount = globSync("**/components/**/*.{jsx,tsx}", {
    cwd: repoPath,
    ignore: ["node_modules/**"],
  }).length;

  signals.apiRouteCount = globSync("**/api/**/route.{js,ts}", {
    cwd: repoPath,
    ignore: ["node_modules/**"],
  }).length;

  signals.testCount = globSync("**/*.{test,spec}.{js,jsx,ts,tsx}", {
    cwd: repoPath,
    ignore: ["node_modules/**"],
  }).length;

  // File-level checks
  signals.hasCI = globSync(".github/workflows/*.{yml,yaml}", { cwd: repoPath }).length > 0;
  signals.hasDocker = fs.existsSync(path.join(repoPath, "Dockerfile")) || fs.existsSync(path.join(repoPath, "docker-compose.yml"));
  signals.hasLicense = fs.existsSync(path.join(repoPath, "LICENSE")) || fs.existsSync(path.join(repoPath, "LICENSE.md"));
  signals.hasContributing = fs.existsSync(path.join(repoPath, "CONTRIBUTING.md"));
  signals.hasDocs = globSync("docs/**/*", { cwd: repoPath }).length > 0;
  signals.hasChangelog = fs.existsSync(path.join(repoPath, "CHANGELOG.md"));

  return signals;
}

export const ideaEvaluationAgent: AuditAgent = {
  name: "idea-evaluation",
  category: "product-completeness",
  label: "Idea & Product Evaluation",
  icon: "Lightbulb",

  async run(repoPath: string): Promise<Finding[]> {
    const findings: Finding[] = [];
    const signals = detectProductSignals(repoPath);

    // Read README for product context
    let readmeContent = "";
    for (const readme of ["README.md", "readme.md", "README.txt"]) {
      const rp = path.join(repoPath, readme);
      if (fs.existsSync(rp)) {
        readmeContent = fs.readFileSync(rp, "utf-8");
        break;
      }
    }

    // ── PRODUCT MATURITY ASSESSMENT ──

    const maturityScore = [
      signals.hasAuth,
      signals.hasDatabase,
      signals.routeCount > 3,
      signals.componentCount > 5,
      signals.apiRouteCount > 1,
      signals.testCount > 0,
      signals.hasCI,
      signals.hasLogging || signals.hasMonitoring,
      signals.hasRateLimiting,
      readmeContent.length > 500,
    ].filter(Boolean).length;

    const maturityLabel =
      maturityScore >= 8 ? "Production-ready" :
      maturityScore >= 5 ? "Beta-grade" :
      maturityScore >= 3 ? "Prototype" :
      "Proof of concept";

    findings.push({
      id: generateId("idea"),
      category: "product-completeness",
      severity: maturityScore >= 5 ? "info" : "warning",
      title: `Product maturity: ${maturityLabel} (${maturityScore}/10)`,
      description: `Based on ${signals.routeCount} pages, ${signals.componentCount} components, ${signals.apiRouteCount} API routes, and ${signals.testCount} tests. Tech stack: ${signals.techStack.join(", ") || "unknown"}.`,
      filePath: "project",
      recommendation: maturityScore < 5
        ? "Key gaps to address before launch: " + [
            !signals.hasAuth && "authentication",
            !signals.hasDatabase && "persistent data storage",
            signals.testCount === 0 && "test coverage",
            !signals.hasCI && "CI/CD pipeline",
            !signals.hasRateLimiting && "rate limiting",
          ].filter(Boolean).join(", ") + "."
        : "Product has solid foundations. Focus on polish and user feedback loops.",
    });

    // ── MISSING FEATURES SUGGESTIONS ──

    // User management
    if (!signals.hasAuth) {
      findings.push({
        id: generateId("idea"),
        category: "product-completeness",
        severity: "warning",
        title: "Feature gap: No user authentication",
        description: "The app has no login/signup flow. Users can't save state, personalize, or return to their data.",
        filePath: "project",
        recommendation: "Add authentication via NextAuth.js, Clerk, or Supabase Auth. This unlocks: saved preferences, history, sharing, and analytics.",
      });
    }

    // Data persistence
    if (!signals.hasDatabase) {
      findings.push({
        id: generateId("idea"),
        category: "product-completeness",
        severity: "warning",
        title: "Feature gap: No persistent data storage",
        description: "No database detected. User data, generated content, and app state are ephemeral.",
        filePath: "project",
        recommendation: "Add a database (Supabase, PlanetScale, or SQLite via Turso) to persist user data and enable features like history, bookmarks, and sharing.",
      });
    }

    // Monetization
    if (!signals.hasPayments && signals.routeCount > 2) {
      findings.push({
        id: generateId("idea"),
        category: "product-completeness",
        severity: "info",
        title: "Feature opportunity: No monetization layer",
        description: "No payment integration detected. If this is a product (not a tool), consider how it will sustain itself.",
        filePath: "project",
        recommendation: "Consider adding Stripe for subscriptions/one-time payments, or a freemium model with usage limits.",
      });
    }

    // Analytics
    if (!signals.hasAnalytics) {
      findings.push({
        id: generateId("idea"),
        category: "product-completeness",
        severity: "info",
        title: "Feature gap: No analytics",
        description: "No analytics tracking detected. You're flying blind on how users interact with the product.",
        filePath: "project",
        recommendation: "Add PostHog (open source), Vercel Analytics, or Plausible to understand user behavior and feature adoption.",
      });
    }

    // Search
    if (signals.routeCount > 5 && !signals.hasSearch) {
      findings.push({
        id: generateId("idea"),
        category: "product-completeness",
        severity: "info",
        title: "Feature opportunity: No search functionality",
        description: `App has ${signals.routeCount} pages but no search. Users may struggle to find what they need as content grows.`,
        filePath: "project",
        recommendation: "Add search with Fuse.js (client-side, simple) or Algolia/Meilisearch (full-text, scalable).",
      });
    }

    // Dark mode
    if (!signals.hasDarkMode) {
      findings.push({
        id: generateId("idea"),
        category: "product-completeness",
        severity: "info",
        title: "UX enhancement: No dark mode",
        description: "Dark mode is expected by most users, especially developers. Missing it feels incomplete.",
        filePath: "project",
        recommendation: "Add dark mode support via Tailwind's `dark:` variant and a theme toggle component.",
      });
    }

    // Onboarding
    if (!signals.hasOnboarding && signals.routeCount > 3) {
      findings.push({
        id: generateId("idea"),
        category: "product-completeness",
        severity: "info",
        title: "Feature gap: No user onboarding",
        description: "No onboarding flow detected. First-time users may not understand the product's value or how to use it.",
        filePath: "project",
        recommendation: "Add a first-run experience: a tooltip tour, an interactive tutorial, or a guided setup wizard.",
      });
    }

    // Feedback mechanism
    if (!signals.hasFeedback) {
      findings.push({
        id: generateId("idea"),
        category: "product-completeness",
        severity: "info",
        title: "Feature gap: No feedback channel",
        description: "No contact form, feedback widget, or support page detected. Users have no way to report issues or request features.",
        filePath: "project",
        recommendation: "Add a feedback mechanism: a simple contact form, a Canny board, or a GitHub Issues link.",
      });
    }

    // i18n
    if (!signals.hasI18n && signals.routeCount > 5) {
      findings.push({
        id: generateId("idea"),
        category: "product-completeness",
        severity: "info",
        title: "Growth opportunity: No internationalization",
        description: "No i18n support detected. The product is limited to a single language, reducing addressable market.",
        filePath: "project",
        recommendation: "Add i18n with next-intl or react-i18next to support multiple languages.",
      });
    }

    // ── OPERATIONAL READINESS ──

    if (!signals.hasCI) {
      findings.push({
        id: generateId("idea"),
        category: "product-completeness",
        severity: "warning",
        title: "Operations gap: No CI/CD pipeline",
        description: "No GitHub Actions or other CI config found. Deploys are manual and error-prone.",
        filePath: "project",
        recommendation: "Add a GitHub Actions workflow for lint + test + build on every PR. Add automatic deploys to Vercel/Netlify.",
      });
    }

    if (!signals.hasDocker) {
      findings.push({
        id: generateId("idea"),
        category: "product-completeness",
        severity: "info",
        title: "Operations opportunity: No containerization",
        description: "No Dockerfile found. Self-hosting and consistent environments are harder without it.",
        filePath: "project",
        recommendation: "Add a Dockerfile for reproducible builds and easier deployment to any cloud provider.",
      });
    }

    if (!signals.hasMonitoring && signals.routeCount > 3) {
      findings.push({
        id: generateId("idea"),
        category: "product-completeness",
        severity: "warning",
        title: "Operations gap: No error monitoring",
        description: "No Sentry or similar error tracking detected. Production errors will go unnoticed.",
        filePath: "project",
        recommendation: "Add Sentry (@sentry/nextjs) for automatic error capture, stack traces, and alerting.",
      });
    }

    // ── README / PRODUCT COMMUNICATION ──

    if (readmeContent.length < 200) {
      findings.push({
        id: generateId("idea"),
        category: "product-completeness",
        severity: "warning",
        title: "Documentation gap: README is too thin",
        description: `README is only ${readmeContent.length} characters. It should communicate the product's value proposition, setup instructions, and architecture.`,
        filePath: "README.md",
        recommendation: "A strong README needs: what it is (1-liner), why it exists, screenshot/demo, quick start, architecture overview, and contributing guide.",
      });
    } else {
      // Check README quality
      const hasScreenshot = /!\[|screenshot|demo|preview/i.test(readmeContent);
      const hasQuickStart = /quick.?start|getting.?started|install|setup/i.test(readmeContent);
      const hasAPI = /api|endpoint|route/i.test(readmeContent);

      if (!hasScreenshot) {
        findings.push({
          id: generateId("idea"),
          category: "product-completeness",
          severity: "info",
          title: "Documentation: README lacks visual preview",
          description: "No screenshot or demo link in the README. Users decide in 5 seconds whether to try a product.",
          filePath: "README.md",
          recommendation: "Add a hero screenshot or GIF demo at the top of the README.",
        });
      }
    }

    // ── TEST COVERAGE ──

    if (signals.testCount === 0 && signals.componentCount > 3) {
      findings.push({
        id: generateId("idea"),
        category: "product-completeness",
        severity: "warning",
        title: "Quality gap: Zero test coverage",
        description: `${signals.componentCount} components and ${signals.apiRouteCount} API routes with no tests. Regressions will ship unnoticed.`,
        filePath: "project",
        recommendation: "Start with tests for critical paths: API routes, auth flows, and data transformations. Use Vitest for unit tests, Playwright for E2E.",
      });
    } else if (signals.testCount > 0) {
      const ratio = signals.testCount / Math.max(1, signals.routeCount + signals.apiRouteCount);
      if (ratio < 0.5) {
        findings.push({
          id: generateId("idea"),
          category: "product-completeness",
          severity: "info",
          title: `Test coverage is thin: ${signals.testCount} tests for ${signals.routeCount + signals.apiRouteCount} routes`,
          description: "Test-to-route ratio is below 0.5. Critical flows may not be tested.",
          filePath: "project",
          recommendation: "Add tests for the happy path of each page and API route.",
        });
      }
    }

    // ── OPEN SOURCE READINESS ──

    if (!signals.hasLicense) {
      findings.push({
        id: generateId("idea"),
        category: "product-completeness",
        severity: "info",
        title: "Open source gap: No LICENSE file",
        description: "Without a license, others legally cannot use, modify, or distribute the code.",
        filePath: "project",
        recommendation: "Add a LICENSE file (MIT for permissive, Apache 2.0 for patent protection, GPL for copyleft).",
      });
    }

    return findings;
  },
};
