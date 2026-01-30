# BetaSafe Wallet (Simple Browser Extension)

A minimal browser wallet extension prototype that demonstrates wallet creation, PIN-based unlocking, and simulated send functionality.

## Part 1 — Technologies Used
- Chrome Extension Manifest V3: [manifest.json](manifest.json)
- JavaScript (ES6): core logic in [wallet.js](wallet.js) and UI logic in [popup.js](popup.js)
- Ethers.js (for mnemonic generation): declared in [package.json](package.json) and included in [popup.html](popup.html)
- HTML/CSS: UI in [popup.html](popup.html) and styles in [style.css](style.css)
- Chrome extension APIs: background service worker [background.js](background.js) and content script [content.js](content.js)
- Storage: simple localStorage usage in [`WalletManager`](wallet.js) (see [`WalletManager.save`](wallet.js))

Key symbols:
- [`WalletManager`](wallet.js)
- [`WalletManager.generateMnemonic`](wallet.js)
- [`WalletManager.saveWallet`](wallet.js)
- [`WalletManager.unlock`](wallet.js)
- [`WalletManager.sendTransaction`](wallet.js)

## Part 2 — How to use the Extension
1. Install dependencies (to provide the `ethers` bundle referenced in [popup.html](popup.html)):
   - Run: `npm install` (see [package.json](package.json))
2. Load the extension in Chrome/Edge/Brave/Firefox:
   - Open chrome://extensions (or edge://extensions)
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extension folder (this project root)
   - The extension reads configuration from [manifest.json](manifest.json)
3. Use the popup UI:
   - Click the extension icon to open the popup ([popup.html](popup.html))
   - If no wallet exists, click "Create New Wallet" to generate a seed via [`WalletManager.generateMnemonic`](wallet.js)
   - Save the displayed seed phrase securely, confirm, then set a 4-digit PIN (stored in localStorage via [`WalletManager.saveWallet`](wallet.js))
   - Unlock with your PIN via the login view (handled by [`WalletManager.unlock`](wallet.js))
   - "Send" in the UI will simulate a transaction via [`WalletManager.sendTransaction`](wallet.js) — this demo updates local balance and history locally and does not broadcast real transactions
4. Notes & limitations:
   - Seed and PIN are not encrypted in this demo (see storage in [wallet.js](wallet.js)); do not use for real funds
   - Background/service worker logic is in [background.js](background.js); content script placeholder is [content.js](content.js)
   - UI styling in [style.css](style.css)

Files
- [manifest.json](manifest.json)
- [background.js](background.js)
- [content.js](content.js)
- [popup.html](popup.html)
- [popup.js](popup.js)
- [wallet.js](wallet.js)
- [style.css](style.css)
- [package.json](package.json)