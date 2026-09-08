// shortcuts.js — グローバルなキーボードショートカット
//
// ブラウザ/OS に予約されている組み合わせ（Alt+Tab や Win+矢印など）は Web ページに
// 届かないため、原則として Ctrl（Mac では Cmd）ベースのキャプチャ可能な組み合わせを使う。
//
// 割り当て:
//   Ctrl(⌘) + ↑           アクティブウィンドウを最大化
//   Ctrl(⌘) + ↓           最大化/スナップ中なら復元、それ以外は最小化
//   Ctrl(⌘) + ← / →       左/右半分へスナップ
//   Ctrl+Alt+↑↓←→         同上（Alt 付きの別名。環境によってはこちらしか届かない）
//   Alt + `（バッククォート）   ウィンドウを巡回（Shift 併用で逆順）
//   Ctrl+Alt+S            クイック設定の開閉
//   単独の Meta/⌘ キー     ランチャーの開閉（OS がキーアップを届ける場合のみ）
//   Esc                   開いているオーバーレイ（ランチャー/クイック設定）を閉じる

import {
    focusWindow, maximizeWindow, minimizeWindow, restoreWindow, snapWindow
} from './window-manager.js';
import { toggleLauncher, closeLauncher } from './launcher.js';
import { toggleQuickSettings, closeQuickSettings } from './quick-settings.js';

const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

// 入力欄でのキー入力（ショートカット無効化）を判定
function isTypingTarget(e) {
    const t = e.target;
    if (!(t instanceof Element)) return false;
    return !!t.closest('input, textarea, select, [contenteditable="true"]');
}

function activeWindow() {
    const focused = document.querySelector('.window.window-focused');
    if (focused) return focused;
    // フォーカスが無い場合は最前面（z-index 最大）の可視ウィンドウを返す
    const visible = [...document.querySelectorAll('.window')].filter(w =>
        w.style.display !== 'none' && !w.hasAttribute('data-minimized'));
    visible.sort((a, b) => (parseInt(b.style.zIndex, 10) || 0) - (parseInt(a.style.zIndex, 10) || 0));
    return visible[0] || null;
}

function handleSnapArrow(e, win) {
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (!mod || e.shiftKey) return false;
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' &&
        e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return false;
    e.preventDefault();
    if (!win) return true;

    switch (e.key) {
        case 'ArrowUp':
            maximizeWindow(win);
            break;
        case 'ArrowDown': {
            const large = win.hasAttribute('data-maximized') || win.dataset.snapped;
            if (large) {
                restoreWindow(win);
            } else {
                minimizeWindow(win);
            }
            break;
        }
        case 'ArrowLeft':
            snapWindow(win, 'left');
            break;
        case 'ArrowRight':
            snapWindow(win, 'right');
            break;
    }
    return true;
}

/** Alt+` によるウィンドウ巡回 */
function cycleWindow(dir) {
    const wins = [...document.querySelectorAll('.window')].filter(w =>
        w.style.display !== 'none' && !w.hasAttribute('data-minimized'));
    if (!wins.length) return;

    const focused = document.querySelector('.window.window-focused');
    const currentIndex = wins.indexOf(focused);
    let next;
    if (currentIndex === -1) {
        next = dir > 0 ? wins[wins.length - 1] : wins[0];
    } else {
        next = wins[(currentIndex + dir + wins.length) % wins.length];
    }
    focusWindow(next);
}

// 単独の Meta キー押下（ランチャー用）の記録。keyup と keydown は別イベント
// オブジェクトなので、モジュールレベルのフラグで受け渡す。
let metaDown = false;

function onKeyDown(e) {
    if (e.key === 'Meta' || e.key === 'OS') {
        metaDown = true;
        return;
    }
    // 他のキーと同時に押された場合はキャンセル（Cmd+C 等の通常操作を妨げない）
    metaDown = false;

    // Esc: オーバーレイを閉じる（入力欄でも有効）
    if (e.key === 'Escape') {
        closeLauncher();
        closeQuickSettings();
        return;
    }

    if (isTypingTarget(e)) return;

    // Ctrl(⌘)[+Alt]+矢印: 最大化 / 最小化 / スナップ
    if ((e.key.startsWith('Arrow'))) {
        if (handleSnapArrow(e, activeWindow())) return;
    }

    // Alt + ` : ウィンドウ巡回
    if (e.altKey && !e.ctrlKey && !e.metaKey && e.key === '`') {
        e.preventDefault();
        cycleWindow(e.shiftKey ? -1 : 1);
        return;
    }

    // Ctrl+Alt+S: クイック設定
    if (e.ctrlKey && e.altKey && !e.metaKey && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        toggleQuickSettings();
        return;
    }
}

function onKeyUp(e) {
    if (e.key === 'Meta' || e.key === 'OS') {
        if (metaDown) {
            e.preventDefault();
            toggleLauncher();
        }
        metaDown = false;
    }
}

/**
 * ショートカット全体を初期化。
 */
export function initShortcuts() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
}
