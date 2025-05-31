# Tài Liệu Hệ Thống: Chrome Extension "Bạn Đồng Hành Giải Mã Tin Tức"

## 1. Architecture Overview

### Module Dependency Map

```
Existing Modules (✅ Available):
├── contentExtractor/     # Content extraction from web pages
├── uiComponents/        # Reusable UI components
├── storage/            # Storage & state management
└── ai/                 # AI integration & processing

New Modules (🔨 To Build):
├── extension/          # Chrome extension infrastructure
├── criticalThinking/   # Critical analysis features
└── newsAnalysis/      # News-specific analysis
```

### Data Flow Architecture

```
Web Page Content → Content Extraction → Analysis Engine → AI Module → Results → UI Components
     ↓                                                                        ↑
Storage Module ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

## 2. Development Phases

### Phase 1: Core Infrastructure (Week 1-2)

**Goal**: MVP với basic functionality

#### Tasks:

1. **Setup Chrome Extension Structure**

   - [ ] Create manifest.json v3
   - [ ] Setup background service worker
   - [ ] Create content script injection
   - [ ] Setup messaging system

2. **Integrate Existing Modules**

   - [ ] Integrate contentExtractor vào content script
   - [ ] Connect storage module với chrome.storage API
   - [ ] Setup uiComponents render system
   - [ ] Connect AI module với background worker

3. **Basic Context Menu Implementation**
   - [ ] Register context menu items
   - [ ] Handle text selection events
   - [ ] Basic analysis flow: select text → AI analysis → display results

### Phase 2: Advanced UI & Features (Week 3-4)

**Goal**: Floating icons và advanced analysis

#### Tasks:

1. **Floating Icon System**

   - [ ] Paragraph detection algorithm
   - [ ] Icon positioning & management
   - [ ] Mini-menu implementation

2. **Sidebar Implementation**

   - [ ] Sidebar UI component
   - [ ] Results history management
   - [ ] Pin/unpin functionality

3. **Critical Thinking Features**
   - [ ] Question generator
   - [ ] Bias detection
   - [ ] Alternative perspective generator

### Phase 3: Polish & Optimization (Week 5-6)

**Goal**: Production-ready extension

#### Tasks:

1. **Performance Optimization**
2. **Error Handling & Edge Cases**
3. **User Onboarding**
4. **Chrome Web Store Preparation**

## 3. Technical Implementation Details

### 3.1 Chrome Extension Structure

```
chrome-extension/
├── manifest.json
├── background/
│   ├── service-worker.js
│   └── ai-handler.js
├── content/
│   ├── content-script.js
│   ├── floating-icons.js
│   └── sidebar.js
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/
│   ├── options.html
│   └── options.js
├── assets/
│   ├── icons/
│   └── css/
└── modules/
    ├── contentExtractor/  # Your existing module
    ├── uiComponents/      # Your existing module
    ├── storage/          # Your existing module
    └── ai/               # Your existing module
```

### 3.2 Manifest.json Configuration

```json
{
  "manifest_version": 3,
  "name": "Bạn Đồng Hành Giải Mã Tin Tức",
  "version": "1.0.0",
  "description": "AI-powered critical thinking companion for news and articles",

  "permissions": ["activeTab", "contextMenus", "storage", "scripting"],

  "host_permissions": ["https://*/*", "http://*/*"],

  "background": {
    "service_worker": "background/service-worker.js"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content-script.js"],
      "css": ["assets/css/content.css"],
      "run_at": "document_end"
    }
  ],

  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "assets/icons/icon16.png",
      "32": "assets/icons/icon32.png",
      "48": "assets/icons/icon48.png",
      "128": "assets/icons/icon128.png"
    }
  }
}
```

### 3.3 Core Components Implementation

#### A. Background Service Worker

```javascript
// background/service-worker.js
import { AIModule } from '../modules/ai/index.js';
import { StorageModule } from '../modules/storage/index.js';

class BackgroundHandler {
  constructor() {
    this.aiModule = new AIModule();
    this.storageModule = new StorageModule();
    this.setupContextMenus();
    this.setupMessageHandlers();
  }

