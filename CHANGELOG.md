# Changelog

## [Unreleased]

### Added
- Annotator → Parser → Exporter パイプライン
- `[spekta:*]` コメントベースの仕様記述
- `spekta init` / `build` / `render` / `annotate` / `doctor` コマンド
- プラグインコマンド（`spekta {exporter}:{command}`）
- IR: 統一 Node ツリー構造（section, summary, why, see, steps, step, image, graph）
- ID: パスベース SHA256
- ページマージ（同じ `[spekta:page]` → 統合）
- `[spekta:steps]` / `[spekta:steps:end]` ブロック
- Config: Zod スキーマによる宣言的定義

### Plugins
- `@ktmage/spekta-annotator-rspec` — RSpec/Capybara Annotator
- `@ktmage/spekta-annotator-vitest` — Vitest Annotator
- `@ktmage/spekta-exporter-web` — HTML Exporter + dev サーバー
- `@ktmage/spekta-exporter-markdown` — Markdown Exporter
