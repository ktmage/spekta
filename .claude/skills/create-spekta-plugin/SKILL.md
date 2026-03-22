---
name: create-spekta-plugin
description: Spekta の Annotator / Exporter プラグインのスキャフォールディングと実装を支援する
---

# Spekta プラグイン作成

## 概要

Spekta の Annotator プラグインまたは Exporter プラグインの新規作成を支援するスキル。
パッケージのスキャフォールディング、インターフェースの実装、設定の定義、README の作成まで一貫して行う。

## トリガー

- 「Annotator を作りたい」「Exporter を作りたい」
- 「プラグインを作って」
- 「pytest 用の Annotator」「Docusaurus 用の Exporter」
- 特定のテスティングフレームワークや出力形式への対応を依頼されたとき

## 前提条件

- プラグインの種別（Annotator / Exporter）が明確であること
- 対象のテスティングフレームワークまたは出力形式が指定されていること

前提条件が不足している場合はユーザーに確認する。

## 手順

### 1. 種別と名前を決める

- Annotator: テスティングフレームワーク名（例: pytest, jest, go-test）
- Exporter: 出力形式名（例: docusaurus, notion, pdf）
- パッケージ名: `@{scope}/spekta-{annotator|exporter}-{name}`

### 2. ディレクトリとファイルを作成する

Annotator の場合:

```
packages/annotators/{name}/
  src/index.ts      ← プラグイン実装
  package.json
  tsconfig.json
  .gitignore
  README.md
```

Exporter の場合:

```
packages/exporters/{name}/
  src/render.ts     ← プラグイン実装
  package.json
  tsconfig.json
  .gitignore
  README.md
```

### 3. package.json を作成する

```json
{
  "name": "@{scope}/spekta-{annotator|exporter}-{name}",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@ktmage/spekta": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 4. tsconfig.json を作成する

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": false
  },
  "include": ["src/**/*.ts"]
}
```

### 5. .gitignore を作成する

```
node_modules/
dist/
```

### 6. プラグインを実装する

#### Annotator の場合

`src/index.ts` に `AnnotatorPlugin` インターフェースを実装する。

```typescript
import type { AnnotatorPlugin, Annotation } from "@ktmage/spekta/plugin";

const plugin: AnnotatorPlugin = {
  name: "{name}",
  filePatterns: ["{対象ファイルパターン}"],
  annotate(filePath: string, source: string, config: Record<string, unknown>): Annotation[] {
    // source を行ごとに解析し、テスト構造を認識して Annotation[] を返す
    return [];
  },
};

export default plugin;
```

生成するアノテーション:
- `section`: テストのグループ構造（describe/context 等）
- `steps`: ステップブロック開始
- `step`: 個別のステップ（DSL から自然言語に変換）
- `steps:end`: ステップブロック終了

`page`, `summary`, `why`, `see`, `image`, `graph` は手書き専用。Annotator は生成しない。

#### Exporter の場合

`src/render.ts` に `ExporterPlugin` インターフェースを実装する。

```typescript
import type { IR, Node, SectionNode, Page } from "@ktmage/spekta";

const plugin = {
  name: "{name}",
  defaultOutputDir: "{name}",
  export(ir: IR, config: Record<string, unknown>, outputDir: string): void {
    // ir.pages を走査してドキュメントを生成し outputDir に出力
  },
};

export default plugin;
```

IR の Node タイプ: section, summary, why, see, steps, step, image, graph

configSchema（任意）で設定バリデーションを追加できる。
commands（任意）でカスタムコマンドを提供できる。

### 7. README.md を作成する

`docs/plugin-readme-template.md` のテンプレートに従って作成する。

### 8. 独立リポジトリとして公開する

プラグインは独立した npm パッケージとして公開する。Spekta のリポジトリに含める必要はない。

## 参考ドキュメント

- `docs/creating-annotator.md` — Annotator の詳細仕様
- `docs/creating-exporter.md` — Exporter の詳細仕様
- `docs/plugin-readme-template.md` — README テンプレート
- `packages/annotators/rspec/` — Annotator の実装例
- `packages/exporters/web/` — Exporter の実装例

## 注意事項

- パッケージ名は `@{scope}/spekta-{annotator|exporter}-{name}` の規則に従うこと
- `export default plugin` で default export すること
- Annotator は `page` を生成しない（手書き専用）
- Exporter の `configSchema` は `.loose()` を使ってプラグイン固有フィールドを許容すること
