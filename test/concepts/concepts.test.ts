import { describe, it, expect } from "vitest";
import { parseSource } from "../../packages/core/src/core/parser.js";

// [spekta:page] コンセプト
// [spekta:summary] Spekta の設計思想と、テストコードから仕様書が生成されるまでの仕組みを説明します。

// [spekta:section] テストファイルが仕様書である
describe("テストファイルが仕様書である", () => {
  // [spekta:summary] テストは実行可能で、正しいかどうか検証可能です。Spekta はテストファイルに書かれた `[spekta:*]` コメントを仕様書の構造として読み取ります。
  // [spekta:text] テストコード自体は読みませんが、コメントで記述された仕様は常にテストと同じファイルに存在するため、乖離が起きにくくなっています。
  // [spekta:callout] note コメントの記法は言語に依存します。TypeScript では `//`、Ruby や Python では `#` を使います。

  // [spekta:list]
  // [spekta:item] TypeScript: `// [spekta:*]`
  // [spekta:item] Ruby: `# [spekta:*]`
  // [spekta:item] Python: `# [spekta:*]`
  // [spekta:list:end]

  // [spekta:section] コメントから仕様書の構造を読み取る
  it("コメントから仕様書の構造を読み取る", () => {
    // [spekta:steps]
    // [spekta:step] テストファイルに `[spekta:page]`, `[spekta:summary]`, `[spekta:section]` を書く
    const source = [
      '// [spekta:page] my-feature',
      '// [spekta:summary] 機能の概要',
      '// [spekta:section] 機能名',
    ].join("\n");
    // [spekta:step] Parser がコメントから IR（中間表現）を生成する
    const pages = parseSource("test.ts", source);
    // [spekta:step] ページ、概要、セクションが構造化されて出力される
    expect(pages.length).toBe(1);
    expect(pages[0].title).toBe("my-feature");
    expect(pages[0].children?.find(n => n.type === "summary")).toBeDefined();
    // [spekta:steps:end]
  });
});

// [spekta:section] Annotator → Parser → Exporter
describe("Annotator → Parser → Exporter", () => {
  // [spekta:summary] Spekta は3つのステージで仕様書を生成します。
  // [spekta:text] **Annotator** はテスティングフレームワークの DSL を読んで `[spekta:*]` コメントを自動補完します（省略可能）。**Parser** はコメントだけを読んで IR に変換します。**Exporter** は IR からドキュメント（HTML, Markdown 等）を出力します。

  // [spekta:code]
  // テストファイル (.test.ts, _spec.rb)
  //   ↓ Annotator（省略可能）
  // [spekta:*] コメント付きテストファイル
  //   ↓ Parser
  // IR（中間表現 / JSON）
  //   ↓ Exporter
  // HTML / Markdown / PDF
  // [spekta:code:end]

  // [spekta:section] Parser はテストコードの構文を理解しない
  it("Parser はテストコードの構文を理解しない", () => {
    // [spekta:why] Parser がフレームワーク固有の構文に依存しないことで、どの言語・フレームワークのテストでも同じ Parser が使えます。
    // [spekta:steps]
    // [spekta:step] `describe` や `it` などのテストコードが含まれるファイルを渡す
    const source = [
      '// [spekta:page] test-page',
      '// [spekta:section] セクション',
      'describe("テスト", () => {',
      '  it("何かをテストする", () => {});',
      '});',
      '// 普通のコメント',
    ].join("\n");
    // [spekta:step] Parser は `[spekta:*]` コメントだけを読み、他は無視する
    const pages = parseSource("test.ts", source);
    const sectionNodes = pages[0].children?.filter(n => n.type === "section") ?? [];
    expect(sectionNodes.length).toBe(1);
    // [spekta:steps:end]
  });

  // [spekta:section] 複数ファイルから1つのページを生成する（マージ）
  it("複数ファイルから1つのページを生成する（マージ）", () => {
    // [spekta:why] 大きな機能を複数のテストファイルに分けて書いても、同じ `[spekta:page]` を指定すれば1つの仕様書ページにまとめられます。
    // [spekta:steps]
    // [spekta:step] 2つのファイルに同じ `[spekta:page]` を書く
    const sourceA = '// [spekta:page] shared\n// [spekta:section] セクションA';
    const sourceB = '// [spekta:page] shared\n// [spekta:section] セクションB';
    const pagesA = parseSource("a.ts", sourceA);
    const pagesB = parseSource("b.ts", sourceB);
    // [spekta:step] 同じページ名からは同じ ID が生成され、マージの対象になる
    expect(pagesA[0].id).toBe(pagesB[0].id);
    // [spekta:steps:end]
  });
});
