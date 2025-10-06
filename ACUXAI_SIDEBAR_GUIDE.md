# 🤖 AcuxAI Sidebar - Modern AI Assistant

## Overview

The AcuxAI Sidebar is a modern, powerful AI coding assistant integrated into AcuxCode. It features a beautiful, minimal design inspired by Windsurf, Copilot Chat, and Cursor, optimized for developers.

## ✨ Features

### 🎨 Modern UI Design

- **Clean Header**
  - App logo and branding
  - Model selector dropdown (Claude 3.5, Grok 4 Fast, Gemini 1.5 Pro, GPT-4, GPT-3.5)
  - Settings gear icon
  - New Chat button

- **Context Bar**
  - Toggle file context inclusion
  - Toggle code selection context
  - Toggle open files context
  - Real-time context summary display

- **Enhanced Chat Interface**
  - Rounded message bubbles (8-12px corners)
  - Distinct user/AI message styling
  - Syntax highlighting for code blocks
  - Copy buttons on code blocks
  - Markdown and math support
  - Streaming responses with typing indicators

- **Welcome Screen**
  - Friendly introduction
  - Quick action suggestions
  - Getting started prompts

### 🔧 Functionality

#### Chat Management
- **New Chat**: Start fresh conversations
- **Save Chats**: Automatically saved to local storage
- **Rename Chats**: Click to rename any conversation
- **Delete Chats**: Remove unwanted conversations
- **Duplicate Chats**: Copy existing conversations

#### Context Controls
- **File Context**: Include workspace files in prompts
- **Selection Context**: Include currently selected code
- **Open Files**: Include all open editor tabs
- **Smart Context Summary**: Shows active context sources and token count

#### Input Area
- **Auto-expanding textarea** (max 4 lines)
- **Send button** (paper plane icon)
- **Stop Generation** button during AI responses
- **Keyboard shortcuts**:
  - `Enter` to send
  - `Shift + Enter` for newline
- **Attach file** icon for context uploads

### ⚡ Power Features

#### Command Palette Integration
Access AcuxAI from anywhere with these commands:

- `AcuxAI: New Chat` - Start a new conversation
- `AcuxAI: Explain Selected Code` - Get code explanations
- `AcuxAI: Create PR Summary` - Generate pull request summaries
- `AcuxAI: Fix Code Issues` - Identify and fix problems
- `AcuxAI: Optimize Code` - Improve performance

#### Right-Click Context Menu
- Right-click in editor → "Ask AcuxAI about this code"
- Quick access to AI assistance

#### Inline Context Display
- Preview of included files and line ranges
- Token count estimation
- Context source indicators

#### Memory Summary
- Conversation summaries for long threads
- Quick context recall
- Smart conversation threading

## 📁 File Structure

```
vscode/src/vs/workbench/contrib/chat/browser/
├── acuxAiHeader.ts              # Header component with model selector
├── acuxAiContextBar.ts          # Context toggles and controls
├── acuxAiChatManager.ts         # Chat session management
├── actions/
│   └── acuxAiActions.ts         # Command palette actions
├── media/
│   └── acuxAiSidebar.css        # Modern styling
└── chatViewPane.ts              # Main integration point
```

## 🎨 Styling

### Design Language
- **Minimalist & Clean**: VS Code native look
- **Rounded Corners**: 8-10px for modern feel
- **Light Shadows**: Subtle depth
- **Theme Aware**: Adapts to dark/light themes
- **Smooth Animations**: Fade in/out, hover effects

### Color Scheme
- Uses VS Code theme variables
- Consistent with editor colors
- Accessible contrast ratios
- Support for custom themes

### Typography
- Matches VS Code's default UI font
- Proper hierarchy (11px-20px range)
- Letter spacing for labels
- Font weights for emphasis

## 🚀 Usage

### Opening the Sidebar
1. Click the AcuxAI icon in the activity bar
2. Use `Cmd/Ctrl + Shift + P` → "AcuxAI: New Chat"
3. Right-click in editor → "Ask AcuxAI about this code"

