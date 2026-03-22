import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

const baseDir = import.meta.dirname ?? __dirname;
const binPath = path.resolve(baseDir, "../packages/core/bin/spekta.js");

export function rspecFixturesDir(): string {
  return path.resolve(baseDir, "fixtures/rspec-project");
}

export function vitestFixturesDir(): string {
  return path.resolve(baseDir, "fixtures/vitest-project");
}

export function runSpektaBuild(projectDir: string): { success: boolean; output: string } {
  try {
    const output = execSync(`node ${binPath} build`, {
      cwd: projectDir,
      encoding: "utf-8",
      timeout: 30000,
    });
    return { success: true, output };
  } catch (err: any) {
    return { success: false, output: err.stdout || err.stderr || err.message };
  }
}

export function isRubyAvailable(): boolean {
  try {
    const version = execSync("ruby --version", { encoding: "utf-8" });
    const match = version.match(/ruby (\d+)\.(\d+)/);
    if (!match) return false;
    return parseInt(match[1]) >= 3 && parseInt(match[2]) >= 3;
  } catch {
    return false;
  }
}

/**
 * Find all page directories (containing index.html) under webDir.
 * Returns relative paths from webDir (e.g. "feature/検索").
 */
export function getGeneratedPages(webDir: string): string[] {
  if (!fs.existsSync(webDir)) return [];
  const pagePaths: string[] = [];
  findIndexHtmlDirs(webDir, webDir, pagePaths);
  return pagePaths;
}

function findIndexHtmlDirs(baseDir: string, currentDir: string, pagePaths: string[]): void {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "images") continue;
    const fullPath = path.join(currentDir, entry.name);
    if (fs.existsSync(path.join(fullPath, "index.html"))) {
      pagePaths.push(path.relative(baseDir, fullPath));
    }
    findIndexHtmlDirs(baseDir, fullPath, pagePaths);
  }
}

export function readPageHtml(webDir: string, pagePath: string): string {
  return fs.readFileSync(path.join(webDir, pagePath, "index.html"), "utf-8");
}
