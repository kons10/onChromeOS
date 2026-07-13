// window.js - ウィンドウのドラッグ＆リサイズ機能

export function initWindowDrag() {
    const windowEl = document.querySelector('.window');
    const titleBar = document.querySelector('.title-bar');
    
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let rafId = null;
    
    // ドラッグ用オーバーレイ要素
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '9999';
    overlay.style.cursor = 'move';
    overlay.style.backgroundColor = 'transparent';

    // 初期位置を設定
    const rect = windowEl.getBoundingClientRect();
    windowEl.style.left = `${rect.left}px`;
    windowEl.style.top = `${rect.top}px`;
    windowEl.style.transform = 'none';
    
    function startDrag(clientX, clientY) {
        isDragging = true;
        windowEl.classList.add('dragging');
        
        // 全画面オーバーレイを追加してイベントをキャプチャ
        document.body.appendChild(overlay);
        
        startX = clientX;
        startY = clientY;
        
        const currentRect = windowEl.getBoundingClientRect();
        initialLeft = currentRect.left;
        initialTop = currentRect.top;
    }
    
    function handleMove(clientX, clientY) {
        if (!isDragging) return;
        
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        
        const newLeft = initialLeft + deltaX;
        const newTop = initialTop + deltaY;
        
        // requestAnimationFrame でスムーズに更新
        if (rafId === null) {
            rafId = requestAnimationFrame(() => {
                windowEl.style.left = `${newLeft}px`;
                windowEl.style.top = `${newTop}px`;
                rafId = null;
            });
        }
    }
    
    function endDrag() {
        if (!isDragging) return;
        
        isDragging = false;
        windowEl.classList.remove('dragging');
        
        // オーバーレイを削除
        if (overlay.parentNode) {
            document.body.removeChild(overlay);
        }
        
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }
    
    // ポインタイベントを使用してマウスとタッチを統一
    titleBar.addEventListener('pointerdown', (e) => {
        // ボタン領域のクリックはドラッグを開始しない
        if (e.target.closest('.title-bar-right')) return;
        // 最大化状態ではドラッグを開始しない
        if (windowEl.hasAttribute('data-maximized')) return;
        
        e.preventDefault();
        titleBar.setPointerCapture(e.pointerId);
        startDrag(e.clientX, e.clientY);
    });
    
    // Overlay に対して PointerMove と PointerUp をバインド
    overlay.addEventListener('pointermove', (e) => {
        handleMove(e.clientX, e.clientY);
    });
    
    overlay.addEventListener('pointerup', (e) => {
        overlay.releasePointerCapture(e.pointerId);
        endDrag();
    });
    
    overlay.addEventListener('pointercancel', endDrag);
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

        if (rafId === null) {
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
        if (!isResizing) return;
        
        isResizing = false;
        windowEl.classList.remove('resizing');
        if (overlay.parentNode) {
            document.body.removeChild(overlay);
        }
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    handles.forEach(handle => {
        handle.addEventListener('pointerdown', (e) => {
            if (windowEl.hasAttribute('data-maximized')) return;
            e.preventDefault();
            handle.setPointerCapture(e.pointerId);
            startResize(e, handle);
        });
    });

    overlay.addEventListener('pointermove', (e) => {
        handleResize(e.clientX, e.clientY);
    });
    
    overlay.addEventListener('pointerup', (e) => {
        overlay.releasePointerCapture(e.pointerId);
        endResize();
    });
    
    overlay.addEventListener('pointercancel', endResize);
}
