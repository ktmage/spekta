import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

const baseDir = import.meta.dirname ?? __dirname;
const binPath = path.resolve(baseDir, "../packages/cli/bin/spekta.js");

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
 * 生成されたHTMLの中から共通の検証を行うヘルパー。
 */
export function getGeneratedPages(webDir: string): string[] {
  if (!fs.existsSync(webDir)) return [];
  return fs.readdirSync(webDir).filter(e =>
    fs.statSync(path.join(webDir, e)).isDirectory() && e !== "images"
  );
}

export function readPageHtml(webDir: string, pageId: string): string {
  return fs.readFileSync(path.join(webDir, pageId, "index.html"), "utf-8");
}
