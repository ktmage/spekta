# Spekta

テストコードから仕様書を生成するツールチェイン。

**[ドキュメント（HTML）](https://ktmage.github.io/spekta/)** | [ドキュメント（Markdown）](.spekta/markdown/)

## 思想

テストファイルは実行可能で、正しいかどうか検証可能な唯一の信頼できる仕様書である。Spekta はテストファイルに書かれた `[spekta:*]` コメントを読み取り、人間が読める仕様書を生成する。

## インストール

> npm パッケージは未公開です。現在はモノレポからローカルで利用できます。

```bash
git clone --recurse-submodules https://github.com/ktmage/spekta.git
cd spekta
bun install
```

npm 公開後は以下でインストールできるようになる予定です。

```bash
npm install @ktmage/spekta
npm install @ktmage/spekta-exporter-web
npm install @ktmage/spekta-exporter-markdown
```

## パイプライン

```
[Annotator]  テスト DSL を読んで [spekta:*] コメントを自動補完（省略可能）
    ↓
[Parser]     [spekta:*] コメントを読んで IR に変換
    ↓
[Exporter]   IR からドキュメントを生成
```

## コマンド

```bash
spekta init                 # .spekta.yml と .spekta/ を生成
spekta build                # annotate + render
spekta render               # parse + export のみ
spekta annotate             # Annotator プラグインを実行
spekta check                # [spekta:*] アノテーションの構文チェック
spekta doctor               # 環境診断
spekta {exporter}:{command} # Exporter コマンド（例: web:dev）
```

## 設定

```yaml
# .spekta.yml
version: 1
target_dir: test/
include:
  - ".test.ts"
exclude:
  - "fixtures/"

annotator:
  "@ktmage/spekta-annotator-rspec":
    page_from: filename

exporter:
  "@ktmage/spekta-exporter-web":
    name: "My Project"
    description: "プロジェクトの説明"
    basePath: "/my-project/"
  "@ktmage/spekta-exporter-markdown":
```

## コメント属性

```ruby
# [spekta:page] 企業検索               # ページ
# [spekta:summary] 企業を検索する機能   # 概要
# [spekta:section] データが存在する場合  # セクション
# [spekta:why] 初回表示の速度が重要     # 理由
# [spekta:see] other-page              # 関連ページ参照
# [spekta:text] 補足テキスト            # テキスト
# [spekta:callout] warning 注意事項    # 注意書き（note/warning/tip）
# [spekta:image] screenshot.png        # 画像
# [spekta:graph]                       # Mermaid ダイアグラム
# [spekta:steps]                       # ステップブロック開始
# [spekta:step] ページを開く            # ステップ
# [spekta:steps:end]                   # ステップブロック終了
# [spekta:code] typescript             # コードブロック開始
# [spekta:code:end]                    # コードブロック終了
# [spekta:list]                        # リスト開始
# [spekta:item] 項目                   # リスト項目
# [spekta:list:end]                    # リスト終了
```

## パッケージ構成

| パッケージ | 説明 |
|---|---|
| `packages/core` | CLI + Parser + IR スキーマ |
| [`packages/annotators/rspec`](https://github.com/ktmage/spekta-annotator-rspec) | RSpec/Capybara Annotator |
| [`packages/annotators/vitest`](https://github.com/ktmage/spekta-annotator-vitest) | Vitest Annotator |
| [`packages/exporters/web`](https://github.com/ktmage/spekta-exporter-web) | HTML Exporter + dev サーバー |
| [`packages/exporters/markdown`](https://github.com/ktmage/spekta-exporter-markdown) | Markdown Exporter |

## プラグイン開発

- [Annotator プラグインの作成](docs/creating-annotator.md)
- [Exporter プラグインの作成](docs/creating-exporter.md)

## 開発

```bash
git clone --recurse-submodules https://github.com/ktmage/spekta.git
cd spekta
bun install
bun run test
```

詳しくは [CONTRIBUTING.md](CONTRIBUTING.md) を参照。

## ライセンス

[MIT](LICENSE) | [Third-Party Licenses](THIRD_PARTY_LICENSES.md)
