# Tài Liệu Hệ Thống: Chrome Extension "Insight Buddy"

## Kiến Trúc Tổng Quan

```
┌─────────────────┬─────────────────┬─────────────────┐
│   Content       │   Extension     │   UI Layer      │
│   Detection     │   Core          │                 │
└─────────────────┴─────────────────┴─────────────────┘
│                 │                 │                 │
│ - Text Scanner  │ - Message Hub   │ - Floating Icon │
│ - Paragraph     │ - State Manager │ - Context Menu  │
│   Detector      │ - Event Router  │ - Sidebar       │
│ - Context       │                 │ - Mini Menu     │
│   Builder       │                 │                 │
└─────────────────┴─────────────────┴─────────────────┘
│                 │                 │                 │
└─────────────────┼─────────────────┼─────────────────┘
                  │                 │
          ┌───────┴───────┐ ┌───────┴───────┐
          │   AI Module   │ │  Storage      │
          │               │ │  Module       │
          └───────────────┘ └───────────────┘
          │               │ │               │
          │ - GPT/Gemini  │ │ - Cache       │
          │ - Prompts     │ │ - History     │
          │ - Response    │ │ - Settings    │
          │   Parser      │ │               │
          └───────────────┘ └───────────────┘
```

---

## F1: Tự Động Phát Hiện Và Hiển Thị Floating Icons

### Mô Tả

Tự động quét trang web, phát hiện các đoạn văn và hiển thị icon nhỏ bên cạnh để người dùng có thể tương tác nhanh.

### Components Liên Quan

- **content-extractor**: Phát hiện đoạn văn
- **ui-components**: FloatingIcon component
- **storage**: Cache vị trí icons đã hiển thị

### Implementation Details

#### 1.1 Content Scanner

```javascript
// Sử dụng content-extractor module
const paragraphDetector = {
  scanPage() {
    // Detect all text blocks > 50 words
    // Filter out navigation, ads, comments
    // Return array of {element, text, position}
  },

  shouldShowIcon(textBlock) {
    // Rules: min length, not duplicate, content type
    return textBlock.wordCount > 50 &&
           !textBlock.isNavigation &&
           !this.isAlreadyProcessed(textBlock);
  }
}
```

#### 1.2 Floating Icon Manager

```javascript
// Sử dụng ui-components module
const floatingIconManager = {
  createIcon(textBlock) {
    // Create floating icon với position absolute
    // Attach event listeners
    // Add to DOM
  },

  positionIcon(icon, textBlock) {
    // Calculate optimal position (top-right của paragraph)
    // Handle viewport boundaries
    // Handle page scroll
  },

  handleIconClick(icon, textBlock) {
    // Show mini menu với quick actions
    // Track interaction
  }
}
```

#### 1.3 Viewport Manager

```javascript
const viewportManager = {
  observeIntersection() {
    // Chỉ tạo icons cho paragraphs trong viewport
    // Lazy load để tối ưu performance
  },

  handleScroll() {
    // Update icon positions
    // Hide/show icons based on viewport
  }
}
```

### Acceptance Criteria

- [ ] Tự động phát hiện paragraphs > 50 từ trên mọi trang web
- [ ] Hiển thị floating icon ở vị trí không che khuất nội dung
- [ ] Icons chỉ xuất hiện khi hover hoặc khi paragraph được focus
- [ ] Performance tốt trên các trang có nhiều nội dung
- [ ] Icons không xuất hiện trên ads, navigation, comments

---

## F2: Context Menu Integration

### Mô Tả

Cho phép người dùng bôi đen text bất kỳ và nhấp chuột phải để access các tính năng phân tích.

### Components Liên Quan

- **ui-components**: ContextMenu component
- **content-extractor**: Text selection handler
- **analysis**: Analysis dispatcher

### Implementation Details

#### 2.1 Selection Handler

```javascript
// Extension của content-extractor module
const selectionHandler = {
  getSelectedText() {
    // Get user selection với context
    // Clean và validate text
    // Return {text, context, element}
  },

  getSelectionContext(selectedText, element) {
    // Lấy surrounding text để AI hiểu context
    // Get article title, author nếu có
    // Return contextual information
  }
}
```

#### 2.2 Context Menu Builder

```javascript
// Sử dụng ui-components module
const contextMenuBuilder = {
  buildMenu(selectedText) {
    return [
      { id: 'summarize', label: 'Tóm tắt đoạn này', icon: '📝' },
      { id: 'explain', label: 'Giải thích thuật ngữ', icon: '💡' },
      { id: 'critique', label: 'Đặt câu hỏi phản biện', icon: '🤔' },
      { id: 'context', label: 'Từ điển ngữ cảnh', icon: '📚' },
      { id: 'bias', label: 'Kiểm tra thiên vị', icon: '⚖️' }
    ];
  },

  handleMenuAction(action, selectedText, context) {
    // Route to appropriate analysis function
    // Show loading state
    // Display results
  }
}
```

