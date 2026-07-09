// window.js - ウィンドウのドラッグ＆ドロップ機能（パフォーマンス最適化版）

let dragOverlay = null;

function getDragOverlay() {
    if (!dragOverlay) {
        dragOverlay = document.createElement('div');
        dragOverlay.style.position = 'fixed';
        dragOverlay.style.inset = '0';
        dragOverlay.style.zIndex = '9999';
        dragOverlay.style.cursor = 'move';
        dragOverlay.style.backgroundColor = 'transparent';
        dragOverlay.style.touchAction = 'none';
        document.body.appendChild(dragOverlay);
    }
    return dragOverlay;
}

export function initWindowDrag() {
    const windowEl = document.querySelector('.window');
    const titleBar = document.querySelector('.title-bar');
    
    if (!windowEl || !titleBar) return;
    
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let rafId = null;
    let pendingLeft = 0;
    let pendingTop = 0;
    
    const overlay = getDragOverlay();
    
    // 初期位置を設定
    const rect = windowEl.getBoundingClientRect();
    windowEl.style.left = `${rect.left}px`;
    windowEl.style.top = `${rect.top}px`;
    windowEl.style.transform = 'none';
    
    function startDrag(clientX, clientY) {
        if (isDragging) return;
        isDragging = true;
        windowEl.classList.add('dragging');
        
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
        if (!isDragging) return;
        isDragging = false;
        windowEl.classList.remove('dragging');
        
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }
    
    // マウスイベント
    titleBar.addEventListener('mousedown', (e) => {
        startDrag(e.clientX, e.clientY);
    }, { passive: true });
    
    overlay.addEventListener('mousemove', (e) => {
        handleMove(e.clientX, e.clientY);
    }, { passive: true });
    
    overlay.addEventListener('mouseup', endDrag, { passive: true });
    
    // タッチイベント
    titleBar.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            startDrag(touch.clientX, touch.clientY);
        }
    }, { passive: true });
    
    overlay.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        }
    }, { passive: true });
    
    overlay.addEventListener('touchend', endDrag, { passive: true });
    overlay.addEventListener('touchcancel', endDrag, { passive: true });
}

initWindowDrag();
