// main.js — アプリケーションのエントリポイント。
// 各モジュールは純粋な宣言のみを行い、副作用（DOM 操作・初期化）は
// ここから明示的に呼び出すことでテスト容易性と再利用性を高める。

// Material Web Components（副作用のみの外部バンドル）
import './mwc.js';

// window-manager.js は内部で window.js を import するため、
// window.js は明示的に import しなくても連鎖的に読み込まれる。
import { initWindowManager } from './window-manager.js';
import { initShelf } from './shelf.js';

initWindowManager();
initShelf();
