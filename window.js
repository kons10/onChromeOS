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

initWindowDrag();