#### 2.3 Chrome Extension Context Menu

```javascript
// manifest.json permissions
"permissions": ["contextMenus", "activeTab"]

// background.js
chrome.contextMenus.create({
  id: "analyzeText",
  title: "Phân tích với AI",
  contexts: ["selection"]
});
```

### Acceptance Criteria

- [ ] Context menu xuất hiện khi bôi đen text > 10 từ
- [ ] Menu có các options phù hợp với content type
- [ ] Hoạt động trên mọi website
- [ ] Có keyboard shortcuts cho power users
- [ ] Loading states rõ ràng khi processing

---

## F3: AI Analysis Features

### Mô Tả

Tích hợp các tính năng phân tích thông minh sử dụng AI module có sẵn.

### Components Liên Quan

- **ai**: Core AI processing
- **analysis**: Analysis orchestration
- **content-extractor**: Context building
- **storage**: Results caching

### Implementation Details

#### 3.1 Analysis Dispatcher

```javascript
// Extension của analysis module
const analysisDispatcher = {
  async analyzeText(text, analysisType, context) {
    // Validate input
    // Check cache first
    // Route to appropriate analyzer
    // Cache results
    return result;
  },

  getAnalysisPrompt(type, text, context) {
    const prompts = {
      summarize: `Tóm tắt ngắn gọn đoạn văn sau trong ngữ cảnh: ${context.title}`,
      explain: `Giải thích các thuật ngữ khó hiểu trong đoạn văn sau`,
      critique: `Đặt 3 câu hỏi phản biện sâu sắc về nội dung này`,
      bias: `Phân tích ngôn ngữ thiên vị hoặc cảm xúc trong đoạn văn`,
      expand: `Gợi ý 5 từ khóa để tìm hiểu thêm về chủ đề này`
    };
    return prompts[type];
  }
}
```

#### 3.2 Specialized Analyzers

```javascript
// Mở rộng analysis module
const criticalThinkingAnalyzer = {
  async generateQuestions(text, context) {
    // Tạo câu hỏi phản biện
    // Focus on logic, evidence, assumptions
  },

  async detectBias(text) {
    // Phát hiện ngôn ngữ thiên vị
    // Emotional language detection
    // Suggest neutral alternatives
  },

  async expandPerspective(text, context) {
    // Suggest related topics
    // Alternative viewpoints
    // Recommended searches
  }
}
```

#### 3.3 Result Formatter

```javascript
const resultFormatter = {
  formatSummary(aiResponse) {
    return {
      type: 'summary',
      content: aiResponse.summary,
      keyPoints: aiResponse.keyPoints,
      confidence: aiResponse.confidence
    };
  },

  formatQuestions(aiResponse) {
    return {
      type: 'questions',
      questions: aiResponse.questions.map(q => ({
        question: q.text,
        category: q.type, // logic, evidence, assumption
        explanation: q.reasoning
      }))
    };
  }
}
```

### Acceptance Criteria

- [ ] 5 loại analysis chính: tóm tắt, giải thích, phản biện, thiên vị, mở rộng
- [ ] Response time < 3 seconds cho mỗi analysis
- [ ] Kết quả được cache để tránh duplicate calls
- [ ] Fallback handling khi AI service unavailable
- [ ] Clear confidence indicators cho mỗi kết quả

---

## F4: Results Sidebar

### Mô Tả

Sidebar thống nhất để hiển thị kết quả phân tích, history và settings.

### Components Liên Quan

- **ui-components**: Sidebar, ResultCard components
- **storage**: History management
- **analysis**: Result formatting

### Implementation Details

#### 4.1 Sidebar Architecture

```javascript
// Sử dụng ui-components module
const sidebarManager = {
  initialize() {
    // Create sidebar DOM structure
    // Set up event listeners
    // Load initial state
  },

  show(result) {
    // Animate sidebar in
    // Display new result
    // Update history
  },

  hide() {
    // Animate sidebar out
    // Maintain state
  }
}
```

#### 4.2 Result Display Components

