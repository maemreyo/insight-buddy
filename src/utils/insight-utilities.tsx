// Utility functions and components for Insight Buddy

import { AlertCircle, WifiOff } from "lucide-react"
import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "~components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class InsightErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Insight Buddy Error:", error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Đã xảy ra lỗi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {this.state.error?.message || "Lỗi không xác định"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Thử lại
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Offline Support Manager
export class OfflineManager {
  private static instance: OfflineManager | null = null
  private isOnline: boolean = navigator.onLine
  private listeners: Set<(online: boolean) => void> = new Set()
  private cachedAnalyses: Map<string, any> = new Map()

  private constructor() {
    this.initialize()
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager()
    }
    return OfflineManager.instance
  }

  private initialize() {
    // Listen for online/offline events
    window.addEventListener("online", this.handleOnline)
    window.addEventListener("offline", this.handleOffline)

    // Load cached analyses from storage
    this.loadCachedAnalyses()
  }

  private handleOnline = () => {
    this.isOnline = true
    this.notifyListeners(true)
  }

  private handleOffline = () => {
    this.isOnline = false
    this.notifyListeners(false)
  }

  private notifyListeners(online: boolean) {
    this.listeners.forEach(listener => listener(online))
  }

  // Public methods
  onStatusChange(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  isOffline(): boolean {
    return !this.isOnline
  }

  async cacheAnalysis(key: string, result: any) {
    this.cachedAnalyses.set(key, {
      result,
      timestamp: Date.now()
    })

    // Also save to chrome storage
    try {
      const cache = await chrome.storage.local.get("insight_offline_cache") || {}
      cache[key] = {
        result,
        timestamp: Date.now()
      }
      await chrome.storage.local.set({ insight_offline_cache: cache })
    } catch (error) {
      console.error("Failed to cache analysis:", error)
    }
  }

  getCachedAnalysis(key: string): any | null {
    const cached = this.cachedAnalyses.get(key)
    if (!cached) return null

    // Check if cache is still valid (24 hours)
    const age = Date.now() - cached.timestamp
    if (age > 86400000) {
      this.cachedAnalyses.delete(key)
      return null
    }

    return cached.result
  }

  async loadCachedAnalyses() {
    try {
      const { insight_offline_cache } = await chrome.storage.local.get("insight_offline_cache")
      if (insight_offline_cache) {
        Object.entries(insight_offline_cache).forEach(([key, value]: [string, any]) => {
          this.cachedAnalyses.set(key, value)
        })
      }
    } catch (error) {
      console.error("Failed to load cached analyses:", error)
    }
  }

  async clearCache() {
    this.cachedAnalyses.clear()
    await chrome.storage.local.remove("insight_offline_cache")
  }
}

// Offline indicator component
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine)

  React.useEffect(() => {
    const offlineManager = OfflineManager.getInstance()
    const unsubscribe = offlineManager.onStatusChange((online) => {
      setIsOffline(!online)
    })

    return unsubscribe
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="flex items-center gap-2 p-3">
          <WifiOff className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Đang offline - Sử dụng cache
          </span>
        </CardContent>
      </Card>
    </div>
  )
}

// Retry mechanism for failed requests
export class RetryManager {
  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static async retry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number
      delay?: number
      backoff?: boolean
      onRetry?: (attempt: number, error: Error) => void
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      delay = 1000,
      backoff = true,
      onRetry
    } = options

    let lastError: Error

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error

        if (attempt < maxRetries - 1) {
          onRetry?.(attempt + 1, lastError)

          const waitTime = backoff ? delay * Math.pow(2, attempt) : delay
          await this.delay(waitTime)
        }
      }
    }

    throw lastError!
  }
}

// Performance monitor
export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map()

  static start(label: string) {
    this.measurements.set(label, performance.now())
  }

  static end(label: string): number | null {
    const start = this.measurements.get(label)
    if (!start) return null

    const duration = performance.now() - start
    this.measurements.delete(label)

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  static async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label)
    try {
      const result = await fn()
      const duration = this.end(label)
      console.debug(`${label}: ${duration?.toFixed(2)}ms`)
      return result
    } catch (error) {
      this.end(label)
      throw error
    }
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null

  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  return debounced as T & { cancel: () => void }
}

// Throttle utility
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean = false

  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }) as T
}

// Text utilities
export const TextUtils = {
  truncate(text: string, maxLength: number, suffix: string = "..."): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - suffix.length) + suffix
  },

  countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  },

  estimateReadingTime(text: string, wordsPerMinute: number = 200): number {
    const wordCount = this.countWords(text)
    return Math.ceil(wordCount / wordsPerMinute)
  },

  highlightText(text: string, query: string): string {
    if (!query) return text

    const regex = new RegExp(`(${query})`, "gi")
    return text.replace(regex, "<mark>$1</mark>")
  },

  extractKeywords(text: string, minLength: number = 3): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(word => word.length >= minLength)

    // Count frequency
    const frequency: Record<string, number> = {}
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })

    // Sort by frequency and return top keywords
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }
}

// Chrome extension utilities
export const ExtensionUtils = {
  async getCurrentTab(): Promise<chrome.tabs.Tab | null> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    return tab || null
  },

  async sendMessageToTab(tabId: number, message: any): Promise<any> {
    try {
      return await chrome.tabs.sendMessage(tabId, message)
    } catch (error) {
      console.error("Failed to send message to tab:", error)
      return null
    }
  },

  async executeScript<T>(tabId: number, func: () => T): Promise<T | null> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func
      })
      return results[0]?.result || null
    } catch (error) {
      console.error("Failed to execute script:", error)
      return null
    }
  },

  isExtensionPage(url: string): boolean {
    return url.startsWith("chrome://") ||
           url.startsWith("chrome-extension://") ||
           url.startsWith("edge://") ||
           url.startsWith("about:")
  },

  async checkPermission(permission: string): Promise<boolean> {
    return chrome.permissions.contains({ permissions: [permission] })
  },

  async requestPermission(permission: string): Promise<boolean> {
    try {
      return await chrome.permissions.request({ permissions: [permission] })
    } catch (error) {
      console.error("Failed to request permission:", error)
      return false
    }
  }
}

// Export singleton instances
export const offlineManager = OfflineManager.getInstance()
export const performanceMonitor = PerformanceMonitor
export const retryManager = RetryManager
