# Insight Buddy - AI Reading Assistant

<div align="center">
  <img src="assets/icon-128.png" alt="Insight Buddy Logo" width="128" height="128">

  <h3>Your intelligent reading companion that helps analyze, understand and think critically about any text content</h3>

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-orange)](package.json)

</div>

---

## ✨ Features

### 🎯 Smart Text Analysis

- **Floating Icons**: Automatically detect paragraphs and show interactive icons
- **Context Menu**: Right-click on selected text for instant analysis
- **Mini Menu**: Quick actions menu with one-click analysis options
- **Keyboard Shortcuts**: Fast access with customizable shortcuts

### 🤖 AI-Powered Analysis Types

- **📝 Summarize**: Get concise summaries of long paragraphs
- **💡 Explain**: Understand difficult terms and concepts
- **🤔 Critical Questions**: Generate thought-provoking questions
- **📚 Contextual Dictionary**: Learn words in their specific context
- **⚖️ Bias Detection**: Identify potential bias in writing
- **➕ Knowledge Expansion**: Discover related topics to explore

### 🎨 User Experience

- **Side Panel**: Dedicated panel for results and history
- **Quick Tooltips**: Instant results without opening sidebar
- **Dark Mode**: Automatic theme based on system preference
- **Offline Support**: Cached results available offline
- **Multi-language**: Vietnamese and English support

---

## 🚀 Installation

### From Chrome Web Store

1. Visit [Insight Buddy on Chrome Web Store](#)
2. Click "Add to Chrome"
3. Grant necessary permissions

### Development Installation

```bash
# Clone repository
git clone https://github.com/yourusername/insight-buddy.git
cd insight-buddy

# Install dependencies
pnpm install

# Build extension
pnpm build

# Load in Chrome
1. Open chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `build/chrome-mv3-prod` folder
```

---

## 📖 How to Use

### Basic Usage

1. **Floating Icons**

   - Hover over any paragraph to see the ⭐ icon
   - Click the icon to open quick actions menu
   - Select an analysis type

2. **Right-Click Analysis**

   - Select any text on a webpage
   - Right-click and choose "Phân tích với Insight Buddy"
   - Pick your preferred analysis type

3. **Keyboard Shortcuts**
   - `Ctrl+Shift+A` (Windows) / `Cmd+Shift+A` (Mac): Analyze selection
   - `Ctrl+Shift+S` / `Cmd+Shift+S`: Toggle sidebar
   - `Ctrl+Shift+Q` / `Cmd+Shift+Q`: Quick questions

### Advanced Features

#### Customizing Settings

1. Click the extension icon in toolbar
2. Go to Settings tab
3. Configure:
   - AI model (GPT-4, Gemini Pro, Claude)
   - Analysis language
   - Floating icon behavior
   - Privacy settings

#### Using History

- All analyses are saved in history
- Search past analyses
- Pin important results
- Export history as JSON

#### Offline Mode

- Recently analyzed content is cached
- Access previous results without internet
- Automatic sync when back online

---

## 🛠️ Configuration

### AI Models

Configure your preferred AI model in settings:

```javascript
// Supported models
{
  "gpt": "GPT-4",
  "gemini": "Gemini Pro",
  "claude": "Claude",
  "local": "Local Model" // For privacy-conscious users
}
```

### API Keys

To use premium AI models, add your API keys:

1. Go to Options page
2. Navigate to AI Settings
3. Enter your API keys:
   - OpenAI API Key for GPT-4
   - Google AI API Key for Gemini
   - Anthropic API Key for Claude

### Privacy Settings

Control your data:

- **Save History**: Toggle history saving
- **Cache Results**: Enable/disable result caching
- **Analytics**: Opt-out of usage analytics

---

## 🏗️ Architecture

```
insight-buddy/
├── src/
│   ├── background/          # Service worker
│   ├── contents/           # Content scripts
│   ├── sidepanel/          # Side panel UI
│   ├── popup/              # Extension popup
│   ├── options/            # Options page
│   ├── components/         # React components
│   ├── modules/            # Core modules
│   │   ├── analysis/       # Analysis engine
│   │   ├── ai/            # AI integration
│   │   ├── content-extractor/
│   │   ├── messaging/      # Message bus
│   │   ├── storage/        # Advanced storage
│   │   └── ui-components/  # UI components
│   ├── services/           # Business logic
│   └── utils/              # Utilities
```

### Key Technologies

- **Framework**: Plasmo
- **UI**: React + Tailwind CSS + Radix UI
- **State**: Zustand + React Query
- **AI**: Multiple AI provider support
- **Storage**: Chrome Storage + IndexedDB

---

## 🧪 Development

### Setup Development Environment

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Lint code
pnpm lint

# Type check
pnpm type-check
```

### Project Structure

- `background/`: Background service worker logic
- `contents/`: Content scripts for webpage interaction
- `modules/`: Reusable modules (AI, analysis, storage)
- `components/`: React UI components
- `services/`: Business logic services

### Key Files

- `insight-buddy.ts`: Main background script
- `insight-detector.ts`: Content script for detecting text
- `insight-sidebar.tsx`: Side panel component
- `insight-service.ts`: Core service integration

---

## 📋 Roadmap

### Version 1.1

- [ ] Multi-tab analysis comparison
- [ ] Export to PDF/Word
- [ ] Voice input support
- [ ] Browser sync

### Version 1.2

- [ ] Collaborative annotations
- [ ] Custom AI prompts
- [ ] Integration with note-taking apps
- [ ] Mobile companion app

### Future

- [ ] Real-time fact checking
- [ ] Academic citation generator
- [ ] Language translation
- [ ] Reading speed optimizer

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Guidelines

1. Follow TypeScript best practices
2. Write tests for new features
3. Update documentation
4. Submit PR with clear description

### Code Style

- Use Prettier for formatting
- Follow ESLint rules
- Maintain type safety
- Comment complex logic

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Plasmo Framework](https://plasmo.com/) for the excellent extension framework
- [Radix UI](https://www.radix-ui.com/) for accessible UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS
- AI providers for making intelligent analysis possible

---

## 📞 Support

- **Documentation**: [Wiki](https://github.com/yourusername/insight-buddy/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/insight-buddy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/insight-buddy/discussions)
- **Email**: support@insightbuddy.app

---

<div align="center">
  Made with ❤️ by the Insight Buddy Team

<sub>Your AI-powered reading companion</sub>

</div>
