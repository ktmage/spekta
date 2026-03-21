# Spekta

**機械的に検証可能なコードから、人間が読めるドキュメントを生成する**

## 概要

Spekta は、テストコードを静的解析し、人間が読める仕様書を自動生成するツールチェインです。

AI がコードを大量に生成する時代において、人間はアプリケーションをより高い抽象度で可視化・把握する必要があります。テストコードは AI にとって既に最良のドキュメントです — 検証可能で、曖昧さがなく、開発を駆動する唯一の信頼源です。Spekta はこれを人間向けのドキュメントに変換します。

テスト自体が仕様書です。Spekta はそれを読みやすくしているだけです。

## アーキテクチャ

```
テストコード → [アナライザー] → IR (JSON) → [レンダラー] → 仕様書
```

3 つのレイヤーで構成され、それぞれが独立している。

### アナライザー

テストコードを静的解析し、IR を出力する。テストフレームワークごとに独立したアナライザーを持つ。

### IR（中間表現）

page と section の 2 階層で構成されるドキュメント構造。全ノードに一意の ID を持つ。テストフレームワークにもレンダラーにも依存しない。

### レンダラー

IR から人間が読めるドキュメントを生成する。出力形式ごとに独立したレンダラーを持つ。

## アナライザー

- [spekta-analyzer-rspec](https://github.com/ktmage/spekta-analyzer-rspec) — RSpec (Feature spec / System spec)

## レンダラー

CLI に内蔵。`.spekta.yml` で有効にする。

- **Web** — Astro + Preact による SSG。ページごとの HTML を生成
- **Markdown** — ページごとの `.md` ファイルを生成
- **PDF** — Pandoc で PDF を生成

## 設定

プロジェクトルートに `.spekta.yml` を配置する。

```yaml
spec_dir: spec/

analyzer:
  rspec:
    spec_types:
      - feature_spec
      - system_spec

renderer:
  web:
    name: "プロダクト名"
    description: "サブタイトル"
  markdown: {}
  pdf: {}
```

## 開発

### セットアップ

```bash
git clone --recurse-submodules https://github.com/ktmage/spekta.git
cd spekta

# CLI のビルド
cd packages/cli && npm install && npx tsc && cd ../..

# レンダラーのビルド
cd packages/renderers/markdown && npm install && npx tsc && cd ../../..
cd packages/renderers/pdf && npm install && npx tsc && cd ../../..
cd packages/renderers/web && npm install && cd ../../..
```

### testbed での動作確認

```bash
cd testbed

# 仕様書を生成
mise exec ruby@3.4.4 -- node ../packages/cli/bin/spekta.js build

# ファイル監視 + 開発サーバー
mise exec ruby@3.4.4 -- node ../packages/cli/bin/spekta.js watch
```

## ステータス

開発中。`spekta` コマンドとしてのグローバルインストールは未対応。

## ライセンス

MIT
