# 🏗️ AcuxAI Sidebar Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      AcuxCode Editor                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Activity Bar                          │ │
│  │  [Files] [Search] [Git] [Debug] [🤖 AcuxAI]           │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌──────────────┬──────────────────────────────────────────┐ │
│  │              │                                          │ │
│  │   Sidebar    │         Editor Area                     │ │
│  │              │                                          │ │
│  │  ┌────────┐  │  ┌────────────────────────────────────┐ │ │
│  │  │ AcuxAI │  │  │                                    │ │ │
│  │  │        │  │  │    Code Editor                     │ │ │
│  │  │ Header │  │  │                                    │ │ │
│  │  ├────────┤  │  │                                    │ │ │
│  │  │Context │  │  │                                    │ │ │
│  │  │  Bar   │  │  └────────────────────────────────────┘ │ │
│  │  ├────────┤  │                                          │ │
│  │  │ Chat   │  │                                          │ │
│  │  │Manager │  │                                          │ │
│  │  ├────────┤  │                                          │ │
│  │  │        │  │                                          │ │
│  │  │ Chat   │  │                                          │ │
│  │  │Widget  │  │                                          │ │
│  │  │        │  │                                          │ │
│  │  ├────────┤  │                                          │ │
│  │  │ Input  │  │                                          │ │
│  │  └────────┘  │                                          │ │
│  └──────────────┴──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
ChatViewPane (Main Container)
│
├── AcuxAiHeader
│   ├── Logo & Branding
│   ├── Model Selector (SelectBox)
│   ├── Settings Button
│   └── New Chat Button
│
├── AcuxAiContextBar
│   ├── File Context Toggle
│   ├── Selection Context Toggle
│   ├── Open Files Toggle
│   └── Context Summary
│
├── AcuxAiChatManager (Optional)
│   ├── Session List
│   ├── Session Items
│   │   ├── Name
│   │   ├── Metadata
│   │   └── Context Menu
│   └── Empty State
│
├── ChatViewWelcomeController
│   └── Welcome Screen
│
└── ChatWidget (Existing)
    ├── Message List
    ├── Code Blocks
    └── Input Area
```

## Data Flow

```
┌─────────────┐
│   User      │
│  Actions    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│     Command Palette Actions         │
│  • AcuxAI: New Chat                │
│  • AcuxAI: Explain Code            │
│  • AcuxAI: Fix Code                │
│  • AcuxAI: Optimize Code           │
│  • AcuxAI: Create PR Summary       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│        ChatViewPane                 │
│  • Manages UI state                │
│  • Coordinates components          │
│  • Handles events                  │
└──────┬──────────────────────────────┘
       │
       ├──────────────┬──────────────┬─────────────┐
       ▼              ▼              ▼             ▼
┌────────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐
│   Header   │  │  Context  │  │   Chat   │  │   Chat   │
│ Component  │  │    Bar    │  │ Manager  │  │  Widget  │
└────────────┘  └───────────┘  └──────────┘  └──────────┘
       │              │              │             │
       ▼              ▼              ▼             ▼
┌─────────────────────────────────────────────────────────┐
│                   Event Handlers                        │
│  • onModelChange()                                      │
│  • onContextChange()                                    │
│  • onSessionSelect()                                    │
│  • onNewChat()                                          │
└─────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                Backend Services (TODO)                  │
│  • AI Model API                                         │
│  • Context Gathering                                    │
│  • Chat Persistence                                     │
│  • Streaming Service                                    │
└─────────────────────────────────────────────────────────┘
```

## File Dependencies

```
chat.contribution.ts
    │
    ├── Registers: acuxAiActions.ts
    │   └── Exports: registerAcuxAiActions()
    │
    └── Imports: chatViewPane.ts
        │
        ├── Imports: acuxAiHeader.ts
        │   └── Exports: AcuxAiHeader, IAcuxAiModel
        │
        ├── Imports: acuxAiContextBar.ts
        │   └── Exports: AcuxAiContextBar, IContextToggleState
        │
        ├── Imports: acuxAiChatManager.ts
        │   └── Exports: AcuxAiChatManager, IChatSession
        │
        └── Imports: media/acuxAiSidebar.css
            └── Styles all components
```

## Service Integration

```
┌─────────────────────────────────────────────────────────┐
│              VS Code Services Used                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  IInstantiationService  ──→  Create components         │
│  IContextViewService    ──→  Dropdown menus            │
│  IThemeService          ──→  Theme colors              │
│  IHoverService          ──→  Tooltips                  │
│  IContextMenuService    ──→  Context menus             │
│  IEditorService         ──→  Get active editor         │
│  IViewsService          ──→  Open/close views          │
│  IChatService           ──→  Chat operations           │
│  ILogService            ──→  Logging                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## State Management

