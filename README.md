# Spekta

テストコードから仕様書を生成するツールチェイン。

## 思想

テストファイルは実行可能で、正しいかどうか検証可能な唯一の信頼できる仕様書である。Spekta はテストファイルに書かれた `[spekta:*]` コメントを読み取り、人間が読める仕様書を生成する。

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

annotator:
  "@ktmage/spekta-annotator-vitest":

exporter:
  "@ktmage/spekta-exporter-web":
    name: "My Project"
  "@ktmage/spekta-exporter-markdown":
```

## コメント属性

```ruby
# [spekta:page] company-search        # ページ（英語スラッグ）
# [spekta:summary] 企業を検索する機能   # 概要
# [spekta:section] データが存在する場合  # セクション
# [spekta:why] 初回表示の速度が重要     # 理由
# [spekta:see] company-detail          # 関連ページ参照
# [spekta:image] screenshot.png        # 画像
# [spekta:graph]                       # Mermaid ダイアグラム
# [spekta:steps]                       # ステップブロック開始
# [spekta:step] ページを開く            # ステップ
# [spekta:steps:end]                   # ステップブロック終了
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

[MIT](LICENSE)
