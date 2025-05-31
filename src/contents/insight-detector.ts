// Content script for detecting paragraphs and creating floating icons

import type { PlasmoCSConfig } from "plasmo"
import { contentExtractor } from "~modules/content-extractor"
import type { Paragraph } from "~modules/content-extractor/types"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_idle"
}

interface FloatingIcon {
  id: string
  element: HTMLElement
  paragraph: Paragraph
  visible: boolean
}

class InsightDetector {
  private floatingIcons: Map<string, FloatingIcon> = new Map()
  private settings: any = null
  private observer: IntersectionObserver | null = null
  private mutationObserver: MutationObserver | null = null
  private selectedText: string = ""
  private miniMenuElement: HTMLElement | null = null
  private tooltipElement: HTMLElement | null = null

  constructor() {
    this.initialize()
  }

  private async initialize() {
    // Load settings
    await this.loadSettings()

    // Setup message listeners
    this.setupMessageListeners()

    // Setup selection listener
    this.setupSelectionListener()

    // Initial scan
    if (this.settings?.enableFloatingIcons) {
      await this.scanPage()
    }

    // Setup observers
    this.setupObservers()

    // Inject styles
    this.injectStyles()
  }

  private async loadSettings() {
    // Request settings from background
    chrome.runtime.sendMessage({
      type: "get-settings",
      tabId: chrome.devtools?.inspectedWindow?.tabId
    })
  }

  private setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case "settings-update":
          this.handleSettingsUpdate(message.settings)
          break

        case "analyze-selection":
          this.analyzeSelection()
          break

        case "quick-questions":
          this.showQuickQuestions()
          break

        case "get-selection-context":
          sendResponse(this.getSelectionContext())
          break

        case "analysis-result":
          this.handleAnalysisResult(message)
          break

