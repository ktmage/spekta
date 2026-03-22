---
name: create-annotator
description: Spekta の Annotator プラグインを新規作成する
---

# Annotator プラグイン作成

## 概要

テスティングフレームワーク向けの Annotator プラグインを新規作成する。テストファイルを読んで `[spekta:*]` コメントを自動生成するプラグイン。

## トリガー

- 「Annotator を作りたい」
- 「pytest 用の Annotator」「Jest の Annotator」
- 特定のテスティングフレームワークへの Spekta 対応を依頼されたとき

## 前提条件

- 対象のテスティングフレームワークが指定されていること

前提条件が不足している場合はユーザーに確認する。

## 手順

### 1. 名前を決める

パッケージ名: `@{scope}/spekta-annotator-{name}`
例: `@ktmage/spekta-annotator-pytest`

### 2. ファイルを作成する

```
src/index.ts
package.json
tsconfig.json
.gitignore
README.md
```

### 3. package.json

```json
{
  "name": "@{scope}/spekta-annotator-{name}",
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

### 6. src/index.ts を実装する

```typescript
import type { AnnotatorPlugin, Annotation } from "@ktmage/spekta/plugin";

const plugin: AnnotatorPlugin = {
  name: "{name}",
  filePatterns: ["{対象ファイルパターン}"],
  annotate(filePath: string, source: string, config: Record<string, unknown>): Annotation[] {
    const lines = source.split("\n");
    const annotations: Annotation[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // テスト構造を認識して Annotation を生成する
      // section: テストのグループ（describe/context 等）
      // steps: ステップブロック開始
      // step: 個別のステップ（DSL → 自然言語）
      // steps:end: ステップブロック終了
    }

    return annotations;
  },
};

export default plugin;
```

#### Annotation の種類

| type | 用途 | text |
|---|---|---|
| `section` | テストのグループ構造 | セクション名 |
| `steps` | ステップブロック開始 | 空文字列 |
| `step` | 個別のステップ | 自然言語テキスト |
| `steps:end` | ステップブロック終了 | 空文字列 |

`page`, `summary`, `why`, `see`, `image`, `graph` は手書き専用。Annotator は生成しない。

#### 設定の受け取り

`.spekta.yml` の設定が `config` 引数で渡される。

```yaml
annotator:
  "@{scope}/spekta-annotator-{name}":
    some_option: true
```

### 7. README.md を作成する

`docs/plugin-readme-template.md` のテンプレートに従って作成する。

### 8. 独立リポジトリとして公開する

プラグインは独立した npm パッケージとして公開する。

## 参考

- `docs/creating-annotator.md` — 詳細仕様
- `packages/annotators/rspec/` — 実装例
- `docs/plugin-readme-template.md` — README テンプレート

## 注意事項

- パッケージ名は `@{scope}/spekta-annotator-{name}` の規則に従うこと
- `export default plugin` で default export すること
- Annotator は `page` を生成しない（手書き専用）
