# IR リファレンス

IR（Intermediate Representation）は Parser が生成するデータ構造で、Exporter への入力になります。全ての要素は Node として統一されたツリー構造を持ちます。

## ページ

IR のトップレベル要素です。`[spekta:page]` のテキストが `title` に、SHA256 ハッシュが `id` になります。

同じページ名は同じ ID を生成するため、複数ファイルからのマージが可能です。

```typescript
interface Page {
  id: string;       // SHA256 ハッシュ
  type: "feature";
  title: string;    // ページ名（英語スラッグ）
  children?: Node[];
}
```

### ID は SHA256 ハッシュ

### 同じページ名は同じ ID

> **なぜ**: ID がページ名から決定的に生成されるため、異なるファイルでも同じページ名なら同じ ID になり、マージの対象になります。

## Node

IR の全要素は Node です。各 Node は `type`（種類）と `id`（SHA256）を持ちます。

リーフ Node（children を持たない）:

- `summary` — 概要テキスト
- `why` — 理由の説明
- `see` — 関連ページへの参照（ref に対象ページの ID）
- `step` — 操作手順の1ステップ
- `image` — 画像パス
- `graph` — Mermaid ダイアグラム
- `text` — 散文テキスト
- `code` — コードブロック（language + text）
- `callout` — 注意書き（variant: note/warning/tip）
- `item` — リスト項目

コンテナ Node（children を持つ）:

- `section` — セクション。children に全種類の Node を持てる
- `steps` — 操作手順ブロック。children に step, image, graph を持てる
- `list` — 箇条書きリスト。children に item を持てる

### 全 Node が ID を持つ

### text Node

### code Node

`language` フィールドで言語を指定でき、`text` がコード本文になります。言語名は省略可能です。

### callout Node

variant は `note`（情報）、`warning`（警告）、`tip`（ヒント）の 3 種類です。

### list Node と item Node

`list` はコンテナ Node で、`item` を children として持ちます。

## マージ

複数ファイルで同じ `[spekta:page]` を指定すると、1つのページにマージされます。

セクションも同じパス（ページ名/セクション名/...）なら統合され、子要素が合流します。

### 同じページ名は 1 ページにマージされる

## スキーマバリデーション

IR は Zod スキーマで定義されています。Parser の出力は `irSchema.parse()` で検証できます。

> **Tip**: Exporter プラグインを開発する際は、入力される IR が必ずこのスキーマに準拠していることを前提にできます。

### Parser の出力はスキーマに準拠する
