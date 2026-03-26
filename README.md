# Claude Catcher

AI-powered code audit tool for projects built with Claude Code. Paste a GitHub repo URL, get an instant health report.

## What it checks

| Agent | What it finds |
|-------|--------------|
| **Code Quality** | Syntax errors, unused imports, dead code, deeply nested logic, TODO/FIXME comments |
| **UX Audit** | Missing alt text, unlabeled inputs, no responsive design, broken links, missing page titles |
| **Bug Detection** | Unhandled promises, async useEffect, missing list keys, loose equality, no error cleanup |
| **Security** | Hardcoded secrets, XSS vectors (innerHTML, eval), SQL injection, exposed .env files |
| **Product Completeness** | Missing loading/error/empty states, no 404 page, no form validation, no error boundary |
| **Performance** | Heavy dependencies, large images, no code splitting, missing meta tags |
| **Visual & Flow Audit** | Playwright-powered: runtime errors, blank pages, broken layouts, responsive overflow, form validation |

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000, paste a GitHub repo URL, and hit "Run Audit".

## Tech stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Playwright** for visual/flow testing
- **Server-Sent Events** for real-time progress
- **Vitest** for testing

## Running tests

```bash
npm test
```

## How it works

1. You paste a public GitHub repo URL
2. The backend clones it (shallow, `--depth 1`)
3. Seven audit agents run sequentially, each scanning for different issues
4. Real-time progress streams to the browser via SSE
5. A scored report is generated with actionable fix recommendations
6. The visual audit agent optionally starts the app's dev server and crawls it with Playwright

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/audit` | Start an audit. Body: `{ "repoUrl": "https://github.com/..." }` |
| GET | `/api/audit-stream?id=xxx` | SSE stream of agent progress |
| GET | `/api/report/[id]` | Fetch the completed audit report JSON |
