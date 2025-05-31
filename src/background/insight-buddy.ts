// Background service worker for Insight Buddy extension

import { analysisEngine } from "~modules/analysis"
import type { AnalysisRequest } from "~modules/analysis/types"
import { messageBus } from "~modules/messaging"
import { storageManager } from "~modules/storage"

// Initialize extension
export function initializeInsightBuddy() {
  console.log("Initializing Insight Buddy...")

  // Setup context menus
  setupContextMenus()

  // Setup message handlers
  setupMessageHandlers()

  // Setup keyboard shortcuts
  setupKeyboardShortcuts()

  // Setup side panel behavior
  setupSidePanel()
}

// Context Menu Setup
function setupContextMenus() {
  // Remove existing menus
  chrome.contextMenus.removeAll()

  // Main context menu when text is selected
  chrome.contextMenus.create({
    id: "insight-buddy-main",
    title: "Phân tích với Insight Buddy",
    contexts: ["selection"]
  })

  // Sub-menu items
  const menuItems = [
    { id: "summarize", title: "📝 Tóm tắt đoạn này", icon: "📝" },
    { id: "explain", title: "💡 Giải thích thuật ngữ", icon: "💡" },
    { id: "critique", title: "🤔 Đặt câu hỏi phản biện", icon: "🤔" },
    { id: "context", title: "📚 Từ điển ngữ cảnh", icon: "📚" },
    { id: "bias", title: "⚖️ Kiểm tra thiên vị", icon: "⚖️" },
    { id: "separator", type: "separator" },
    { id: "expand", title: "➕ Mở rộng kiến thức", icon: "➕" }
  ]

  menuItems.forEach(item => {
    if (item.type === "separator") {
      chrome.contextMenus.create({
        type: "separator",
        parentId: "insight-buddy-main",
        contexts: ["selection"]
      })
    } else {
      chrome.contextMenus.create({
        id: `insight-${item.id}`,
        title: item.title,
        parentId: "insight-buddy-main",
        contexts: ["selection"]
      })
    }
  })

  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!info.selectionText || !tab?.id) return

    const action = info.menuItemId.toString().replace("insight-", "")

    // Send message to content script to get context
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "get-selection-context",
      selection: info.selectionText
    })

    // Analyze text
    const analysisRequest: AnalysisRequest = {
      type: mapActionToAnalysisType(action),
      inputs: {
        text: info.selectionText,
        context: response?.context || "",
        url: tab.url,
        title: tab.title
      },
      options: {
        depth: "standard",
        includeRecommendations: true,
        language: "vi"
      }
    }

    // Process analysis
    const result = await analysisEngine.analyze(analysisRequest)

    // Send result to sidebar
    await chrome.sidePanel.open({ tabId: tab.id })

    // Send result to sidebar
    messageBus.publish("insight-results", "analysis-complete", {
      result,
      context: {
        selection: info.selectionText,
        action,
        tabId: tab.id
      }
    })
  })
}

// Message Handlers
function setupMessageHandlers() {
  // Create channels
  messageBus.createChannel("insight-content", { persistent: true })
  messageBus.createChannel("insight-results", { persistent: true })
  messageBus.createChannel("insight-ui", { persistent: true })

  // Handle content script messages
  messageBus.subscribe("insight-content", async (message) => {
    switch (message.type) {
      case "analyze-paragraph":
        await handleParagraphAnalysis(message.payload)
        break

      case "quick-analysis":
        await handleQuickAnalysis(message.payload)
        break

      case "get-settings":
        await handleGetSettings(message.payload)
        break
    }
  })

  // Handle UI messages
  messageBus.subscribe("insight-ui", async (message) => {
    switch (message.type) {
      case "update-settings":
        await handleUpdateSettings(message.payload)
        break

      case "clear-history":
        await handleClearHistory(message.payload)
        break

      case "export-results":
        await handleExportResults(message.payload)
        break
    }
  })
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
  chrome.commands.onCommand.addListener(async (command) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return

    switch (command) {
      case "analyze-selection":
        chrome.tabs.sendMessage(tab.id, { type: "analyze-selection" })
        break

      case "toggle-sidebar":
        chrome.sidePanel.open({ tabId: tab.id })
        break

      case "quick-questions":
        chrome.tabs.sendMessage(tab.id, { type: "quick-questions" })
        break
    }
  })
}

