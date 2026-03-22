import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { rspecFixturesDir, isRubyAvailable } from "../helpers.js";

const binPath = path.resolve(import.meta.dirname ?? __dirname, "../../packages/core/bin/spekta.js");

// [spekta:page] cli
// [spekta:section] spekta annotate
// [spekta:summary] Annotator プラグインを実行してテストファイルに [spekta:*] コメントを自動追加するコマンド。
describe("spekta annotate", () => {
  // [spekta:section] annotator が設定されていない場合
  describe("annotator が設定されていない場合", () => {
    // [spekta:section] 何も処理されずに終了すること
    it("何も処理されずに終了すること", () => {
      // [spekta:steps]
      // [spekta:step] annotator 設定のない fixture で spekta annotate を実行する
      const tempDir = path.resolve(import.meta.dirname ?? __dirname, "../../.tmp-annotate-test");
      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, ".spekta.yml"), "version: 1\ntarget_dir: .\nexporter:\n  \"@ktmage/spekta-exporter-web\":\n    name: test\n");
      try {
        const output = execSync(`node ${binPath} annotate`, { cwd: tempDir, encoding: "utf-8" });
        // [spekta:step] エラーなく完了する
        expect(output).not.toContain("Failed");
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      // [spekta:steps:end]
    });
  });
});
