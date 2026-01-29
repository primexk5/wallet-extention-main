chrome.runtime.onInstalled.addListener(() => {
  console.log("Wallet Extension installed successfully.");
});

// Listen for messages from popup or content script if needed