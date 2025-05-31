// Sidebar component for Insight Buddy extension

import {
  Brain,
  Clock,
  Download,
  FileText,
  HelpCircle,
  History,
  Lightbulb,
  Maximize2,
  Pin,
  Scale,
  Search,
  Settings,
  Trash2,
  X
} from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "~components/ui/badge"
import { Button } from "~components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~components/ui/card"
import { Input } from "~components/ui/input"
import { Label } from "~components/ui/label"
import { ScrollArea } from "~components/ui/scroll-area"
import { Switch } from "~components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"
import type { AnalysisResult } from "~modules/analysis/types"
import { useMessage } from "~modules/messaging/hooks"
import { useHistory, useSettings } from "~modules/storage/hooks"

interface ResultCard {
  id: string
  result: AnalysisResult
  context: any
  timestamp: Date
  pinned: boolean
}

export function InsightSidebar() {
  const [activeTab, setActiveTab] = useState("current")
  const [results, setResults] = useState<ResultCard[]>([])
  const [currentResult, setCurrentResult] = useState<ResultCard | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Hooks
  const { _messages, lastMessage } = useMessage("insight-results")
  const { items: historyItems, addItem, clearHistory } = useHistory()
  const { value: settings, update: updateSettings } = useSettings("insight-settings")

  useEffect(() => {
    // Handle new analysis results
    if (lastMessage?.type === "analysis-complete") {
      const newResult: ResultCard = {
        id: Date.now().toString(),
        result: lastMessage.payload.result,
        context: lastMessage.payload.context,
        timestamp: new Date(),
        pinned: false
      }

      setResults(prev => [newResult, ...prev].slice(0, 10))
      setCurrentResult(newResult)
      setActiveTab("current")

      // Add to history
      addItem({
        type: "analysis",
        title: getResultTitle(newResult),
        data: newResult,
        metadata: {
          tags: [lastMessage.payload.context.action],
          source: lastMessage.payload.context.tabId?.toString()
        }
      })
    }
  }, [lastMessage])

  const getResultTitle = (card: ResultCard): string => {
    const action = card.context.action
    const text = card.context.selection?.substring(0, 50) + "..."

    const titles: Record<string, string> = {
      summarize: `Tóm tắt: ${text}`,
      explain: `Giải thích: ${text}`,
      critique: `Phản biện: ${text}`,
      bias: `Kiểm tra thiên vị: ${text}`,
      expand: `Mở rộng: ${text}`
    }

    return titles[action] || `Phân tích: ${text}`
  }

  const handlePinResult = (id: string) => {
    setResults(prev => prev.map(r =>
      r.id === id ? { ...r, pinned: !r.pinned } : r
    ))
  }

  const handleDeleteResult = (id: string) => {
    setResults(prev => prev.filter(r => r.id !== id))
    if (currentResult?.id === id) {
      setCurrentResult(null)
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `insight-buddy-export-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const filteredResults = results.filter(r => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      getResultTitle(r).toLowerCase().includes(searchLower) ||
      JSON.stringify(r.result).toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Insight Buddy</h1>
          </div>
          <Badge variant="outline">
            {settings?.aiModel === "gpt" ? "GPT-4" : "Gemini"}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3 px-4">
            <TabsTrigger value="current" className="gap-1">
              <FileText className="h-4 w-4" />
              Hiện tại
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <History className="h-4 w-4" />
              Lịch sử
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1">
              <Settings className="h-4 w-4" />
              Cài đặt
            </TabsTrigger>
          </TabsList>

          {/* Current Tab */}
          <TabsContent value="current" className="h-[calc(100%-40px)] mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {currentResult ? (
                  <ResultDisplay result={currentResult} />
                ) : (
                  <EmptyState />
                )}

                {/* Recent Results */}
                {filteredResults.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Kết quả gần đây
                    </h3>
                    {filteredResults.map(card => (
                      <ResultCard
                        key={card.id}
                        card={card}
                        onSelect={() => setCurrentResult(card)}
                        onPin={() => handlePinResult(card.id)}
                        onDelete={() => handleDeleteResult(card.id)}
                        isActive={currentResult?.id === card.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="h-[calc(100%-40px)] mt-0">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm lịch sử..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => clearHistory()}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-[calc(100%-60px)]">
                <div className="space-y-2">
                  {historyItems.map(item => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => {
                        if (item.data) {
                          setCurrentResult(item.data)
                          setActiveTab("current")
                        }
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-sm line-clamp-1">
                              {item.title}
                            </CardTitle>
                            <CardDescription className="text-xs flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.timestamp).toLocaleString("vi-VN")}
                            </CardDescription>
                          </div>
                          {item.metadata?.tags?.[0] && (
                            <Badge variant="secondary" className="text-xs">
                              {getActionIcon(item.metadata.tags[0])}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="h-[calc(100%-40px)] mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                <SettingsPanel
                  settings={settings}
                  onUpdate={updateSettings}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Sub-components
function ResultDisplay({ result }: { result: ResultCard }) {
  const getIcon = (action: string) => {
    const icons: Record<string, JSX.Element> = {
      summarize: <FileText className="h-5 w-5" />,
      explain: <Lightbulb className="h-5 w-5" />,
      critique: <HelpCircle className="h-5 w-5" />,
      bias: <Scale className="h-5 w-5" />,
      expand: <Maximize2 className="h-5 w-5" />
    }
    return icons[action] || <Brain className="h-5 w-5" />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getIcon(result.context.action)}
            <CardTitle className="text-base">
              {getResultTitle(result)}
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {new Date(result.timestamp).toLocaleTimeString("vi-VN")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Display sections */}
          {result.result.sections?.map((section, index) => (
            <div key={section.id || index} className="space-y-2">
              <h4 className="font-medium text-sm">{section.title}</h4>
              <div className="text-sm text-muted-foreground">
                {renderSectionContent(section)}
              </div>
            </div>
          ))}

          {/* Display recommendations */}
          {result.result.recommendations && result.result.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Gợi ý</h4>
              <div className="space-y-2">
                {result.result.recommendations.map((rec, index) => (
                  <div
                    key={rec.id || index}
                    className={`p-3 rounded-lg border ${
                      rec.priority === "high" ? "border-red-200 bg-red-50" :
                      rec.priority === "medium" ? "border-yellow-200 bg-yellow-50" :
                      "border-green-200 bg-green-50"
                    }`}
                  >
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {rec.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {result.result.metadata && (
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Model: {result.result.metadata.model}</span>
                {result.result.metadata.duration && (
                  <span>Thời gian: {(result.result.metadata.duration / 1000).toFixed(2)}s</span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ResultCard({
  card,
  onSelect,
  onPin,
  onDelete,
  isActive
}: {
  card: ResultCard
  onSelect: () => void
  onPin: () => void
  onDelete: () => void
  isActive: boolean
}) {
  return (
    <Card
      className={`cursor-pointer transition-colors ${
        isActive ? "border-primary" : "hover:bg-accent/50"
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm line-clamp-1">
              {getResultTitle(card)}
            </CardTitle>
            <CardDescription className="text-xs">
              {new Date(card.timestamp).toLocaleTimeString("vi-VN")}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            {card.pinned && <Pin className="h-3 w-3 text-primary" />}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                onPin()
              }}
            >
              <Pin className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] text-center">
      <Brain className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Chưa có phân tích nào</h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">
        Bôi đen văn bản và nhấp chuột phải để bắt đầu phân tích, hoặc click vào
        các biểu tượng bên cạnh đoạn văn.
      </p>
    </div>
  )
}

