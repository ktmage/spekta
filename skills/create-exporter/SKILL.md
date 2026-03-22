---
name: create-exporter
description: Spekta の Exporter プラグインを新規作成する
---

# Exporter プラグイン作成

## 概要

IR からドキュメントを生成する Exporter プラグインを新規作成する。

## トリガー

- 「Exporter を作りたい」
- 「Docusaurus 用の Exporter」「Notion の Exporter」
- 特定の出力形式への Spekta 対応を依頼されたとき

## 前提条件

- 対象の出力形式が指定されていること

前提条件が不足している場合はユーザーに確認する。

## 手順

### 1. 名前を決める

パッケージ名: `@{scope}/spekta-exporter-{name}`
例: `@ktmage/spekta-exporter-docusaurus`

### 2. ファイルを作成する

```
src/render.ts
package.json
tsconfig.json
.gitignore
README.md
```

### 3. package.json

```json
{
  "name": "@{scope}/spekta-exporter-{name}",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/render.js",
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

### 4. tsconfig.json

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

### 5. .gitignore

```
node_modules/
dist/
```

### 6. src/render.ts を実装する

```typescript
import type { IR, Node, SectionNode, Page } from "@ktmage/spekta";

const plugin = {
  name: "{name}",
  defaultOutputDir: "{name}",
  export(ir: IR, config: Record<string, unknown>, outputDir: string): void {
    for (const page of ir.pages) {
      // page.children を走査してドキュメントを生成
      // outputDir にファイルを出力
    }
  },
};

export default plugin;
```

#### IR の Node タイプ

| type | フィールド | 説明 |
|---|---|---|
| `section` | `title`, `children?` | セクション。再帰的にネスト可能 |
| `summary` | `text` | 概要テキスト |
| `why` | `text` | 理由の説明 |
| `see` | `ref` | 参照先の Node ID（SHA256） |
| `steps` | `children?` | ステップブロック。step/image/graph を含む |
| `step` | `text` | 個別のステップ |
| `image` | `path` | 画像ファイルパス |
| `graph` | `text` | Mermaid ダイアグラムのテキスト |

#### configSchema（任意）

```typescript
import { z } from "zod/v4";

const myConfigSchema = z.object({
  name: z.string(),
  theme: z.enum(["light", "dark"]).optional(),
}).loose();

const plugin = {
  name: "{name}",
  defaultOutputDir: "{name}",
  configSchema: myConfigSchema,
  export(ir, config, outputDir) {
    const validatedConfig = myConfigSchema.parse(config);
    // ...
  },
};
```

#### commands（任意）

カスタムコマンドを提供できる。`spekta {短縮名}:{コマンド名}` で呼び出せる。

```typescript
import type { SpektaConfig } from "@ktmage/spekta/types";
import { build, render } from "@ktmage/spekta/commands";

const plugin = {
  // ...
  commands: {
    async dev(config: SpektaConfig): Promise<void> {
      await build(config);
      // dev サーバーを起動、ファイル監視、リビルド...
    },
  },
};
```

```bash
spekta {name}:dev
```

### 7. README.md を作成する

`docs/plugin-readme-template.md` のテンプレートに従って作成する。

### 8. 独立リポジトリとして公開する

プラグインは独立した npm パッケージとして公開する。

## 参考

- `docs/creating-exporter.md` — 詳細仕様
- `packages/exporters/web/` — 実装例（HTML + dev サーバー）
- `packages/exporters/markdown/` — 実装例（Markdown）
- `docs/plugin-readme-template.md` — README テンプレート

## 注意事項

- パッケージ名は `@{scope}/spekta-exporter-{name}` の規則に従うこと
- `export default plugin` で default export すること
- `configSchema` は `.loose()` を使ってプラグイン固有フィールドを許容すること
