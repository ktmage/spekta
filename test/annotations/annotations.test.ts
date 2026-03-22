import { describe, it, expect } from "vitest";
import { parseSource } from "../../packages/core/src/core/parser.js";
import type { SectionNode } from "../../packages/core/src/schema/ir.js";

// [spekta:page] アノテーション一覧
// [spekta:summary] テストファイルに書ける `[spekta:*]` コメントの一覧です。これらのコメントが仕様書の構造とコンテンツになります。
// [spekta:text] コメントは `//`（TypeScript）または `#`（Ruby/Python）で始めます。インデントの深さがセクションのネスト構造を決定します。

// [spekta:section] [spekta:page] — ページの定義
describe("[spekta:page]", () => {
  // [spekta:summary] 仕様書の1ページを定義します。値は英語のスラッグで、URL のパスに使われます。

  // [spekta:code] typescript
  // // [spekta:page] company-search
  // [spekta:code:end]

  // [spekta:text] 1ファイルに1つが基本ですが、複数書くこともできます。同じページ名を複数ファイルに書くと、1ページにマージされます。

  // [spekta:section] 基本的な使い方
  it("基本的な使い方", () => {
    // [spekta:steps]
    // [spekta:step] `// [spekta:page] my-feature` と書く
    const pages = parseSource("t.ts", '// [spekta:page] my-feature');
    // [spekta:step] ページ名 `my-feature` のページが生成される
    expect(pages[0].title).toBe("my-feature");
    // [spekta:steps:end]
  });
});

// [spekta:section] [spekta:section] — セクションの定義
describe("[spekta:section]", () => {
  // [spekta:summary] 仕様書のセクション（見出し）を定義します。テストの `describe` や `context` に対応します。

  // [spekta:code] typescript
  // // [spekta:section] 親セクション
  // describe("親セクション", () => {
  //   // [spekta:section] 子セクション
  //   it("子セクション", () => {});
  // });
  // [spekta:code:end]

  // [spekta:callout] tip インデントの深さでネスト構造が決まります。テストコードのインデントと合わせると、コードの構造がそのまま仕様書の階層になります。

  // [spekta:section] セクションの作成
  it("セクションの作成", () => {
    // [spekta:steps]
    // [spekta:step] `// [spekta:section] セクション名` と書く
    const pages = parseSource("t.ts", '// [spekta:page] p\n// [spekta:section] セクション名');
    // [spekta:step] 見出しとしてセクションが生成される
    const sections = pages[0].children?.filter(n => n.type === "section") ?? [];
    expect((sections[0] as SectionNode).title).toBe("セクション名");
    // [spekta:steps:end]
  });

  // [spekta:section] インデントによるネスト
  it("インデントによるネスト", () => {
    // [spekta:steps]
    // [spekta:step] インデントを深くして `[spekta:section]` を書くと、子セクションになる
    const source = '// [spekta:page] p\n// [spekta:section] 親\n  // [spekta:section] 子';
    const pages = parseSource("t.ts", source);
    const parentSection = pages[0].children?.find(n => n.type === "section") as SectionNode;
    const childSections = parentSection.children?.filter(n => n.type === "section") ?? [];
    expect(childSections.length).toBe(1);
    // [spekta:steps:end]
  });
});

// [spekta:section] [spekta:summary] — 概要
describe("[spekta:summary]", () => {
  // [spekta:summary] ページやセクションの概要テキストを設定します。仕様書の冒頭に表示されます。

  // [spekta:code] typescript
  // // [spekta:page] my-feature
  // // [spekta:summary] ユーザーが企業を検索する機能です。
  // [spekta:code:end]

  // [spekta:section] ページに概要を追加する
  it("ページに概要を追加する", () => {
    // [spekta:steps]
    // [spekta:step] `[spekta:page]` の後に `[spekta:summary]` を書く
    const pages = parseSource("t.ts", '// [spekta:page] p\n// [spekta:summary] この機能はユーザーが検索を行うためのものです。');
    // [spekta:step] 概要テキストがページに表示される
    const summaryNode = pages[0].children?.find(n => n.type === "summary") as any;
    expect(summaryNode.text).toContain("検索を行うため");
    // [spekta:steps:end]
  });
});

