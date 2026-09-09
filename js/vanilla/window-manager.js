// window-manager.js - ウィンドウのボタン動作・Zインデックス管理
// 最大化/最小化に加えて、エッジへのドラッグ（スナップ）とその復元を管理する。

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
export function closeWindow(windowEl) {
    const content = windowEl.querySelector('.window-content');
    content.classList.add('closing');

    content.addEventListener('transitionend', () => {
        content.classList.remove('closing');
        windowEl.remove();
        notifyShelfModeChange();
        window.dispatchEvent(new CustomEvent('window-closed', { detail: { appId: windowEl.dataset.appId } }));
    }, { once: true });

    // transitionendが発火しない場合の保険
    setTimeout(() => {
        if (windowEl.parentNode) {
            content.classList.remove('closing');
            windowEl.remove();
            notifyShelfModeChange();
            window.dispatchEvent(new CustomEvent('window-closed', { detail: { appId: windowEl.dataset.appId } }));
        }
    }, 250);
}

// ---------------------------------------------------------------------------
// ジオメトリ・状態管理ヘルパ
// ---------------------------------------------------------------------------

// neodragインスタンスを破棄し、transformをクリアする
function destroyDrag(windowEl) {
    if (windowEl._dragInstance) {
        windowEl._dragInstance.destroy();
        windowEl._dragInstance = null;
    }
    windowEl.style.transform = 'none';
}

// neodragは位置をtransformで保持するため、style.left/top は初期値のままになっている。
// スナップショットを取る前に、現在の表示位置をinline style（絶対座標）へ書き戻す。
function materializePosition(windowEl) {
    const rect = windowEl.getBoundingClientRect();
    windowEl.style.left = `${rect.left}px`;
    windowEl.style.top = `${rect.top}px`;
    windowEl.style.width = `${rect.width}px`;
    windowEl.style.height = `${rect.height}px`;
    destroyDrag(windowEl);
}

// 現在のジオメトリを復元用データセットへ保存
function snapshotGeometry(windowEl) {
    windowEl.dataset.savedLeft = windowEl.style.left;
    windowEl.dataset.savedTop = windowEl.style.top;
    windowEl.dataset.savedWidth = windowEl.style.width;
    windowEl.dataset.savedHeight = windowEl.style.height;
}

// 保存済みジオメトリを復元してデータセットを削除
function restoreGeometry(windowEl) {
    windowEl.style.left = windowEl.dataset.savedLeft ?? '0px';
    windowEl.style.top = windowEl.dataset.savedTop ?? '0px';
    windowEl.style.width = windowEl.dataset.savedWidth ?? '480px';
    windowEl.style.height = windowEl.dataset.savedHeight ?? '600px';
    delete windowEl.dataset.savedLeft;
    delete windowEl.dataset.savedTop;
    delete windowEl.dataset.savedWidth;
    delete windowEl.dataset.savedHeight;
}

// 遷移クラス（maximizing / snapping）を消す後始末。transitionendと保険の両方から
// 呼ばれても1回しか実行されないようにガードする。
function endStateAnimation(windowEl, onEnd) {
    let done = false;
    const finish = () => {
        if (done) return;
        done = true;
        windowEl.classList.remove('maximizing', 'snapping');
        if (onEnd) onEnd();
    };
    windowEl.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 250);
}

// スナップ表示（クラス・属性・transform）を解除する。保存済みジオメトリは保持する。
function clearSnapVisuals(windowEl) {
    windowEl.removeAttribute('data-snapped');
    delete windowEl.dataset.snapped;
    windowEl.classList.remove('snapped-left', 'snapped-right');
    destroyDrag(windowEl);
}

// ---------------------------------------------------------------------------
// 最大化 / スナップ / 復元
// ---------------------------------------------------------------------------

/**
 * ウィンドウの最大化トグル。
 * 最大化中なら復元、それ以外（浮遊・スナップ中）なら最大化する。
 */
export function maximizeWindow(windowEl) {
    // 最大化中の再クリックは復元
    if (windowEl.hasAttribute('data-maximized')) {
        restoreWindow(windowEl);
        return;
    }

    const wasSnapped = windowEl.dataset.snapped;
    if (wasSnapped) {
        // スナップ中からの最大化: 復元用ジオメトリはスナップ時に保存済み
        clearSnapVisuals(windowEl);
    } else {
        // 浮遊中のドラッグ位置を確定させてから保存（復元位置の正確化）
        // neodrag の transform を絶対座標に変換してスタイルに適用
        const rect = windowEl.getBoundingClientRect();
        windowEl.style.left = `${rect.left}px`;
        windowEl.style.top = `${rect.top}px`;
        windowEl.style.width = `${rect.width}px`;
        windowEl.style.height = `${rect.height}px`;
        destroyDrag(windowEl);
        snapshotGeometry(windowEl);
    }

    windowEl.classList.add('maximizing', 'maximized');
    windowEl.style.left = '0';
    windowEl.style.top = '0';
    windowEl.style.width = '100%';
    windowEl.style.height = '100%';
    windowEl.setAttribute('data-maximized', '');

    endStateAnimation(windowEl, () => notifyShelfModeChange());
}

/**
 * 最大化・スナップ状態を解除して保存済みジオメトリへ戻す。
 */
