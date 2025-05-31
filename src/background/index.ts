import "@plasmohq/messaging/background"

import { startHub } from "@plasmohq/messaging/pub-sub"
import { Storage } from "@plasmohq/storage"

import { setupAlarms } from "~core/alarms"
import { setupContextMenus } from "~core/context-menus"
import { setupNotifications } from "~core/notifications"
import { supabase } from "~core/supabase"
import { initializeInsightBuddy } from "./insight-buddy"

// Check if chrome is available
if (
  typeof chrome !== "undefined"
) {
  console.log("Background service worker started")

  // Start messaging hub
  startHub()

  // Initialize core services
  setupAlarms()
  setupContextMenus()
  setupNotifications()

  // Initialize Insight Buddy
  initializeInsightBuddy()

  // Initialize Supabase auth listener
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed:", event, session?.user?.email)

    if (chrome.action) {
      if (event === "SIGNED_IN") {
        chrome.action.setBadgeText({ text: "" })
      } else if (event === "SIGNED_OUT") {
        chrome.action.setBadgeText({ text: "!" })
        chrome.action.setBadgeBackgroundColor({ color: "#ef4444" })
      }
    }
  })

  // Handle extension installation
  chrome.runtime.onInstalled.addListener(async (details) => {
    const storage = new Storage()

    if (details.reason === "install") {
      await storage.set("installed_at", new Date().toISOString())

      // Set default settings with correct property names
      await storage.set("settings", {
        theme: "light",
        notifications: true,
        autoSync: true
      })

      // Initialize Supabase session
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (session) {
        console.log("Existing session found:", session.user.email)
      }

      // Open welcome/onboarding page
      chrome.tabs.create({
        url: chrome.runtime.getURL("tabs/welcome.html")
      })
    }
  })

  // Handle side panel - check if API exists (Chrome 114+)
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error(error))
  }

  // Add direct message listener for debugging
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background received message:", message, "from:", sender)

    if (message.type === "get-settings") {
      // Send default settings
      const defaultSettings = {
        enableFloatingIcons: true,
        enableAutoAnalysis: false,
        aiModel: "gpt",
        analysisLanguage: "vi",
        theme: "light",
        showConfidenceScores: true
      }

      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: "settings-update",
          settings: defaultSettings
        }).catch(err => console.error("Error sending settings:", err))
      }

      sendResponse({ success: true })
      return true
    }

    return false
  })
}
