const PARAMETER = 'splash';

function getSplashMode() {
    const value = new URLSearchParams(window.location.search).get(PARAMETER)?.toLowerCase();
    if (value === 'false' || value === 'none') return 'false';
    if (value === 'more') return 'more';
    return 'true';
}

const mode = getSplashMode();
let root = null;
let status = null;
let list = null;

function init() {
    root = document.getElementById('onchromeos-splash');
    status = document.getElementById('onchromeos-splash-status');
    list = document.getElementById('onchromeos-splash-list');

    if (!root || mode === 'false') {
        document.documentElement.dataset.splash = 'none';
        return;
    }

    root.hidden = false;
    root.dataset.mode = mode;
}

function setStatus(message, state = 'loading') {
    if (!root || mode !== 'more' || !list) return;

    let item = [...list.children].find((element) => element.dataset.status === message);
    if (!item) {
        item = document.createElement('div');
        item.className = 'onchromeos-splash-item';
        item.dataset.status = message;
        list.appendChild(item);
    }

    item.dataset.state = state;
    item.innerHTML = state === 'done'
        ? '<span class="onchromeos-splash-mark">✓</span><span></span>'
        : state === 'error'
            ? '<span class="onchromeos-splash-mark">!</span><span></span>'
            : '<span class="onchromeos-splash-mark">◌</span><span></span>';
    item.lastElementChild.textContent = message;

    if (status) status.textContent = message;
}

function finish() {
    if (!root || mode === 'false') return;

    root.dataset.state = 'ready';
    window.setTimeout(() => {
        root.classList.add('onchromeos-splash-hidden');
        window.setTimeout(() => {
            root.remove();
        }, 220);
    }, mode === 'more' ? 180 : 80);
}

init();

export const splash = Object.freeze({
    mode,
    setStatus,
    finish,
});

window.onChromeOSSplash = splash;
