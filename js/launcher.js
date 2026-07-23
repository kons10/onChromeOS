// launcher.js - ランチャー（Everythingボタン）のダイアログとウィンドウ作成

import { focusWindow, nextZIndex, closeWindow, maximizeWindow, minimizeWindow, setupWindowButtons } from './window-manager.js';
import { initWindowDrag, initWindowResize, createDragOptions } from './window.js';
import { Draggable } from 'https://esm.sh/@neodrag/vanilla@2.3.1';

// ダイアログ用のHTMLテンプレート
const DIALOG_HTML = `
<div class="launcher-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="launcher-dialog-title">
    <div class="launcher-dialog">
        <h2 id="launcher-dialog-title">新しいウィンドウを作成</h2>
        <form class="launcher-form">
            <div class="form-field">
                <label for="launcher-url">何をiframeしますか？ (URL)</label>
                <input type="url" id="launcher-url" name="url" placeholder="https://example.com" required>
            </div>
            <div class="form-field">
                <label for="launcher-title">タイトルを入力</label>
                <input type="text" id="launcher-title" name="title" placeholder="ウィンドウのタイトル" required maxlength="50">
            </div>
            <div class="form-actions">
                <button type="button" class="btn-cancel">キャンセル</button>
                <button type="submit" class="btn-create">作成</button>
            </div>
        </form>
    </div>
</div>
`;

// ダイアログ用のスタイル（インラインで注入）
const DIALOG_STYLES = `
.launcher-dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.2s ease;
}
.launcher-dialog-overlay.visible {
    opacity: 1;
}
.launcher-dialog {
    background: var(--md-sys-color-surface, #fff);
    border-radius: 16px;
    padding: 24px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    transform: scale(0.9) translateY(20px);
    transition: transform 0.2s ease;
}
.launcher-dialog-overlay.visible .launcher-dialog {
    transform: scale(1) translateY(0);
}
.launcher-dialog h2 {
    margin: 0 0 20px;
    font-size: 1.25rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface, #202124);
}
.launcher-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.form-field label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface, #202124);
}
.form-field input {
    padding: 10px 12px;
    border: 1px solid var(--md-sys-color-outline, #e0e0e0);
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    background: var(--md-sys-color-surface, #fff);
    color: var(--md-sys-color-on-surface, #202124);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
}
.form-field input:focus {
    border-color: var(--md-sys-color-primary, #1f6feb);
    box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.15);
}
.form-field input::placeholder {
    color: var(--md-sys-color-on-surface-variant, #9aa0a6);
}
.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
}
.btn-cancel, .btn-create {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    border: none;
    transition: background-color 0.2s, box-shadow 0.2s;
}
.btn-cancel {
    background: transparent;
    color: var(--md-sys-color-on-surface, #202124);
}
.btn-cancel:hover {
    background: var(--md-sys-color-surface-dim, #eee);
}
.btn-create {
    background: var(--md-sys-color-primary, #1f6feb);
    color: white;
}
.btn-create:hover {
    background: #175cd3;
}
.btn-create:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
`;

// スタイルを一度だけ注入
let stylesInjected = false;
function injectStyles() {
    if (stylesInjected) return;
    const styleEl = document.createElement('style');
    styleEl.textContent = DIALOG_STYLES;
    document.head.appendChild(styleEl);
    stylesInjected = true;
}

// URLの簡易検証
function isValidUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

// カスケード配置のオフセット計算
function getCascadePosition(windowWidth, windowHeight) {
    const existingWindows = document.querySelectorAll('.window:not([data-minimized])');
    const cascadeOffset = 30; // ウィンドウごとのズレ幅
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const shelfHeight = 48;

    // 初期位置：ビューポートの中央
    let baseX = Math.max(40, (viewportWidth - windowWidth) / 2);
    let baseY = Math.max(20, (viewportHeight - shelfHeight - windowHeight) / 2);

    // 既存ウィンドウの数だけオフセットを加算
    const offset = existingWindows.length * cascadeOffset;

    let x = baseX + offset;
    let y = baseY + offset;

    // 画面内に収まるよう制約
    x = Math.min(x, viewportWidth - windowWidth - 40);
    y = Math.min(y, viewportHeight - shelfHeight - windowHeight - 20);

    // 最小位置を保証
    x = Math.max(20, x);
    y = Math.max(10, y);

    return { x, y };
}

