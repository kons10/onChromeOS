// quick-settings.js — クイック設定パネル
// シェルフ右端の .status-pill をクリックで開閉する。
// 大きな時計・日付に加え、Wi-Fi / Bluetooth / ダークテーマ のトグル（md-switch）を持つ。
// 各トグルの状態は localStorage に永続化し、再読込時にも復元する。

const STORAGE_KEY = 'chromeos-web-dummy.quick-settings';
const DEFAULT_STATE = { wifi: true, bluetooth: true, dark: false };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

let state = { ...DEFAULT_STATE };
let isOpen = false;

let panelEl = null;
let pillEl = null;
let els = { time: null, date: null, wifi: null, bluetooth: null, dark: null };

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            state = { ...DEFAULT_STATE, ...JSON.parse(raw) };
        }
    } catch (e) {
        /* localStorage が使えない環境ではデフォルトのまま */
    }
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        /* 同上 */
    }
}

function formatClock(now) {
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return {
        time: `${hours}:${minutes}`,
        date: `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`
    };
}

function updatePanelClock() {
    if (!els.time) return;
    const { time, date } = formatClock(new Date());
    els.time.textContent = time;
    els.date.textContent = date;
}

/** 現在の状態をUI（bodyクラス・スイッチ・シェルフアイコン）へ反映 */
function applyState() {
    document.body.classList.toggle('dark-theme', !!state.dark);

    if (els.wifi) els.wifi.selected = !!state.wifi;
    if (els.bluetooth) els.bluetooth.selected = !!state.bluetooth;
    if (els.dark) els.dark.selected = !!state.dark;

    if (pillEl) {
        pillEl.classList.toggle('wifi-off', !state.wifi);
        pillEl.setAttribute('aria-expanded', String(isOpen));
    }
}

function buildPanel() {
    if (panelEl) return;

    panelEl = document.createElement('section');
    panelEl.className = 'quick-settings-panel';
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-label', 'クイック設定');
    panelEl.setAttribute('aria-hidden', 'true');
    panelEl.innerHTML = `
        <div class="qs-clock">
            <div class="qs-time"></div>
            <div class="qs-date"></div>
        </div>
        <div class="qs-rows">
            <div class="qs-row">
                <span class="qs-row-label">Wi-Fi</span>
                <md-switch data-qs="wifi"></md-switch>
            </div>
            <div class="qs-row">
                <span class="qs-row-label">Bluetooth</span>
                <md-switch data-qs="bluetooth"></md-switch>
            </div>
            <div class="qs-row">
                <span class="qs-row-label">ダークテーマ</span>
                <md-switch data-qs="dark"></md-switch>
            </div>
        </div>
    `;
    document.body.appendChild(panelEl);

    els.time = panelEl.querySelector('.qs-time');
    els.date = panelEl.querySelector('.qs-date');
    els.wifi = panelEl.querySelector('[data-qs="wifi"]');
    els.bluetooth = panelEl.querySelector('[data-qs="bluetooth"]');
    els.dark = panelEl.querySelector('[data-qs="dark"]');

    els.wifi.addEventListener('change', () => {
        state.wifi = els.wifi.selected;
        saveState();
        applyState();
    });
    els.bluetooth.addEventListener('change', () => {
        state.bluetooth = els.bluetooth.selected;
        saveState();
        applyState();
    });
    els.dark.addEventListener('change', () => {
        state.dark = els.dark.selected;
        saveState();
        applyState();
    });
}

export function openQuickSettings() {
    buildPanel();
    if (isOpen) return;
    isOpen = true;
    updatePanelClock();
    applyState();
    panelEl.classList.add('open');
    panelEl.setAttribute('aria-hidden', 'false');
    // キーボード操作の起点を最初のスイッチへ
    els.wifi.focus();
}

export function closeQuickSettings() {
    if (!isOpen || !panelEl) return;
    isOpen = false;
    panelEl.classList.remove('open');
    panelEl.setAttribute('aria-hidden', 'true');
    applyState();
}

export function toggleQuickSettings() {
    if (isOpen) {
        closeQuickSettings();
    } else {
        openQuickSettings();
    }
}

/**
 * クイック設定を初期化：状態の読込・シェルフの pill への開閉イベント登録。
 */
export function initQuickSettings() {
    loadState();

    pillEl = document.querySelector('.status-pill');
    if (!pillEl) {
        console.warn('Status pill (.status-pill) not found');
        return;
    }

    // アクセシビリティ属性を付与（HTML は触らずに済ませる）
    pillEl.setAttribute('role', 'button');
    pillEl.setAttribute('tabindex', '0');
    pillEl.setAttribute('aria-haspopup', 'dialog');

    pillEl.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleQuickSettings();
    });
    pillEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleQuickSettings();
        }
    });

    // パネル外クリックで閉じる
    document.addEventListener('pointerdown', (e) => {
        if (!isOpen) return;
        if (panelEl && panelEl.contains(e.target)) return;
        if (pillEl && pillEl.contains(e.target)) return;
        closeQuickSettings();
    });

    // 時計の定期更新（パネル表示中のみ意味があるが、処理は軽い）
    setInterval(() => {
        if (isOpen) updatePanelClock();
    }, 1000);

    applyState();
}
