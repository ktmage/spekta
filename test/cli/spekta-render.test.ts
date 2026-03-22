import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { vitestFixturesDir, getGeneratedPages, readPageHtml } from "../helpers.js";

const binPath = path.resolve(import.meta.dirname ?? __dirname, "../../packages/core/bin/spekta.js");

// [spekta:page] CLI コマンド
// [spekta:section] spekta render
// [spekta:summary] テストファイルの [spekta:*] コメントを読み取ってドキュメントを生成するコマンド。
describe("spekta render", () => {
  const projectDir = vitestFixturesDir();
  const webDir = path.join(projectDir, ".spekta/web");
  const mdDir = path.join(projectDir, ".spekta/markdown");

  beforeAll(() => {
    fs.rmSync(path.join(projectDir, ".spekta"), { recursive: true, force: true });
    execSync(`node ${binPath} render`, { cwd: projectDir, encoding: "utf-8" });
  });

  afterAll(() => {
    fs.rmSync(path.join(projectDir, ".spekta"), { recursive: true, force: true });
  });

  // [spekta:section] Web Exporter の場合
  describe("Web Exporter の場合", () => {
    // [spekta:section] /{pageType}/{pageTitle}/ のディレクトリ構造で HTML が生成されること
    it("/{pageType}/{pageTitle}/ のディレクトリ構造で HTML が生成されること", () => {
      // [spekta:steps]
      // [spekta:step] .spekta/web/ 配下にページディレクトリが存在する
      const pages = getGeneratedPages(webDir);
      expect(pages.length).toBeGreaterThan(0);
      // [spekta:step] 各ページに index.html が含まれる
      for (const page of pages) {
        expect(fs.existsSync(path.join(webDir, page, "index.html"))).toBe(true);
      }
      // [spekta:steps:end]
    });

    // [spekta:section] index.html がリダイレクトすること
    it("index.html がリダイレクトすること", () => {
      // [spekta:steps]
      // [spekta:step] ルートの index.html を読み込む
      const html = fs.readFileSync(path.join(webDir, "index.html"), "utf-8");
      // [spekta:step] meta refresh によるリダイレクトが設定されている
      expect(html).toContain("http-equiv=\"refresh\"");
      // [spekta:steps:end]
    });

    // [spekta:section] HTML にページタイトルが含まれること
    it("HTML にページタイトルが含まれること", () => {
      // [spekta:steps]
      // [spekta:step] 生成された HTML を読み込む
      const pages = getGeneratedPages(webDir);
      const html = readPageHtml(webDir, pages[0]);
      // [spekta:step] タイトル要素が存在する
      expect(html).toContain("spec-content__title");
      // [spekta:steps:end]
    });
  });

  // [spekta:section] Markdown Exporter の場合
  describe("Markdown Exporter の場合", () => {
    // [spekta:section] .md ファイルが生成されること
    it(".md ファイルが生成されること", () => {
      // [spekta:steps]
      // [spekta:step] .spekta/markdown/ 配下のファイルを確認する
      const files = fs.readdirSync(mdDir).filter((f: string) => f.endsWith(".md"));
      // [spekta:step] .md ファイルが 1 つ以上存在する
      expect(files.length).toBeGreaterThan(0);
      // [spekta:steps:end]
    });

    // [spekta:section] Markdown にページタイトルが h1 として含まれること
    it("Markdown にページタイトルが h1 として含まれること", () => {
      // [spekta:steps]
      // [spekta:step] 生成された Markdown を読み込む
      const files = fs.readdirSync(mdDir).filter((f: string) => f.endsWith(".md"));
      const md = fs.readFileSync(path.join(mdDir, files[0]), "utf-8");
      // [spekta:step] h1 見出しが存在する
      expect(md).toMatch(/^# .+/m);
      // [spekta:steps:end]
    });
  });
});
