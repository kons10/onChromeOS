// window-manager.js - ウィンドウのボタン動作・Zインデックス管理

import { initWindowDrag, initWindowResize } from './window.js';

let zIndexCounter = 100;

// ウィンドウを最前面にする
function focusWindow(windowEl) {
    // 他のウィンドウからfocusedクラスを削除
    document.querySelectorAll('.window-focused').forEach(el => {
        el.classList.remove('window-focused');
    });

    windowEl.classList.add('window-focused');
    windowEl.style.zIndex = ++zIndexCounter;
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
        }, { once: true });

        // transitionendが発火しない場合の保険
        setTimeout(() => {
            windowEl.classList.remove('maximizing', 'maximized');
        }, 250);
    } else {
        // 現在の位置を保存
        windowEl.dataset.savedLeft = windowEl.style.left;
        windowEl.dataset.savedTop = windowEl.style.top;
        windowEl.dataset.savedWidth = windowEl.style.width;
        windowEl.dataset.savedHeight = windowEl.style.height;

        windowEl.classList.add('maximizing', 'maximized');
        windowEl.style.left = '0';
        windowEl.style.top = '0';
        windowEl.style.width = '100%';
        windowEl.style.height = '100%';
        windowEl.setAttribute('data-maximized', '');

        windowEl.addEventListener('transitionend', () => {
            windowEl.classList.remove('maximizing');
        }, { once: true });

        setTimeout(() => {
            windowEl.classList.remove('maximizing');
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
function initWindowManager() {
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

initWindowManager();