```
┌─────────────────────────────────────────────────────────┐
│                  Component State                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  AcuxAiHeader                                          │
│  ├── selectedModelId: string                           │
│  ├── models: IAcuxAiModel[]                           │
│  └── Events: onDidChangeModel, onDidClickNewChat      │
│                                                         │
│  AcuxAiContextBar                                      │
│  ├── state: IContextToggleState                       │
│  │   ├── includeFiles: boolean                        │
│  │   ├── includeSelection: boolean                    │
│  │   └── includeOpenFiles: boolean                    │
│  └── Events: onDidChangeState                         │
│                                                         │
│  AcuxAiChatManager                                     │
│  ├── sessions: IChatSession[]                         │
│  ├── currentSessionId: string                         │
│  └── Events: onDidSelectSession, onDidRenameSession   │
│                                                         │
│  ChatViewPane                                          │
│  ├── viewState: IViewPaneState                        │
│  │   ├── sessionId: string                            │
│  │   ├── inputValue: string                           │
│  │   └── inputState: IChatInputState                  │
│  └── widget: ChatWidget                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Event Flow

```
User Action
    │
    ▼
UI Component
    │
    ├── Emits Event (onDidChange...)
    │
    ▼
ChatViewPane Handler
    │
    ├── Updates State
    ├── Calls Service
    │
    ▼
Backend Service (TODO)
    │
    ├── Process Request
    ├── Return Response
    │
    ▼
Update UI
    │
    └── Render Changes
```

## Styling Architecture

```
acuxAiSidebar.css
│
├── Header Styles
│   ├── .acuxai-header
│   ├── .acuxai-brand
│   ├── .acuxai-model-selector
│   └── .acuxai-new-chat-btn
│
├── Context Bar Styles
│   ├── .acuxai-context-bar
│   ├── .acuxai-context-toggle
│   └── .acuxai-context-summary
│
├── Chat Manager Styles
│   ├── .acuxai-chat-manager
│   ├── .acuxai-chat-session-item
│   └── .acuxai-chat-session-menu
│
├── Message Styles
│   ├── .interactive-item-container
│   ├── .interactive-request
│   └── .interactive-response
│
├── Input Styles
│   ├── .interactive-input-part
│   └── .chat-input-container
│
└── Animations
    ├── @keyframes fadeInUp
    ├── @keyframes pulse
    └── @keyframes ellipsis
```

## Extension Points

```
┌─────────────────────────────────────────────────────────┐
│              How to Extend                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Add New Model                                      │
│     └── Edit: chatViewPane.ts → getAvailableModels()  │
│                                                         │
│  2. Add New Action                                     │
│     └── Edit: actions/acuxAiActions.ts                │
│     └── Register: chat.contribution.ts                │
│                                                         │
│  3. Add New Context Source                            │
│     └── Edit: acuxAiContextBar.ts                     │
│     └── Add: New toggle + handler                     │
│                                                         │
│  4. Customize Styling                                  │
│     └── Edit: media/acuxAiSidebar.css                 │
│                                                         │
│  5. Add New Component                                  │
│     └── Create: New .ts file                          │
│     └── Import: In chatViewPane.ts                    │
│     └── Render: In renderBody()                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Build Pipeline

```
Source Files (.ts, .css)
    │
    ▼
TypeScript Compiler (tsc)
    │
    ├── Type checking
    ├── Transpilation
    │
    ▼
JavaScript Output (.js)
    │
    ▼
CSS Processing
    │
    ├── Bundling
    ├── Minification
    │
    ▼
AcuxCode Bundle
    │
    ▼
Runtime Execution
```

## Future Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Planned Enhancements                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Backend Integration                                    │
│  ├── WebSocket for streaming                          │
│  ├── REST API for models                              │
│  └── Database for persistence                         │
│                                                         │
│  Advanced Features                                      │
│  ├── Memory/RAG system                                │
│  ├── Code analysis engine                             │
│  ├── Multi-file context                               │
│  └── Voice input/output                               │
│                                                         │
│  UI Enhancements                                        │
│  ├── Drag-and-drop files                              │
│  ├── Inline code actions                              │
│  ├── Custom themes                                     │
│  └── Split view support                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

**This architecture provides a solid foundation for a modern AI coding assistant!**