// [spekta:section] [spekta:why] — 理由の説明
describe("[spekta:why]", () => {
  // [spekta:summary] 設計判断やルールの理由を説明します。仕様書ではコールアウト（強調ブロック）として表示されます。
  // [spekta:text] 「なぜこの仕様なのか」を読者に伝えるために使います。テストで「何を検証しているか」は見ればわかりますが、「なぜそうである必要があるか」はコメントがないと伝わりません。

  // [spekta:section] セクションに理由を追加する
  it("セクションに理由を追加する", () => {
    // [spekta:steps]
    // [spekta:step] セクション内に `[spekta:why]` を書く
    const pages = parseSource("t.ts", '// [spekta:page] p\n// [spekta:section] s\n  // [spekta:why] 初回表示の速度が重要なため');
    // [spekta:step] 理由がコールアウトとして表示される
    const section = pages[0].children?.find(n => n.type === "section") as SectionNode;
    const whyNode = section.children?.find(n => n.type === "why") as any;
    expect(whyNode.text).toContain("初回表示の速度");
    // [spekta:steps:end]
  });
});

// [spekta:section] [spekta:see] — 関連ページへの参照
describe("[spekta:see]", () => {
  // [spekta:summary] 関連するページへのリンクを作成します。値にはページ名を書きます。仕様書では「関連:」セクションにリンクとして表示されます。

  // [spekta:section] ページ名で参照する
  it("ページ名で参照する", () => {
    // [spekta:steps]
    // [spekta:step] `[spekta:see] other-page` と書く
    const pages = parseSource("t.ts", '// [spekta:page] p\n// [spekta:see] other-page');
    // [spekta:step] 参照先が SHA256 ID に変換される
    const seeNode = pages[0].children?.find(n => n.type === "see") as any;
    expect(seeNode.ref).toMatch(/^[0-9a-f]{64}$/);
    // [spekta:steps:end]
  });
});

// [spekta:section] [spekta:steps] と [spekta:step] — 操作手順
describe("[spekta:steps] と [spekta:step]", () => {
  // [spekta:summary] 操作手順を番号付きリストで記述します。`[spekta:steps]` で開始し、`[spekta:steps:end]` で終了するブロック構文です。
  // [spekta:callout] warning `[spekta:steps]` と `[spekta:steps:end]` は必ずペアにしてください。ネストはできません。

  // [spekta:code] typescript
  // // [spekta:steps]
  // // [spekta:step] ページを開く
  // // [spekta:step] フォームに入力する
  // // [spekta:step] 送信ボタンをクリックする
  // // [spekta:steps:end]
  // [spekta:code:end]

  // [spekta:section] ステップブロックの書き方
  it("ステップブロックの書き方", () => {
    // [spekta:steps]
    // [spekta:step] `[spekta:steps]` と `[spekta:steps:end]` で囲む
    // [spekta:step] 中に `[spekta:step]` で手順を書く
    const source = [
      '// [spekta:page] p', '// [spekta:section] s',
      '  // [spekta:steps]',
      '  // [spekta:step] ページを開く',
      '  // [spekta:step] フォームに入力する',
      '  // [spekta:steps:end]',
    ].join("\n");
    const pages = parseSource("t.ts", source);
    const section = pages[0].children?.find(n => n.type === "section") as SectionNode;
    const stepsNode = section.children?.find(n => n.type === "steps") as any;
    expect(stepsNode.children.filter((n: any) => n.type === "step").length).toBe(2);
    // [spekta:steps:end]
  });

  // [spekta:section] ステップ内に画像を差し込む
  it("ステップ内に画像を差し込む", () => {
    // [spekta:why] 操作手順の途中にスクリーンショットを挟むことで、読者が手順を視覚的に追えるようになります。
    // [spekta:steps]
    // [spekta:step] `[spekta:steps]` ブロック内で `[spekta:image]` を書く
    const source = [
      '// [spekta:page] p', '// [spekta:section] s',
      '  // [spekta:steps]',
      '  // [spekta:step] ページを開く',
      '  // [spekta:image] screenshot.png',
      '  // [spekta:step] ボタンをクリックする',
      '  // [spekta:steps:end]',
    ].join("\n");
    const pages = parseSource("t.ts", source);
    const section = pages[0].children?.find(n => n.type === "section") as SectionNode;
    const stepsNode = section.children?.find(n => n.type === "steps") as any;
    // [spekta:step] ステップの間に画像が配置される
    expect(stepsNode.children[1].type).toBe("image");
    // [spekta:steps:end]
  });
});

