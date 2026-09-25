// main.js — アプリケーションのエントリポイント。
// 各モジュールは純粋な宣言のみを行い、副作用（DOM 操作・初期化）は
// ここから明示的に呼び出すことでテスト容易性と再利用性を高める。

import { splash } from './splash.js';
import { initWindowManager } from './vanilla/window-manager.js';
import { initShelf } from './vanilla/shelf.js';
import { initLauncher } from './vanilla/launcher.js';
import { initQuickSettings } from './vanilla/quick-settings.js';
import { initShortcuts } from './vanilla/shortcuts.js';

splash.setStatus('Loading MWC.JS');

// Material Web Components（副作用のみの外部バンドル）
await import('./npmbundle/material.web.mjs');
splash.setStatus('Loading MWC.JS', 'done');

function initializeDesktop() {
    splash.setStatus('Initializing desktop');

    initWindowManager();
    initShelf();
    initLauncher();
    initQuickSettings();
    initShortcuts();

    splash.setStatus('Initializing desktop', 'done');
    splash.finish();
}

// MWC.JS の読み込み中に DOMContentLoaded が発火している場合があるため、
// readyState を確認してから初期化する。
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDesktop, { once: true });
} else {
    initializeDesktop();
}
