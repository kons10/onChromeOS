// window.js - ウィンドウのドラッグ＆リサイズ機能

export function initWindowDrag() {
    const windowEl = document.querySelector('.window');
    const titleBar = document.querySelector('.title-bar');
    
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let currentPointerId = null;
    
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
    
    function startDrag(e) {
        // ボタン領域のクリックはドラッグを開始しない
        if (e.target.closest('.title-bar-right')) return;
        // 最大化状態ではドラッグを開始しない
        if (windowEl.hasAttribute('data-maximized')) return;
        
        e.preventDefault();
        
        isDragging = true;
        currentPointerId = e.pointerId;
        windowEl.classList.add('dragging');
        
        // 全画面オーバーレイを追加してイベントをキャプチャ
        document.body.appendChild(overlay);
        
        // Pointer capture を開始
        titleBar.setPointerCapture(currentPointerId);
        
        startX = e.clientX;
        startY = e.clientY;
        
        const currentRect = windowEl.getBoundingClientRect();
        initialLeft = currentRect.left;
        initialTop = currentRect.top;
    }
    
    function handleMove(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        const newLeft = initialLeft + deltaX;
        const newTop = initialTop + deltaY;
        
        // 直接更新（requestAnimationFrame はブラウザが最適化）
        windowEl.style.left = `${newLeft}px`;
        windowEl.style.top = `${newTop}px`;
    }
    
    function endDrag(e) {
        if (!isDragging) return;
        
        isDragging = false;
        windowEl.classList.remove('dragging');
        
        // Pointer capture を解放
        if (currentPointerId !== null) {
            try {
                titleBar.releasePointerCapture(currentPointerId);
            } catch (err) {
                // Already released
            }
            currentPointerId = null;
        }
        
        // オーバーレイを削除
        if (overlay.parentNode) {
            document.body.removeChild(overlay);
        }
    }
    
    // Pointer Events で統一処理
    titleBar.addEventListener('pointerdown', startDrag);
    titleBar.addEventListener('pointermove', handleMove);
    titleBar.addEventListener('pointerup', endDrag);
    titleBar.addEventListener('pointercancel', endDrag);
    titleBar.addEventListener('lostpointercapture', endDrag);
}

export function initWindowResize() {
    const windowEl = document.querySelector('.window');
    const handles = document.querySelectorAll('.resize-handle');
    
    let isResizing = false;
    let currentHandle = null;
    let startX, startY, startWidth, startHeight, startLeft, startTop;
    let currentPointerId = null;
    
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
        
        e.preventDefault();
        
        isResizing = true;
        currentHandle = handle;
        currentPointerId = e.pointerId;
        windowEl.classList.add('resizing');
        
        // Match cursor
        const cursor = window.getComputedStyle(handle).cursor;
        overlay.style.cursor = cursor;
        document.body.appendChild(overlay);
        
        // Pointer capture を開始
        handle.setPointerCapture(currentPointerId);

        startX = e.clientX;
        startY = e.clientY;
        
        const rect = windowEl.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        startLeft = rect.left;
        startTop = rect.top;
    }

    function handleResize(e) {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
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

        // 直接更新（requestAnimationFrame はブラウザが最適化）
        windowEl.style.width = `${newWidth}px`;
        windowEl.style.height = `${newHeight}px`;
        windowEl.style.left = `${newLeft}px`;
        windowEl.style.top = `${newTop}px`;
    }

    function endResize() {
        if (!isResizing) return;
        
        isResizing = false;
        windowEl.classList.remove('resizing');
        
        // Pointer capture を解放
        if (currentPointerId !== null) {
            try {
                currentHandle.releasePointerCapture(currentPointerId);
            } catch (err) {
                // Already released
            }
            currentPointerId = null;
        }
        
        if (overlay.parentNode) {
            document.body.removeChild(overlay);
        }
    }

    handles.forEach(handle => {
        handle.addEventListener('pointerdown', (e) => {
            if (windowEl.hasAttribute('data-maximized')) return;
            startResize(e, handle);
        });
        
        handle.addEventListener('pointermove', (e) => {
            handleResize(e);
        });
        
        handle.addEventListener('pointerup', endResize);
        handle.addEventListener('pointercancel', endResize);
        handle.addEventListener('lostpointercapture', endResize);
    });
}