### Selecting a Model
1. Click the model dropdown in the header
2. Choose from available models:
   - **Claude 3.5 Sonnet**: Most capable, 200K context
   - **Grok 4 Fast**: Ultra-fast responses, 128K context
   - **Gemini 1.5 Pro**: Google's latest, 1M context
   - **GPT-4 Turbo**: OpenAI flagship, 128K context
   - **GPT-3.5 Turbo**: Fast and efficient, 16K context

### Managing Context
1. Use toggles in the context bar:
   - **Files**: Include workspace file context
   - **Selection**: Include selected code
   - **Open Files**: Include all open tabs
2. View active context summary
3. Context automatically included in prompts

### Chat Sessions
1. **Create**: Click "New Chat" button
2. **Rename**: Click on chat name in sessions list
3. **Delete**: Click "..." menu → Delete
4. **Duplicate**: Click "..." menu → Duplicate
5. **Switch**: Click any saved chat to reopen

## ⚙️ Configuration

### Model Settings
Configure default model in settings:
```json
{
  "acuxai.defaultModel": "claude-3.5",
  "acuxai.streamingEnabled": true,
  "acuxai.maxTokens": 4096
}
```

### Context Settings
```json
{
  "acuxai.context.includeFiles": true,
  "acuxai.context.includeSelection": true,
  "acuxai.context.includeOpenFiles": false,
  "acuxai.context.maxFiles": 10
}
```

### UI Settings
```json
{
  "acuxai.ui.showWelcomeScreen": true,
  "acuxai.ui.messageAnimation": true,
  "acuxai.ui.compactMode": false
}
```

## 🔌 API Integration

### Adding New Models
Edit `chatViewPane.ts`:

```typescript
private getAvailableModels(): IAcuxAiModel[] {
  return [
    { 
      id: 'your-model-id', 
      name: 'Your Model Name', 
      description: 'Model description',
      contextWindow: '100K',
      speed: 'Fast'
    },
    // ... other models
  ];
}
```

### Implementing Model Switching
```typescript
private handleModelChange(modelId: string): void {
  // Update backend endpoint
  this.chatService.setModel(modelId);
  
  // Update UI
  this.logService.info(`Model changed to ${modelId}`);
}
```

### Context Handling
```typescript
private handleContextChange(state: IContextToggleState): void {
  if (state.includeFiles) {
    // Gather file context
    const files = this.workspaceService.getFiles();
    this.chatService.addContext(files);
  }
  
  if (state.includeSelection) {
    // Get selected code
    const selection = this.editorService.getSelection();
    this.chatService.addContext(selection);
  }
}
```

## 🎯 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Shift + A` | Open AcuxAI Sidebar |
| `Cmd/Ctrl + N` | New Chat (when sidebar focused) |
| `Enter` | Send message |
| `Shift + Enter` | New line in message |
| `Cmd/Ctrl + K` | Clear current chat |
| `Cmd/Ctrl + /` | Toggle context bar |
| `Esc` | Stop generation |

## 🐛 Troubleshooting

### Sidebar Not Showing
1. Check if AcuxCode is properly built: `npm run watch`
2. Restart AcuxCode: `./scripts/code.sh`
3. Check browser console for errors

### Model Not Switching
1. Verify API keys are configured
2. Check network connectivity
3. Review logs: Developer → Toggle Developer Tools

### Context Not Working
1. Ensure files are saved
2. Check context toggle states
3. Verify workspace is open

### Styling Issues
1. Clear cache and reload
2. Check theme compatibility
3. Verify CSS is loaded: Inspect element

## 🔄 Updates & Maintenance

### Updating Styles
Edit `media/acuxAiSidebar.css` and rebuild:
```bash
npm run watch
```

### Adding Features
1. Create component in `browser/` directory
2. Import in `chatViewPane.ts`
3. Add to render pipeline
4. Update this documentation

### Testing
```bash
# Run tests
npm test

# Run specific test
npm test -- --grep "AcuxAI"
```

## 📚 Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Chat API Documentation](../common/README.md)
- [Styling Guide](./media/README.md)
- [Contributing Guide](../../../../CONTRIBUTING.md)

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

Copyright (c) AcuxAI. All rights reserved.

---

**Built with ❤️ by the AcuxAI Team**
