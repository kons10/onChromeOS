// window-manager.js - ウィンドウのボタン動作・Zインデックス管理

import { Draggable } from 'https://esm.sh/@neodrag/vanilla@2.3.1';
import { initWindowDrag, initWindowResize, createDragOptions } from './window.js';

// Zインデックスはこのモジュール内部でのみ管理される単調増加カウンタ。
// かつて window._zIndexCounter でグローバル共有していたが、
// モジュールのカプセル化のため nextZIndex() 経由で外部に公開する。
let zIndexCounter = 100;

/**
 * 次の Zインデックス値を返す（呼び出しのたびに単調増加）。
 * shelf.js など外部からフォーカス時に利用する。
 */
export function nextZIndex() {
    return ++zIndexCounter;
}

/**
 * 最大化ウィンドウの有無を判定し、シェルフモード変更イベントをdispatch。
 */
function notifyShelfModeChange() {
    const hasLarge = document.querySelector('.window[data-maximized]') !== null;
    window.dispatchEvent(new CustomEvent('shelf-mode-change', { detail: { hasLarge } }));
}

// ウィンドウを最前面にする
export function focusWindow(windowEl) {
    // 他のウィンドウからfocusedクラスを削除
    document.querySelectorAll('.window-focused').forEach(el => {
        el.classList.remove('window-focused');
    });

    windowEl.classList.add('window-focused');
    windowEl.style.zIndex = nextZIndex();
}

// ウィンドウを閉じる
function closeWindow(windowEl) {
    const content = windowEl.querySelector('.window-content');
    content.classList.add('closing');

    content.addEventListener('transitionend', () => {
        content.classList.remove('closing');
        windowEl.style.display = 'none';
    }, { once: true });

    // transitionendが発火しない場合の保険
    setTimeout(() => {
        content.classList.remove('closing');
        windowEl.style.display = 'none';
    }, 250);
}

// ウィンドウの最大化トグル
function maximizeWindow(windowEl) {
    const isMaximized = windowEl.hasAttribute('data-maximized');

    if (isMaximized) {
        // 復元
        windowEl.classList.add('maximizing');
        windowEl.style.left = windowEl.dataset.savedLeft;
        windowEl.style.top = windowEl.dataset.savedTop;
        windowEl.style.width = windowEl.dataset.savedWidth;
        windowEl.style.height = windowEl.dataset.savedHeight;
        windowEl.removeAttribute('data-maximized');
        delete windowEl.dataset.savedLeft;
        delete windowEl.dataset.savedTop;
        delete windowEl.dataset.savedWidth;
        delete windowEl.dataset.savedHeight;

        windowEl.addEventListener('transitionend', () => {
            windowEl.classList.remove('maximizing', 'maximized');
            notifyShelfModeChange();
        }, { once: true });

        // transitionendが発火しない場合の保険
        setTimeout(() => {
            windowEl.classList.remove('maximizing', 'maximized');
            notifyShelfModeChange();
        }, 250);

        // neodragインスタンスを再生成（最大化時に破棄されているため、無条件で再生成）
        if (windowEl._dragInstance) {
            windowEl._dragInstance.destroy();
        }
        windowEl._dragInstance = new Draggable(windowEl, createDragOptions());
    } else {
        // 現在の位置を保存
        windowEl.dataset.savedLeft = windowEl.style.left;
        windowEl.dataset.savedTop = windowEl.style.top;
        windowEl.dataset.savedWidth = windowEl.style.width;
        windowEl.dataset.savedHeight = windowEl.style.height;

        // neodragインスタンスを破棄（最大化中のtransform競合を回避）
        if (windowEl._dragInstance) {
            windowEl._dragInstance.destroy();
            windowEl._dragInstance = null;
        }
        // neodragが付与したtransformをクリア（最大化レイアウトを確実に反映）
        windowEl.style.transform = 'none';

        windowEl.classList.add('maximizing', 'maximized');
        windowEl.style.left = '0';
        windowEl.style.top = '0';
        windowEl.style.width = '100%';
        windowEl.style.height = '100%';
        windowEl.setAttribute('data-maximized', '');

        windowEl.addEventListener('transitionend', () => {
            windowEl.classList.remove('maximizing');
            notifyShelfModeChange();
        }, { once: true });

        setTimeout(() => {
            windowEl.classList.remove('maximizing');
            notifyShelfModeChange();
        }, 250);
    }
}

// ウィンドウの最小化
function minimizeWindow(windowEl) {
    const content = windowEl.querySelector('.window-content');
    windowEl.classList.add('minimizing');
    content.classList.add('minimizing');

    content.addEventListener('transitionend', () => {
        content.classList.remove('minimizing');
        windowEl.classList.remove('minimizing');
        windowEl.style.display = 'none';
        windowEl.setAttribute('data-minimized', '');
    }, { once: true });

    setTimeout(() => {
        content.classList.remove('minimizing');
        windowEl.classList.remove('minimizing');
        windowEl.style.display = 'none';
        windowEl.setAttribute('data-minimized', '');
    }, 250);
}

// 各ウィンドウの初期化
export function initWindowManager() {
    const windows = document.querySelectorAll('.window');

    windows.forEach(windowEl => {
        // クリックでフォーカス
        windowEl.addEventListener('mousedown', () => focusWindow(windowEl));
        windowEl.addEventListener('touchstart', () => focusWindow(windowEl), { passive: true });

        // 閉じるボタン
        windowEl.querySelector('[data-close]')?.addEventListener('click', () => {
            closeWindow(windowEl);
        });

        // 最大化ボタン
        windowEl.querySelector('[data-maximize]')?.addEventListener('click', () => {
            maximizeWindow(windowEl);
        });

        // 最小化ボタン
        windowEl.querySelector('[data-minimize]')?.addEventListener('click', () => {
            minimizeWindow(windowEl);
        });
    });

    // ドラッグ＆リサイズを初期化
    initWindowDrag();
    initWindowResize();
}
