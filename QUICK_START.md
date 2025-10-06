# 🚀 AcuxAI Sidebar - Quick Start Guide

## Prerequisites

- Node.js installed
- AcuxCode repository cloned
- Dependencies installed (`npm install`)

## Step 1: Build the Project

```bash
cd /Users/aaravpatel/Desktop/Developer/AcuxAI/AcuxCode/vscode
npm run watch
```

Wait for the build to complete. You should see:
```
[watch-client] Finished compilation with 0 errors after X ms
```

## Step 2: Run AcuxCode

In a new terminal:

```bash
cd /Users/aaravpatel/Desktop/Developer/AcuxAI/AcuxCode/vscode
./scripts/code.sh
```

## Step 3: Access the AI Sidebar

### Option 1: Activity Bar
1. Look for the AcuxAI icon in the left sidebar
2. Click to open the AI sidebar

### Option 2: Command Palette
1. Press `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows/Linux)
2. Type "AcuxAI: New Chat"
3. Press Enter

### Option 3: Right-Click Menu
1. Select some code in the editor
2. Right-click
3. Choose "Ask AcuxAI about this code"

## Step 4: Use the Features

### Select a Model
1. Click the model dropdown in the header
2. Choose from:
   - Claude 3.5 Sonnet
   - Grok 4 Fast
   - Gemini 1.5 Pro
   - GPT-4 Turbo
   - GPT-3.5 Turbo

### Toggle Context
1. Use the context bar toggles:
   - **Files**: Include workspace files
   - **Selection**: Include selected code
   - **Open Files**: Include all open tabs
2. See the context summary update

### Manage Chats
1. **New Chat**: Click the "New Chat" button
2. **Rename**: Click on a chat name
3. **Delete/Duplicate**: Click the "..." menu on any chat

### Send Messages
1. Type your message in the input area
2. Press `Enter` to send
3. Press `Shift + Enter` for a new line
4. Click the stop button to cancel generation

## Step 5: Try Quick Actions

### Explain Code
1. Select code in the editor
2. `Cmd/Ctrl + Shift + P` → "AcuxAI: Explain Selected Code"

### Fix Code
1. Select code with issues
2. `Cmd/Ctrl + Shift + P` → "AcuxAI: Fix Code Issues"

### Optimize Code
1. Select code to optimize
2. `Cmd/Ctrl + Shift + P` → "AcuxAI: Optimize Code"

### Create PR Summary
1. `Cmd/Ctrl + Shift + P` → "AcuxAI: Create PR Summary"

## Troubleshooting

### Sidebar Not Showing
```bash
# Rebuild
npm run watch

# Restart AcuxCode
./scripts/code.sh
```

### Build Errors
```bash
# Clean and rebuild
npm run clean
npm install
npm run watch
```

### Styles Not Loading
1. Open DevTools: `Help` → `Toggle Developer Tools`
2. Check Console for errors
3. Verify `acuxAiSidebar.css` is loaded

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Shift + P` | Open Command Palette |
| `Enter` | Send message |
| `Shift + Enter` | New line |
| `Esc` | Stop generation |

## What's Next?

1. **Connect Backend**: Implement actual AI model integration
2. **Add Context**: Wire up file/selection context gathering
3. **Enable Streaming**: Add WebSocket/SSE for real-time responses
4. **Persist Chats**: Implement chat storage

## Need Help?

- **User Guide**: See `ACUXAI_SIDEBAR_GUIDE.md`
- **Implementation**: See `IMPLEMENTATION_SUMMARY.md`
- **Editing**: See `COPILOT_SIDEBAR_EDITING_GUIDE.md`

---

**Happy Coding with AcuxAI! 🤖**
