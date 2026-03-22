import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import * as path from "node:path";
import { rspecFixturesDir } from "./helpers.js";

const context = describe;
const binPath = path.resolve(import.meta.dirname ?? __dirname, "../packages/cli/bin/spekta.js");

function runDoctor(cwd: string): string {
  try {
    return execSync(`node ${binPath} doctor`, {
      encoding: "utf-8",
      cwd,
    });
  } catch (err: any) {
    return err.stdout || err.stderr || "";
  }
}

// [spekta:summary] プロジェクトの環境と設定を診断するコマンド。
describe("spekta doctor", () => {
  it("Node.js のバージョンを表示すること", () => {
    // [spekta:step] spekta doctor を実行する
    const output = runDoctor(process.cwd());
    // [spekta:step] 出力に Node.js バージョン情報が含まれる
    expect(output).toContain("[+] Node.js:");
  });

  context("プロジェクトディレクトリで実行した場合", () => {
    it(".spekta.yml が見つかること", () => {
      // [spekta:step] プロジェクトディレクトリで spekta doctor を実行する
      const output = runDoctor(rspecFixturesDir());
      // [spekta:step] 出力に .spekta.yml: found が含まれる
      expect(output).toContain("[+] .spekta.yml: found");
    });

    it("spec ディレクトリが見つかること", () => {
      // [spekta:step] プロジェクトディレクトリで spekta doctor を実行する
      const output = runDoctor(rspecFixturesDir());
      // [spekta:step] 出力に spec/features パスが含まれる
      expect(output).toContain("spec/features");
    });
  });
});
