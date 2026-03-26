import { NextRequest, NextResponse } from "next/server";
import { cloneRepo, cleanupRepo } from "@/lib/clone-repo";
import { runAudit } from "@/lib/run-agents";

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

    // Basic URL validation
    if (!repoUrl.startsWith("https://github.com/") && !repoUrl.startsWith("http://github.com/")) {
      return NextResponse.json(
        { error: "Only public GitHub repository URLs are supported" },
        { status: 400 }
      );
    }

    // Clone the repo
    const { auditId, repoPath } = await cloneRepo(repoUrl);

    // Start the audit in the background
    runAudit(auditId, repoPath, repoUrl)
      .finally(() => cleanupRepo(repoPath));

    return NextResponse.json({
      id: auditId,
      status: "processing",
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to start audit: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
