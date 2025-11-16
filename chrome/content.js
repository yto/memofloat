// content.js
(() => {
  const STORAGE_KEY_PREFIX = 'memofloat_';
  const DEFAULT_FONT_SIZE = 13; // px

  const storageKey = STORAGE_KEY_PREFIX + location.origin + location.pathname;

  let note = null;
  let content = null;
  let fontSizePx = DEFAULT_FONT_SIZE;
  let isVisible = false;
  let savedState = null;

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

    document.documentElement.appendChild(note);

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