export function restoreWindow(windowEl) {
    const isMaximized = windowEl.hasAttribute('data-maximized');
    const snapRegion = windowEl.dataset.snapped;
    if (!isMaximized && !snapRegion) return;

    // アニメーション用クラス（最大化→復元 / スナップ→復元 で同じ遷移を使う）
    windowEl.classList.add('maximizing');
    restoreGeometry(windowEl);
    windowEl.removeAttribute('data-maximized');
    windowEl.removeAttribute('data-snapped');
    delete windowEl.dataset.snapped;
    windowEl.classList.remove('maximized', 'snapped-left', 'snapped-right');

    let done = false;
    const finish = () => {
        if (done) return;
        done = true;
        windowEl.classList.remove('maximizing', 'snapping');
        // ドラッグを再生成（最大化/スナップ中は破棄されている）
        if (windowEl._dragInstance) {
            windowEl._dragInstance.destroy();
        }
        windowEl.style.transform = 'none';
        windowEl._dragInstance = new Draggable(windowEl, createDragOptions());
        notifyShelfModeChange();
    };
    windowEl.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 250);
}

/**
 * ウィンドウを画面の左/右半分へスナップする。
 * @param {HTMLElement} windowEl
 * @param {'left'|'right'} region
 */
export function snapWindow(windowEl, region) {
    if (region !== 'left' && region !== 'right') return;
    if (windowEl.hasAttribute('data-maximized')) return;

    const wasSnapped = windowEl.dataset.snapped;
    if (wasSnapped) {
        // 反対側への切替: ドラッグ中に残った transform をクリア
        destroyDrag(windowEl);
    } else {
        // 初回スナップ: 浮遊ジオメトリを保存
        materializePosition(windowEl);
        snapshotGeometry(windowEl);
    }

    windowEl.classList.remove('snapped-left', 'snapped-right', 'snapping');
    windowEl.classList.add('snapping', `snapped-${region}`);
    windowEl.setAttribute('data-snapped', region);

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const halfWidth = Math.floor(viewportWidth / 2);
    windowEl.style.top = '0';
    windowEl.style.height = `${viewportHeight}px`;
    windowEl.style.width = `${halfWidth}px`;
    windowEl.style.left = region === 'left' ? '0' : `${halfWidth}px`;

    endStateAnimation(windowEl, null);

    // スナップ中でもドラッグで解除・移動できるようドラッグを有効に保つ
    if (!windowEl._dragInstance) {
        windowEl._dragInstance = new Draggable(windowEl, createDragOptions());
    }
}

/**
 * スナップを解除して、現在のドロップ位置で浮遊ウィンドウに戻す。
 * （スナップ中のウィンドウを中央付近へドラッグした時に呼ばれる）
 */
export function detachWindow(windowEl) {
    if (!windowEl.dataset.snapped) return;

    // ドラッグ先の表示位置を絶対座標として確定
    materializePosition(windowEl);
    clearSnapVisuals(windowEl);

    // スナップ前の保存値は不要になるため削除
    delete windowEl.dataset.savedLeft;
    delete windowEl.dataset.savedTop;
    delete windowEl.dataset.savedWidth;
    delete windowEl.dataset.savedHeight;

    windowEl._dragInstance = new Draggable(windowEl, createDragOptions());
}

/**
 * ドラッグ終了時に呼ばれる共通処理（window.js の onDragEnd から委譲される）。
 * エッジへのドロップで最大化/スナップを適用し、通常ドロップは位置を確定する。
 */
export function resolveWindowDragEnd(windowEl) {
    if (windowEl.hasAttribute('data-maximized')) return;

    const rect = windowEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const edge = 8; // エッジ判定の閾値(px)

    const nearTop = rect.top <= edge;
    const nearLeft = rect.left <= edge;
    const nearRight = viewportWidth - rect.right <= edge;

    if (nearTop) {
        // 上端へドロップ → 最大化
        maximizeWindow(windowEl);
        return;
    }
    if (nearLeft && !nearRight) {
        snapWindow(windowEl, 'left');
        return;
    }
    if (nearRight && !nearLeft) {
        snapWindow(windowEl, 'right');
        return;
    }

    // スナップ中ウィンドウを中央付近へドロップ → 解除して浮遊状態へ
    if (windowEl.dataset.snapped) {
        detachWindow(windowEl);
        return;
    }

    // 通常の浮遊ドラッグ: transform位置をinline化して確定（復元位置の正確化）
    materializePosition(windowEl);
    windowEl._dragInstance = new Draggable(windowEl, createDragOptions());
}

// ---------------------------------------------------------------------------
// 最小化 / ボタン・イベント設定
// ---------------------------------------------------------------------------

// ウィンドウの最小化
export function minimizeWindow(windowEl) {
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

// ウィンドウのボタンイベントとフォーカスを設定
export function setupWindowButtons(windowEl) {
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

    // タイトルバーのダブルクリックで最大化⇔復元（ChromeOS風）
    const titleBar = windowEl.querySelector('.title-bar');
    titleBar?.addEventListener('dblclick', (e) => {
        if (e.target.closest('.title-bar-right')) return;
        if (windowEl.hasAttribute('data-maximized') || windowEl.dataset.snapped) {
            restoreWindow(windowEl);
        } else {
            maximizeWindow(windowEl);
        }
    });
}

// 各ウィンドウの初期化
export function initWindowManager() {
    const windows = document.querySelectorAll('.window');

    windows.forEach(windowEl => {
        setupWindowButtons(windowEl);
    });

    // ドラッグ＆リサイズを初期化
    initWindowDrag();
    initWindowResize();
}