        case "quick-result":
          this.showQuickResult(message)
          break
      }
      return true
    })
  }

  private setupSelectionListener() {
    document.addEventListener("selectionchange", () => {
      const selection = window.getSelection()
      if (selection && selection.toString().trim().length > 10) {
        this.selectedText = selection.toString()
      }
    })

    // Right-click listener for custom handling
    document.addEventListener("contextmenu", (e) => {
      const selection = window.getSelection()
      if (selection && selection.toString().trim().length > 10) {
        this.selectedText = selection.toString()
      }
    })
  }

  private setupObservers() {
    // Intersection observer for viewport tracking
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const iconId = entry.target.getAttribute("data-paragraph-id")
        if (!iconId) return

        const icon = this.floatingIcons.get(iconId)
        if (icon) {
          icon.visible = entry.isIntersecting
          this.updateIconVisibility(icon)
        }
      })
    }, {
      rootMargin: "50px"
    })

    // Mutation observer for dynamic content
    this.mutationObserver = new MutationObserver(() => {
      if (this.settings?.enableFloatingIcons) {
        this.debouncedScan()
      }
    })

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  private debouncedScan = debounce(() => {
    this.scanPage()
  }, 1000)

  private async scanPage() {
    try {
      // Use content extractor to find paragraphs
      const extracted = await contentExtractor.extractFromCurrentTab({
        minParagraphLength: 50,
        detectSections: true,
        scoreParagraphs: true
      })

      // Filter paragraphs
      const validParagraphs = extracted.paragraphs.filter(p => {
        const wordCount = p.text.split(/\s+/).length
        return wordCount > 50 &&
               p.importance > 0.5 &&
               !this.isExcludedElement(p.element)
      })

      // Create floating icons for new paragraphs
      validParagraphs.forEach(paragraph => {
        if (!this.floatingIcons.has(paragraph.id)) {
          this.createFloatingIcon(paragraph)
        }
      })

      // Remove icons for paragraphs that no longer exist
      this.floatingIcons.forEach((icon, id) => {
        if (!validParagraphs.find(p => p.id === id)) {
          this.removeFloatingIcon(id)
        }
      })
    } catch (error) {
      console.error("Scan page error:", error)
    }
  }

  private isExcludedElement(selector: string): boolean {
    const excludeSelectors = [
      "nav", "header", "footer", ".advertisement", ".ad",
      ".sidebar", ".comments", ".social-share"
    ]

    try {
      const element = document.querySelector(selector)
      if (!element) return true

      return excludeSelectors.some(exclude =>
        element.closest(exclude) !== null
      )
    } catch {
      return true
    }
  }

  private createFloatingIcon(paragraph: Paragraph) {
    try {
      const targetElement = document.querySelector(paragraph.element)
      if (!targetElement) return

      // Create icon container
      const iconContainer = document.createElement("div")
      iconContainer.className = "insight-buddy-icon"
      iconContainer.setAttribute("data-paragraph-id", paragraph.id)

      // Icon HTML
      iconContainer.innerHTML = `
        <div class="insight-icon-inner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      `

      // Position icon
      const position = this.calculateIconPosition(targetElement, paragraph.bounds)
      iconContainer.style.position = "absolute"
      iconContainer.style.left = `${position.x}px`
      iconContainer.style.top = `${position.y}px`

      // Add event listeners
      iconContainer.addEventListener("click", (e) => {
        e.stopPropagation()
        this.handleIconClick(paragraph, iconContainer)
      })

      iconContainer.addEventListener("mouseenter", () => {
        iconContainer.classList.add("hover")
      })

      iconContainer.addEventListener("mouseleave", () => {
        iconContainer.classList.remove("hover")
      })

      // Add to DOM
      document.body.appendChild(iconContainer)

      // Store reference
      this.floatingIcons.set(paragraph.id, {
        id: paragraph.id,
        element: iconContainer,
        paragraph,
        visible: true
      })

      // Observe for viewport changes
      if (targetElement instanceof Element) {
        this.observer?.observe(targetElement)
      }
    } catch (error) {
      console.error("Create floating icon error:", error)
    }
  }

  private calculateIconPosition(element: Element, bounds: DOMRect) {
    const rect = element.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

    let x = rect.right + scrollLeft + 10
    const y = rect.top + scrollTop

    // Adjust for viewport boundaries
    if (x + 40 > window.innerWidth + scrollLeft) {
      x = rect.left + scrollLeft - 50
    }

    return { x, y }
  }

  private removeFloatingIcon(id: string) {
    const icon = this.floatingIcons.get(id)
    if (icon) {
      icon.element.remove()
      this.floatingIcons.delete(id)
    }
  }

  private updateIconVisibility(icon: FloatingIcon) {
    if (icon.visible && this.settings?.enableFloatingIcons) {
      icon.element.style.display = "block"
    } else {
      icon.element.style.display = "none"
    }
  }

  private handleIconClick(paragraph: Paragraph, iconElement: HTMLElement) {
    // Create mini menu
    this.showMiniMenu(paragraph, iconElement)
  }

  private showMiniMenu(paragraph: Paragraph, iconElement: HTMLElement) {
    // Remove existing menu
    this.closeMiniMenu()

    // Create menu element
    const menu = document.createElement("div")
    menu.className = "insight-buddy-mini-menu"
    menu.innerHTML = `
      <button data-action="quickSummary" class="menu-item">
        <span class="icon">📝</span>
        <span>Tóm tắt</span>
      </button>
      <button data-action="askQuestions" class="menu-item">
        <span class="icon">🤔</span>
        <span>Đặt câu hỏi</span>
      </button>
      <button data-action="explainTerms" class="menu-item">
        <span class="icon">💡</span>
        <span>Giải thích</span>
      </button>
      <button data-action="more" class="menu-item">
        <span class="icon">➕</span>
        <span>Thêm</span>
      </button>
    `

    // Position menu
    const iconRect = iconElement.getBoundingClientRect()
    const x = iconRect.right + 5
    const y = iconRect.top

    menu.style.position = "fixed"
    menu.style.left = `${x}px`
    menu.style.top = `${y}px`
    menu.style.zIndex = "10001"

    // Adjust if out of viewport
    setTimeout(() => {
      const menuRect = menu.getBoundingClientRect()
      if (menuRect.right > window.innerWidth) {
        menu.style.left = `${iconRect.left - menuRect.width - 5}px`
      }
      if (menuRect.bottom > window.innerHeight) {
        menu.style.top = `${window.innerHeight - menuRect.height - 10}px`
      }
    }, 0)

    // Add event listeners
    menu.querySelectorAll("button").forEach(button => {
      button.addEventListener("click", (e) => {
        e.stopPropagation()
        const action = button.getAttribute("data-action")
        if (action) {
          this.handleMiniMenuAction(action, paragraph)
        }
      })
    })

    // Add to DOM
    document.body.appendChild(menu)
    this.miniMenuElement = menu

    // Close on click outside
    setTimeout(() => {
      document.addEventListener("click", this.closeMiniMenuHandler)
    }, 0)
  }

  private closeMiniMenuHandler = (e: MouseEvent) => {
    if (this.miniMenuElement && !this.miniMenuElement.contains(e.target as Node)) {
      this.closeMiniMenu()
    }
  }

  private closeMiniMenu() {
    if (this.miniMenuElement) {
      this.miniMenuElement.remove()
      this.miniMenuElement = null
      document.removeEventListener("click", this.closeMiniMenuHandler)
    }
  }

  private async handleMiniMenuAction(action: string, paragraph: Paragraph) {
    this.closeMiniMenu()

    // Send request to background
    chrome.runtime.sendMessage({
      type: "quick-analysis",
      payload: {
        text: paragraph.text,
        analysisType: this.mapActionToType(action),
        tabId: chrome.devtools?.inspectedWindow?.tabId,
        position: paragraph.bounds
      }
    })

    // Show loading tooltip
    this.showTooltip("Đang phân tích...", paragraph.bounds, "loading")
  }

  private mapActionToType(action: string): string {
    const mapping: Record<string, string> = {
      quickSummary: "summary",
      askQuestions: "questions",
      explainTerms: "explain",
      more: "expand"
    }
    return mapping[action] || "content"
  }

  private showTooltip(content: string, position: DOMRect, type: string = "info") {
    // Remove existing tooltip
    this.closeTooltip()

    // Create tooltip
    const tooltip = document.createElement("div")
    tooltip.className = `insight-buddy-tooltip ${type}`
    tooltip.innerHTML = content

    // Position tooltip
    const x = position.left + (position.width / 2)
    const y = position.top - 10

    tooltip.style.position = "fixed"
    tooltip.style.left = `${x}px`
    tooltip.style.top = `${y}px`
    tooltip.style.transform = "translate(-50%, -100%)"
    tooltip.style.zIndex = "10002"

    // Add to DOM
    document.body.appendChild(tooltip)
    this.tooltipElement = tooltip

    // Auto-hide after delay (except for loading)
    if (type !== "loading") {
      setTimeout(() => this.closeTooltip(), 5000)
    }
  }

  private closeTooltip() {
    if (this.tooltipElement) {
      this.tooltipElement.remove()
      this.tooltipElement = null
    }
  }

  private showQuickResult(message: any) {
    this.closeTooltip()
    const { position, result } = message
    this.showTooltip(result.content, position, result.type)
  }

  private handleAnalysisResult(message: any) {
    // Handle full analysis results
    // This would typically update the UI or send to sidebar
    console.log("Analysis result:", message)
  }

  private analyzeSelection() {
    if (!this.selectedText) return

    const context = this.getSelectionContext()

    chrome.runtime.sendMessage({
      type: "analyze-paragraph",
      payload: {
        text: this.selectedText,
        context: context.context,
        tabId: chrome.devtools?.inspectedWindow?.tabId,
        elementId: "selection"
      }
    })
  }

  private showQuickQuestions() {
    if (!this.selectedText) return

    chrome.runtime.sendMessage({
      type: "quick-analysis",
      payload: {
        text: this.selectedText,
        analysisType: "questions",
        tabId: chrome.devtools?.inspectedWindow?.tabId,
        position: this.getSelectionPosition()
      }
    })
  }

  private getSelectionContext() {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      return { context: "" }
    }

    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer
    const element = container instanceof Element ? container : container.parentElement

    if (!element) {
      return { context: "" }
    }

    // Get surrounding text
    const parent = element.closest("article, section, main, div")
    const context = parent?.textContent?.substring(0, 500) || ""

    return {
      context,
      title: document.title,
      url: window.location.href
    }
  }

  private getSelectionPosition(): DOMRect {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      return new DOMRect()
    }

    const range = selection.getRangeAt(0)
    return range.getBoundingClientRect()
  }

  private handleSettingsUpdate(settings: any) {
    this.settings = settings

    // Update floating icons visibility
    if (settings.enableFloatingIcons) {
      this.scanPage()
    } else {
      // Hide all icons
      this.floatingIcons.forEach(icon => {
        icon.element.style.display = "none"
      })
    }
  }

  private injectStyles() {
    const styleId = "insight-buddy-styles"
    if (document.getElementById(styleId)) return

    const style = document.createElement("style")
    style.id = styleId
    style.textContent = getInjectedStyles()
    document.head.appendChild(style)
  }
}

