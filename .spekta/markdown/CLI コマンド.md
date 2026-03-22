# CLI コマンド

## spekta annotate

Annotator プラグインを実行してテストファイルに [spekta:*] コメントを自動追加するコマンド。

### annotator が設定されていない場合

#### 何も処理されずに終了すること

1. annotator 設定のない fixture で spekta annotate を実行する
2. エラーなく完了する

## spekta build

annotate + render を一括実行し、テストコードから仕様書を生成するコマンド。

## spekta check

テストファイルの [spekta:*] アノテーションを構文チェックするコマンド。

### 正しいアノテーションの場合

#### 全ファイルが passed になること

1. vitest fixture で spekta check を実行する
2. 終了コードが 0 である
3. passed と表示される

#### ページ数とセクション数が表示されること

1. vitest fixture で spekta check を実行する
2. page と section の数が表示される

## spekta doctor

プロジェクトの環境と設定を診断するコマンド。

### Node.js のバージョンを表示すること

### プロジェクトディレクトリで実行した場合

#### .spekta.yml が見つかること

#### target_dir が見つかること

## spekta init

プロジェクトの初期設定ファイルを生成するコマンド。

### .spekta.yml が存在しない場合

#### .spekta.yml と .spekta/ が生成されること

1. 空のディレクトリで spekta init を実行する
2. .spekta.yml が生成される
3. .spekta/ ディレクトリが生成される
4. 完了メッセージが出力される

#### 生成された .spekta.yml がコメントアウトされていること

1. spekta init を実行する
2. .spekta.yml の内容がコメントアウトされている

### .spekta.yml が既に存在する場合

#### エラーで終了すること

1. .spekta.yml が存在するディレクトリで spekta init を実行する
2. エラーメッセージが出力される

## spekta render

テストファイルの [spekta:*] コメントを読み取ってドキュメントを生成するコマンド。

### Web Exporter の場合

#### /{pageType}/{pageTitle}/ のディレクトリ構造で HTML が生成されること

1. .spekta/web/ 配下にページディレクトリが存在する
2. 各ページに index.html が含まれる

#### index.html がリダイレクトすること

1. ルートの index.html を読み込む
2. meta refresh によるリダイレクトが設定されている

#### HTML にページタイトルが含まれること

1. 生成された HTML を読み込む
2. タイトル要素が存在する

### Markdown Exporter の場合

#### .md ファイルが生成されること

1. .spekta/markdown/ 配下のファイルを確認する
2. .md ファイルが 1 つ以上存在する

#### Markdown にページタイトルが h1 として含まれること

1. 生成された Markdown を読み込む
2. h1 見出しが存在する

## spekta web:dev

Web Exporter の dev サーバー。ファイル変更を監視し、自動リビルドとライブリロードを提供する。

### サーバーが起動している場合

#### HTTP でページを配信できること

#### SSE エンドポイントが利用可能であること

### テストファイルを変更した場合

#### 自動でリビルドされること
