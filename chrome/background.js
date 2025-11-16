// background.js

// 拡張アイコンをクリックしたとき
chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "toggle-memo" });
});

// ショートカットから
chrome.commands.onCommand.addListener((command) => {
    if (command === "toggle-overlay-memo") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (!tab || !tab.id) return;
            chrome.tabs.sendMessage(tab.id, { type: "toggle-memo" });
        });
    }
});
