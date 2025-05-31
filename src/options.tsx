// Options page for Insight Buddy extension

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~components/ui/card"
import { Button } from "~components/ui/button"
import { Input } from "~components/ui/input"
import { Label } from "~components/ui/label"
import { Switch } from "~components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~components/ui/select"
import { Textarea } from "~components/ui/textarea"
import { Badge } from "~components/ui/badge"
import { Alert, AlertDescription } from "~components/ui/alert"
import {
  Brain,
  Settings,
  Keyboard,
  Palette,
  Shield,
  Save,
  RotateCcw,
  AlertCircle
} from "lucide-react"
import { useSettings } from "~modules/storage/hooks"
import { AISettings } from "~modules/ai/components/ai-settings"
import "~styles/globals.css"

export default function OptionsPage() {
  const { value: settings, update: updateSettings, loading } = useSettings("insight-settings")
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  // Default settings
  const defaultSettings = {
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
    keyboardShortcuts: {
      analyzeSelection: "Ctrl+Shift+A",
      toggleSidebar: "Ctrl+Shift+S",
      quickQuestions: "Ctrl+Shift+Q"
    },
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

  const [formData, setFormData] = useState(settings || defaultSettings)

  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const handleSave = async () => {
    await updateSettings(formData)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    setFormData(defaultSettings)
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateNestedField = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Brain className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p>Đang tải cài đặt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Insight Buddy Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Tùy chỉnh trải nghiệm phân tích văn bản với AI
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            Chung
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Brain className="h-4 w-4 mr-2" />
            AI
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Giao diện
          </TabsTrigger>
          <TabsTrigger value="shortcuts">
            <Keyboard className="h-4 w-4 mr-2" />
            Phím tắt
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="h-4 w-4 mr-2" />
            Riêng tư
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt chung</CardTitle>
              <CardDescription>
                Các tùy chọn cơ bản cho extension
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hiển thị biểu tượng nổi</Label>
                  <p className="text-sm text-muted-foreground">
                    Hiện icon bên cạnh các đoạn văn để phân tích nhanh
                  </p>
                </div>
                <Switch
                  checked={formData.enableFloatingIcons}
                  onCheckedChange={(checked) => updateField("enableFloatingIcons", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Phân tích tự động</Label>
                  <p className="text-sm text-muted-foreground">
                    Tự động phân tích khi chọn văn bản
                  </p>
                </div>
                <Switch
                  checked={formData.enableAutoAnalysis}
                  onCheckedChange={(checked) => updateField("enableAutoAnalysis", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Vị trí biểu tượng nổi</Label>
                <Select
                  value={formData.floatingIconPosition}
                  onValueChange={(value) => updateField("floatingIconPosition", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-right">Trên - Phải</SelectItem>
                    <SelectItem value="top-left">Trên - Trái</SelectItem>
                    <SelectItem value="bottom-right">Dưới - Phải</SelectItem>
                    <SelectItem value="bottom-left">Dưới - Trái</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Độ trễ hiển thị icon (ms)</Label>
                <Input
                  type="number"
                  value={formData.floatingIconDelay}
                  onChange={(e) => updateField("floatingIconDelay", parseInt(e.target.value))}
                  min="0"
                  max="1000"
                  step="100"
                />
              </div>

              <div className="space-y-2">
                <Label>Số lượng lịch sử tối đa</Label>
                <Input
                  type="number"
                  value={formData.maxHistoryItems}
                  onChange={(e) => updateField("maxHistoryItems", parseInt(e.target.value))}
                  min="10"
                  max="1000"
                  step="10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loại phân tích</CardTitle>
              <CardDescription>
                Chọn các loại phân tích muốn sử dụng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(formData.analysisTypes).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="capitalize">{key}</Label>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => updateNestedField("analysisTypes", key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình AI</CardTitle>
              <CardDescription>
                Thiết lập model và ngôn ngữ phân tích
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Model AI</Label>
                <Select
                  value={formData.aiModel}
                  onValueChange={(value) => updateField("aiModel", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt">GPT-4</SelectItem>
                    <SelectItem value="gemini">Gemini Pro</SelectItem>
                    <SelectItem value="claude">Claude</SelectItem>
                    <SelectItem value="local">Local Model</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ngôn ngữ phân tích</Label>
                <Select
                  value={formData.analysisLanguage}
                  onValueChange={(value) => updateField("analysisLanguage", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="auto">Tự động phát hiện</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Hiển thị độ tin cậy</Label>
                  <p className="text-sm text-muted-foreground">
                    Hiển thị mức độ tin cậy của kết quả phân tích
                  </p>
                </div>
                <Switch
                  checked={formData.showConfidenceScores}
                  onCheckedChange={(checked) => updateField("showConfidenceScores", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Settings Component */}
          <AISettings />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Giao diện</CardTitle>
              <CardDescription>
                Tùy chỉnh giao diện của extension
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={formData.theme}
                  onValueChange={(value) => updateField("theme", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Sáng</SelectItem>
                    <SelectItem value="dark">Tối</SelectItem>
                    <SelectItem value="system">Theo hệ thống</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shortcuts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Phím tắt</CardTitle>
              <CardDescription>
                Cấu hình phím tắt cho các chức năng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label>Kích hoạt phím tắt</Label>
                <Switch
                  checked={formData.enableKeyboardShortcuts}
                  onCheckedChange={(checked) => updateField("enableKeyboardShortcuts", checked)}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Phím tắt được cấu hình trong manifest và không thể thay đổi tại đây.
                  Bạn có thể thay đổi trong chrome://extensions/shortcuts
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {Object.entries(formData.keyboardShortcuts).map(([key, shortcut]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                    <Badge variant="secondary">{shortcut}</Badge>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => chrome.tabs.create({ url: "chrome://extensions/shortcuts" })}
              >
                Mở cài đặt phím tắt Chrome
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quyền riêng tư</CardTitle>
              <CardDescription>
                Quản lý dữ liệu và quyền riêng tư
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Lưu lịch sử phân tích</Label>
                  <p className="text-sm text-muted-foreground">
                    Lưu kết quả phân tích để xem lại sau
                  </p>
                </div>
                <Switch
                  checked={formData.privacy.saveHistory}
                  onCheckedChange={(checked) => updateNestedField("privacy", "saveHistory", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cache kết quả</Label>
                  <p className="text-sm text-muted-foreground">
                    Lưu cache để tăng tốc độ phân tích
                  </p>
                </div>
                <Switch
                  checked={formData.privacy.cacheResults}
                  onCheckedChange={(checked) => updateNestedField("privacy", "cacheResults", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Gửi thống kê sử dụng</Label>
                  <p className="text-sm text-muted-foreground">
                    Giúp cải thiện extension (ẩn danh)
                  </p>
                </div>
                <Switch
                  checked={formData.privacy.sendAnalytics}
                  onCheckedChange={(checked) => updateNestedField("privacy", "sendAnalytics", checked)}
                />
              </div>

              <div className="pt-4 space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (confirm("Bạn có chắc muốn xóa toàn bộ lịch sử?")) {
                      chrome.runtime.sendMessage({ type: "clear-history" })
                    }
                  }}
                >
                  Xóa lịch sử phân tích
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    if (confirm("Bạn có chắc muốn xóa toàn bộ cache?")) {
                      chrome.runtime.sendMessage({ type: "clear-cache" })
                    }
                  }}
                >
                  Xóa cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save buttons */}
      <div className="mt-8 flex gap-4">
        <Button onClick={handleSave} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          Lưu cài đặt
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Đặt lại mặc định
        </Button>
      </div>

      {saved && (
        <Alert className="mt-4">
          <AlertDescription>
            ✓ Cài đặt đã được lưu thành công!
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}