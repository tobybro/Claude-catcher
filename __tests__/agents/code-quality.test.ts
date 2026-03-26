import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { codeQualityAgent } from "@/agents/code-quality";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codequality-test-"));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

function writeFile(name: string, content: string) {
  const filePath = path.join(tempDir, name);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

describe("code quality agent", () => {
  it("detects console.log statements", async () => {
    writeFile(
      "app.ts",
      `function greet(name: string) {\n  console.log("Hello", name);\n  return name;\n}`
    );
    const findings = await codeQualityAgent.run(tempDir);
    const consoleLogs = findings.filter((f) => f.title.includes("console.log"));
    expect(consoleLogs.length).toBeGreaterThan(0);
    expect(consoleLogs[0].severity).toBe("info");
  });

  it("ignores console.log in test files", async () => {
    writeFile(
      "app.test.ts",
      `console.log("test output");`
    );
    const findings = await codeQualityAgent.run(tempDir);
    const consoleLogs = findings.filter((f) => f.title.includes("console.log"));
    expect(consoleLogs.length).toBe(0);
  });

  it("detects TODO comments", async () => {
    writeFile(
      "utils.ts",
      `// TODO: fix this later\nfunction broken() { return null; }`
    );
    const findings = await codeQualityAgent.run(tempDir);
    const todos = findings.filter((f) => f.title.includes("TODO"));
    expect(todos.length).toBeGreaterThan(0);
  });

  it("detects FIXME comments", async () => {
    writeFile(
      "utils.ts",
      `// FIXME: memory leak here\nfunction leaky() { return []; }`
    );
    const findings = await codeQualityAgent.run(tempDir);
    const fixmes = findings.filter((f) => f.title.includes("FIXME"));
    expect(fixmes.length).toBeGreaterThan(0);
  });

  it("detects very long files", async () => {
    const lines = Array(600).fill("const x = 1;").join("\n");
    writeFile("huge.ts", lines);
    const findings = await codeQualityAgent.run(tempDir);
    const longFiles = findings.filter((f) => f.title.includes("very long"));
    expect(longFiles.length).toBeGreaterThan(0);
  });

  it("returns no findings for clean code", async () => {
    writeFile(
      "clean.ts",
      `export function add(a: number, b: number): number {\n  return a + b;\n}`
    );
    const findings = await codeQualityAgent.run(tempDir);
    // May have dead file finding, but no quality issues
    const qualityIssues = findings.filter(
      (f) => !f.title.includes("unused file") && !f.title.includes("Potentially")
    );
    expect(qualityIssues.length).toBe(0);
  });
});
