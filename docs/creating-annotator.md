# Annotator プラグインの作成

Annotator はテストファイルを読んで `[spekta:*]` コメントを自動生成するプラグイン。

## パッケージ命名規則

```
@{scope}/spekta-annotator-{name}
```

例: `@ktmage/spekta-annotator-rspec`, `@yourname/spekta-annotator-pytest`

## インターフェース

```typescript
import type { AnnotatorPlugin, Annotation } from "@ktmage/spekta/plugin";

const plugin: AnnotatorPlugin = {
  name: "my-annotator",
  filePatterns: ["*.test.ts"],  // 対象ファイルのパターン
  annotate(filePath: string, source: string, config: Record<string, unknown>): Annotation[] {
    // source を解析して Annotation[] を返す
    return [];
  },
};

export default plugin;
```

## Annotation の構造

```typescript
interface Annotation {
  line: number;  // 挿入先の行番号（元ファイルの行番号）
  type: string;  // アノテーションの種類
  text: string;  // テキスト内容
}
```

## 生成できるアノテーション

| type | 用途 | text の内容 |
|---|---|---|
| `section` | セクション見出し | セクション名 |
| `steps` | ステップブロック開始 | 空文字列 |
| `step` | ステップ | ステップのテキスト |
| `steps:end` | ステップブロック終了 | 空文字列 |

`page`, `summary`, `why`, `see`, `image`, `graph` は手書き専用。Annotator は生成しない。

## 設定の受け取り

`.spekta.yml` の annotator セクションに書かれた設定が `config` 引数で渡される。

```yaml
annotator:
  "@yourname/spekta-annotator-pytest":
    some_option: true
```

```typescript
annotate(filePath, source, config) {
  const someOption = config.some_option === true;
  // ...
}
```

## package.json

```json
{
  "name": "@yourname/spekta-annotator-pytest",
  "type": "module",
  "main": "dist/index.js",
  "files": ["dist"],
  "dependencies": {
    "@ktmage/spekta": "workspace:*"
  }
}
```

## 実装例

[spekta-annotator-rspec](https://github.com/ktmage/spekta-annotator-rspec) を参照。