// 新しいウィンドウ要素を作成
function createWindowElement(appId, url, title) {
    const windowWidth = 800;
    const windowHeight = 600;
    const { x, y } = getCascadePosition(windowWidth, windowHeight);

    const windowEl = document.createElement('div');
    windowEl.className = 'window';
    windowEl.dataset.appId = appId;
    windowEl.style.left = `${x}px`;
    windowEl.style.top = `${y}px`;
    windowEl.style.width = `${windowWidth}px`;
    windowEl.style.height = `${windowHeight}px`;
    windowEl.style.zIndex = nextZIndex();

    windowEl.innerHTML = `
        <div class="window-content">
            <div class="title-bar">
                <div class="title-bar-left">
                    <div class="title-text">${escapeHtml(title)}</div>
                </div>
                <div class="title-bar-right">
                    <md-icon-button title="Minimize" aria-label="Minimize" data-minimize>
                        <md-icon></md-icon>
                    </md-icon-button>
                    <md-icon-button title="Maximize" aria-label="Maximize" data-maximize>
                        <md-icon></md-icon>
                    </md-icon-button>
                    <md-icon-button title="Close" aria-label="Close" data-close>
                        <md-icon></md-icon>
                    </md-icon-button>
                </div>
            </div>
            <iframe src="${escapeHtml(url)}" title="${escapeHtml(title)}"></iframe>
        </div>
        <!-- Resize Handles -->
        <div class="resize-handle handle-t"></div>
        <div class="resize-handle handle-b"></div>
        <div class="resize-handle handle-l"></div>
        <div class="resize-handle handle-r"></div>
        <div class="resize-handle handle-tl"></div>
        <div class="resize-handle handle-tr"></div>
        <div class="resize-handle handle-bl"></div>
        <div class="resize-handle handle-br"></div>
    `;

    return windowEl;
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// シェルフのアプリボタンを追加
function addShelfAppButton(appId, title) {
    const shelfCenter = document.querySelector('.shelf-center');
    if (!shelfCenter) return;

    const btn = document.createElement('md-icon-button');
    btn.className = 'shelf-app-btn';
    btn.dataset.appId = appId;
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.innerHTML = `<md-icon class="shelf-icon"></md-icon>`;

    // 既存のボタンと同じ動作を付与
    btn.addEventListener('click', () => {
        const windowEl = document.querySelector(`.window[data-app-id="${appId}"]`);
        if (!windowEl) return;

        if (windowEl.hasAttribute('data-minimized')) {
            windowEl.removeAttribute('data-minimized');
            windowEl.style.display = '';
        }
        if (windowEl.style.display === 'none') {
            windowEl.style.display = '';
        }
        focusWindow(windowEl);
    });

    shelfCenter.appendChild(btn);
}

// ウィンドウが閉じられた時のシェルフボタン自動削除（カスタムアプリのみ）
function initWindowClosedListener() {
    window.addEventListener('window-closed', (e) => {
        const appId = e.detail.appId;
        // 動的に作られたカスタムアプリのみシェルフボタンを削除
        if (appId && appId.startsWith('app-')) {
            const btn = document.querySelector(`.shelf-app-btn[data-app-id="${appId}"]`);
            if (btn) btn.remove();
        }
    });
}

// ダイアログを表示
function showLauncherDialog() {
    injectStyles();

    // 既存のダイアログがあれば削除
    const existing = document.querySelector('.launcher-dialog-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.innerHTML = DIALOG_HTML;
    const dialogEl = overlay.firstElementChild;
    document.body.appendChild(dialogEl);

    // アニメーション用に微小遅延
    requestAnimationFrame(() => {
        dialogEl.classList.add('visible');
    });

    const form = dialogEl.querySelector('.launcher-form');
    const urlInput = dialogEl.querySelector('#launcher-url');
    const titleInput = dialogEl.querySelector('#launcher-title');
    const cancelBtn = dialogEl.querySelector('.btn-cancel');
    const createBtn = dialogEl.querySelector('.btn-create');

    // フォーカス
    urlInput.focus();

    // バリデーション
    function validate() {
        const urlValid = isValidUrl(urlInput.value.trim());
        const titleValid = titleInput.value.trim().length > 0;
        createBtn.disabled = !(urlValid && titleValid);
    }
    urlInput.addEventListener('input', validate);
    titleInput.addEventListener('input', validate);
    validate();

    // キャンセル
    function closeDialog() {
        dialogEl.classList.remove('visible');
        setTimeout(() => dialogEl.remove(), 200);
    }

    cancelBtn.addEventListener('click', closeDialog);
    dialogEl.addEventListener('click', (e) => {
        if (e.target === dialogEl) closeDialog();
    });

    // ESCキーで閉じる
    function onKeydown(e) {
        if (e.key === 'Escape') {
            closeDialog();
            document.removeEventListener('keydown', onKeydown);
        }
    }
    document.addEventListener('keydown', onKeydown);

    // フォーム送信
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const url = urlInput.value.trim();
        const title = titleInput.value.trim();

        if (!isValidUrl(url) || !title) return;

        closeDialog();
        document.removeEventListener('keydown', onKeydown);

        // 新しいウィンドウを作成
        createNewWindow(url, title);
    });
}

