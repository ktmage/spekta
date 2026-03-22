import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import * as path from "node:path";
import { vitestFixturesDir } from "../helpers.js";

const binPath = path.resolve(import.meta.dirname ?? __dirname, "../../packages/core/bin/spekta.js");

function runCheck(cwd: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`node ${binPath} check`, { cwd, encoding: "utf-8", stdio: "pipe" });
    return { stdout, exitCode: 0 };
  } catch (checkError: any) {
    return { stdout: checkError.stdout ?? "", exitCode: checkError.status ?? 1 };
  }
}

// [spekta:page] CLI コマンド
// [spekta:section] spekta check
// [spekta:summary] テストファイルの [spekta:*] アノテーションを構文チェックするコマンド。
describe("spekta check", () => {
  // [spekta:section] 正しいアノテーションの場合
  describe("正しいアノテーションの場合", () => {
    // [spekta:section] 全ファイルが passed になること
    it("全ファイルが passed になること", () => {
      // [spekta:steps]
      // [spekta:step] vitest fixture で spekta check を実行する
      const { stdout, exitCode } = runCheck(vitestFixturesDir());
      // [spekta:step] 終了コードが 0 である
      expect(exitCode).toBe(0);
      // [spekta:step] passed と表示される
      expect(stdout).toContain("passed");
      // [spekta:steps:end]
    });

    // [spekta:section] ページ数とセクション数が表示されること
    it("ページ数とセクション数が表示されること", () => {
      // [spekta:steps]
      // [spekta:step] vitest fixture で spekta check を実行する
      const { stdout } = runCheck(vitestFixturesDir());
      // [spekta:step] page と section の数が表示される
      expect(stdout).toContain("page");
      expect(stdout).toContain("section");
      // [spekta:steps:end]
    });
  });
});
