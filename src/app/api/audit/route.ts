import { NextRequest, NextResponse } from "next/server";
import { cloneRepo, cleanupRepo } from "@/lib/clone-repo";
import { runAudit } from "@/lib/run-agents";

// Simple concurrency limit
let activeAudits = 0;
const MAX_CONCURRENT_AUDITS = 3;

function validateGitHubUrl(raw: string): { valid: boolean; error?: string; cleaned?: string } {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  if (parsed.hostname !== "github.com") {
    return { valid: false, error: "Only github.com repositories are supported" };
  }
  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Only HTTPS URLs are supported" };
  }
  if (parsed.username || parsed.password) {
    return { valid: false, error: "URL must not contain credentials" };
  }
  if (parsed.port) {
    return { valid: false, error: "URL must not specify a port" };
  }

  // Path must be /owner/repo (optionally with .git suffix)
  const pathParts = parsed.pathname.split("/").filter(Boolean);
  if (pathParts.length < 2 || pathParts.length > 2) {
    return { valid: false, error: "URL must be https://github.com/owner/repo" };
  }

  const owner = pathParts[0];
  const repo = pathParts[1].replace(/\.git$/, "");

  // Reject anything that looks like a git flag
  if (owner.startsWith("-") || repo.startsWith("-")) {
    return { valid: false, error: "Invalid repository path" };
  }

  // Only allow alphanumeric, hyphens, underscores, dots
  if (!/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(repo)) {
    return { valid: false, error: "Invalid characters in repository path" };
  }

  return { valid: true, cleaned: `https://github.com/${owner}/${repo}.git` };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoUrl } = body;

    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json(
        { error: "repoUrl is required" },
        { status: 400 }
      );
    }

    // Strict URL validation
    const validation = validateGitHubUrl(repoUrl.trim());
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Concurrency limit
    if (activeAudits >= MAX_CONCURRENT_AUDITS) {
      return NextResponse.json(
        { error: "Server is busy. Please try again in a minute." },
        { status: 429 }
      );
    }

    activeAudits++;

    // Clone the repo using the sanitized URL
    const { auditId, repoPath } = await cloneRepo(validation.cleaned!);

    // Start the audit in the background
    runAudit(auditId, repoPath, repoUrl.trim())
      .finally(() => {
        activeAudits--;
        cleanupRepo(repoPath);
      });

    return NextResponse.json({
      id: auditId,
      status: "processing",
    });
  } catch (err) {
    activeAudits = Math.max(0, activeAudits - 1);
    return NextResponse.json(
      { error: `Failed to start audit: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