// Side Panel Setup
function setupSidePanel() {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      .catch(error => console.error("Side panel setup error:", error))
  }
}

// Handler Functions
async function handleParagraphAnalysis(payload: any) {
  const { text, context, tabId, elementId } = payload

  try {
    const result = await analysisEngine.analyze({
      type: "content",
      inputs: { content: text, context },
      options: { depth: "quick" }
    })

    // Send result back to content script
    chrome.tabs.sendMessage(tabId, {
      type: "analysis-result",
      elementId,
      result
    })
  } catch (error) {
    console.error("Analysis error:", error)
  }
}

async function handleQuickAnalysis(payload: any) {
  const { text, analysisType, tabId, position } = payload

  try {
    const result = await analysisEngine.analyze({
      type: analysisType,
      inputs: { text },
      options: { depth: "quick" }
    })

    // Send quick result
    chrome.tabs.sendMessage(tabId, {
      type: "quick-result",
      position,
      result: {
        type: analysisType,
        content: formatQuickResult(result, analysisType)
      }
    })
  } catch (error) {
    console.error("Quick analysis error:", error)
  }
}

async function handleGetSettings(payload: any) {
  const storage = storageManager.get()
  const settings = await storage.get("insight-settings") || getDefaultSettings()

  chrome.tabs.sendMessage(payload.tabId, {
    type: "settings-update",
    settings
  })
}

async function handleUpdateSettings(payload: any) {
  const storage = storageManager.get()
  await storage.set("insight-settings", payload.settings)

  // Broadcast settings update to all tabs
  const tabs = await chrome.tabs.query({})
  tabs.forEach(tab => {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: "settings-update",
        settings: payload.settings
      })
    }
  })
}

async function handleClearHistory(payload: any) {
  const storage = storageManager.get()
  await storage.delete("insight-history")

  messageBus.publish("insight-results", "history-cleared", {})
}

async function handleExportResults(payload: any) {
  const { format, results } = payload
  // Implementation for export functionality
}

// Helper Functions
function mapActionToAnalysisType(action: string): string {
  const mapping: Record<string, string> = {
    summarize: "summary",
    explain: "content",
    critique: "content",
    context: "content",
    bias: "bias",
    expand: "content"
  }
  return mapping[action] || "content"
}

function formatQuickResult(result: any, analysisType: string): string {
  switch (analysisType) {
    case "summary":
      return result.output?.summary || result.sections?.[0]?.content || "Không thể tạo tóm tắt"

    case "questions":
      const questions = result.recommendations?.slice(0, 2) || []
      return questions.map((q: any) => `• ${q.title}`).join("\n")

    case "explain":
      return result.sections?.find((s: any) => s.title.includes("Explanation"))?.content || "Không tìm thấy giải thích"

    default:
      return result.output || "Phân tích đã hoàn thành"
  }
}

function getDefaultSettings() {
  return {
    enableFloatingIcons: true,
    enableAutoAnalysis: false,
    aiModel: "gpt",
    analysisLanguage: "vi",
    theme: "light",
    showConfidenceScores: true,
    floatingIconPosition: "top-right",
    keyboardShortcuts: {
      analyzeSelection: "Ctrl+Shift+A",
      toggleSidebar: "Ctrl+Shift+S",
      quickQuestions: "Ctrl+Shift+Q"
    }
  }
}

// Export for use in main background script
export const insightBuddyHandlers = {
  handleParagraphAnalysis,
  handleQuickAnalysis,
  handleGetSettings,
  handleUpdateSettings
}
