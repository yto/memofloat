// content.js
(() => {
    const SHADOW_CSS = `
#overlay-memo-note {
  position: fixed;
  top: 80px;
  left: 80px;
  width: 260px;
  min-width: 180px;
  min-height: 120px;
  max-width: 90vw;
  max-height: 80vh;
  background: #f4f4f4;
  border: 1px solid #cccccc;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 2147483647;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

#overlay-memo-header {
  cursor: move;
  padding: 4px 8px;
  background: #e6e6e6;
  border-bottom: 1px solid #cccccc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  box-sizing: border-box;
}

#overlay-memo-title {
  font-size: 12px;
  color: #555555;
}

#overlay-memo-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* buttons */
.overlay-memo-btn {
  all: unset;
  box-sizing: border-box;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
  font-size: 11px;
  line-height: 1.2;
  white-space: nowrap;

  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #bbbbbb;
  background: #f9f9f9;
  cursor: pointer;
}

.overlay-memo-btn:hover {
  background: #e6e6e6;
}

#overlay-memo-close-btn {
  padding: 2px 8px;
}

#overlay-memo-content {
  flex: 1;
  padding: 8px;
  font-size: 13px;
  line-height: 1.5;
  overflow: auto;
  outline: none;
  box-sizing: border-box;
  background: #ffffff;
}

#overlay-memo-resize {
  width: 14px;
  height: 14px;
  align-self: flex-end;
  margin: 0 4px 4px 0;
  cursor: se-resize;
  position: relative;
}

#overlay-memo-resize::before {
  content: "";
  position: absolute;
  right: 0;
  bottom: 0;
  width: 80%;
  height: 80%;
  border-right: 2px solid #bbbbbb;
  border-bottom: 2px solid #bbbbbb;
  box-sizing: border-box;
}
  `;

    const STORAGE_KEY_PREFIX = 'memofloat_';
    const DEFAULT_FONT_SIZE = 13; // px

    const storageKey = STORAGE_KEY_PREFIX + location.origin + location.pathname;

    let note = null;
    let content = null;
    let fontSizePx = DEFAULT_FONT_SIZE;
    let isVisible = false;
    let savedState = null;
    let shadowRoot = null;

    // 事前に状態だけロードしておく
    chrome.storage.local.get(storageKey, (result) => {
        const s = result[storageKey];
        if (s) {
            savedState = s;
            if (typeof s.fontSize === 'number') {
                fontSizePx = s.fontSize;
            }
            if (s.visible === true) {
                showNote();
            }
        }
    });

    // ------------------------
    // メモ生成（必要になったときに1回だけ）
    // ------------------------
    function createNoteIfNeeded() {
        if (note) return;

        // ★ Shadow DOM のホスト要素を作る
        const host = document.createElement('div');
        host.id = 'memofloat-host';
        // ページ側のレイアウトに影響されないよう、fixed にしておくと安心
        host.style.position = 'fixed';
        host.style.top = '0';
        host.style.left = '0';
        host.style.zIndex = '2147483647';

        document.documentElement.appendChild(host);

        // ★ Shadow root を作成
        shadowRoot = host.attachShadow({ mode: 'open' });

        // ★ Shadow 内に style を注入
        const styleEl = document.createElement('style');
        styleEl.textContent = SHADOW_CSS;
        shadowRoot.appendChild(styleEl);

        // ここから先は今までとほぼ同じ
        note = document.createElement('div');
        note.id = 'overlay-memo-note';

        const header = document.createElement('div');
        header.id = 'overlay-memo-header';

        const title = document.createElement('span');
        title.id = 'overlay-memo-title';
        title.textContent = 'Memo';

        const controls = document.createElement('div');
        controls.id = 'overlay-memo-controls';

        const smallerBtn = document.createElement('button');
        smallerBtn.className = 'overlay-memo-btn';
        smallerBtn.id = 'overlay-memo-font-smaller';
        smallerBtn.textContent = 'A-';

        const largerBtn = document.createElement('button');
        largerBtn.className = 'overlay-memo-btn';
        largerBtn.id = 'overlay-memo-font-larger';
        largerBtn.textContent = 'A+';

        const clearBtn = document.createElement('button');
        clearBtn.className = 'overlay-memo-btn';
        clearBtn.id = 'overlay-memo-clear-btn';
        clearBtn.textContent = 'Clear';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'overlay-memo-btn';
        closeBtn.id = 'overlay-memo-close-btn';
        closeBtn.textContent = '×';

        controls.appendChild(smallerBtn);
        controls.appendChild(largerBtn);
        controls.appendChild(clearBtn);
        controls.appendChild(closeBtn);

        header.appendChild(title);
        header.appendChild(controls);

        content = document.createElement('div');
        content.id = 'overlay-memo-content';
        content.contentEditable = 'true';
        content.spellcheck = false;
        content.style.fontSize = fontSizePx + 'px';

        const resizeHandle = document.createElement('div');
        resizeHandle.id = 'overlay-memo-resize';

        note.appendChild(header);
        note.appendChild(content);
        note.appendChild(resizeHandle);

        // ★ ここが一番大事：note を document ではなく shadowRoot に追加
        shadowRoot.appendChild(note);

        // ------------------------
        // 保存されている状態の復元
        // ------------------------
        if (savedState) {
            if (typeof savedState.top === 'number') {
                note.style.top = savedState.top + 'px';
            }
            if (typeof savedState.left === 'number') {
                note.style.left = savedState.left + 'px';
            }
            if (typeof savedState.width === 'number') {
                note.style.width = savedState.width + 'px';
            }
            if (typeof savedState.height === 'number') {
                note.style.height = savedState.height + 'px';
            }
            if (typeof savedState.content === 'string') {
                content.innerHTML = savedState.content;
            }
            if (typeof savedState.fontSize === 'number') {
                fontSizePx = savedState.fontSize;
                content.style.fontSize = fontSizePx + 'px';
            }
        }

        // ------------------------
        // 状態保存（debounce付き）
        // ------------------------
        let saveTimer = null;
        function scheduleSaveState() {
            if (saveTimer) clearTimeout(saveTimer);
            saveTimer = setTimeout(saveState, 300);
        }

        function saveState() {
            if (!note || !content) return;

            let rect;
            // ★ 非表示(display:none)のときは、前回保存していた位置・サイズをそのまま使う
            if (note.style.display === 'none' && savedState) {
                rect = {
                    top: savedState.top,
                    left: savedState.left,
                    width: savedState.width,
                    height: savedState.height
                };
            } else {
                rect = note.getBoundingClientRect();
            }

            const currentFontSize = parseInt(
                window.getComputedStyle(content).fontSize,
                10
            ) || DEFAULT_FONT_SIZE;

            const data = {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                content: content.innerHTML,
                fontSize: currentFontSize,
                visible: isVisible
            };

            chrome.storage.local.set({ [storageKey]: data });
            savedState = data;
        }

        // ------------------------
        // 各種ボタン
        // ------------------------

        // クリア
        clearBtn.addEventListener('click', () => {
            content.innerHTML = '';
            scheduleSaveState();
        });

        // 閉じる（非表示にするだけ。内容は残る）
        closeBtn.addEventListener('click', () => {
            hideNote();
            scheduleSaveState();
        });

        // 文字サイズ縮小
        smallerBtn.addEventListener('click', () => {
            fontSizePx = Math.max(8, fontSizePx - 1);
            content.style.fontSize = fontSizePx + 'px';
            scheduleSaveState();
        });

        // 文字サイズ拡大
        largerBtn.addEventListener('click', () => {
            fontSizePx = Math.min(40, fontSizePx + 1);
            content.style.fontSize = fontSizePx + 'px';
            scheduleSaveState();
        });

        // contenteditable 変更
        content.addEventListener('input', () => {
            scheduleSaveState();
        });

        // ------------------------
        // ドラッグ移動（ヘッダがハンドル）
        // ------------------------
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        function onMouseMoveDrag(e) {
            if (!isDragging) return;
            const newLeft = e.clientX - dragOffsetX;
            const newTop = e.clientY - dragOffsetY;

            note.style.left = Math.max(0, newLeft) + 'px';
            note.style.top = Math.max(0, newTop) + 'px';
        }

        function onMouseUpDrag() {
            if (!isDragging) return;
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMoveDrag);
            document.removeEventListener('mouseup', onMouseUpDrag);
            scheduleSaveState();
        }

        header.addEventListener('mousedown', (e) => {
            // ボタン類のクリックはドラッグ扱いにしない
            if (e.target instanceof HTMLElement && e.target.classList.contains('overlay-memo-btn')) {
                return;
            }

            isDragging = true;
            const rect = note.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;

            document.addEventListener('mousemove', onMouseMoveDrag);
            document.addEventListener('mouseup', onMouseUpDrag);

            e.preventDefault();
        });

        // ------------------------
        // リサイズ（右下ハンドル）
        // ------------------------
        let isResizing = false;
        let startWidth = 0;
        let startHeight = 0;
        let startX = 0;
        let startY = 0;

        function onMouseMoveResize(e) {
            if (!isResizing) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const newWidth = Math.max(180, startWidth + deltaX);
            const newHeight = Math.max(120, startHeight + deltaY);

            note.style.width = newWidth + 'px';
            note.style.height = newHeight + 'px';
        }

        function onMouseUpResize() {
            if (!isResizing) return;
            isResizing = false;
            document.removeEventListener('mousemove', onMouseMoveResize);
            document.removeEventListener('mouseup', onMouseUpResize);
            scheduleSaveState();
        }

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            const rect = note.getBoundingClientRect();
            startWidth = rect.width;
            startHeight = rect.height;
            startX = e.clientX;
            startY = e.clientY;

            document.addEventListener('mousemove', onMouseMoveResize);
            document.addEventListener('mouseup', onMouseUpResize);

            e.preventDefault();
        });

        // ページ離脱前に一応保存
        window.addEventListener('beforeunload', () => {
            saveState();
        });
    }

    // ------------------------
    // 表示 / 非表示
    // ------------------------
    function showNote() {
        createNoteIfNeeded();
        if (!note) return;
        note.style.display = 'flex';
        isVisible = true;
    }

    function hideNote() {
        if (!note) return;
        note.style.display = 'none';
        isVisible = false;
    }

    function toggleNote() {
        if (!note || !isVisible) {
            showNote();
        } else {
            hideNote();
        }
    }

    // ------------------------
    // background からのメッセージを受ける
    // ------------------------
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message && message.type === 'toggle-memo') {
            toggleNote();
        }
    });
})();
