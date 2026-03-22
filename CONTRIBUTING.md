# コントリビューションガイド

Spekta への貢献に興味を持っていただきありがとうございます。

## 開発環境のセットアップ

```bash
git clone --recurse-submodules https://github.com/ktmage/spekta.git
cd spekta
bun install
```

## ビルド

```bash
# コア
cd packages/core && bun run build

# Exporter（サブモジュール）
cd packages/exporters/web && bun run build
cd packages/exporters/markdown && bun run build
```

## テスト

```bash
bun run test
```

## プラグインの開発

新しい Annotator や Exporter を作る場合は、以下のガイドを参照してください。

- [Annotator プラグインの作成](docs/creating-annotator.md)
- [Exporter プラグインの作成](docs/creating-exporter.md)

## Pull Request

1. Issue を確認し、作業予定を共有する
2. フォークしてブランチを作成する
3. 変更を実装し、テストを追加する
4. 全テストが通ることを確認する（`bun run test`）
5. Pull Request を作成する

### コミットメッセージ

日本語で記述する。変更内容を簡潔に1行で表す。

```
Parser: [spekta:page] のマージロジックを修正
Web Exporter: サイドバーのアンカーリンクを修正
```

### コードの原則

- 名前だけで何を指しているかわかるようにする
- フォールバック処理を書かない
- テストで検証できることはテストに書く
- `as` キャストを避け、型ガードを使う

## Issue

バグ報告や機能提案は [GitHub Issues](https://github.com/ktmage/spekta/issues) で受け付けています。

## ライセンス

貢献されたコードは [MIT License](LICENSE) のもとで公開されます。
