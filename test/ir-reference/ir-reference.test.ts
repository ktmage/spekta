import { describe, it, expect } from "vitest";
import { parseSource } from "../../packages/core/src/core/parser.js";
import { irSchema } from "../../packages/core/src/schema/ir.js";

// [spekta:page] IR リファレンス
// [spekta:summary] IR（Intermediate Representation）は Parser が生成するデータ構造で、Exporter への入力になります。全ての要素は Node として統一されたツリー構造を持ちます。

// [spekta:section] ページ
describe("ページ", () => {
  // [spekta:summary] IR のトップレベル要素です。`[spekta:page]` のテキストが `title` に、SHA256 ハッシュが `id` になります。
  // [spekta:text] 同じページ名は同じ ID を生成するため、複数ファイルからのマージが可能です。

  // [spekta:code] typescript
  // interface Page {
  //   id: string;       // SHA256 ハッシュ
  //   type: "feature";
  //   title: string;    // ページ名（英語スラッグ）
  //   children?: Node[];
  // }
  // [spekta:code:end]

  // [spekta:section] ID は SHA256 ハッシュ
  it("ID は SHA256 ハッシュ", () => {
    const pages = parseSource("t.ts", "// [spekta:page] my-page");
    expect(pages[0].id).toMatch(/^[0-9a-f]{64}$/);
  });

  // [spekta:section] 同じページ名は同じ ID
  it("同じページ名は同じ ID", () => {
    // [spekta:why] ID がページ名から決定的に生成されるため、異なるファイルでも同じページ名なら同じ ID になり、マージの対象になります。
    const pagesA = parseSource("a.ts", "// [spekta:page] same");
    const pagesB = parseSource("b.ts", "// [spekta:page] same");
    expect(pagesA[0].id).toBe(pagesB[0].id);
  });
});

