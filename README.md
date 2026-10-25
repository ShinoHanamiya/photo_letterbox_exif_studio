# Photo Letterbox EXIF Studio v1.1.3

写真をトリミングせずに指定アスペクト比のキャンバスへ配置し、上下余白にEXIF情報を表示する静的Webアプリです。

## 機能

- 16:9 / 3:2 / 4:3 / 1:1 / 9:16 / カスタムサイズ
- 写真の全体表示（クロッピングなし）
- 白・黒余白、上下余白調整
- EXIF：機材・レンズ・焦点距離・F値・シャッター速度・ISO・撮影日
- 自由記述1（機材行の末尾）・自由記述2（撮影条件行の末尾）・自由記述3（独立行）
- 区切り記号 ` / ` 、日付形式 `YYYY-MM-DD`
- テキスト位置・文字サイズの調整、PNG/JPEG保存

## GitHub Pagesへの公開手順

1. GitHubで新しい公開リポジトリ（例：`photo-letterbox-exif-studio`）を作る。
2. このZIP内の **index.html / assets / .nojekyll / README.md / .gitignore** をリポジトリのルートへアップロードする（ZIPファイルそのものをアップロードしない）。
3. リポジトリの **Settings → Pages** を開く。
4. **Build and deployment → Source: Deploy from a branch** に設定。
5. **Branch: main / Folder: /(root)** を指定して **Save**。
6. 公開先は通常 `https://<GitHubユーザー名>.github.io/<リポジトリ名>/` となる。反映まで時間がかかることがある。

サーバーやビルドは不要です。リポジトリ名を変えても相対パスのまま動作する構成です。

## ローカル起動

`index.html` をChrome等で開きます。Python等のインストールは不要です。

**注意:** EXIF解析ライブラリ `exifr` をCDNから取得しているため、完全オフラインではEXIF自動取得ができません（写真表示と出力は可能です）。CDNへ写真本体を送る処理はありません。EXIFが取得できないときはネット接続や画像内EXIFを確認してください。

## プライバシー

選択された写真データはブラウザ内のFileReaderとCanvasで処理します。画像を自前のサーバーに送信する機能はありません。ただし外部CDNからJavaScriptの取得は行います。利用するGitHub PagesやCDN等のアクセスログは各サービスのポリシーに従います。

## 既知の制約

- EXIFがない画像や一部形式では情報が表示されません。
- 出力画像のEXIFメタデータ自体を保持する機能はありません（情報を画像上に描画します）。
- 文字が極端に長い場合の自動折返しは未対応です。
- 外部CDNを使用するため完全オフライン対応ではありません。
- 実ブラウザ・GitHub Pagesでのデプロイ動作確認は未実施です。

## 使用技術

HTML / CSS / JavaScript / Canvas API / exifr 7.1.3 (CDN: [exifr](https://github.com/MikeKovarik/exifr), MIT License)。

## 変更履歴

- v1.1.3：自由記述3項目、3行表示、区切り `/`、日付 `YYYY-MM-DD`
- GitHub Pages配布版：公開用のファイル分割・README・`.nojekyll` を追加。EXIF情報表示におけるHTML埋め込みを廃止。
