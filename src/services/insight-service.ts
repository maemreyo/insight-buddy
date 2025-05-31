// Main service for coordinating Insight Buddy features

import { analysisEngine } from "~modules/analysis"
import { formatInsightResponse, getInsightPrompt, insightAnalysisTypes } from "~modules/analysis/insight-templates"
import type { AnalysisRequest, AnalysisResult } from "~modules/analysis/types"
import { contentExtractor } from "~modules/content-extractor"
import type { Paragraph } from "~modules/content-extractor/types"
import { messageBus } from "~modules/messaging"
import { HistoryManager, storageManager } from "~modules/storage"

export interface InsightContext {
  selection?: string
  paragraph?: Paragraph
  url: string
  title: string
  author?: string
  source?: string
}

export interface QuickAnalysisRequest {
  text: string
  type: string
  context?: InsightContext
  position?: { x: number; y: number }
}

export interface InsightSettings {
  enableFloatingIcons: boolean
  enableAutoAnalysis: boolean
  aiModel: string
  analysisLanguage: string
  theme: string
  showConfidenceScores: boolean
  floatingIconPosition: string
  floatingIconDelay: number
  maxHistoryItems: number
  enableKeyboardShortcuts: boolean
  analysisTypes: Record<string, boolean>
  privacy: {
    saveHistory: boolean
    sendAnalytics: boolean
    cacheResults: boolean
  }
}

class InsightService {
  private historyManager: HistoryManager
  private settings: InsightSettings | null = null
  private cache: Map<string, AnalysisResult> = new Map()
  private readonly CACHE_TTL = 3600000 // 1 hour

  constructor() {
    this.historyManager = new HistoryManager({
      maxItems: 1000,
      groupByTime: true
    })
    this.initialize()
  }

  private async initialize() {
    // Load settings
    const storage = storageManager.get()
    this.settings = await storage.get("insight-settings") || this.getDefaultSettings()

    // Setup message handlers
    this.setupMessageHandlers()

    // Clean old cache periodically
    setInterval(() => this.cleanCache(), 600000) // Every 10 minutes
  }

  private setupMessageHandlers() {
    // Subscribe to analysis requests
    messageBus.subscribe("insight-content", async (message) => {
      if (message.type === "analyze-request") {
        const result = await this.analyze(message.payload)
        messageBus.publish("insight-results", "analysis-complete", {
          result,
          requestId: message.payload.requestId
        })
      }
    })

    // Subscribe to settings updates
    messageBus.subscribe("insight-ui", async (message) => {
      if (message.type === "settings-updated") {
        this.settings = message.payload.settings
        await this.saveSettings(this.settings)
      }
    })
  }

  // Main analysis method
  async analyze(request: QuickAnalysisRequest): Promise<AnalysisResult> {
    const cacheKey = this.getCacheKey(request)

    // Check cache first
    if (this.settings?.privacy.cacheResults) {
      const cached = this.cache.get(cacheKey)
      if (cached && this.isCacheValid(cached)) {
        return cached
      }
    }

    try {
      // Build analysis request
      const analysisRequest: AnalysisRequest = {
        type: request.type,
        inputs: {
          text: request.text,
          context: request.context?.selection || request.context?.paragraph?.text || "",
          url: request.context?.url,
          title: request.context?.title,
          author: request.context?.author,
          source: request.context?.source
        },
        options: {
          language: this.settings?.analysisLanguage || "vi",
          depth: request.type === "quickSummary" ? "quick" : "standard",
          includeRecommendations: true,
          customPrompt: getInsightPrompt(request.type, {
            text: request.text,
            context: request.context?.selection || ""
          })
        }
      }

      // Use analysis engine
      const result = await analysisEngine.analyze(analysisRequest)

      // Format response based on type
      if (result.output && typeof result.output === "string") {
        result.output = formatInsightResponse(request.type, result.output)
      }

      // Cache result
      if (this.settings?.privacy.cacheResults) {
        this.cache.set(cacheKey, result)
      }

      // Save to history
      if (this.settings?.privacy.saveHistory) {
        await this.saveToHistory(request, result)
      }

      return result
    } catch (error) {
      console.error("Analysis error:", error)
      return this.createErrorResult(error)
    }
  }

  // Quick analysis for tooltips
  async quickAnalyze(text: string, type: string): Promise<string> {
    try {
      const result = await this.analyze({
        text,
        type: type === "summary" ? "quickSummary" : type
      })

      // Extract quick result based on type
      switch (type) {
        case "summary":
          return result.output?.summary ||
                 result.sections?.find(s => s.title.includes("Summary"))?.content ||
                 "Không thể tạo tóm tắt"

        case "questions":
          const questions = result.output?.questions || result.recommendations?.slice(0, 2) || []
          return questions.map((q: any) => `• ${q.question || q.title}`).join("\n") ||
                 "Không thể tạo câu hỏi"

        case "explain":
          const terms = result.output?.terms || []
          if (terms.length > 0) {
            return terms.slice(0, 2).map((t: any) =>
              `${t.term}: ${t.explanation}`
            ).join("\n")
          }
          return "Không tìm thấy thuật ngữ cần giải thích"

        default:
          return result.output?.toString() || "Đã hoàn thành phân tích"
      }
    } catch (error) {
      return "Lỗi khi phân tích"
    }
  }

