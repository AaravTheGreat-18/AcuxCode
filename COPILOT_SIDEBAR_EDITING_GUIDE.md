# 🎨 AcuxCode Copilot Sidebar Editing Guide

## 📁 Key Files for Copilot Sidebar Editing

### 🎯 Main Components

#### 1. **Chat View Pane** (Main Sidebar Container)
- **File:** `src/vs/workbench/contrib/chat/browser/chatViewPane.ts`
- **Purpose:** Main container for the Copilot sidebar
- **Key Methods:**
  - `renderBody()` - Renders the main sidebar content
  - `loadSession()` - Loads chat sessions
  - `focusInput()` - Focuses the chat input

#### 2. **Chat Widget** (Core Chat Interface)
- **File:** `src/vs/workbench/contrib/chat/browser/chatWidget.ts`
- **Purpose:** The actual chat interface with messages and input
- **Key Methods:**
  - `render()` - Renders the chat widget
  - `createInput()` - Creates the input area
  - `createList()` - Creates the message list

#### 3. **Chat Sessions View** (Session Management)
- **File:** `src/vs/workbench/contrib/chat/browser/chatSessions/view/sessionsViewPane.ts`
- **Purpose:** Manages chat sessions in the sidebar
- **Key Methods:**
  - `renderBody()` - Renders the sessions list
  - `loadDataWithProgress()` - Loads session data

### 🎨 Styling Files

#### 1. **Main Chat Styles**
- **File:** `src/vs/workbench/contrib/chat/browser/media/chat.css`
- **Purpose:** All main chat styling
- **Key Classes:**
  - `.interactive-session` - Main chat container
  - `.interactive-item-container` - Individual message containers
  - `.chat-welcome-view-container` - Welcome message area

#### 2. **Chat Sessions Styles**
- **File:** `src/vs/workbench/contrib/chat/browser/media/chatSessions.css`
- **Purpose:** Session list styling
- **Key Classes:**
  - `.chat-sessions-view` - Sessions container
  - `.chat-sessions-tree-container` - Tree view container

### ⚙️ Configuration Files

#### 1. **Chat Configuration**
- **File:** `src/vs/workbench/contrib/chat/browser/chat.contribution.ts`
- **Purpose:** Chat settings and configuration
- **Key Settings:**
  - `chat.fontSize` - Font size for messages
  - `chat.fontFamily` - Font family for messages
  - `chat.editor.fontSize` - Font size for code blocks

## 🛠️ Common Editing Tasks

### 1. **Change Sidebar Width**
```css
/* In chat.css */
.interactive-session {
    max-width: 1200px; /* Change from 950px */
}
```

### 2. **Modify Message Styling**
```css
/* In chat.css */
.interactive-item-container {
    padding: 16px 20px; /* Change padding */
    background-color: var(--vscode-custom-chat-bg); /* Custom background */
}
```

### 3. **Customize Input Area**
```css
/* In chat.css */
.chat-input-container {
    border-radius: 8px; /* Rounded corners */
    background-color: var(--vscode-input-background);
}
```

### 4. **Add Custom Header**
```typescript
// In chatViewPane.ts, modify renderBody()
protected override async renderBody(parent: HTMLElement): Promise<void> {
    super.renderBody(parent);
    
    // Add custom header
    const customHeader = DOM.append(parent, $('.custom-chat-header'));
    customHeader.textContent = '🤖 AcuxCode AI Assistant';
    
    // ... rest of existing code
}
```

### 5. **Modify Welcome Message**
```typescript
// In chatViewPane.ts, look for ChatViewWelcomeController
// Or modify the welcome message in the CSS
.chat-welcome-view-container {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
}
```

## 🎯 Advanced Customizations

### 1. **Add Custom Buttons**
```typescript
// In chatWidget.ts, modify the render() method
private createCustomButtons(container: HTMLElement): void {
    const buttonContainer = DOM.append(container, $('.custom-buttons'));
    
    const customButton = new Button(buttonContainer, {
        title: 'Custom Action',
        icon: Codicon.heart
    });
    
    this._register(customButton.onDidClick(() => {
        // Handle custom action
        console.log('Custom button clicked!');
    }));
}
```

### 2. **Modify Message Rendering**
```typescript
// In chatWidget.ts, look for message rendering logic
// You can customize how messages are displayed
private renderCustomMessage(message: IChatMessage): HTMLElement {
    const messageElement = $('.custom-message');
    // Add your custom rendering logic
    return messageElement;
}
```

### 3. **Add Custom Themes**
```css
/* In chat.css, add custom theme variables */
:root {
    --acuxcode-chat-primary: #667eea;
    --acuxcode-chat-secondary: #764ba2;
    --acuxcode-chat-accent: #f093fb;
}

.interactive-session {
    --vscode-chat-requestBorder: var(--acuxcode-chat-primary);
}
```

## 🚀 How to Apply Changes

### 1. **Make Your Changes**
Edit the relevant files in `src/vs/workbench/contrib/chat/`

### 2. **Rebuild AcuxCode**
```bash
cd /Users/aaravpatel/Desktop/Developer/AcuxAI/AcuxCode/vscode
npm run watch
```

### 3. **Test Changes**
```bash
./scripts/code.sh
```

### 4. **Hot Reload** (if available)
Some changes may require a restart, but many CSS changes will apply immediately.

## 📝 Example: Complete Sidebar Makeover

Here's an example of how to completely customize the Copilot sidebar:

### 1. **Custom Header with Logo**
```typescript
// In chatViewPane.ts
protected override async renderBody(parent: HTMLElement): Promise<void> {
    super.renderBody(parent);
    
    // Custom header
    const header = DOM.append(parent, $('.acuxcode-chat-header'));
    header.innerHTML = `
        <div class="header-content">
            <div class="logo">🤖</div>
            <div class="title">AcuxCode AI</div>
            <div class="subtitle">Your Coding Assistant</div>
        </div>
    `;
    
    // ... rest of existing code
}
```

### 2. **Custom Styling**
```css
/* In chat.css */
.acuxcode-chat-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    text-align: center;
    border-radius: 8px;
    margin-bottom: 16px;
}

.acuxcode-chat-header .logo {
    font-size: 2em;
    margin-bottom: 8px;
}

.acuxcode-chat-header .title {
    font-size: 1.5em;
    font-weight: bold;
    margin-bottom: 4px;
}

.acuxcode-chat-header .subtitle {
    font-size: 0.9em;
    opacity: 0.8;
}
```

## 🔧 Development Tips

1. **Use Browser DevTools:** Right-click in the sidebar and inspect elements
2. **Check Console:** Look for any JavaScript errors
3. **Test Different Themes:** Make sure your changes work in both light and dark themes
4. **Responsive Design:** Test with different sidebar widths
5. **Accessibility:** Ensure your changes maintain keyboard navigation

## 🎨 Available CSS Variables

VS Code provides many CSS variables you can use:
- `--vscode-sideBar-background`
- `--vscode-sideBar-foreground`
- `--vscode-chat-requestBorder`
- `--vscode-interactive-session-foreground`
- `--vscode-button-background`
- `--vscode-button-foreground`

---

**🎉 Happy Customizing! Your AcuxCode Copilot sidebar is ready to be transformed!**
