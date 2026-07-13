// window.js - ウィンドウのドラッグ＆ドロップ機能

export function initWindowDrag() {
    const windowEl = document.querySelector('.window');
    const titleBar = document.querySelector('.title-bar');
    
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let rafId = null;
    let pendingLeft = 0;
    let pendingTop = 0;
    
    // ドラッグ用オーバーレイ要素
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '9999';
    overlay.style.cursor = 'move';
    overlay.style.backgroundColor = 'transparent'; // 透明に設定

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
        
        pendingLeft = initialLeft + deltaX;
        pendingTop = initialTop + deltaY;
        
        if (!rafId) {
            rafId = requestAnimationFrame(() => {
                windowEl.style.left = `${pendingLeft}px`;
                windowEl.style.top = `${pendingTop}px`;
                rafId = null;
            });
        }
    }
    
    function endDrag() {
        if (isDragging) {
            isDragging = false;
            windowEl.classList.remove('dragging');
            
            // オーバーレイを削除
            if (overlay.parentNode) {
                document.body.removeChild(overlay);
            }
            
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }
    }
    
    // マウスイベント (TitleBarで開始、Overlayで継続)
    titleBar.addEventListener('mousedown', (e) => {
        startDrag(e.clientX, e.clientY);
    });
    
    // Overlayに対してMouseMoveとMouseUpをバインドするのがポイント
    overlay.addEventListener('mousemove', (e) => {
        handleMove(e.clientX, e.clientY);
    });
    
    overlay.addEventListener('mouseup', endDrag);
    
    // タッチイベント
    titleBar.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY);
    }, { passive: false });
    
    overlay.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
    }, { passive: false });
    
    overlay.addEventListener('touchend', endDrag);
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

initWindowDrag();
initWindowResize();