// 新しいウィンドウを作成して初期化
export function createNewWindow(url, title, appId) {
    // ユニークなappIdを生成（指定されていなければ）
    if (!appId) {
        appId = `app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }

    const windowEl = createWindowElement(appId, url, title);
    document.querySelector('main').appendChild(windowEl);

    // ウィンドウのボタンイベントを設定（window-manager.js の共有関数を利用）
    setupWindowButtons(windowEl);

    // ドラッグ・リサイズを初期化
    const rect = windowEl.getBoundingClientRect();
    windowEl.style.left = `${rect.left}px`;
    windowEl.style.top = `${rect.top}px`;
    windowEl.style.transform = 'none';
    windowEl._dragInstance = new Draggable(windowEl, createDragOptions());

    // リサイズハンドルを設定
    setupResizeHandles(windowEl);

    // フォーカス
    focusWindow(windowEl);

    // シェルフボタンを追加（既存でなければ）
    if (!document.querySelector(`.shelf-app-btn[data-app-id="${appId}"]`)) {
        addShelfAppButton(appId, title);
    }
    
    return windowEl;
}

// リサイズハンドルの設定（window.jsのinitWindowResizeから必要な部分を抽出・調整）
function setupResizeHandles(windowEl) {
    const minWidth = 300;
    const minHeight = 200;

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '9999';
    overlay.style.backgroundColor = 'transparent';

    let isResizing = false;
    let activeWindow = null;
    let currentHandle = null;
    let startX, startY, startWidth, startHeight, startLeft, startTop;
    let rafId = null;

    function startResize(e, handle) {
        if (windowEl.hasAttribute('data-maximized')) return;
        isResizing = true;
        activeWindow = windowEl;
        currentHandle = handle;
        windowEl.classList.add('resizing');

        const cursor = window.getComputedStyle(handle).cursor;
        overlay.style.cursor = cursor;
        document.body.appendChild(overlay);

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        startX = clientX;
        startY = clientY;

        const rect = windowEl.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        startLeft = rect.left;
        startTop = rect.top;

        e.preventDefault();
    }

    function handleResize(clientX, clientY) {
        if (!isResizing || !activeWindow) return;

        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;

        const isRight = currentHandle.classList.contains('handle-r') || currentHandle.classList.contains('handle-tr') || currentHandle.classList.contains('handle-br');
        const isLeft = currentHandle.classList.contains('handle-l') || currentHandle.classList.contains('handle-tl') || currentHandle.classList.contains('handle-bl');
        const isBottom = currentHandle.classList.contains('handle-b') || currentHandle.classList.contains('handle-bl') || currentHandle.classList.contains('handle-br');
        const isTop = currentHandle.classList.contains('handle-t') || currentHandle.classList.contains('handle-tl') || currentHandle.classList.contains('handle-tr');

        if (isRight) {
            newWidth = Math.max(minWidth, startWidth + deltaX);
        } else if (isLeft) {
            const calculatedWidth = startWidth - deltaX;
            if (calculatedWidth >= minWidth) {
                newWidth = calculatedWidth;
                newLeft = startLeft + deltaX;
            } else {
                newWidth = minWidth;
                newLeft = startLeft + (startWidth - minWidth);
            }
        }

        if (isBottom) {
            newHeight = Math.max(minHeight, startHeight + deltaY);
        } else if (isTop) {
            const calculatedHeight = startHeight - deltaY;
            if (calculatedHeight >= minHeight) {
                newHeight = calculatedHeight;
                newTop = startTop + deltaY;
            } else {
                newHeight = minHeight;
                newTop = startTop + (startHeight - minHeight);
            }
        }

        if (!rafId) {
            rafId = requestAnimationFrame(() => {
                windowEl.style.width = `${newWidth}px`;
                windowEl.style.height = `${newHeight}px`;
                windowEl.style.left = `${newLeft}px`;
                windowEl.style.top = `${newTop}px`;
                rafId = null;
            });
        }
    }

    function endResize() {
        if (isResizing) {
            isResizing = false;
            if (activeWindow) {
                activeWindow.classList.remove('resizing');
            }
            activeWindow = null;
            currentHandle = null;
            if (overlay.parentNode) {
                document.body.removeChild(overlay);
            }
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }
    }

    const handles = windowEl.querySelectorAll('.resize-handle');
    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => startResize(e, handle));
        handle.addEventListener('touchstart', (e) => startResize(e, handle), { passive: false });
    });

    overlay.addEventListener('mousemove', (e) => handleResize(e.clientX, e.clientY));
    overlay.addEventListener('mouseup', endResize);
    overlay.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        handleResize(touch.clientX, touch.clientY);
    }, { passive: false });
    overlay.addEventListener('touchend', endResize);
}

// ランチャー初期化
export function initLauncher() {
    const launcherBtn = document.querySelector('.shelf-left md-icon-button[data-launcher]');
    if (!launcherBtn) {
        console.warn('Launcher button not found');
        return;
    }

    launcherBtn.addEventListener('click', showLauncherDialog);

    // ウィンドウが閉じられた時のシェルフボタン自動削除を初期化
    initWindowClosedListener();
}
