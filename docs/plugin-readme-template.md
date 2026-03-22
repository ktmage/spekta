# プラグイン README テンプレート

プラグインの README.md を書く際の参考テンプレート。

---

# @{scope}/spekta-{annotator|exporter}-{name}

{1-2文の概要。何をするプラグインか。}

## インストール

```bash
npm install @{scope}/spekta-{annotator|exporter}-{name}
```

## 設定

```yaml
# .spekta.yml
{annotator|exporter}:
  "@{scope}/spekta-{annotator|exporter}-{name}":
    # 設定項目をここに
```

### 設定項目

| 項目 | 型 | デフォルト | 説明 |
|---|---|---|---|
| `as` | `string` | (自動) | コマンドの短縮名を上書き |
| ... | ... | ... | ... |

## 対応フレームワーク / 出力形式

{Annotator の場合: どのテスティングフレームワーク・DSL に対応しているか}
{Exporter の場合: どんな形式のドキュメントを出力するか}

## 生成されるアノテーション / 出力構造

{Annotator の場合: どんな [spekta:*] アノテーションを生成するか}
{Exporter の場合: 出力されるファイルやディレクトリの構成}

## コマンド（Exporter のみ）

{Exporter コマンドがあれば記載}

```bash
spekta {name}:{command}
```

## 関連

- [Spekta](https://github.com/ktmage/spekta)
- [Annotator プラグインの作成](https://github.com/ktmage/spekta/blob/main/docs/creating-annotator.md)
- [Exporter プラグインの作成](https://github.com/ktmage/spekta/blob/main/docs/creating-exporter.md)