// [spekta:section] Node
describe("Node", () => {
  // [spekta:summary] IR の全要素は Node です。各 Node は `type`（種類）と `id`（SHA256）を持ちます。

  // [spekta:text] リーフ Node（children を持たない）:
  // [spekta:list]
  // [spekta:item] `summary` — 概要テキスト
  // [spekta:item] `why` — 理由の説明
  // [spekta:item] `see` — 関連ページへの参照（ref に対象ページの ID）
  // [spekta:item] `step` — 操作手順の1ステップ
  // [spekta:item] `image` — 画像パス
  // [spekta:item] `graph` — Mermaid ダイアグラム
  // [spekta:item] `text` — 散文テキスト
  // [spekta:item] `code` — コードブロック（language + text）
  // [spekta:item] `callout` — 注意書き（variant: note/warning/tip）
  // [spekta:item] `item` — リスト項目
  // [spekta:list:end]

  // [spekta:text] コンテナ Node（children を持つ）:
  // [spekta:list]
  // [spekta:item] `section` — セクション。children に全種類の Node を持てる
  // [spekta:item] `steps` — 操作手順ブロック。children に step, image, graph を持てる
  // [spekta:item] `list` — 箇条書きリスト。children に item を持てる
  // [spekta:list:end]

  // [spekta:section] 全 Node が ID を持つ
  it("全 Node が ID を持つ", () => {
    const source = [
      "// [spekta:page] p",
      "// [spekta:summary] テスト",
      "// [spekta:section] セクション",
      "  // [spekta:why] 理由",
      "  // [spekta:see] other",
      "  // [spekta:image] img.png",
      "  // [spekta:text] 説明テキスト",
      "  // [spekta:callout] note 注意事項",
    ].join("\n");
    const pages = parseSource("t.ts", source);
    for (const node of pages[0].children ?? []) {
      expect(node.id).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  // [spekta:section] text Node
  it("text Node", () => {
    const source = [
      "// [spekta:page] p",
      "// [spekta:section] s",
      "  // [spekta:text] この機能は検索画面で使用します。",
    ].join("\n");
    const pages = parseSource("t.ts", source);
    const section = pages[0].children?.find(n => n.type === "section") as any;
    const textNode = section.children?.find((n: any) => n.type === "text");
    expect(textNode.text).toBe("この機能は検索画面で使用します。");
  });

  // [spekta:section] code Node
  it("code Node", () => {
    // [spekta:text] `language` フィールドで言語を指定でき、`text` がコード本文になります。言語名は省略可能です。
    const source = [
      "// [spekta:page] p",
      "// [spekta:section] s",
      "  // [spekta:code] typescript",
      "  // const x = 1;",
      "  // console.log(x);",
      "  // [spekta:code:end]",
    ].join("\n");
    const pages = parseSource("t.ts", source);
    const section = pages[0].children?.find(n => n.type === "section") as any;
    const codeNode = section.children?.find((n: any) => n.type === "code");
    expect(codeNode.language).toBe("typescript");
    expect(codeNode.text).toContain("const x = 1;");
  });

  // [spekta:section] callout Node
  it("callout Node", () => {
    // [spekta:text] variant は `note`（情報）、`warning`（警告）、`tip`（ヒント）の 3 種類です。
    const source = [
      "// [spekta:page] p",
      "// [spekta:section] s",
      "  // [spekta:callout] warning この操作は元に戻せません",
    ].join("\n");
    const pages = parseSource("t.ts", source);
    const section = pages[0].children?.find(n => n.type === "section") as any;
    const calloutNode = section.children?.find((n: any) => n.type === "callout");
    expect(calloutNode.variant).toBe("warning");
    expect(calloutNode.text).toBe("この操作は元に戻せません");
  });

  // [spekta:section] list Node と item Node
  it("list Node と item Node", () => {
    // [spekta:text] `list` はコンテナ Node で、`item` を children として持ちます。
    const source = [
      "// [spekta:page] p",
      "// [spekta:section] s",
      "  // [spekta:list]",
      "  // [spekta:item] 項目 1",
      "  // [spekta:item] 項目 2",
      "  // [spekta:item] 項目 3",
      "  // [spekta:list:end]",
    ].join("\n");
    const pages = parseSource("t.ts", source);
    const section = pages[0].children?.find(n => n.type === "section") as any;
    const listNode = section.children?.find((n: any) => n.type === "list");
    expect(listNode.children.length).toBe(3);
    expect(listNode.children[0].type).toBe("item");
    expect(listNode.children[0].text).toBe("項目 1");
  });
});

// [spekta:section] マージ
describe("マージ", () => {
  // [spekta:summary] 複数ファイルで同じ `[spekta:page]` を指定すると、1つのページにマージされます。
  // [spekta:text] セクションも同じパス（ページ名/セクション名/...）なら統合され、子要素が合流します。

  // [spekta:section] 同じページ名は 1 ページにマージされる
  it("同じページ名は 1 ページにマージされる", () => {
    const pagesA = parseSource("a.ts", "// [spekta:page] shared\n// [spekta:section] A");
    const pagesB = parseSource("b.ts", "// [spekta:page] shared\n// [spekta:section] B");
    expect(pagesA[0].id).toBe(pagesB[0].id);
  });
});

// [spekta:section] スキーマバリデーション
describe("スキーマバリデーション", () => {
  // [spekta:summary] IR は Zod スキーマで定義されています。Parser の出力は `irSchema.parse()` で検証できます。
  // [spekta:callout] tip Exporter プラグインを開発する際は、入力される IR が必ずこのスキーマに準拠していることを前提にできます。

  // [spekta:section] Parser の出力はスキーマに準拠する
  it("Parser の出力はスキーマに準拠する", () => {
    const source = [
      "// [spekta:page] p",
      "// [spekta:section] s",
      "  // [spekta:text] テキスト",
      "  // [spekta:callout] note メモ",
      "  // [spekta:code] ts",
      "  // const x = 1;",
      "  // [spekta:code:end]",
      "  // [spekta:list]",
      "  // [spekta:item] a",
      "  // [spekta:list:end]",
    ].join("\n");
    const pages = parseSource("t.ts", source);
    expect(() => irSchema.parse({ version: "1.0.0", pages })).not.toThrow();
  });
});
