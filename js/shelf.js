// shelf.js — ChromeOS Shelf（タスクバー）の初期化・ロジック

import { focusWindow } from './window-manager.js';

/**
 * hasLargeWindow の変更を監視してシェルフモードを切り替え。
 * window-manager.js 側で shelf-mode-change カスタムイベントをdispatchする。
 */
function initShelfModeListener() {
    window.addEventListener('shelf-mode-change', (e) => {
        syncShelfMode(e.detail.hasLarge);
    });
}

/**
 * body.shelf-large クラスを切り替え、シェルフの角丸モードを変更。
 * @param {boolean} hasLarge - 最大化ウィンドウが存在するか
 */
function syncShelfMode(hasLarge) {
    if (hasLarge) {
        document.body.classList.add('shelf-large');
    } else {
        document.body.classList.remove('shelf-large');
    }
}

/**
 * ステータスバーの日時をリアルタイムで更新。
 */
function initClock() {
    const dateEl = document.querySelector('#shelf-date');
    const timeEl = document.querySelector('#shelf-time');
    if (!dateEl || !timeEl) return;

    function tick() {
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        dateEl.textContent = `${months[now.getMonth()]} ${now.getDate()}`;

        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeEl.textContent = `${hours}:${minutes}`;
    }

    tick();
    setInterval(tick, 10000); // 10秒ごとに更新
}

/**
 * シェルフのアプリボタンとウィンドウを連携させる。
 * data-app-id 属性でウィンドウとの対応を判定。
 */
function initAppButtons() {
    const buttons = document.querySelectorAll('.shelf-app-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const appId = btn.dataset.appId;
            if (!appId) return;

            const windowEl = document.querySelector(`.window[data-app-id="${appId}"]`);
            if (!windowEl) return;

            // 最小化されていれば復元
            if (windowEl.hasAttribute('data-minimized')) {
                windowEl.removeAttribute('data-minimized');
                windowEl.style.display = '';
            }

            // 非表示なら表示
            if (windowEl.style.display === 'none') {
                windowEl.style.display = '';
            }

            // フォーカス（window-manager.js の中央集権的な実装に委譲）
            focusWindow(windowEl);
        });
    });
}

/**
 * アクティブウィンドウに対応するシェルフボタンのインジケーターを更新。
 */
function initActiveAppTracking() {
    document.addEventListener('mousedown', () => updateActiveApp());
    document.addEventListener('touchstart', () => updateActiveApp(), { passive: true });

    function updateActiveApp() {
        // focusedウィンドウのapp-idを取得
        const focusedWindow = document.querySelector('.window.window-focused');
        const focusedAppId = focusedWindow?.dataset?.appId || '';

        // シェルフボタンのactive-appクラスを更新
        document.querySelectorAll('.shelf-app-btn').forEach(btn => {
            if (btn.dataset.appId === focusedAppId) {
                btn.classList.add('active-app');
            } else {
                btn.classList.remove('active-app');
            }
        });
    }
}

/**
 * シェルフシステム全体を初期化。
 */
export function initShelf() {
    initShelfModeListener();
    initClock();
    initAppButtons();
    initActiveAppTracking();
}
