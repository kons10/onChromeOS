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
    const minWidth = 300;
    const minHeight = 200;

    // リサイズ中の状態はアクティブなウィンドウ1つ分だけ持つ。
    // overlay はリサイズ開始時に body へ追加し、終了時に取り除く（元実装と同じ挙動）。
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

    function startResize(e, windowEl, handle) {
        // 最大化状態ではリサイズを開始しない
        if (windowEl.hasAttribute('data-maximized')) return;
        
        // Pointer capture を使用して iframe を含むすべての要素を通過してイベントを受信
        if (e.target.setPointerCapture) {
            e.target.setPointerCapture(e.pointerId || 1);
        }
        
        isResizing = true;
        activeWindow = windowEl;
        currentHandle = handle;
        windowEl.classList.add('resizing');

        // Match cursor
        const cursor = window.getComputedStyle(handle).cursor;
        overlay.style.cursor = cursor;
        document.body.appendChild(overlay);

        // DOM 読み取りは最初に一度だけ行う（レイアウトスラッシング防止）
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        startX = clientX;
        startY = clientY;

        // getBoundingClientRect はここで一度だけ呼び出し（読み取り操作）
        const rect = windowEl.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        startLeft = rect.left;
        startTop = rect.top;

        e.preventDefault();
    }

    function handleResize(clientX, clientY) {
        if (!isResizing || !activeWindow) return;

        // 前回の更新がまだ処理中の場合はスキップ（不要な再計算を防止）
        if (rafId !== null) return;

        const windowEl = activeWindow;
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

        // requestAnimationFrame でブラウザの描画タイミングに同期
        rafId = requestAnimationFrame(() => {
            // すべての DOM 書き込みを一つのフレームにまとめる（レイアウトスラッシング防止）
            windowEl.style.width = `${newWidth}px`;
            windowEl.style.height = `${newHeight}px`;
            windowEl.style.left = `${newLeft}px`;
            windowEl.style.top = `${newTop}px`;
            rafId = null;
        });
    }

    function endResize(e) {
        if (isResizing) {
            // Pointer capture の解放
            if (e && e.target && e.target.releasePointerCapture) {
                e.target.releasePointerCapture(e.pointerId || 1);
            }
            
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

    // 各ウィンドウ配下のリサイズハンドルを設定（複数ウィンドウ対応）
    document.querySelectorAll('.window').forEach(windowEl => {
        const handles = windowEl.querySelectorAll('.resize-handle');
        handles.forEach(handle => {
            // Pointer events を使用してより正確なポインター追跡を実現
            handle.addEventListener('pointerdown', (e) => {
                startResize(e, windowEl, handle);
            });
        });
    });

    // overlay 上のポインター移動／終了を一度だけ取り付ける
    overlay.addEventListener('pointermove', (e) => {
        handleResize(e.clientX, e.clientY);
    });
    overlay.addEventListener('pointerup', endResize);
    overlay.addEventListener('pointercancel', endResize);
}