// [spekta:section] [spekta:image] — 画像の埋め込み
describe("[spekta:image]", () => {
  // [spekta:summary] スクリーンショットや図を仕様書に埋め込みます。値には画像ファイルのパスを書きます。

  // [spekta:section] 画像パスの指定
  it("画像パスの指定", () => {
    // [spekta:steps]
    // [spekta:step] `[spekta:image] path/to/image.png` と書く
    const pages = parseSource("t.ts", '// [spekta:page] p\n// [spekta:image] screenshots/search.png');
    // [spekta:step] 画像が仕様書に埋め込まれる
    const imageNode = pages[0].children?.find(n => n.type === "image") as any;
    expect(imageNode.path).toBe("screenshots/search.png");
    // [spekta:steps:end]
  });
});

// [spekta:section] [spekta:graph] — Mermaid ダイアグラム
describe("[spekta:graph]", () => {
  // [spekta:summary] Mermaid 記法のダイアグラムを仕様書に埋め込みます。`[spekta:graph]` の後にコメント行で Mermaid 記法を書くと、複数行がまとめて読み取られます。

  // [spekta:section] Mermaid ダイアグラムの書き方
  it("Mermaid ダイアグラムの書き方", () => {
    // [spekta:steps]
    // [spekta:step] `[spekta:graph]` に続けて Mermaid 記法をコメントで書く
    const source = '// [spekta:page] p\n// [spekta:graph]\n// graph TD\n// A --> B';
    const pages = parseSource("t.ts", source);
    // [spekta:step] ダイアグラムが仕様書に表示される
    const graphNode = pages[0].children?.find(n => n.type === "graph") as any;
    expect(graphNode.text).toContain("graph TD");
    // [spekta:steps:end]
  });
});

// [spekta:section] [spekta:text] — テキスト
describe("[spekta:text]", () => {
  // [spekta:summary] 散文テキストを仕様書に追加します。セクション内に説明文や補足情報を書くために使います。

  // [spekta:code] typescript
  // // [spekta:text] この機能はユーザー認証後に使用できます。
  // [spekta:code:end]

  // [spekta:section] テキストの追加
  it("テキストの追加", () => {
    // [spekta:steps]
    // [spekta:step] `[spekta:text]` にテキストを書く
    const pages = parseSource("t.ts", '// [spekta:page] p\n// [spekta:section] s\n  // [spekta:text] この機能はユーザー認証後に使用できます。');
    // [spekta:step] テキストが仕様書に表示される
    const section = pages[0].children?.find(n => n.type === "section") as SectionNode;
    const textNode = section.children?.find(n => n.type === "text") as any;
    expect(textNode.text).toBe("この機能はユーザー認証後に使用できます。");
    // [spekta:steps:end]
  });
});

// [spekta:section] [spekta:code] — コードブロック
describe("[spekta:code]", () => {
  // [spekta:summary] コードブロックを仕様書に埋め込みます。`[spekta:code]` で開始し `[spekta:code:end]` で終了するブロック構文です。開始タグの後ろに言語名を指定できます。
  // [spekta:callout] warning `[spekta:code]` と `[spekta:code:end]` は必ずペアにしてください。ネストはできません。

  // [spekta:section] コードブロックの書き方
  it("コードブロックの書き方", () => {
    // [spekta:steps]
    // [spekta:step] `[spekta:code] 言語名` で開始し、`[spekta:code:end]` で閉じる
    // [spekta:step] 間のコメント行がコード本文になる
    const source = [
      '// [spekta:page] p', '// [spekta:section] s',
      '  // [spekta:code] yaml',
      '  // version: 1',
      '  // target_dir: test/',
      '  // [spekta:code:end]',
    ].join("\n");
    const pages = parseSource("t.ts", source);
    const section = pages[0].children?.find(n => n.type === "section") as SectionNode;
    const codeNode = section.children?.find(n => n.type === "code") as any;
    // [spekta:step] 言語名とコード本文がそれぞれ格納される
    expect(codeNode.language).toBe("yaml");
    expect(codeNode.text).toContain("version: 1");
    // [spekta:steps:end]
  });

  // [spekta:section] 言語名を省略する
  it("言語名を省略する", () => {
    // [spekta:text] 言語名を省略するとシンタックスハイライトなしのコードブロックになります。
    const source = [
      '// [spekta:page] p', '// [spekta:section] s',
      '  // [spekta:code]',
      '  // some code here',
      '  // [spekta:code:end]',
    ].join("\n");
    const pages = parseSource("t.ts", source);
    const section = pages[0].children?.find(n => n.type === "section") as SectionNode;
    const codeNode = section.children?.find(n => n.type === "code") as any;
    expect(codeNode.language).toBe("");
    expect(codeNode.text).toContain("some code here");
  });
});

