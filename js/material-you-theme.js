import {
    argbFromHex,
    hexFromArgb,
    themeFromSourceColor,
} from 'https://esm.sh/@material/material-color-utilities@0.4.0';

const DEFAULT_SOURCE_COLOR = '#5b6ee1';
const SOURCE_COLORS = [
    { name: 'Blue', value: '#5b6ee1' },
    { name: 'Green', value: '#0b8043' },
    { name: 'Yellow', value: '#f9ab00' },
    { name: 'Red', value: '#d93025' },
    { name: 'Purple', value: '#9334e6' },
    { name: 'Pink', value: '#d01884' },
];
const DEFAULT_MODE = 'auto';
const MODES = new Set(['light', 'dark', 'auto']);
const mq = window.matchMedia('(prefers-color-scheme: dark)');
let selectedMode = DEFAULT_MODE;
let selectedSourceColor = DEFAULT_SOURCE_COLOR;

const THEME_DIALOG_HTML = `
<div class="theme-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="theme-dialog-title">
    <section class="theme-dialog">
        <div class="theme-dialog-icon" aria-hidden="true"></div>
        <h2 id="theme-dialog-title">Material Youを有効化</h2>
        <p>一時的な見た目変更。起動中だけ反映。色と表示modeを選択。</p>
        <h3>色palette</h3>
        <div class="theme-palette" role="radiogroup" aria-label="Source color">
            ${SOURCE_COLORS.map((color) => `
                <button
                    type="button"
                    class="theme-swatch"
                    data-source-color="${color.value}"
                    role="radio"
                    aria-checked="false"
                    aria-label="${color.name}"
                    style="--theme-swatch-color: ${color.value}"
                ></button>
            `).join('')}
        </div>
        <h3>表示mode</h3>
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

function applyTheme(mode = selectedMode, sourceColor = selectedSourceColor) {
    selectedMode = MODES.has(mode) ? mode : DEFAULT_MODE;
    selectedSourceColor = SOURCE_COLORS.some((color) => color.value === sourceColor)
        ? sourceColor
        : DEFAULT_SOURCE_COLOR;
    const isDark = selectedMode === 'dark' || (selectedMode === 'auto' && mq.matches);
    const theme = themeFromSourceColor(argbFromHex(selectedSourceColor));
    const scheme = isDark ? theme.schemes.dark : theme.schemes.light;

    setCssVariables(document.documentElement, scheme.toJSON());
    document.documentElement.dataset.themeMode = selectedMode;
    document.documentElement.dataset.colorScheme = isDark ? 'dark' : 'light';
    document.documentElement.dataset.sourceColor = selectedSourceColor;
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
}

function updateSelectedOptions(dialog) {
    dialog.querySelectorAll('[data-theme-mode]').forEach((button) => {
        const selected = button.dataset.themeMode === selectedMode;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-checked', String(selected));
    });

    dialog.querySelectorAll('[data-source-color]').forEach((button) => {
        const selected = button.dataset.sourceColor === selectedSourceColor;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-checked', String(selected));
    });
}

function closeDialog(overlay) {
    if (!overlay || overlay.dataset.closing === 'true') return;

    overlay.dataset.closing = 'true';
    overlay.classList.remove('visible');

    const removeOverlay = () => overlay.remove();
    overlay.addEventListener('transitionend', removeOverlay, { once: true });
    window.setTimeout(removeOverlay, 250);
}

function showStartupThemeDialog() {
    document.body.insertAdjacentHTML('beforeend', THEME_DIALOG_HTML);
    const overlay = document.querySelector('.theme-dialog-overlay');
    const dialog = overlay.querySelector('.theme-dialog');

    updateSelectedOptions(dialog);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    dialog.addEventListener('click', (event) => {
        const sourceButton = event.target.closest('[data-source-color]');
        if (sourceButton) {
            applyTheme(selectedMode, sourceButton.dataset.sourceColor);
            updateSelectedOptions(dialog);
            return;
        }

        const modeButton = event.target.closest('[data-theme-mode]');
        if (modeButton) {
            applyTheme(modeButton.dataset.themeMode, selectedSourceColor);
            updateSelectedOptions(dialog);
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