  // Extract content from current page
  async extractPageContent(options?: any) {
    try {
      const extracted = await contentExtractor.extractFromCurrentTab({
        minParagraphLength: 50,
        detectSections: true,
        scoreParagraphs: true,
        ...options
      })

      return extracted
    } catch (error) {
      console.error("Content extraction error:", error)
      return null
    }
  }

  // Get analysis types
  getAnalysisTypes() {
    return Object.entries(insightAnalysisTypes)
      .filter(([key]) => this.settings?.analysisTypes[key] !== false)
      .map(([_, type]) => type)
  }

  // Settings management
  async saveSettings(settings: InsightSettings) {
    const storage = storageManager.get()
    await storage.set("insight-settings", settings)
    this.settings = settings
  }

  getSettings(): InsightSettings {
    return this.settings || this.getDefaultSettings()
  }

  private getDefaultSettings(): InsightSettings {
    return {
      enableFloatingIcons: true,
      enableAutoAnalysis: false,
      aiModel: "gpt",
      analysisLanguage: "vi",
      theme: "light",
      showConfidenceScores: true,
      floatingIconPosition: "top-right",
      floatingIconDelay: 300,
      maxHistoryItems: 100,
      enableKeyboardShortcuts: true,
      analysisTypes: {
        summarize: true,
        explain: true,
        critique: true,
        bias: true,
        expand: true
      },
      privacy: {
        saveHistory: true,
        sendAnalytics: false,
        cacheResults: true
      }
    }
  }

  // History management
  async getHistory(filters?: any) {
    return this.historyManager.searchHistory(filters?.search, {
      types: filters?.types,
      dateRange: filters?.dateRange,
      tags: filters?.tags
    })
  }

  async clearHistory() {
    return this.historyManager.clearHistory()
  }

  // Cache management
  private getCacheKey(request: QuickAnalysisRequest): string {
    const text = request.text.substring(0, 100)
    return `${request.type}:${text}:${this.settings?.analysisLanguage}`
  }

  private isCacheValid(result: AnalysisResult): boolean {
    if (!result.metadata?.completedAt) return false
    const age = Date.now() - new Date(result.metadata.completedAt).getTime()
    return age < this.CACHE_TTL
  }

  private cleanCache() {
    const now = Date.now()
    for (const [key, result] of this.cache.entries()) {
      if (!this.isCacheValid(result)) {
        this.cache.delete(key)
      }
    }
  }

  // Save to history
  private async saveToHistory(request: QuickAnalysisRequest, result: AnalysisResult) {
    const analysisType = insightAnalysisTypes[request.type]

    await this.historyManager.addItem({
      type: "analysis",
      title: `${analysisType?.name || request.type}: ${request.text.substring(0, 50)}...`,
      description: this.getResultSummary(result),
      url: request.context?.url,
      data: {
        request,
        result
      },
      metadata: {
        duration: result.metadata?.duration,
        status: result.status === "completed" ? "success" : "failure",
        tags: [request.type, this.settings?.aiModel || "ai"],
        source: "insight-buddy"
      }
    })
  }

  private getResultSummary(result: AnalysisResult): string {
    if (result.output?.summary) return result.output.summary
    if (result.sections?.length > 0) return result.sections[0].content
    if (result.recommendations?.length > 0) return result.recommendations[0].description
    return "Analysis completed"
  }

  // Error handling
  private createErrorResult(error: any): AnalysisResult {
    return {
      id: Date.now().toString(),
      type: "error",
      status: "failed",
      inputs: {},
      metadata: {
        startedAt: new Date(),
        completedAt: new Date(),
        error: error.message || "Unknown error"
      },
      sections: [{
        id: "error",
        title: "Lỗi",
        content: this.getErrorMessage(error),
        type: "text",
        order: 0
      }]
    }
  }

  private getErrorMessage(error: any): string {
    const errorMessages: Record<string, string> = {
      'rate_limit': 'API đã đạt giới hạn. Vui lòng thử lại sau vài phút.',
      'network': 'Lỗi kết nối mạng. Kiểm tra kết nối internet.',
      'invalid_key': 'API key không hợp lệ. Vui lòng kiểm tra cài đặt.',
      'content_too_long': 'Văn bản quá dài. Vui lòng chọn đoạn ngắn hơn.'
    }

    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code]
    }

    if (error.message?.includes('rate limit')) return errorMessages.rate_limit
    if (error.message?.includes('network')) return errorMessages.network
    if (error.message?.includes('key')) return errorMessages.invalid_key

    return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
  }

  // Export singleton instance
  static instance: InsightService | null = null

  static getInstance(): InsightService {
    if (!InsightService.instance) {
      InsightService.instance = new InsightService()
    }
    return InsightService.instance
  }
}

export const insightService = InsightService.getInstance()

// Helper functions for content scripts
export async function analyzeText(text: string, type: string, context?: InsightContext) {
  return insightService.analyze({ text, type, context })
}

export async function quickAnalyzeText(text: string, type: string) {
  return insightService.quickAnalyze(text, type)
}

export function getAvailableAnalysisTypes() {
  return insightService.getAnalysisTypes()
}
