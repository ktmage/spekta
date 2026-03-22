# Spekta CLI

Spekta の CLI エントリーポイント。spec ファイルを静的解析し、人間が読めるドキュメントを生成する。

## コマンド

### `spekta build`

設定ファイル（`.spekta.yml`）に基づいて spec ファイルを解析し、指定されたフォーマットでドキュメントを出力する。

### `spekta watch`

`build` と同等の処理を実行した後、spec ファイルの変更を監視し、変更を検知するたびに自動で再ビルドを行う。

## 設定ファイル

プロジェクトルートに `.spekta.yml` を配置して動作を制御する。

### 設定項目

- **spec_dir**: spec ファイルが配置されているディレクトリのパス（デフォルト: `spec/`）
- **output.format**: 出力フォーマット。Phase 1 では `html` のみ対応（デフォルト: `html`）
- **output.path**: ドキュメントの出力先ディレクトリパス（デフォルト: `dist/spekta`）
- **spec_types**: 解析対象とする spec の種類（デフォルト: `["feature_spec", "system_spec"]`）

### 設定例

```yaml
spec_dir: spec/
output:
  format: html
  path: dist/spekta
spec_types:
  - feature_spec
  - system_spec
```

## インストールと実行

```bash
# ビルド
bin/spekta build

# ウォッチモード
bin/spekta watch
```
