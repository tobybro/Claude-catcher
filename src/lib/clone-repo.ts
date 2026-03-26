import simpleGit from "simple-git";
import * as fs from "fs";
import * as path from "path";
import { generateAuditId } from "./utils";

const REPOS_DIR = "/tmp/claude-catcher/repos";

export interface CloneResult {
  auditId: string;
  repoPath: string;
  repoName: string;
}

export async function cloneRepo(repoUrl: string): Promise<CloneResult> {
  const auditId = generateAuditId();
  const repoPath = path.join(REPOS_DIR, auditId);

  // Ensure the repos directory exists
  fs.mkdirSync(REPOS_DIR, { recursive: true });

  const git = simpleGit();

  try {
    await git.clone(repoUrl, repoPath, ["--depth", "1", "--single-branch"]);
  } catch (err) {
    throw new Error(`Failed to clone repository: ${(err as Error).message}`);
  }

  // Extract repo name from the cloned directory
  const repoName = repoUrl.split("/").filter(Boolean).pop()?.replace(".git", "") || "unknown";

  return { auditId, repoPath, repoName };
}

export async function cleanupRepo(repoPath: string): Promise<void> {
  try {
    fs.rmSync(repoPath, { recursive: true, force: true });
  } catch {
    // Best effort cleanup
  }
}