function SettingsPanel({
  settings,
  onUpdate
}: {
  settings: any
  onUpdate: (settings: any) => void
}) {
  const handleToggle = (key: string, value: boolean) => {
    onUpdate({ ...settings, [key]: value })
  }

  const handleSelectChange = (key: string, value: string) => {
    onUpdate({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Hiển thị</h3>

        <div className="flex items-center justify-between">
          <Label htmlFor="floating-icons" className="text-sm">
            Hiển thị biểu tượng nổi
          </Label>
          <Switch
            id="floating-icons"
            checked={settings?.enableFloatingIcons ?? true}
            onCheckedChange={(checked) => handleToggle("enableFloatingIcons", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="auto-analysis" className="text-sm">
            Phân tích tự động
          </Label>
          <Switch
            id="auto-analysis"
            checked={settings?.enableAutoAnalysis ?? false}
            onCheckedChange={(checked) => handleToggle("enableAutoAnalysis", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="confidence-scores" className="text-sm">
            Hiển thị độ tin cậy
          </Label>
          <Switch
            id="confidence-scores"
            checked={settings?.showConfidenceScores ?? true}
            onCheckedChange={(checked) => handleToggle("showConfidenceScores", checked)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">AI Model</h3>

        <div className="space-y-2">
          <Label htmlFor="ai-model" className="text-sm">
            Chọn model
          </Label>
          <select
            id="ai-model"
            className="w-full px-3 py-2 border rounded-md text-sm"
            value={settings?.aiModel || "gpt"}
            onChange={(e) => handleSelectChange("aiModel", e.target.value)}
          >
            <option value="gpt">GPT-4</option>
            <option value="gemini">Gemini Pro</option>
            <option value="claude">Claude</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Ngôn ngữ</h3>

        <div className="space-y-2">
          <Label htmlFor="language" className="text-sm">
            Ngôn ngữ phân tích
          </Label>
          <select
            id="language"
            className="w-full px-3 py-2 border rounded-md text-sm"
            value={settings?.analysisLanguage || "vi"}
            onChange={(e) => handleSelectChange("analysisLanguage", e.target.value)}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
            <option value="auto">Tự động phát hiện</option>
          </select>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          Cài đặt nâng cao
        </Button>
      </div>
    </div>
  )
}

// Helper functions
function getActionIcon(action: string): string {
  const icons: Record<string, string> = {
    summarize: "📝",
    explain: "💡",
    critique: "🤔",
    bias: "⚖️",
    expand: "➕"
  }
  return icons[action] || "📊"
}

function renderSectionContent(section: any) {
  if (typeof section.content === "string") {
    return <p className="whitespace-pre-wrap">{section.content}</p>
  }

  if (section.type === "list" && section.content?.items) {
    return (
      <ul className="space-y-1">
        {section.content.items.map((item: string, index: number) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )
  }

  if (section.type === "metric" && section.content?.data) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(section.content.data).map(([key, value]: [string, any]) => (
          <div key={key} className="flex justify-between p-2 bg-muted rounded">
            <span className="text-xs">{key}</span>
            <span className="text-xs font-medium">{value.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return <p>{JSON.stringify(section.content)}</p>
}
