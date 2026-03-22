import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

const binPath = path.resolve(import.meta.dirname ?? __dirname, "../../packages/core/bin/spekta.js");

// [spekta:page] cli
// [spekta:section] spekta init
// [spekta:summary] プロジェクトの初期設定ファイルを生成するコマンド。
describe("spekta init", () => {
  const tempDir = path.resolve(import.meta.dirname ?? __dirname, "../../.tmp-init-test");

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // [spekta:section] .spekta.yml が存在しない場合
  describe(".spekta.yml が存在しない場合", () => {
    // [spekta:section] .spekta.yml と .spekta/ が生成されること
    it(".spekta.yml と .spekta/ が生成されること", () => {
      // [spekta:steps]
      // [spekta:step] 空のディレクトリで spekta init を実行する
      fs.mkdirSync(tempDir, { recursive: true });
      const output = execSync(`node ${binPath} init`, { cwd: tempDir, encoding: "utf-8" });
      // [spekta:step] .spekta.yml が生成される
      expect(fs.existsSync(path.join(tempDir, ".spekta.yml"))).toBe(true);
      // [spekta:step] .spekta/ ディレクトリが生成される
      expect(fs.existsSync(path.join(tempDir, ".spekta"))).toBe(true);
      // [spekta:step] 完了メッセージが出力される
      expect(output).toContain("Created");
      // [spekta:steps:end]
    });

    // [spekta:section] 生成された .spekta.yml がコメントアウトされていること
    it("生成された .spekta.yml がコメントアウトされていること", () => {
      // [spekta:steps]
      // [spekta:step] spekta init を実行する
      fs.mkdirSync(tempDir, { recursive: true });
      execSync(`node ${binPath} init`, { cwd: tempDir, encoding: "utf-8" });
      // [spekta:step] .spekta.yml の内容がコメントアウトされている
      const content = fs.readFileSync(path.join(tempDir, ".spekta.yml"), "utf-8");
      expect(content).toContain("# target_dir:");
      expect(content).toContain("# exporter:");
      // [spekta:steps:end]
    });
  });

  // [spekta:section] .spekta.yml が既に存在する場合
  describe(".spekta.yml が既に存在する場合", () => {
    // [spekta:section] エラーで終了すること
    it("エラーで終了すること", () => {
      // [spekta:steps]
      // [spekta:step] .spekta.yml が存在するディレクトリで spekta init を実行する
      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, ".spekta.yml"), "existing");
      // [spekta:step] エラーメッセージが出力される
      try {
        execSync(`node ${binPath} init`, { cwd: tempDir, encoding: "utf-8", stdio: "pipe" });
        expect.unreachable();
      } catch (initError: any) {
        expect(initError.stderr.toString()).toContain("already exists");
      }
      // [spekta:steps:end]
    });
  });
});
