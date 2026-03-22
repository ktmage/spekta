import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import * as path from "node:path";
import { rspecFixturesDir } from "./helpers.js";

const context = describe;
const binPath = path.resolve(import.meta.dirname ?? __dirname, "../packages/core/bin/spekta.js");

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

// [spekta:page] spekta doctor
// [spekta:summary] プロジェクトの環境と設定を診断するコマンド。
describe("spekta doctor", () => {
  // [spekta:section] Node.js のバージョンを表示すること
  it("Node.js のバージョンを表示すること", () => {
    // [spekta:step] spekta doctor を実行する
    const output = runDoctor(process.cwd());
    // [spekta:step] 出力に Node.js バージョン情報が含まれる
    expect(output).toContain("[+] Node.js:");
  });

  // [spekta:section] プロジェクトディレクトリで実行した場合
  context("プロジェクトディレクトリで実行した場合", () => {
    // [spekta:section] .spekta.yml が見つかること
    it(".spekta.yml が見つかること", () => {
      // [spekta:step] プロジェクトディレクトリで spekta doctor を実行する
      const output = runDoctor(rspecFixturesDir());
      // [spekta:step] 出力に .spekta.yml: found が含まれる
      expect(output).toContain("[+] .spekta.yml: found");
    });

    // [spekta:section] target_dir が見つかること
    it("target_dir が見つかること", () => {
      // [spekta:step] プロジェクトディレクトリで spekta doctor を実行する
      const output = runDoctor(rspecFixturesDir());
      // [spekta:step] 出力に target_dir のパスが含まれる
      expect(output).toContain("[+] target_dir:");
    });
  });
});
