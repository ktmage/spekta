# Changelog

## [Unreleased]

### Added
- Annotator → Parser → Exporter パイプライン
- `[spekta:*]` コメントベースの仕様記述
- `spekta init` / `build` / `render` / `annotate` / `check` / `doctor` コマンド
- プラグインコマンド（`spekta {exporter}:{command}`）
- IR: 統一 Node ツリー構造
  - リーフ Node: section, summary, why, see, steps, step, image, graph, text, code, callout, item
  - コンテナ Node: section, steps, list
- ID: パスベース SHA256
- ページマージ（同じ `[spekta:page]` → 統合）
- `[spekta:steps]` / `[spekta:steps:end]` ブロック構文
- `[spekta:code]` / `[spekta:code:end]` コードブロック構文
- `[spekta:list]` / `[spekta:item]` / `[spekta:list:end]` リスト構文
- `[spekta:callout]` 注意書き（note / warning / tip）
- `[spekta:text]` テキストノード
- Config: Zod スキーマによる宣言的定義
- GitHub Pages デプロイ（basePath 対応）
- dogfooding: Spekta 自身のテストから仕様書を生成

### Plugins
- `@ktmage/spekta-annotator-rspec` — RSpec/Capybara Annotator
- `@ktmage/spekta-annotator-vitest` — Vitest Annotator
- `@ktmage/spekta-exporter-web` — HTML Exporter + dev サーバー
- `@ktmage/spekta-exporter-markdown` — Markdown Exporter
