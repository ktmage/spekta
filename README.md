# Spekta

Tests are the spec. Generate living documentation from test code.

テストコードから仕様書を生成するツールチェイン。

## Table of Contents / 目次

- [English](#english)
- [日本語](#japanese)

<a id="english"></a>
## English

### Spekta

AI agents write tests, Spekta turns them into human-readable docs. Add `[spekta:*]` comments to your test files and generate specification documents automatically.

> [!CAUTION]
> **Disclaimer:**
> This project is experimental. It is provided "as-is" without warranty of any kind. APIs, schemas, and CLI commands may change without notice. Use at your own risk.

**[Documentation (HTML)](https://ktmage.github.io/spekta/)** | [Documentation (Markdown)](.spekta/markdown/)

### Documents

| File | Description |
|------|-------------|
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contributing guide |
| [CHANGELOG.md](CHANGELOG.md) | Release history |
| [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) | Third-party licenses |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Code of conduct |
| [LICENSE](LICENSE) | MIT License |

### Philosophy

Test files are the only executable, verifiable, and trustworthy specification. Spekta reads `[spekta:*]` comments in test files and generates human-readable documentation. The spec lives alongside the test — they never drift apart.

### Installation

> npm packages are not yet published. Currently available via the monorepo.

```bash
git clone --recurse-submodules https://github.com/ktmage/spekta.git
cd spekta
bun install
```

After npm publication, the following will be available:

```bash
npm install @ktmage/spekta
npm install @ktmage/spekta-exporter-web
npm install @ktmage/spekta-exporter-markdown
```

### Pipeline

```
[Annotator]  Reads test DSL and auto-generates [spekta:*] comments (optional)
    ↓
[Parser]     Reads [spekta:*] comments and converts to IR
    ↓
[Exporter]   Generates documentation from IR
```

### Commands

```bash
spekta init                 # Generate .spekta.yml and .spekta/
spekta build                # annotate + render
spekta render               # parse + export only
spekta annotate             # Run Annotator plugins
spekta check                # Validate [spekta:*] annotation syntax
spekta doctor               # Environment diagnostics
spekta {exporter}:{command} # Exporter commands (e.g. web:dev)
```

### Configuration

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
    description: "Project description"
    basePath: "/my-project/"
  "@ktmage/spekta-exporter-markdown":
```

### Annotations

```ruby
# [spekta:page] User Search             # Page
# [spekta:summary] Search for users     # Summary
# [spekta:section] When data exists      # Section
# [spekta:why] Performance matters       # Reason
# [spekta:see] other-page               # Related page reference
# [spekta:text] Additional explanation   # Text
# [spekta:callout] warning Be careful   # Callout (note/warning/tip)
# [spekta:image] screenshot.png         # Image
# [spekta:graph]                        # Mermaid diagram
# [spekta:steps]                        # Steps block start
# [spekta:step] Open the page           # Step
# [spekta:steps:end]                    # Steps block end
# [spekta:code] typescript              # Code block start
# [spekta:code:end]                     # Code block end
# [spekta:list]                         # List start
# [spekta:item] Item                    # List item
# [spekta:list:end]                     # List end
```

### Official Plugins

Spekta is extensible via plugins. **Annotators** read testing framework DSL and auto-generate `[spekta:*]` comments. **Exporters** produce documentation from IR.

#### Annotator

| Package | Description | Status |
|---|---|---|
| [`@ktmage/spekta-annotator-rspec`](https://github.com/ktmage/spekta-annotator-rspec) | Auto-generate annotations from RSpec / Capybara tests | Public |
| `@ktmage/spekta-annotator-vitest` | Auto-generate annotations from Vitest tests | Private |

#### Exporter

| Package | Description | Status |
|---|---|---|
| [`@ktmage/spekta-exporter-web`](https://github.com/ktmage/spekta-exporter-web) | Generate static HTML documentation site with dev server | Public |
| [`@ktmage/spekta-exporter-markdown`](https://github.com/ktmage/spekta-exporter-markdown) | Generate Markdown documentation | Public |

### Plugin Development

- [Creating an Annotator Plugin](docs/creating-annotator.md)
- [Creating an Exporter Plugin](docs/creating-exporter.md)

### Development

```bash
git clone --recurse-submodules https://github.com/ktmage/spekta.git
cd spekta
bun install
bun run test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### License

[MIT](LICENSE) | [Third-Party Licenses](THIRD_PARTY_LICENSES.md)

---

<a id="japanese"></a>
## 日本語

### Spekta

AI エージェントがテストを書き、Spekta がそれを人間が読める仕様書に変換します。テストファイルに `[spekta:*]` コメントを追加するだけで、仕様書が自動生成されます。

> [!CAUTION]
> **免責事項：**
> 本プロジェクトは実験的な取り組みです。いかなる保証もなく「現状のまま」提供されます。API、スキーマ、CLI コマンドは予告なく変更される可能性があります。ご利用は自己責任でお願いいたします。

**[ドキュメント（HTML）](https://ktmage.github.io/spekta/)** | [ドキュメント（Markdown）](.spekta/markdown/)

### ドキュメント

| ファイル | 説明 |
|------|-------------|
| [CONTRIBUTING.md](CONTRIBUTING.md) | コントリビュートガイド |
| [CHANGELOG.md](CHANGELOG.md) | リリース履歴 |
| [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) | サードパーティライセンス |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | 行動規範 |
| [LICENSE](LICENSE) | MIT ライセンス |

### 思想

テストファイルは実行可能で、正しいかどうか検証可能な唯一の信頼できる仕様書である。Spekta はテストファイルに書かれた `[spekta:*]` コメントを読み取り、人間が読める仕様書を生成する。仕様はテストと同じファイルに存在するため、乖離が起きない。

### インストール

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

### パイプライン

```
[Annotator]  テスト DSL を読んで [spekta:*] コメントを自動補完（省略可能）
    ↓
[Parser]     [spekta:*] コメントを読んで IR に変換
    ↓
[Exporter]   IR からドキュメントを生成
```

### コマンド

```bash
spekta init                 # .spekta.yml と .spekta/ を生成
spekta build                # annotate + render
spekta render               # parse + export のみ
spekta annotate             # Annotator プラグインを実行
spekta check                # [spekta:*] アノテーションの構文チェック
spekta doctor               # 環境診断
spekta {exporter}:{command} # Exporter コマンド（例: web:dev）
```

### 設定

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

### コメント属性

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

### 公式プラグイン

Spekta はプラグインで拡張できます。**Annotator** はテスティングフレームワークの DSL を読んで `[spekta:*]` コメントを自動生成し、**Exporter** は IR からドキュメントを出力します。

#### Annotator

| パッケージ | 説明 | 状態 |
|---|---|---|
| [`@ktmage/spekta-annotator-rspec`](https://github.com/ktmage/spekta-annotator-rspec) | RSpec / Capybara テストからアノテーションを自動生成 | 公開 |
| `@ktmage/spekta-annotator-vitest` | Vitest テストからアノテーションを自動生成 | 非公開 |

#### Exporter

| パッケージ | 説明 | 状態 |
|---|---|---|
| [`@ktmage/spekta-exporter-web`](https://github.com/ktmage/spekta-exporter-web) | 静的 HTML 仕様書サイトを生成。dev サーバー付き | 公開 |
| [`@ktmage/spekta-exporter-markdown`](https://github.com/ktmage/spekta-exporter-markdown) | Markdown 形式の仕様書を生成 | 公開 |

### プラグイン開発

- [Annotator プラグインの作成](docs/creating-annotator.md)
- [Exporter プラグインの作成](docs/creating-exporter.md)

### 開発

```bash
git clone --recurse-submodules https://github.com/ktmage/spekta.git
cd spekta
bun install
bun run test
```

詳しくは [CONTRIBUTING.md](CONTRIBUTING.md) を参照。

### ライセンス

[MIT](LICENSE) | [Third-Party Licenses](THIRD_PARTY_LICENSES.md)
