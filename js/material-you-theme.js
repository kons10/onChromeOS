import {
    argbFromHex,
    hexFromArgb,
    themeFromSourceColor,
} from 'https://esm.sh/@material/material-color-utilities@0.4.0';

const SOURCE_COLOR = '#5b6ee1';
const DEFAULT_MODE = 'auto';
const MODES = new Set(['light', 'dark', 'auto']);
const mq = window.matchMedia('(prefers-color-scheme: dark)');
let selectedMode = DEFAULT_MODE;

const THEME_DIALOG_HTML = `
<div class="theme-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="theme-dialog-title">
    <section class="theme-dialog">
        <div class="theme-dialog-icon" aria-hidden="true"></div>
        <h2 id="theme-dialog-title">Material Youを有効化</h2>
        <p>一時的な見た目変更。起動中だけ反映。表示modeを選択。</p>
        <div class="theme-options" role="radiogroup" aria-label="Theme mode">
            <button type="button" class="theme-option" data-theme-mode="light" role="radio" aria-checked="false">
                <span>Light</span>
                <small>明るい色</small>
            </button>
            <button type="button" class="theme-option" data-theme-mode="dark" role="radio" aria-checked="false">
                <span>Dark</span>
                <small>暗い色</small>
            </button>
            <button type="button" class="theme-option" data-theme-mode="auto" role="radio" aria-checked="true">
                <span>Auto</span>
                <small>OS設定に追従</small>
            </button>
        </div>
        <button type="button" class="theme-continue">開始</button>
    </section>
</div>
`;

function setCssVariables(target, values) {
    Object.entries(values).forEach(([key, value]) => {
        target.style.setProperty(`--md-sys-color-${key.replaceAll('_', '-')}`, hexFromArgb(value));
    });
}

function applyTheme(mode = selectedMode) {
    selectedMode = MODES.has(mode) ? mode : DEFAULT_MODE;
    const isDark = selectedMode === 'dark' || (selectedMode === 'auto' && mq.matches);
    const theme = themeFromSourceColor(argbFromHex(SOURCE_COLOR));
    const scheme = isDark ? theme.schemes.dark : theme.schemes.light;

    setCssVariables(document.documentElement, scheme.toJSON());
    document.documentElement.dataset.themeMode = selectedMode;
    document.documentElement.dataset.colorScheme = isDark ? 'dark' : 'light';
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
}

function updateSelectedOption(dialog, mode) {
    dialog.querySelectorAll('[data-theme-mode]').forEach((button) => {
        const selected = button.dataset.themeMode === mode;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-checked', String(selected));
    });
}

function closeDialog(overlay) {
    overlay.classList.remove('visible');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
}

function showStartupThemeDialog() {
    document.body.insertAdjacentHTML('beforeend', THEME_DIALOG_HTML);
    const overlay = document.querySelector('.theme-dialog-overlay');
    const dialog = overlay.querySelector('.theme-dialog');

    updateSelectedOption(dialog, selectedMode);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    dialog.addEventListener('click', (event) => {
        const modeButton = event.target.closest('[data-theme-mode]');
        if (modeButton) {
            applyTheme(modeButton.dataset.themeMode);
            updateSelectedOption(dialog, selectedMode);
            return;
        }

        if (event.target.closest('.theme-continue')) {
            closeDialog(overlay);
        }
    });

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeDialog(overlay);
    });

    overlay.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeDialog(overlay);
    });
}

export function initMaterialYouTheme() {
    applyTheme(DEFAULT_MODE);
    mq.addEventListener('change', () => {
        if (selectedMode === 'auto') applyTheme(selectedMode);
    });
    showStartupThemeDialog();
}