```javascript
const resultComponents = {
  SummaryCard: {
    render(summary) {
      return `
        <div class="result-card summary">
          <h3>📝 Tóm Tắt</h3>
          <p>${summary.content}</p>
          <ul>${summary.keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
      `;
    }
  },

  QuestionsCard: {
    render(questions) {
      return `
        <div class="result-card questions">
          <h3>🤔 Câu Hỏi Phản Biện</h3>
          ${questions.questions.map(q => `
            <div class="question-item">
              <strong>${q.question}</strong>
              <p class="explanation">${q.explanation}</p>
            </div>
          `).join('')}
        </div>
      `;
    }
  }
}
```

#### 4.3 History Manager

```javascript
// Extension của storage module
const historyManager = {
  addResult(result, context) {
    // Add to session history
    // Limit to last 10 results
    // Persist important results
  },

  getPageHistory() {
    // Get all results for current page
    // Group by analysis type
  },

  pinResult(resultId) {
    // Pin important results
    // Persist across sessions
  }
}
```

#### 4.4 Settings Panel

```javascript
const settingsPanel = {
  render() {
    return `
      <div class="settings-panel">
        <h3>⚙️ Cài Đặt</h3>
        <label>
          <input type="checkbox" id="enableFloatingIcons">
          Hiện floating icons
        </label>
        <label>
          <input type="checkbox" id="enableAutoAnalysis">
          Phân tích tự động
        </label>
        <select id="aiModel">
          <option value="gpt">GPT-4</option>
          <option value="gemini">Gemini Pro</option>
        </select>
      </div>
    `;
  }
}
```

### Acceptance Criteria

- [ ] Sidebar slide in/out smoothly từ phải
- [ ] Hiển thị tối đa 10 results gần nhất
- [ ] Pin/unpin results quan trọng
- [ ] Settings panel đầy đủ options
- [ ] Responsive design cho different screen sizes
- [ ] Clear separation giữa different result types

---

## F5: Mini Menu từ Floating Icons

### Mô Tả

Menu compact xuất hiện khi click floating icon, cung cấp quick actions.

### Components Liên Quan

- **ui-components**: MiniMenu component
- **analysis**: Quick analysis functions

### Implementation Details

#### 5.1 Mini Menu Component

```javascript
// Sử dụng ui-components module
const miniMenu = {
  create(textBlock, position) {
    return `
      <div class="mini-menu" style="top: ${position.y}px; left: ${position.x}px">
        <button data-action="quickSummary">📝 Tóm tắt</button>
        <button data-action="askQuestions">🤔 Đặt câu hỏi</button>
        <button data-action="explainTerms">💡 Giải thích</button>
        <button data-action="more">➕ Thêm</button>
      </div>
    `;
  },

  positionMenu(iconElement) {
    // Calculate position to avoid viewport overflow
    // Position relative to icon
    return {x: calculatedX, y: calculatedY};
  },

  handleAction(action, textBlock) {
    // Quick analysis without opening sidebar
    // Show inline results or tooltip
  }
}
```

#### 5.2 Quick Analysis Functions

```javascript
const quickAnalysis = {
  async quickSummary(text) {
    // 1-sentence summary
    // Show as tooltip
  },

  async quickQuestions(text) {
    // 1-2 critical questions
    // Show as expandable tooltip
  },

  async quickExplain(text) {
    // Explain 1-2 difficult terms
    // Show as inline definitions
  }
}
```

#### 5.3 Tooltip Display

```javascript
const tooltipManager = {
  show(content, position, type) {
    // Create tooltip with appropriate styling
    // Auto-hide after timeout
    // Handle multiple tooltips
  },

  createTooltip(content, type) {
    const templates = {
      summary: `<div class="tooltip summary">${content}</div>`,
      questions: `<div class="tooltip questions">${content}</div>`,
      explanation: `<div class="tooltip explanation">${content}</div>`
    };
    return templates[type];
  }
}
```

### Acceptance Criteria

- [ ] Menu xuất hiện immediately khi click floating icon
- [ ] 4 quick actions: tóm tắt, câu hỏi, giải thích, thêm
- [ ] Results hiển thị trong tooltip không che khuất nội dung
- [ ] Menu tự động hide khi click outside
- [ ] Keyboard navigation support
- [ ] Smooth animations cho show/hide

---

## F6: Keyboard Shortcuts & Accessibility

### Mô Tả

Hỗ trợ keyboard shortcuts và accessibility features.

### Components Liên Quan

- **ui-components**: Keyboard handler
- All components: Accessibility attributes

### Implementation Details

#### 6.1 Keyboard Shortcuts

```javascript
const keyboardHandler = {
  shortcuts: {
    'Ctrl+Shift+A': 'analyzeSelection',
    'Ctrl+Shift+S': 'toggleSidebar',
    'Ctrl+Shift+Q': 'quickQuestions',
    'Escape': 'hideAllMenus'
  },

  handleKeydown(event) {
    const combo = this.getKeyCombo(event);
    if (this.shortcuts[combo]) {
      event.preventDefault();
      this.executeAction(this.shortcuts[combo]);
    }
  }
}
```

#### 6.2 Accessibility Features

```javascript
const accessibilityManager = {
  addAriaLabels() {
    // Add proper ARIA labels to all interactive elements
    // Screen reader support
  },

  manageFocus() {
    // Proper focus management for modals, menus
    // Focus trapping trong sidebar
  },

  addHighContrastMode() {
    // High contrast themes
    // Larger text options
  }
}
```

### Acceptance Criteria

- [ ] 5 keyboard shortcuts chính hoạt động
- [ ] Tab navigation through all UI elements
- [ ] Screen reader compatibility
- [ ] High contrast mode option
- [ ] Focus indicators rõ ràng
- [ ] ARIA labels cho tất cả interactive elements

---

## F7: Error Handling & Offline Support

### Mô Tả

Robust error handling và fallback mechanisms.

### Components Liên Quan

- **ai**: Error handling cho API calls
- **storage**: Offline caching
- **ui-components**: Error display

### Implementation Details

#### 7.1 Error Handler

```javascript
const errorHandler = {
  handleAIError(error) {
    const errorTypes = {
      'rate_limit': 'API rate limit reached. Please try again in a few minutes.',
      'network': 'Network error. Check your connection.',
      'invalid_key': 'Invalid API key. Please check settings.',
      'content_too_long': 'Text too long for analysis. Please select a shorter passage.'
    };

    return errorTypes[error.type] || 'Unknown error occurred';
  },

  showErrorToast(message) {
    // Non-intrusive error display
    // Auto-dismiss after 5 seconds
  }
}
```

#### 7.2 Offline Support

```javascript
const offlineManager = {
  cacheAnalysis(text, result) {
    // Cache successful analyses
    // Use for offline viewing
  },

  isOffline() {
    return !navigator.onLine;
  },

  showOfflineMessage() {
    // Show helpful offline message
    // Suggest cached results
  }
}
```

### Acceptance Criteria

- [ ] Graceful degradation khi API không available
- [ ] Clear error messages cho different error types
- [ ] Cached results available offline
- [ ] Retry mechanisms cho transient errors
- [ ] Network status indicator

---

## F8: Settings & Customization

### Mô Tả

Comprehensive settings panel cho user customization.

### Implementation Details

#### 8.1 Settings Manager

```javascript
// Extension của storage module
const settingsManager = {
  defaultSettings: {
    enableFloatingIcons: true,
    enableAutoAnalysis: false,
    aiModel: 'gpt',
    analysisLanguage: 'vi',
    maxCacheSize: 100,
    showConfidenceScores: true
  },

  getSetting(key) {
    // Get setting với fallback to default
  },

  updateSetting(key, value) {
    // Update setting và sync across tabs
    // Trigger relevant updates
  }
}
```

#### 8.2 Customization Options

```javascript
const customizationOptions = {
  themes: ['light', 'dark', 'auto'],
  languages: ['vi', 'en', 'auto-detect'],
  aiModels: ['gpt-4', 'gemini-pro', 'claude'],
  iconPositions: ['top-right', 'top-left', 'bottom-right'],
  analysisTypes: {
    enabled: ['summarize', 'critique', 'explain'],
    disabled: ['bias', 'expand']
  }
}
```

### Acceptance Criteria

- [ ] Comprehensive settings panel
- [ ] Settings persist across browser sessions
- [ ] Real-time preview của customizations
- [ ] Import/export settings
- [ ] Reset to defaults option

---

## Integration Points

### Module Communication

```javascript
// Message passing architecture
const messageHub = {
  // Content script -> Background
  requestAnalysis: (text, type) => {},

  // Background -> Content script
  analysisComplete: (result) => {},

  // Popup -> Background
  updateSettings: (settings) => {},

  // Between content scripts
  syncState: (state) => {}
}
```

### Data Flow

```
User Action → UI Component → Analysis Dispatcher → AI Module → Result Formatter → UI Update → Storage
```

### Performance Targets

- Initial page scan: < 100ms
- Floating icon creation: < 50ms per icon
- AI analysis: < 3 seconds
- Sidebar open/close: < 200ms
- Memory usage: < 50MB per tab

### Testing Strategy

- Unit tests cho mỗi module
- Integration tests cho user flows
- Performance tests với large pages
- Cross-browser compatibility tests
- Accessibility audits
