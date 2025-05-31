// Main background script that initializes Insight Buddy

import { initializeInsightBuddy } from "./background/insight-buddy"

// Initialize the extension when installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed/updated:", details.reason)

  // Initialize Insight Buddy
  initializeInsightBuddy()

  // Open welcome page on first install
  if (details.reason === "install") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("tabs/welcome.html")
    })
  }
})

// Re-initialize on startup
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started, re-initializing Insight Buddy")
  initializeInsightBuddy()
})

// Export empty object to make this a module
export { }