// Helper functions
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout

  return ((...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

function getInjectedStyles() {
  return `
    .insight-buddy-icon {
      position: absolute;
      width: 32px;
      height: 32px;
      z-index: 9999;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }

    *:hover > .insight-buddy-icon,
    .insight-buddy-icon:hover,
    .insight-buddy-icon.hover {
      opacity: 1;
    }

    .insight-icon-inner {
      width: 100%;
      height: 100%;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .insight-buddy-icon:hover .insight-icon-inner {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      background: #f8f9fa;
    }

    .insight-icon-inner svg {
      width: 16px;
      height: 16px;
      color: #1a73e8;
    }

    .insight-buddy-mini-menu {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 4px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      min-width: 160px;
    }

    .insight-buddy-mini-menu .menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: none;
      cursor: pointer;
      text-align: left;
      border-radius: 4px;
      transition: background 0.2s ease;
      font-size: 14px;
      color: #333;
    }

    .insight-buddy-mini-menu .menu-item:hover {
      background: #f0f0f0;
    }

    .insight-buddy-mini-menu .icon {
      font-size: 16px;
    }

    .insight-buddy-tooltip {
      background: #333;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      max-width: 300px;
      line-height: 1.4;
      animation: fadeIn 0.2s ease;
    }

    .insight-buddy-tooltip.loading {
      background: #1a73e8;
    }

    .insight-buddy-tooltip.summary {
      background: #34a853;
    }

    .insight-buddy-tooltip.questions {
      background: #ea4335;
    }

    .insight-buddy-tooltip.explanation {
      background: #fbbc04;
      color: #333;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translate(-50%, -90%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -100%);
      }
    }
  `
}

// Initialize detector
const detector = new InsightDetector()
