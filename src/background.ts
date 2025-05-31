// Updated background script with full integration

import { messageBus } from "~modules/messaging"
import { storageManager } from "~modules/storage"
import { initializeInsightBuddy } from "./background/insight-buddy"
import { insightService } from "./services/insight-service"
import { offlineManager, retryManager } from "./utils/insight-utilities"

// Initialize the extension when installed or updated
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("Extension installed/updated:", details.reason)

  // Initialize Insight Buddy
  initializeInsightBuddy()

  // Initialize services
  await initializeServices()

  // Handle installation
  if (details.reason === "install") {
    // Set default settings
    const storage = storageManager.get()
    await storage.set("insight-settings", insightService.getSettings())

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
      message: "Phiên bản mới với nhiều cải tiến về hiệu suất và tính năng!"
    })
  }
})

// Re-initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log("Browser started, re-initializing Insight Buddy")
  initializeInsightBuddy()
  await initializeServices()
})

// Initialize all services
async function initializeServices() {
  console.log("Initializing Insight Buddy services...")

  // Setup message channels
  messageBus.createChannel("insight-content", { persistent: true })
  messageBus.createChannel("insight-results", { persistent: true })
  messageBus.createChannel("insight-ui", { persistent: true })
  messageBus.createChannel("insight-sync", { persistent: true })

  // Setup error handling
  setupErrorHandling()

  // Setup keep-alive
  setupKeepAlive()

  console.log("Insight Buddy services initialized")
}

// Error handling
function setupErrorHandling() {
  // Global error handler
  self.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason)

    // Send error notification to UI
    messageBus.publish("insight-ui", "error", {
      message: "Đã xảy ra lỗi không mong muốn",
      error: event.reason
    })
  })

  // Message error handler
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "error-report") {
      console.error("Error from content script:", message.error)
      // Could send to analytics service
    }
  })
}

// Keep service worker alive
function setupKeepAlive() {
  // Send periodic ping to keep service worker active
  setInterval(() => {
    chrome.storage.local.get("keep-alive", () => {
      // Just accessing storage keeps the worker alive
    })
  }, 20000) // Every 20 seconds
}

// Handle quick analysis from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "quick-analysis") {
    handleQuickAnalysis(message, sender).then(sendResponse)
    return true // Keep channel open for async response
  }
})

async function handleQuickAnalysis(message: any, sender: chrome.runtime.MessageSender) {
  const { text, analysisType, position } = message.payload

  try {
    // Check if offline
    if (offlineManager.isOffline()) {
      // Try to get from cache
      const cacheKey = `${analysisType}:${text.substring(0, 50)}`
      const cached = offlineManager.getCachedAnalysis(cacheKey)

      if (cached) {
        return {
          success: true,
          result: cached,
          fromCache: true
        }
      } else {
        return {
          success: false,
          error: "Không có kết nối mạng và không tìm thấy cache"
        }
      }
    }

    // Use retry manager for resilient API calls
    const result = await retryManager.retry(
      async () => insightService.quickAnalyze(text, analysisType),
      {
        maxRetries: 3,
        delay: 1000,
        backoff: true,
        onRetry: (attempt, error) => {
          console.log(`Retry attempt ${attempt} after error:`, error.message)
        }
      }
    )

    // Cache for offline use
    const cacheKey = `${analysisType}:${text.substring(0, 50)}`
    await offlineManager.cacheAnalysis(cacheKey, result)

    return {
      success: true,
      result
    }
  } catch (error) {
    console.error("Quick analysis error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    // Open side panel
    try {
      await chrome.sidePanel.open({ tabId: tab.id })
    } catch (error) {
      // Fallback to opening in new tab if side panel not supported
      chrome.tabs.create({
        url: chrome.runtime.getURL("tabs/dashboard.html")
      })
    }
  }
})

// Export empty object to make this a module
export { }
