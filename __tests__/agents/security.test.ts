import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { securityAgent } from "@/agents/security";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "security-test-"));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

function writeFile(name: string, content: string) {
  const filePath = path.join(tempDir, name);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

describe("security agent", () => {
  it("detects hardcoded API keys", async () => {
    writeFile(
      "config.ts",
      `const API_KEY = "sk-live-1234567890abcdefghijklmn";\nexport default API_KEY;`
    );
    const findings = await securityAgent.run(tempDir);
    const keyFindings = findings.filter((f) => f.title.includes("Stripe secret key"));
    expect(keyFindings.length).toBeGreaterThan(0);
    expect(keyFindings[0].severity).toBe("critical");
  });

  it("detects dangerouslySetInnerHTML", async () => {
    writeFile(
      "Component.tsx",
      `export default function Comp({ html }: { html: string }) {\n  return <div dangerouslySetInnerHTML={{ __html: html }} />;\n}`
    );
    const findings = await securityAgent.run(tempDir);
    const xssFindings = findings.filter((f) => f.title.includes("dangerouslySetInnerHTML"));
    expect(xssFindings.length).toBeGreaterThan(0);
    expect(xssFindings[0].severity).toBe("critical");
  });

  it("detects innerHTML assignments", async () => {
    writeFile(
      "dom.ts",
      `function render(html: string) {\n  document.getElementById("app")!.innerHTML = html;\n}`
    );
    const findings = await securityAgent.run(tempDir);
    const innerHTMLFindings = findings.filter((f) => f.title.includes("innerHTML"));
    expect(innerHTMLFindings.length).toBeGreaterThan(0);
  });

  it("detects eval usage", async () => {
    writeFile("evil.ts", `const result = eval("2 + 2");`);
    const findings = await securityAgent.run(tempDir);
    const evalFindings = findings.filter((f) => f.title.includes("eval"));
    expect(evalFindings.length).toBeGreaterThan(0);
    expect(evalFindings[0].severity).toBe("critical");
  });

  it("detects SQL injection patterns", async () => {
    writeFile(
      "db.ts",
      `function getUser(id: string) {\n  return db.query("SELECT * FROM users WHERE id = " + id);\n}`
    );
    const findings = await securityAgent.run(tempDir);
    const sqlFindings = findings.filter((f) => f.title.includes("SQL injection"));
    expect(sqlFindings.length).toBeGreaterThan(0);
  });

  it("detects committed .env files", async () => {
    writeFile(".env", "DATABASE_URL=postgres://localhost/mydb\nSECRET=supersecret123");
    const findings = await securityAgent.run(tempDir);
    const envFindings = findings.filter((f) => f.title.includes("Environment file"));
    expect(envFindings.length).toBeGreaterThan(0);
  });

  it("ignores .env.example files", async () => {
    writeFile(".env.example", "DATABASE_URL=\nSECRET=");
    const findings = await securityAgent.run(tempDir);
    const envFindings = findings.filter((f) => f.title.includes("Environment file"));
    expect(envFindings.length).toBe(0);
  });

  it("returns no findings for clean code", async () => {
    writeFile(
      "clean.ts",
      `export function add(a: number, b: number): number {\n  return a + b;\n}`
    );
    const findings = await securityAgent.run(tempDir);
    expect(findings.length).toBe(0);
  });
});
