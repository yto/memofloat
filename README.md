# MemoFloat

A lightweight Chrome extension that displays a floating memo overlay on any webpage.  
Move it, resize it, type freely — and MemoFloat remembers everything per page.

## Features

- **Floating memo overlay** on any webpage  
- **Draggable** — move freely anywhere on screen  
- **Resizable** — drag from the bottom-right corner  
- **Content editable** — type directly into the memo  
- **Auto-save** per page:
  - memo content  
  - font size  
  - position  
  - size  
  - visibility state  
- **Clean grayscale design**
- **Keyboard shortcut support**
- **One memo per page** (not global)

## Usage

### Show / hide the memo
Click the extension icon, or use the keyboard shortcut:

- **Mac**: `Alt` + `Shift` + `M`  
- **Windows / Linux**: `Alt` + `Shift` + `M`

(You can customize these at `chrome://extensions/shortcuts`)

### Buttons

- **A+ / A-** — Increase / decrease font size  
- **Clear** — Clear memo content  
- **× Close** — Hide memo (visibility is saved)

### Auto-save behavior
MemoFloat automatically saves the memo state when:

- You edit text  
- You move or resize the memo  
- You close or show the memo  
- You leave or reload the page  

When you revisit the same page, MemoFloat restores the previous memo  
**only if it was visible last time**.

## Installation

### From Chrome Web Store  
Coming soon…

## Permissions

- `storage` — Save memo content and state  
- `tabs` — Required to send toggle commands to the active tab

No tracking, analytics, or external network requests.  
MemoFloat stores everything *locally* in your browser.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for the full text.