  setupContextMenus() {
    chrome.contextMenus.create({
      id: "analyze-text",
      title: "Phân tích đoạn văn này",
      contexts: ["selection"]
    });
  }

  setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender).then(sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  async handleMessage(message, sender) {
    switch (message.type) {
      case 'ANALYZE_TEXT':
        return await this.analyzeText(message.text, message.analysisType);
      case 'GET_HISTORY':
        return await this.storageModule.getHistory();
      // Add more message handlers
    }
  }

  async analyzeText(text, analysisType) {
    try {
      const result = await this.aiModule.analyze(text, analysisType);
      await this.storageModule.saveAnalysis(result);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

new BackgroundHandler();
```

#### B. Content Script

```javascript
// content/content-script.js
import { ContentExtractor } from '../modules/contentExtractor/index.js';
import { UIComponents } from '../modules/uiComponents/index.js';

class ContentScriptHandler {
  constructor() {
    this.contentExtractor = new ContentExtractor();
    this.uiComponents = new UIComponents();
    this.init();
  }

  init() {
    this.setupFloatingIcons();
    this.setupContextMenu();
    this.setupSidebar();
  }

  setupFloatingIcons() {
    const paragraphs = this.contentExtractor.detectParagraphs();
    paragraphs.forEach(paragraph => {
      const icon = this.uiComponents.createFloatingIcon({
        position: this.calculateIconPosition(paragraph),
        onClickHandlers: {
          'summarize': () => this.analyzeText(paragraph.textContent, 'summarize'),
          'question': () => this.analyzeText(paragraph.textContent, 'critical_questions'),
          'bias': () => this.analyzeText(paragraph.textContent, 'bias_detection')
        }
      });
      document.body.appendChild(icon);
    });
  }

  async analyzeText(text, analysisType) {
    this.uiComponents.showLoading();

    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_TEXT',
      text,
      analysisType
    });

    if (response.success) {
      this.displayResults(response.result);
    } else {
      this.uiComponents.showError(response.error);
    }
  }

  displayResults(result) {
    const sidebar = this.uiComponents.getSidebar();
    sidebar.addResult(result);
    sidebar.show();
  }
}

new ContentScriptHandler();
```

### 3.4 Integration Points với Existing Modules

#### A. Content Extractor Integration

```javascript
// Assume your contentExtractor has these methods:
const contentExtractor = new ContentExtractor();

// Usage in extension:
const paragraphs = contentExtractor.detectParagraphs(document);
const cleanText = contentExtractor.extractCleanText(selectedElement);
const articleContent = contentExtractor.getMainContent(document);
```

#### B. Storage Module Integration

```javascript
// Assume your storage module works like this:
const storage = new StorageModule();

// Extension-specific adaptations:
class ExtensionStorage extends StorageModule {
  async saveToChrome(key, data) {
    await chrome.storage.local.set({ [key]: data });
  }

  async getFromChrome(key) {
    const result = await chrome.storage.local.get(key);
    return result[key];
  }
}
```

#### C. UI Components Integration

```javascript
// Assume your UI components are modular:
const ui = new UIComponents();

// Extension-specific implementations:
const floatingIcon = ui.createFloatingIcon({
  className: 'news-analyzer-icon',
  position: { top: '10px', right: '10px' },
  content: '🔍'
});

const sidebar = ui.createSidebar({
  width: '300px',
  position: 'right',
  title: 'Analysis Results'
});
```

#### D. AI Module Integration

```javascript
// Your AI module interface (assuming):
const ai = new AIModule({
  provider: 'gemini', // or 'openai'
  apiKey: userApiKey
});

// Analysis types for the extension:
const analysisTypes = {
  summarize: {
    prompt: "Summarize this text in 2-3 sentences: {text}",
    temperature: 0.3
  },
  critical_questions: {
    prompt: "Generate 3 critical thinking questions about: {text}",
    temperature: 0.7
  },
  bias_detection: {
    prompt: "Identify potential biases or loaded language in: {text}",
    temperature: 0.5
  }
};
```

## 4. Development Workflow

### 4.1 Setup Development Environment

```bash
# 1. Create project structure
mkdir news-analyzer-extension
cd news-analyzer-extension

# 2. Copy existing modules
cp -r /path/to/your/modules/* ./modules/

# 3. Initialize package.json (for development tools)
npm init -y
npm install --save-dev webpack webpack-cli

# 4. Setup build process if needed
```

### 4.2 Testing Strategy

1. **Local Testing**: Load unpacked extension in Chrome developer mode
2. **Unit Testing**: Test individual modules
3. **Integration Testing**: Test message passing between components
4. **User Testing**: Test with real websites and content

### 4.3 Chrome Web Store Deployment Checklist

- [ ] Icons in all required sizes (16, 32, 48, 128px)
- [ ] Privacy policy document
- [ ] Store listing screenshots
- [ ] Detailed description
- [ ] Category selection
- [ ] Permissions justification

## 5. Configuration & Settings

### 5.1 User Settings Interface

```javascript
// User configurable options:
const defaultSettings = {
  floatingIcons: {
    enabled: true,
    position: 'right', // 'left' | 'right'
    size: 'medium', // 'small' | 'medium' | 'large'
    showOnHover: false
  },
  analysis: {
    autoDetectLanguage: true,
    defaultAnalysisType: 'summarize',
    maxTextLength: 5000
  },
  ai: {
    provider: 'gemini',
    temperature: 0.5,
    maxTokens: 500
  },
  ui: {
    theme: 'light', // 'light' | 'dark' | 'auto'
    sidebarPosition: 'right',
    showNotifications: true
  }
};
```

### 5.2 Site-Specific Configurations

```javascript
// For handling different website layouts:
const siteConfigs = {
  'medium.com': {
    articleSelector: 'article',
    paragraphSelector: 'p',
    excludeSelectors: ['.ad', '.sidebar']
  },
  'substack.com': {
    articleSelector: '.post-content',
    paragraphSelector: 'p',
    excludeSelectors: ['.subscription-widget']
  },
  // Add more as needed
};
```

## 6. Performance Considerations

### 6.1 Optimization Strategies

- **Lazy Loading**: Only initialize floating icons for visible paragraphs
- **Debouncing**: Prevent rapid-fire API calls
- **Caching**: Cache analysis results for repeated content
- **Selective Activation**: Only activate on article/news pages

### 6.2 Resource Management

```javascript
// Example resource management:
class ResourceManager {
  constructor() {
    this.cache = new Map();
    this.requestQueue = [];
    this.maxConcurrent = 3;
  }

  async queueAnalysis(text, type) {
    const cacheKey = this.generateCacheKey(text, type);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    return this.enqueueRequest(() => this.performAnalysis(text, type));
  }
}
```

## 7. Error Handling & Edge Cases

### 7.1 Common Error Scenarios

- API rate limits exceeded
- Network connectivity issues
- Malformed HTML content
- User permissions denied
- Invalid API keys

### 7.2 Graceful Degradation

```javascript
// Example error handling:
class ErrorHandler {
  static async handleAPIError(error) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      return {
        type: 'info',
        message: 'API rate limit reached. Please try again later.'
      };
    }
    // Handle other error types...
  }
}
```

## 8. Next Steps Checklist

### Immediate Actions (This Week):

- [ ] Setup basic Chrome extension structure
- [ ] Test integration with your existing modules
- [ ] Implement basic context menu functionality
- [ ] Create simple popup for settings

### Short Term (Next 2 Weeks):

- [ ] Implement floating icon system
- [ ] Build sidebar component
- [ ] Add critical thinking analysis features
- [ ] Optimize performance

### Medium Term (Next Month):

- [ ] User testing and feedback integration
- [ ] Chrome Web Store submission preparation
- [ ] Documentation and help system
- [ ] Marketing website setup

---

**Ready to start? Begin with Phase 1, Task 1: Setting up manifest.json and basic extension structure!**
