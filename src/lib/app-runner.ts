import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export interface AppProcess {
  process: ChildProcess;
  port: number;
  repoPath: string;
}

function detectPort(scripts: Record<string, string>): number {
  // Try to find port in scripts
  for (const script of Object.values(scripts)) {
    const portMatch = script.match(/-p\s+(\d+)|--port\s+(\d+)|PORT=(\d+)/);
    if (portMatch) {
      return parseInt(portMatch[1] || portMatch[2] || portMatch[3]);
    }
  }
  // Default port for common frameworks
  return 3000;
}

function detectDevCommand(scripts: Record<string, string>): string | null {
  if (scripts.dev) return "dev";
  if (scripts.start) return "start";
  if (scripts.serve) return "serve";
  return null;
}

async function waitForServer(port: number, timeoutMs: number = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`http://localhost:${port}`, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok || response.status < 500) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

export async function startApp(repoPath: string): Promise<AppProcess | null> {
  const pkgPath = path.join(repoPath, "package.json");
  if (!fs.existsSync(pkgPath)) return null;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const scripts = pkg.scripts || {};
  const devCommand = detectDevCommand(scripts);
  if (!devCommand) return null;

  const port = detectPort(scripts);

  // Install dependencies first
  try {
    const lockFile = fs.existsSync(path.join(repoPath, "yarn.lock"))
      ? "yarn"
      : fs.existsSync(path.join(repoPath, "pnpm-lock.yaml"))
      ? "pnpm"
      : "npm";

    const installCmd = lockFile === "yarn" ? "yarn install" : lockFile === "pnpm" ? "pnpm install" : "npm install";
    execSync(installCmd, {
      cwd: repoPath,
      timeout: 60000,
      stdio: "pipe",
    });
  } catch {
    // If install fails, try to continue anyway (might have pre-installed deps)
  }

  // Start the dev server
  const child = spawn("npm", ["run", devCommand], {
    cwd: repoPath,
    stdio: "pipe",
    env: { ...process.env, PORT: String(port), BROWSER: "none" },
    detached: true,
  });

  // Wait for the server to be ready
  const isReady = await waitForServer(port);
  if (!isReady) {
    child.kill("SIGTERM");
    return null;
  }

  return { process: child, port, repoPath };
}

export async function stopApp(app: AppProcess): Promise<void> {
  try {
    if (app.process.pid) {
      // Kill the process group to clean up all child processes
      process.kill(-app.process.pid, "SIGTERM");
    }
  } catch {
    // Best effort cleanup
    try {
      app.process.kill("SIGKILL");
    } catch {
      // Process already dead
    }
  }
}
