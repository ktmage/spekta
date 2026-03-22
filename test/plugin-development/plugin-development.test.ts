import { describe, it, expect } from "vitest";
import { isAnnotatorPlugin, isExporterPlugin } from "../../packages/core/src/core/load-plugin.js";

// [spekta:page] プラグイン開発
// [spekta:summary] Spekta のプラグインシステムについて説明します。Annotator（テスト DSL の解析）と Exporter（ドキュメント出力）の2種類があり、npm パッケージとして独立して開発・配布できます。

// [spekta:section] Annotator プラグイン
describe("Annotator プラグイン", () => {
  // [spekta:summary] テスティングフレームワークの DSL を読んで `[spekta:*]` コメントを自動生成するプラグインです。

  // [spekta:text] 以下のインターフェースを実装した default export を持つ npm パッケージとして公開します。

  // [spekta:code] typescript
  // interface AnnotatorPlugin {
  //   name: string;
  //   filePatterns: string[];
  //   annotate(filePath: string, source: string, config: Record<string, unknown>): Annotation[];
  // }
  // [spekta:code:end]

  // [spekta:list]
  // [spekta:item] `name` — プラグイン名（例: `"rspec"`）
  // [spekta:item] `filePatterns` — 対象ファイルのパターン（例: `["*_spec.rb"]`）
  // [spekta:item] `annotate` — ソースコードを解析して Annotation 配列を返す関数
  // [spekta:list:end]

  // [spekta:section] AnnotatorPlugin インターフェース
  it("AnnotatorPlugin インターフェース", () => {
    // [spekta:steps]
    // [spekta:step] `name`, `filePatterns`, `annotate` を持つオブジェクトを作る
    const validPlugin = {
      name: "my-annotator",
      filePatterns: ["*.test.ts"],
      annotate: () => [],
    };
    // [spekta:step] 型ガードで AnnotatorPlugin として認識される
    expect(isAnnotatorPlugin(validPlugin)).toBe(true);
    // [spekta:steps:end]
  });

  // [spekta:section] 必須フィールドが欠けている場合
  it("必須フィールドが欠けている場合", () => {
    // [spekta:why] プラグインのロード時に型ガードで検証されるため、インターフェースに準拠していないオブジェクトは拒否されます。
    expect(isAnnotatorPlugin({ filePatterns: [], annotate: () => [] })).toBe(false);
    expect(isAnnotatorPlugin({ name: "test", annotate: () => [] })).toBe(false);
    expect(isAnnotatorPlugin({ name: "test", filePatterns: [] })).toBe(false);
  });
});

// [spekta:section] Exporter プラグイン
describe("Exporter プラグイン", () => {
  // [spekta:summary] IR からドキュメントを生成するプラグインです。

  // [spekta:text] 以下のインターフェースを実装した default export を持つ npm パッケージとして公開します。

  // [spekta:code] typescript
  // interface ExporterPlugin {
  //   name: string;
  //   defaultOutputDir: string;
  //   configSchema?: { parse(data: unknown): unknown };
  //   export(ir: IR, config: Record<string, unknown>, outputDir: string): void;
  //   commands?: Record<string, (config: SpektaConfig) => Promise<void>>;
  // }
  // [spekta:code:end]

  // [spekta:list]
  // [spekta:item] `name` — プラグイン名（例: `"web"`）
  // [spekta:item] `defaultOutputDir` — デフォルト出力ディレクトリ名（例: `"web"`）
  // [spekta:item] `export` — IR を受け取りドキュメントを出力する関数
  // [spekta:item] `configSchema` — （オプション）設定値のバリデーション用 Zod スキーマ
  // [spekta:item] `commands` — （オプション）カスタム CLI コマンド（例: `web:dev`）
  // [spekta:list:end]

  // [spekta:callout] tip `commands` を実装すると、`spekta {name}:{command}` の形式でカスタムコマンドを追加できます（例: `spekta web:dev`）。

  // [spekta:section] ExporterPlugin インターフェース
  it("ExporterPlugin インターフェース", () => {
    // [spekta:steps]
    // [spekta:step] `name`, `defaultOutputDir`, `export` を持つオブジェクトを作る
    const validPlugin = {
      name: "my-exporter",
      defaultOutputDir: "my-output",
      export: () => {},
    };
    // [spekta:step] 型ガードで ExporterPlugin として認識される
    expect(isExporterPlugin(validPlugin)).toBe(true);
    // [spekta:steps:end]
  });

  // [spekta:section] commands はオプション
  it("commands はオプション", () => {
    // [spekta:text] `commands` フィールドを省略しても ExporterPlugin として有効です。カスタムコマンドが不要な場合は省略できます。
    expect(isExporterPlugin({ name: "test", defaultOutputDir: "test", export: () => {} })).toBe(true);
  });
});
