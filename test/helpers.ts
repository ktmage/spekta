import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

/**
 * テスト用フィクスチャのディレクトリパスを返す。
 * コピーせず直接参照する（Gemfileの相対パスを壊さないため）。
 */
export function fixturesDir(): string {
  return path.resolve(import.meta.dirname ?? __dirname, "fixtures/rspec-project");
}

/**
 * テストプロジェクトで spekta build を実行する。
 */
export function runSpektaBuild(projectDir: string): { success: boolean; output: string } {
  const binPath = path.resolve(import.meta.dirname ?? __dirname, "../packages/cli/bin/spekta.js");
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

/**
 * Ruby 3.3+ が利用可能かチェック。
 */
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
