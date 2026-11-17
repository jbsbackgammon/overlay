# JBS 配信盤面作成（overlay）

JBSのバックギャモン配信向けに、1920×1080のオーバーレイを編集・プレビュー・出力する静的Webツールです。GitHub Pagesで公開し、ビルド用のフレームワークやアプリケーションサーバーを使用しません。

- **操作画面**：https://jbsbackgammon.github.io/overlay/
- **OBS出力画面**：https://jbsbackgammon.github.io/overlay/output.html
- **共通大会マスター**：https://github.com/jbsbackgammon/common

## ファイル構成と責務

| ファイル | 役割 |
| --- | --- |
| `index.html` | 操作画面。入力部品と各種機能の入口 |
| `output.html` | OBSブラウザーソース向けの透明出力画面 |
| `stage.html` | 操作画面と出力画面で共有する盤面DOM |
| `styles.css` | 盤面固有の装飾、操作画面の配置、レスポンシブ、OBS出力 |
| `overlay.js` | 状態管理、画面描画、配信同期、各種入出力（命名は共通APIを使用） |
| `ads.json` | 既定の広告情報 |
| `assets/` | 画像素材。サムネイルと広告は指定フォルダーに配置 |
| `media.json` | ローカル確認用素材一覧。公開時はGitHub Actionsが再生成 |
| `scripts/generate-media.cjs` | 素材フォルダーから一覧JSONを作成 |
| `scripts/check-overlay.cjs` | 機能・記述・互換性の静的検査 |
| `scripts/smoke-browser.cjs` | 実ブラウザによる画面初期化・入力操作・共通デザイン検査 |
| `.github/workflows/pages.yml` | Node.js 24で検証し、GitHub Pagesに配信 |

## デザインの責任分担

- 汎用の編集UIは `common/ui.css` を利用する。色、フォント、入力欄、ボタン、プルダウン、チェックボックス、ダイアログ等をoverlay側で再定義しない
- 選手名や大会の装飾、映像・広告枠、右1〜5の配置は `styles.css` が担当する。これらは汎用UIに混ぜない
- 大会名・回次・テーマカラー等のマスターは `common/brand.js` を参照し、取得に失敗した場合はツール内の既定値を使用する
- 設定呼出一覧の `日時・回次等_大会名_試合名_上選手-下選手` とJSON出力の `配信盤面_回次等_大会名_試合名_上選手-下選手.json` は `common/naming.js` の `JBSNaming` で共通管理する。命名ロジックをoverlay側に重複実装しない
- `styles.css` の編集画面専用変数は `--width-editor-*` 等に限定し、共通UI側の変数と重複させない
- 画面幅別のCSSはファイル末尾で **1200 → 960 → 820 → 680 → 600px** の降順に管理する
- CSSは原則 `!important` 不使用。例外はOBS出力時にJavaScriptが設定するプレビュー倍率を無効化するための `.output-page .stage` のみ

## 状態と配信

- 配信1〜3はURLの `?channel=1`〜`3` で切り替える。チャンネルごとに保存状態・同期チャンネル・出力ウィンドウを分離する
- ブラウザ内の設定は `localStorage` に保持し、`BroadcastChannel` とストレージ変更通知で出力画面へ伝える
- 過去の設定やJSONを読み込んでも、手動で選んだ試合名やカスタム値を勝手に初期値へ戻さない
- 手動保存／呼び出し、JSON取込／出力、選手写真、サムネイル作成ツールへの受渡しを利用できる
- 配信盤面はOBSブラウザーソースで表示する。PNG出力機能は廃止し、ライブラリへの依存も削除した
- OBS画面の解像度は1920×1080で固定する。操作画面のプレビューのみ表示倍率を変更する

## 修正・検証・公開

GitHub Actionsはmainブランチへのpush時に検証・公開を実施します。

1. `node --check overlay.js`、`node scripts/check-overlay.cjs` で基本整合性を検査
2. `node scripts/smoke-browser.cjs` で、Chrome系ブラウザが利用可能な場合に画面初期化・UI操作を確認
3. `node scripts/generate-media.cjs _site/media.json` で画像一覧を生成
4. `_site/` をGitHub Pagesへアップロードして公開

必要なときだけローカル実行します（Node.js 24推奨）。

```sh
node --check overlay.js
node scripts/check-overlay.cjs
node scripts/generate-media.cjs media.json
node scripts/smoke-browser.cjs
```

ブラウザ確認時はHTTPサーバー経由で開いてください。直接 `file://` でHTMLを開くと、`stage.html` やJSONの読み込みが制限されます。

### 運用上の注意

- `index.html` と `output.html` は同じ `styles.css` と `overlay.js` を読み込む。どちらかを改修したら、**両ページのキャッシュ用クエリを同時に更新**する
- `stage.html` を変更した場合も、両ページの読み込みクエリを合わせる
- 既存の保存済み設定、3チャンネルの状態分離、OBSの透過領域、右枠のコンテンツ切替は互換性を維持する
- HTMLの入力部品の見た目を直すときは、まず `common/ui.css` の定義を確認する。個別の上書きで問題を隠さない
- 外部の会員写真・大会情報・広告画像が取得できない場合がある。データ取得失敗で操作画面全体を止めないようにする
