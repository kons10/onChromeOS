// window.js - ウィンドウのドラッグ＆ドロップ機能

export function initWindowDrag() {
    const windowEl = document.querySelector('.window');
    const titleBar = document.querySelector('.title-bar');
    
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let rafId = null;
    let pendingLeft = 0;
    let pendingTop = 0;
    
    // 初期位置を設定（transform を解除して left/top で位置決め）
    const rect = windowEl.getBoundingClientRect();
    windowEl.style.left = `${rect.left}px`;
    windowEl.style.top = `${rect.top}px`;
    windowEl.style.transform = 'none';
    
    function startDrag(clientX, clientY) {
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
        if (isDragging) {
            isDragging = false;
            windowEl.classList.remove('dragging');
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }
    }
    
    // マウスイベント
    titleBar.addEventListener('mousedown', (e) => {
        startDrag(e.clientX, e.clientY);
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        handleMove(e.clientX, e.clientY);
    });
    
    document.addEventListener('mouseup', endDrag);
    
    // タッチイベント
    titleBar.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY);
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchend', endDrag);
}

// モジュールが読み込まれたら自動的に初期化
initWindowDrag();
