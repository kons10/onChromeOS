// window.js - ウィンドウのドラッグ＆リサイズ機能
import { Draggable } from 'https://esm.sh/@neodrag/vanilla@2.3.1';

// ドラッグの neodrag オプションを生成（インスタンスの生成・再生成で共通利用）
export function createDragOptions() {
    return {
        handle: '.title-bar',
        // ボタン領域（最小化/最大化/閉じる）でのドラッグ開始を除外
        cancel: '.title-bar-right',
        // 既存の .dragging / .dragged クラス名に合わせる
        defaultClassDragging: 'dragging',
        defaultClassDragged: 'dragged',
        onDragStart: ({ rootNode }) => {
            // 最大化状態ではドラッグさせない（念のためのガード）
            if (rootNode.hasAttribute('data-maximized')) return;
            // ドラッグ中は iframe がイベントを奪うのを防ぐ
            const iframe = rootNode.querySelector('iframe');
            if (iframe) iframe.style.pointerEvents = 'none';
        },
        onDragEnd: ({ rootNode }) => {
            // ドラッグ終了時に iframe のポインター操作を元に戻す
            const iframe = rootNode.querySelector('iframe');
            if (iframe) iframe.style.pointerEvents = '';
        },
    };
}

export function initWindowDrag() {
    document.querySelectorAll('.window').forEach(windowEl => {
        // 初期位置を絶対座標に固定（CSS の translateX(-50%) 中央寄せから切り替え）
        const rect = windowEl.getBoundingClientRect();
        windowEl.style.left = `${rect.left}px`;
        windowEl.style.top = `${rect.top}px`;
        windowEl.style.transform = 'none';

        // neodrag インスタンスを生成して保持（window-manager.js から操作可能にする）
        windowEl._dragInstance = new Draggable(windowEl, createDragOptions());
    });
}

export function initWindowResize() {
    const windowEl = document.querySelector('.window');
    const handles = document.querySelectorAll('.resize-handle');

    let isResizing = false;
    let currentHandle = null;
    let startX, startY, startWidth, startHeight, startLeft, startTop;
    let rafId = null;

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '9999';
    overlay.style.backgroundColor = 'transparent';

    const minWidth = 300;
    const minHeight = 200;

    function startResize(e, handle) {
        // 最大化状態ではリサイズを開始しない
        if (windowEl.hasAttribute('data-maximized')) return;
        isResizing = true;
        currentHandle = handle;
        windowEl.classList.add('resizing');

        // Match cursor
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
        if (!isResizing) return;

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
            windowEl.classList.remove('resizing');
            if (overlay.parentNode) {
                document.body.removeChild(overlay);
            }
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }
    }

    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => startResize(e, handle));
        handle.addEventListener('touchstart', (e) => startResize(e, handle), { passive: false });
    });

    overlay.addEventListener('mousemove', (e) => {
        handleResize(e.clientX, e.clientY);
    });
    overlay.addEventListener('mouseup', endResize);

    overlay.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        handleResize(touch.clientX, touch.clientY);
    }, { passive: false });
    overlay.addEventListener('touchend', endResize);
}
