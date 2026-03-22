---
name: annotate-tests
description: テストファイルに [spekta:*] コメントを手動で追加する
---

# テストファイルのアノテーション

## 概要

テストファイルを読み、`[spekta:*]` コメントを手動で追加するスキル。Annotator プラグインが対応していないフレームワークや、自動生成では不十分な場合に使う。

## トリガー

- 「テストにアノテーションを追加して」
- 「このテストファイルに spekta コメントを書いて」
- 「仕様書用のコメントを付けて」
- テストファイルを指定されて、ドキュメント生成の準備を依頼されたとき

## 前提条件

- 対象のテストファイルが指定されていること
- `.spekta.yml` が存在すること（`[spekta:page]` の名前を決めるため）

前提条件が不足している場合はユーザーに確認する。

## 手順

### 1. テストファイルを読む

対象ファイルの構造を把握する:
- テストのグループ構造（describe/context/it 等）
- 各テストの目的と操作内容
- 既存の `[spekta:*]` コメントの有無

### 2. ページアノテーションを追加する

ファイルの先頭に `[spekta:page]` を追加する。英語のスラッグで命名する。

```ruby
# [spekta:page] company-search
```

既に存在する場合はスキップする。

### 3. summary を追加する

ページの概要を `[spekta:summary]` で追加する。

```ruby
# [spekta:page] company-search
# [spekta:summary] 企業名や業界で検索する機能
```

### 4. セクションアノテーションを追加する

テストのグループ構造に `[spekta:section]` を追加する。

```ruby
# [spekta:section] データが存在する場合
context "データが存在する場合" do
  # [spekta:section] キーワードで検索できる
  it "キーワードで検索できる" do
```

### 5. ステップアノテーションを追加する

テストの操作手順に `[spekta:steps]` / `[spekta:step]` / `[spekta:steps:end]` を追加する。

```ruby
# [spekta:steps]
# [spekta:step] 検索画面を開く
# [spekta:step] 「キーワード」に「テスト」と入力する
# [spekta:step] 「検索」ボタンをクリックする
# [spekta:step] 検索結果が表示される
# [spekta:steps:end]
```

ステップのテキストは自然言語で書く。コードの操作を人間が読める形に変換する。

### 6. 補足アノテーションを追加する（必要に応じて）

| アノテーション | 用途 | 例 |
|---|---|---|
| `[spekta:why]` | そうである理由 | `# [spekta:why] 口コミの品質を担保するため` |
| `[spekta:see]` | 関連ページ参照 | `# [spekta:see] company-detail` |
| `[spekta:image]` | スクリーンショット | `# [spekta:image] screenshots/search.png` |
| `[spekta:graph]` | Mermaid ダイアグラム | `# [spekta:graph]` + 続く行に Mermaid 記法 |

### 7. 構文チェックする

```bash
spekta check
```

アノテーションの構文エラーがないか検証する。`[spekta:steps]` と `[spekta:steps:end]` のペア、`[spekta:step]` の位置、空テキスト等をチェックする。全ファイルが passed になるまで修正する。

### 8. ドキュメント生成を確認する

```bash
spekta render
```

生成されたドキュメント（`.spekta/web/` や `.spekta/markdown/`）を確認し、意図通りの仕様書が生成されることを検証する。

## コメント記法

TypeScript:
```typescript
// [spekta:page] my-feature
// [spekta:section] データが存在する場合
```

Ruby:
```ruby
# [spekta:page] my-feature
# [spekta:section] データが存在する場合
```

Python:
```python
# [spekta:page] my-feature
# [spekta:section] データが存在する場合
```

## 注意事項

- `[spekta:page]` は英語スラッグで命名する（URL に使われる）
- `[spekta:section]` はテストの見出しと一致させる
- `[spekta:step]` は自然言語で書く。コードをそのまま書かない
- `[spekta:steps]` と `[spekta:steps:end]` は必ずペアにする
- 既存の `[spekta:*]` コメントを壊さない
- アノテーションのインデントはテストコードのインデントに合わせる
