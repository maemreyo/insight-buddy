// src/background/index.ts

import { initializeInsightBuddy } from "./insight-buddy"

// Export empty object to make this a module
export { }

// Initialize extension when installed or updated
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("Extension installed/updated:", details.reason)

  // Initialize Insight Buddy
  await initializeInsightBuddy()

  if (details.reason === "install") {
    // Open welcome page
    chrome.tabs.create({
      url: chrome.runtime.getURL("tabs/welcome.html")
    })
  } else if (details.reason === "update") {
    // Show update notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("assets/icon-128.png"),
      title: "Insight Buddy đã được cập nhật",
      message: "Phiên bản mới với nhiều cải tiến!"
    })
  }
})

// Re-initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log("Browser started, re-initializing Insight Buddy")
  await initializeInsightBuddy()
})

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id })
    } catch (error) {
      // Fallback to popup if side panel not supported
      chrome.windows.create({
        url: chrome.runtime.getURL("sidepanel.html"),
        type: "popup",
        width: 400,
        height: 600
      })
    }
  }
})

// Keep service worker alive
setInterval(() => {
  chrome.storage.local.get("keep-alive", () => {
    // Just accessing storage keeps the worker alive
  })
}, 20000)
