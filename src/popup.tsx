// Popup interface for Insight Buddy extension

import {
  BarChart,
  Brain,
  ExternalLink,
  HelpCircle,
  Info,
  Power,
  Settings
} from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "~components/ui/badge"
import { Button } from "~components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Label } from "~components/ui/label"
import { Switch } from "~components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"
import { useSettings } from "~modules/storage/hooks"
import { useStorageStats } from "~modules/storage/hooks/useStorageStats"
import "~styles/globals.css"

export default function PopupPage() {
  const { value: settings, update: updateSettings } = useSettings("insight-settings")
  const { stats } = useStorageStats()
  const [_activeTab] = useState<chrome.tabs.Tab | null>(null)
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    // Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Check if extension is enabled for this tab
        const url = tabs[0].url
        if (url?.startsWith("chrome://") || url?.startsWith("chrome-extension://")) {
          setEnabled(false)
        }
      }
    })
  }, [])

  const handleToggleFloatingIcons = async (checked: boolean) => {
    await updateSettings({
      ...settings,
      enableFloatingIcons: checked
    })
  }

  const handleOpenSidebar = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.sidePanel.open({ tabId: tabs[0].id })
      }
    })
    window.close()
  }

  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  const quickActions = [
    {
      id: "analyze",
      label: "Phân tích lựa chọn",
      icon: "📝",
      shortcut: "Ctrl+Shift+A",
      action: () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "analyze-selection" })
          }
        })
        window.close()
      }
    },
    {
      id: "questions",
      label: "Đặt câu hỏi nhanh",
      icon: "🤔",
      shortcut: "Ctrl+Shift+Q",
      action: () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: "quick-questions" })
          }
        })
        window.close()
      }
    }
  ]

  return (
    <div className="w-[400px] h-[600px] bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            <h1 className="text-lg font-semibold">Insight Buddy</h1>
          </div>
          <Badge variant="secondary">
            {settings?.aiModel === "gpt" ? "GPT-4" : "Gemini"}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {!enabled ? (
          <Alert>
            <AlertDescription>
              Extension không hoạt động trên trang này
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="quick" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quick">Nhanh</TabsTrigger>
              <TabsTrigger value="stats">Thống kê</TabsTrigger>
              <TabsTrigger value="help">Trợ giúp</TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="space-y-4">
              {/* Quick Toggle */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Biểu tượng nổi</Label>
                      <p className="text-xs text-muted-foreground">
                        Hiện icon phân tích nhanh
                      </p>
                    </div>
                    <Switch
                      checked={settings?.enableFloatingIcons ?? true}
                      onCheckedChange={handleToggleFloatingIcons}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hành động nhanh</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickActions.map(action => (
                    <Button
                      key={action.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={action.action}
                    >
                      <span className="mr-2">{action.icon}</span>
                      <span className="flex-1 text-left">{action.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {action.shortcut}
                      </Badge>
                    </Button>
                  ))}

                  <Button
                    className="w-full"
                    onClick={handleOpenSidebar}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Mở Sidebar
                  </Button>
                </CardContent>
              </Card>

              {/* Settings Link */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleOpenOptions}
              >
                <Settings className="h-4 w-4 mr-2" />
                Cài đặt nâng cao
              </Button>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thống kê sử dụng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Phân tích hôm nay</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tổng phân tích</span>
                      <span className="font-medium">247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Dung lượng sử dụng</span>
                      <span className="font-medium">
                        {stats ? `${(stats.totalSize / 1024 / 1024).toFixed(2)} MB` : "0 MB"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        chrome.tabs.create({ url: chrome.runtime.getURL("tabs/dashboard.html") })
                      }}
                    >
                      <BarChart className="h-4 w-4 mr-2" />
                      Xem chi tiết
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="help" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hướng dẫn sử dụng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Cách sử dụng:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Bôi đen văn bản và click chuột phải</li>
                      <li>• Click vào icon nổi bên cạnh đoạn văn</li>
                      <li>• Dùng phím tắt để phân tích nhanh</li>
                    </ul>
                  </div>

                  <div className="space-y-2 pt-3 border-t">
                    <h4 className="text-sm font-medium">Phím tắt:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <kbd>Ctrl+Shift+A</kbd>: Phân tích lựa chọn</li>
                      <li>• <kbd>Ctrl+Shift+S</kbd>: Mở sidebar</li>
                      <li>• <kbd>Ctrl+Shift+Q</kbd>: Câu hỏi nhanh</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Về Insight Buddy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Phiên bản: 1.0.0
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Hỗ trợ đọc hiểu và phân tích văn bản với AI
                  </p>
                  <div className="flex gap-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        chrome.tabs.create({ url: "https://github.com/yourusername/insight-buddy" })
                      }}
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Tài liệu
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        chrome.tabs.create({ url: "https://github.com/yourusername/insight-buddy/issues" })
                      }}
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Báo lỗi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

// Simple Alert component for disabled state
function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
      <div className="flex items-center gap-2">
        <Power className="h-5 w-5 text-muted-foreground" />
        {children}
      </div>
    </div>
  )
}

function AlertDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}
