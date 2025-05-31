// Mini menu component that appears when clicking floating icons

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  HelpCircle,
  Lightbulb,
  Plus,
  Scale,
  X
} from "lucide-react"

interface MiniMenuItem {
  id: string
  label: string
  icon: React.ReactNode
  action: string
}

interface MiniMenuProps {
  position: { x: number; y: number }
  onAction: (action: string) => void
  onClose: () => void
  isOpen: boolean
}

const menuItems: MiniMenuItem[] = [
  {
    id: "quickSummary",
    label: "Tóm tắt",
    icon: <FileText className="h-4 w-4" />,
    action: "summarize"
  },
  {
    id: "askQuestions",
    label: "Đặt câu hỏi",
    icon: <HelpCircle className="h-4 w-4" />,
    action: "critique"
  },
  {
    id: "explainTerms",
    label: "Giải thích",
    icon: <Lightbulb className="h-4 w-4" />,
    action: "explain"
  },
  {
    id: "checkBias",
    label: "Kiểm tra thiên vị",
    icon: <Scale className="h-4 w-4" />,
    action: "bias"
  },
  {
    id: "more",
    label: "Thêm",
    icon: <Plus className="h-4 w-4" />,
    action: "expand"
  }
]

export function MiniMenu({ position, onAction, onClose, isOpen }: MiniMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Add delay to prevent immediate close
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside)
    }, 100)

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Adjust position to prevent overflow
  const adjustedPosition = useRef(position)

  useEffect(() => {
    if (!menuRef.current || !isOpen) return

    const rect = menuRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let { x, y } = position

    // Adjust horizontal position
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 10
    }
    if (x < 10) {
      x = 10
    }

    // Adjust vertical position
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 10
    }
    if (y < 10) {
      y = 10
    }

    adjustedPosition.current = { x, y }

    if (menuRef.current) {
      menuRef.current.style.left = `${x}px`
      menuRef.current.style.top = `${y}px`
    }
  }, [position, isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="insight-buddy-mini-menu fixed z-[10002] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-1"
          style={{
            position: "fixed",
            left: adjustedPosition.current.x,
            top: adjustedPosition.current.y,
            minWidth: "180px"
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {index === menuItems.length - 1 && (
                  <div className="h-px bg-gray-200 dark:bg-gray-700 mx-2 my-1" />
                )}
                <motion.button
                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onAction(item.action)
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <span className="text-blue-500">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Quick Result Tooltip Component
interface QuickTooltipProps {
  content: string
  position: { x: number; y: number }
  type: "summary" | "questions" | "explanation" | "loading" | "error"
  isOpen: boolean
  onClose: () => void
}

export function QuickTooltip({ content, position, type, isOpen, onClose }: QuickTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || type === "loading") return

    const timer = setTimeout(() => {
      onClose()
    }, 8000) // Auto-hide after 8 seconds

    return () => clearTimeout(timer)
  }, [isOpen, type, onClose])

  const getTypeStyles = () => {
    switch (type) {
      case "summary":
        return "bg-green-500 text-white"
      case "questions":
        return "bg-red-500 text-white"
      case "explanation":
        return "bg-yellow-500 text-gray-900"
      case "loading":
        return "bg-blue-500 text-white"
      case "error":
        return "bg-red-600 text-white"
      default:
        return "bg-gray-800 text-white"
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className={`insight-buddy-tooltip fixed z-[10003] px-4 py-3 rounded-lg shadow-xl max-w-sm ${getTypeStyles()}`}
          style={{
            position: "fixed",
            left: position.x,
            top: position.y - 10,
            transform: "translate(-50%, -100%)"
          }}
        >
          {/* Arrow */}
          <div
            className={`absolute w-3 h-3 rotate-45 ${getTypeStyles()}`}
            style={{
              bottom: "-6px",
              left: "50%",
              transform: "translateX(-50%)"
            }}
          />

          {/* Content */}
          <div className="relative">
            {type === "loading" ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">{content}</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
            )}
          </div>

          {/* Close button for non-loading tooltips */}
          {type !== "loading" && (
            <button
              onClick={onClose}
              className="absolute -top-1 -right-1 w-5 h-5 bg-white text-gray-700 rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Floating Action Button Component
interface FloatingActionButtonProps {
  position: { x: number; y: number }
  onClick: () => void
  isVisible: boolean
}

export function FloatingActionButton({ position, onClick, isVisible }: FloatingActionButtonProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className="insight-buddy-fab fixed z-[10001] w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          style={{
            position: "fixed",
            left: position.x,
            top: position.y
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  )
}