// [spekta:section] [spekta:callout] — 注意書き
describe("[spekta:callout]", () => {
  // [spekta:summary] 注意書きやヒントを強調ブロックとして表示します。variant をテキストの前に指定します。

  // [spekta:text] 利用可能な variant は以下の3種類です。
  // [spekta:list]
  // [spekta:item] `note` — 補足情報や参考情報
  // [spekta:item] `warning` — 注意が必要な情報
  // [spekta:item] `tip` — 便利なヒントやコツ
  // [spekta:list:end]

  // [spekta:code] typescript
  // // [spekta:callout] warning この操作は元に戻せません
  // // [spekta:callout] tip インデックスを追加するとパフォーマンスが改善します
  // // [spekta:callout] note この設定はオプションです
  // [spekta:code:end]

  // [spekta:section] variant を指定する
  it("variant を指定する", () => {
    // [spekta:steps]
    // [spekta:step] `[spekta:callout] variant テキスト` と書く（variant は note/warning/tip）
    const source = [
      '// [spekta:page] p', '// [spekta:section] s',
      '  // [spekta:callout] tip パフォーマンス改善にはインデックスを追加してください',
    ].join("\n");
    const pages = parseSource("t.ts", source);
    const section = pages[0].children?.find(n => n.type === "section") as SectionNode;
    const calloutNode = section.children?.find(n => n.type === "callout") as any;
    // [spekta:step] variant とテキストが分離して格納される
    expect(calloutNode.variant).toBe("tip");
    expect(calloutNode.text).toBe("パフォーマンス改善にはインデックスを追加してください");
    // [spekta:steps:end]
  });
});

// [spekta:section] [spekta:list] と [spekta:item] — 箇条書きリスト
describe("[spekta:list] と [spekta:item]", () => {
  // [spekta:summary] 箇条書きリストを仕様書に埋め込みます。`[spekta:list]` で開始し `[spekta:list:end]` で終了するブロック構文です。
  // [spekta:callout] warning `[spekta:list]` と `[spekta:list:end]` は必ずペアにしてください。`[spekta:item]` はブロック内にのみ書けます。

  // [spekta:code] typescript
  // // [spekta:list]
  // // [spekta:item] メール通知
  // // [spekta:item] Slack 通知
  // // [spekta:item] Webhook
  // // [spekta:list:end]
  // [spekta:code:end]

  // [spekta:section] リストの書き方
  it("リストの書き方", () => {
    // [spekta:steps]
    // [spekta:step] `[spekta:list]` と `[spekta:list:end]` で囲む
    // [spekta:step] 中に `[spekta:item]` で項目を書く
    const source = [
      '// [spekta:page] p', '// [spekta:section] s',
      '  // [spekta:list]',
      '  // [spekta:item] メール通知',
      '  // [spekta:item] Slack 通知',
      '  // [spekta:item] Webhook',
      '  // [spekta:list:end]',
    ].join("\n");
    const pages = parseSource("t.ts", source);
    const section = pages[0].children?.find(n => n.type === "section") as SectionNode;
    const listNode = section.children?.find(n => n.type === "list") as any;
    // [spekta:step] 箇条書きとして表示される
    expect(listNode.children.length).toBe(3);
    expect(listNode.children[0].text).toBe("メール通知");
    // [spekta:steps:end]
  });
});
