# Exporter プラグインの作成

Exporter は IR からドキュメントを生成するプラグイン。

## パッケージ命名規則

```
@{scope}/spekta-exporter-{name}
```

例: `@ktmage/spekta-exporter-web`, `@yourname/spekta-exporter-docusaurus`

## インターフェース

```typescript
import type { IR } from "@ktmage/spekta";

const plugin = {
  name: "my-exporter",
  defaultOutputDir: "my-output",  // .spekta/{defaultOutputDir}/ に出力
  export(ir: IR, config: Record<string, unknown>, outputDir: string): void {
    // ir からドキュメントを生成して outputDir に出力
  },
};

export default plugin;
```

## IR の構造

```typescript
interface IR {
  version: string;
  pages: Page[];
}

interface Page {
  id: string;       // SHA256 ハッシュ
  type: "feature";   // ページタイプ
  title: string;     // ページ識別子（英語スラッグ）
  children?: Node[]; // ページの子ノード
}
```

## Node の種類

全 Node は `id`（SHA256）と `type` を持つ。

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

## 設定バリデーション（任意）

`configSchema` を定義すると、`.spekta.yml` の設定がバリデーションされる。

```typescript
import { z } from "zod/v4";

const myConfigSchema = z.object({
  name: z.string(),
  theme: z.enum(["light", "dark"]).optional(),
}).loose();

const plugin = {
  name: "my-exporter",
  defaultOutputDir: "my-output",
  configSchema: myConfigSchema,
  export(ir, config, outputDir) {
    const validatedConfig = myConfigSchema.parse(config);
    // ...
  },
};
```

## Exporter コマンド（任意）

`commands` フィールドでカスタムコマンドを提供できる。`spekta {短縮名}:{コマンド名}` で呼び出せる。

```typescript
import type { SpektaConfig } from "@ktmage/spekta/types";
import { build, render } from "@ktmage/spekta/commands";

const plugin = {
  name: "my-exporter",
  defaultOutputDir: "my-output",
  export(ir, config, outputDir) { /* ... */ },
  commands: {
    async dev(config: SpektaConfig): Promise<void> {
      await build(config);
      // dev サーバーを起動、ファイル監視、リビルド...
    },
  },
};
```

```bash
spekta my-exporter:dev
```

## package.json

```json
{
  "name": "@yourname/spekta-exporter-docusaurus",
  "type": "module",
  "main": "dist/render.js",
  "files": ["dist"],
  "dependencies": {
    "@ktmage/spekta": "workspace:*"
  }
}
```

## 実装例

- [spekta-exporter-web](https://github.com/ktmage/spekta-exporter-web) — HTML + dev サーバー
- [spekta-exporter-markdown](https://github.com/ktmage/spekta-exporter-markdown) — Markdown
