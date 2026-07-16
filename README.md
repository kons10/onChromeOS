# ChromeOS Web Simulator

ChromeOS のデスクトップ環境を Web ブラウザ上でシミュレートするプロジェクトです。

## 概要

このプロジェクトは、HTML/CSS/JavaScript を使用して ChromeOS のユーザーインターフェースを再現します。実際の ChromeOS と連動するものではなく、あくまで UI/UX のデモンストレーションを目的としています。

## 主な機能

- **ウィンドウ管理**: ドラッグによる移動、サイズ変更、最小化/最大化/閉じる操作
- **iframe アプリケーション**: 外部 Web サイトをアプリとしてウィンド内に表示
- **レスポンシブデザイン**: 様々な画面サイズに対応

## 技術スタック

- HTML5
- CSS3 (Flexbox, Grid)
- Vanilla JavaScript (ES6+)
- iframe API

## 使用方法

1. ローカルサーバーでプロジェクトを配信（例: `python -m http.server`）し、ブラウザで `http://localhost:8000/` を開く
2. デフォルトで表示されているウィンドウを操作可能
3. ウィンドウのタイトルバーをドラッグして移動
4. ウィンドウ右下をドラッグしてリサイズ
5. タイトルバーのボタンで最小化/最大化/閉じる操作

## 開発者向け情報

### プロジェクト構成

```
├── index.html          # メイン HTML ファイル
├── css/
│   └── styles.css      # スタイル定義
└── js/
    ├── mwc.js          # Material Web Components
    ├── window.js       # ウィンドウ管理ロジック
    └── window-manager.js # ウィンドウマネージャー
```

### カスタマイズ方法

#### アプリの追加

`index.html` 内の既存の `.window` ブロックをコピーし、`<iframe>` の `src` 属性を新しいアプリの URL に設定：

```html
<div class="window">
    <div class="window-content">
        <div class="title-bar">
            <div class="title-bar-left">
                <div class="title-text">App Name</div>
            </div>
            <div class="title-bar-right">
                <!-- ボタン... -->
            </div>
        </div>
        <iframe src="https://example.com" title="App Name"></iframe>
    </div>
</div>
```

#### スタイルの変更

`css/styles.css` を編集して、色テーマやレイアウトをカスタマイズ可能。

### ブラウザ互換性

- Chrome (推奨)
- Firefox
- Safari
- Edge

※最新のブラウザバージョンでの動作を推奨

## 制限事項

- 一部の Web サイトは iframe 表示を制限しているため表示できない場合があります
- モバイルブラウザでは操作性が制限される可能性があります
- 実際の ChromeOS 機能（ファイル管理、設定など）は実装されていません

## Special Thanks

[@neodrag/vanilla Liblary](https://github.com/PuruVJ/neodrag)


## ライセンス

MIT License

## 貢献について

バグ報告や機能提案は Issue で受け付けています。

---

**注意**: このプロジェクトは教育・デモンストレーション目的であり、Google や Chromium OS とは一切関係ありません。
