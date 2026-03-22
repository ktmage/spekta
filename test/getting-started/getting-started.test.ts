import { describe, it, expect, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

const binPath = path.resolve(import.meta.dirname ?? __dirname, "../../packages/core/bin/spekta.js");
const tempDir = path.resolve(import.meta.dirname ?? __dirname, "../../.tmp-getting-started");

function run(command: string): string {
  return execSync(`node ${binPath} ${command}`, { cwd: tempDir, encoding: "utf-8" });
}

// [spekta:page] はじめに
// [spekta:summary] Spekta はテストコードから仕様書を生成するツールチェインです。テストファイルに `[spekta:*]` コメントを書くだけで、人間が読める仕様書が自動生成されます。このページでは、最初のセットアップからドキュメント生成までの手順を説明します。

// [spekta:section] プロジェクトの初期化
describe("プロジェクトの初期化", () => {
  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // [spekta:summary] `spekta init` コマンドで `.spekta.yml`（設定ファイル）と `.spekta/`（出力ディレクトリ）が生成されます。
  // [spekta:callout] tip 生成された `.spekta.yml` はコメントアウトされた状態なので、プロジェクトに合わせて編集してください。

  // [spekta:section] spekta init の実行
  it("spekta init の実行", () => {
    // [spekta:steps]
    // [spekta:step] プロジェクトディレクトリで `spekta init` を実行する
    fs.mkdirSync(tempDir, { recursive: true });
    run("init");
    // [spekta:step] `.spekta.yml` と `.spekta/` ディレクトリが生成される
    expect(fs.existsSync(path.join(tempDir, ".spekta.yml"))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, ".spekta"))).toBe(true);
    // [spekta:step] 設定ファイルの内容はコメントアウトされている
    const content = fs.readFileSync(path.join(tempDir, ".spekta.yml"), "utf-8");
    expect(content).toContain("# target_dir:");
    // [spekta:steps:end]
  });
});

// [spekta:section] 設定ファイルの編集
describe("設定ファイルの編集", () => {
  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // [spekta:summary] `.spekta.yml` を編集して、テストファイルの場所と使用する Exporter を設定します。
  // [spekta:text] `target_dir` にテストファイルが置かれたディレクトリを、`include` に対象ファイルの拡張子パターンを、`exporter` に使用する Exporter プラグインを指定します。

  // [spekta:code] yaml
  // version: 1
  // target_dir: test/
  // include:
  //   - ".test.ts"
  // exporter:
  //   "@ktmage/spekta-exporter-web":
  //     name: "My Project"
  // [spekta:code:end]

  // [spekta:section] 最小構成の設定例
  it("最小構成の設定例", () => {
    // [spekta:steps]
    // [spekta:step] `.spekta.yml` に `target_dir`, `include`, `exporter` を設定する
    fs.mkdirSync(path.join(tempDir, "test"), { recursive: true });
    fs.writeFileSync(path.join(tempDir, ".spekta.yml"), [
      "version: 1",
      "target_dir: test/",
      "include:",
      '  - ".test.ts"',
      "exporter:",
      '  "@ktmage/spekta-exporter-web":',
      '    name: "My Project"',
    ].join("\n"));
    // [spekta:step] 設定ファイルが正しく読み込まれる
    expect(fs.existsSync(path.join(tempDir, ".spekta.yml"))).toBe(true);
    // [spekta:steps:end]
  });
});

// [spekta:section] テストファイルへのアノテーション
describe("テストファイルへのアノテーション", () => {
  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // [spekta:summary] テストファイルにコメントで `[spekta:*]` アノテーションを追加します。これらのコメントが仕様書の構造になります。
  // [spekta:text] 最低限、`[spekta:page]`（ページ定義）と `[spekta:section]`（セクション定義）を書けば仕様書が生成されます。`[spekta:summary]` で概要を、`[spekta:steps]` で操作手順を追加すると、より充実した仕様書になります。

  // [spekta:code] typescript
  // // [spekta:page] hello
  // // [spekta:summary] はじめての仕様書です。
  // // [spekta:section] Hello World
  // describe("Hello World", () => {
  //   // [spekta:section] 挨拶が表示される
  //   it("挨拶が表示される", () => {});
  // });
  // [spekta:code:end]

  // [spekta:section] アノテーションを書いてドキュメントを生成する
  it("アノテーションを書いてドキュメントを生成する", () => {
    // [spekta:steps]
    // [spekta:step] `.spekta.yml` を作成する
    fs.mkdirSync(path.join(tempDir, "test"), { recursive: true });
    fs.writeFileSync(path.join(tempDir, ".spekta.yml"), [
      "version: 1",
      "target_dir: test/",
      'include: [".test.ts"]',
      "exporter:",
      '  "@ktmage/spekta-exporter-web":',
      '    name: "My Project"',
    ].join("\n"));

    // [spekta:step] テストファイルに `[spekta:page]`, `[spekta:section]`, `[spekta:summary]` を書く
    fs.writeFileSync(path.join(tempDir, "test/hello.test.ts"), [
      '// [spekta:page] hello',
      '// [spekta:summary] はじめての仕様書です。',
      '// [spekta:section] Hello World',
      'describe("Hello World", () => {',
      '  // [spekta:section] 挨拶が表示される',
      '  it("挨拶が表示される", () => {});',
      '});',
    ].join("\n"));

    // [spekta:step] `spekta render` を実行する
    const output = run("render");

    // [spekta:step] `.spekta/web/` に HTML 仕様書が生成される
    expect(output).toContain("1 page(s)");
    expect(fs.existsSync(path.join(tempDir, ".spekta/web/feature/hello/index.html"))).toBe(true);
    // [spekta:steps:end]
  });
});
