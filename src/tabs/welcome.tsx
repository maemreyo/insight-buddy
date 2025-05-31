// Welcome page shown on first install

import { motion } from "framer-motion"
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Keyboard,
  MessageSquare,
  MousePointer,
  Sparkles
} from "lucide-react"
import { useState } from "react"
import { Badge } from "~components/ui/badge"
import { Button } from "~components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~components/ui/card"
import "~styles/globals.css"

const features = [
  {
    icon: MousePointer,
    title: "Click để phân tích",
    description: "Chỉ cần click vào icon nổi bên cạnh đoạn văn để phân tích nhanh"
  },
  {
    icon: MessageSquare,
    title: "AI thông minh",
    description: "Sử dụng GPT-4, Gemini Pro để phân tích sâu nội dung"
  },
  {
    icon: Keyboard,
    title: "Phím tắt tiện lợi",
    description: "Truy cập nhanh các tính năng với phím tắt tùy chỉnh"
  },
  {
    icon: BarChart3,
    title: "Lưu lịch sử",
    description: "Xem lại các phân tích trước đó, xuất báo cáo"
  }
]

const steps = [
  {
    title: "Cho phép quyền truy cập",
    description: "Extension cần quyền đọc nội dung trang để phân tích",
    action: "Đã cấp quyền"
  },
  {
    title: "Cấu hình AI Model",
    description: "Chọn model AI phù hợp với nhu cầu của bạn",
    action: "Mở cài đặt"
  },
  {
    title: "Thử ngay",
    description: "Mở một trang web và bắt đầu phân tích văn bản",
    action: "Bắt đầu"
  }
]

export default function WelcomePage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState([false, false, false])

  const handleStepAction = (index: number) => {
    switch (index) {
      case 0:
        // Permission already granted if we're here
        setCompleted(prev => {
          const newCompleted = [...prev]
          newCompleted[0] = true
          return newCompleted
        })
        setCurrentStep(1)
        break
      case 1:
        chrome.runtime.openOptionsPage()
        setCompleted(prev => {
          const newCompleted = [...prev]
          newCompleted[1] = true
          return newCompleted
        })
        setCurrentStep(2)
        break
      case 2:
        // Open a sample page
        chrome.tabs.create({ url: "https://vi.wikipedia.org/wiki/Trang_Ch%C3%ADnh" })
        setCompleted(prev => {
          const newCompleted = [...prev]
          newCompleted[2] = true
          return newCompleted
        })
        break
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Brain className="h-20 w-20 text-primary" />
              <Sparkles className="h-8 w-8 text-yellow-500 absolute -top-2 -right-2" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Chào mừng đến với Insight Buddy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trợ lý AI thông minh giúp bạn đọc hiểu và phân tích văn bản hiệu quả hơn
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <feature.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Setup Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <Card>
            <CardHeader>
              <CardTitle>Bắt đầu nhanh</CardTitle>
              <CardDescription>
                Hoàn thành 3 bước đơn giản để sử dụng Insight Buddy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                    index <= currentStep ? "bg-primary/5" : "bg-muted/50"
                  }`}
                >
                  {completed[index] ? (
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                  ) : index === currentStep ? (
                    <div className="h-6 w-6 rounded-full border-2 border-primary animate-pulse flex-shrink-0" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      index <= currentStep ? "" : "text-muted-foreground"
                    }`}>
                      {step.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {index === currentStep && (
                    <Button
                      size="sm"
                      onClick={() => handleStepAction(index)}
                    >
                      {step.action}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 max-w-4xl mx-auto"
        >
          <h2 className="text-2xl font-semibold text-center mb-8">
            Mẹo sử dụng hiệu quả
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Badge className="w-fit mb-2">Mẹo 1</Badge>
                <CardTitle className="text-base">Sử dụng phím tắt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Nhấn <kbd>Ctrl+Shift+A</kbd> để phân tích văn bản đã chọn nhanh chóng
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Badge className="w-fit mb-2">Mẹo 2</Badge>
                <CardTitle className="text-base">Pin kết quả quan trọng</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click icon ghim để lưu các phân tích quan trọng và xem lại sau
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Badge className="w-fit mb-2">Mẹo 3</Badge>
                <CardTitle className="text-base">Tùy chỉnh phân tích</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Vào cài đặt để chọn loại phân tích phù hợp với nhu cầu của bạn
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-12 text-center"
        >
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => chrome.runtime.openOptionsPage()}
            >
              Mở cài đặt
            </Button>
            <Button
              onClick={() => chrome.tabs.create({ url: "https://github.com/yourusername/insight-buddy/wiki" })}
            >
              Xem hướng dẫn chi tiết
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
