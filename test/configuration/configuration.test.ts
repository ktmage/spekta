import { describe, it, expect } from "vitest";
import { spektaConfigSchema } from "../../packages/core/src/schema/config.js";

// [spekta:page] 設定リファレンス
// [spekta:summary] `.spekta.yml` の設定リファレンスです。プロジェクトルートに配置し、対象ディレクトリ、プラグイン、出力形式を設定します。

// [spekta:code] yaml
// version: 1
// target_dir: test/
// include:
//   - ".test.ts"
// exclude:
//   - "fixtures/"
// annotator:
//   "@ktmage/spekta-annotator-rspec":
// exporter:
//   "@ktmage/spekta-exporter-web":
//     name: "My Project"
//     description: "プロジェクトの説明"
// [spekta:code:end]

// [spekta:text] 必須フィールドは `version`、`target_dir`、`exporter` の3つです。`include`、`exclude`、`annotator` は省略できます。

// [spekta:section] version
describe("version", () => {
  // [spekta:summary] 設定ファイルのバージョン番号です。現在は `1` を指定します。
  // [spekta:why] 将来のスキーマ変更時に互換性を判断するために使われます。

  // [spekta:section] 必須フィールド
  it("必須フィールド", () => {
    expect(() => spektaConfigSchema.parse({ target_dir: "test/", exporter: {} })).toThrow();
  });
});

// [spekta:section] target_dir
describe("target_dir", () => {
  // [spekta:summary] テストファイルが配置されたディレクトリのパスです。Parser と Annotator はこのディレクトリ配下のファイルを対象にします。

  // [spekta:section] 必須フィールド
  it("必須フィールド", () => {
    expect(() => spektaConfigSchema.parse({ version: 1, exporter: {} })).toThrow();
  });
});

// [spekta:section] include / exclude
describe("include / exclude", () => {
  // [spekta:summary] 対象ファイルのフィルタリング設定です。
  // [spekta:list]
  // [spekta:item] `include` — 対象ファイルの拡張子パターンの配列（例: `[".test.ts"]`）。省略すると全ファイルがスキャンされる
  // [spekta:item] `exclude` — 除外パターンの配列（例: `["fixtures/"]`）。パスに含まれる文字列でマッチする
  // [spekta:list:end]

  // [spekta:section] 省略可能
  it("省略可能", () => {
    const config = spektaConfigSchema.parse({ version: 1, target_dir: "test/", exporter: {} });
    expect(config.include).toBeUndefined();
    expect(config.exclude).toBeUndefined();
  });
});

// [spekta:section] exporter
describe("exporter", () => {
  // [spekta:summary] 使用する Exporter プラグインを設定します。必須フィールドです。キーはパッケージ名、値はプラグイン固有の設定です。

  // [spekta:code] yaml
  // exporter:
  //   "@ktmage/spekta-exporter-web":
  //     name: "My Project"
  //   "@ktmage/spekta-exporter-markdown":
  // [spekta:code:end]

  // [spekta:section] 必須フィールド
  it("必須フィールド", () => {
    expect(() => spektaConfigSchema.parse({ version: 1, target_dir: "test/" })).toThrow();
  });

  // [spekta:section] パッケージ名の命名規則
  it("パッケージ名の命名規則", () => {
    // [spekta:why] 命名規則を統一することで、プラグインコマンド（`spekta web:dev` 等）の短縮名を自動導出できます。
    // [spekta:text] パッケージ名は `@{scope}/spekta-exporter-{name}` 形式に従う必要があります。
    // [spekta:steps]
    // [spekta:step] `@{scope}/spekta-exporter-{name}` 形式のパッケージ名は受け入れられる
    const config = spektaConfigSchema.parse({
      version: 1, target_dir: "test/",
      exporter: { "@ktmage/spekta-exporter-web": { name: "test" } },
    });
    expect(config.exporter).toBeDefined();
    // [spekta:step] 規則に従わないパッケージ名はバリデーションエラーになる
    expect(() => spektaConfigSchema.parse({
      version: 1, target_dir: "test/",
      exporter: { "invalid-name": null },
    })).toThrow();
    // [spekta:steps:end]
  });
});

// [spekta:section] annotator
describe("annotator", () => {
  // [spekta:summary] Annotator プラグインを設定します。省略可能です。手書きでアノテーションを書く場合は不要です。
  // [spekta:text] パッケージ名は `@{scope}/spekta-annotator-{name}` 形式に従います。
  // [spekta:callout] tip Annotator は `spekta annotate` コマンドで実行されます。`spekta build` は Annotator + Render を連続実行します。

  // [spekta:code] yaml
  // annotator:
  //   "@ktmage/spekta-annotator-rspec":
  //     page_from: filename
  // [spekta:code:end]

  // [spekta:section] 省略可能
  it("省略可能", () => {
    const config = spektaConfigSchema.parse({ version: 1, target_dir: "test/", exporter: {} });
    expect(config.annotator).toBeUndefined();
  });
});
