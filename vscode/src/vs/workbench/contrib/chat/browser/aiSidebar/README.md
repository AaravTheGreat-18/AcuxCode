# AI Sidebar Refactoring

This folder contains the modular components extracted from `aiSidebarView.ts` to reduce the file size from 2100+ lines to under 1000 lines.

## Module Structure

### Core Modules

#### `types.ts` (27 lines)
- **Purpose**: Type definitions and interfaces
- **Exports**:
  - `CustomModel` - Custom AI model configuration
  - `ModelInfo` - Model information structure
  - `AttachedFile` - File attachment data

#### `modelManager.ts` (134 lines)
- **Purpose**: Model state management and persistence
- **Responsibilities**:
  - Manage selected model, custom models, recent models
  - Handle auto-mode state
  - Persist/load state from storage
  - CRUD operations for custom models
- **Key Methods**:
  - `getSelectedModel()`, `setSelectedModel()`
  - `addCustomModel()`, `updateCustomModel()`, `deleteCustomModel()`
  - `addRecentModel()`, `getRecentModels()`

#### `apiService.ts` (112 lines)
- **Purpose**: API request handling for all provider types
- **Responsibilities**:
  - Format requests for different providers (LM Studio, Ollama, OpenAI)
  - Handle authentication (multiple header formats)
  - Parse provider-specific responses
  - Error handling
- **Key Methods**:
  - `sendRequest(message, files, customModel)` - Main API call handler

### UI Modules

#### `messageRenderer.ts` (75 lines)
- **Purpose**: Render user and AI messages
- **Responsibilities**:
  - Display user messages (right-aligned bubble)
  - Display AI messages (left-aligned, copyable)
  - Clear message area
  - Auto-scroll to bottom
- **Key Methods**:
  - `displayUserMessage(message)`
  - `displayAIMessage(message)`
  - `clearMessages()`

#### `fileAttachmentManager.ts` (112 lines)
- **Purpose**: Manage file attachments
- **Responsibilities**:
  - Add/remove attached files
  - Display file chips with remove buttons
  - Prevent duplicate attachments
  - Use resource labels for file icons
- **Key Methods**:
  - `addFile(name, uri)`
  - `removeFile(index)`
  - `updateFilesDisplay()`
  - `clearFiles()`

#### `loadingIndicator.ts` (62 lines)
- **Purpose**: Show/hide loading indicator
- **Responsibilities**:
  - Animated "Thinking..." indicator
  - Auto-scroll during display
  - Cleanup on hide
- **Key Methods**:
  - `show()` - Display loading indicator
  - `hide()` - Remove loading indicator

#### `modelUI.ts` (384 lines)
- **Purpose**: Model form UI creation
- **Responsibilities**:
  - Create "Add Model" / "Edit Model" form
  - Dynamic field visibility based on provider type
  - Form validation (provider-specific)
  - Handle save/cancel callbacks
- **Key Methods**:
  - `createAddModelForm(container, existingModel, callbacks)`
  - Field generators for each input type

#### `modelDropdownRenderer.ts` (348 lines)
- **Purpose**: Render model selection dropdown
- **Responsibilities**:
  - Group models by provider
  - Show recently used models
  - Display custom models with edit/delete buttons
  - Search/filter functionality
  - "Add Model" button at bottom
- **Key Methods**:
  - `renderDropdown(container, models, customModels, recentModels, selectedModel, autoMode, callbacks)`

## Usage in Main File

The main `aiSidebarView.ts` file should now:
1. Import these modules
2. Instantiate them in the constructor
3. Delegate responsibilities to the appropriate module
4. Act as the coordinator between modules

### Example Integration

```typescript
import { ModelManager } from './aiSidebar/modelManager.js';
import { APIService } from './aiSidebar/apiService.js';
import { MessageRenderer } from './aiSidebar/messageRenderer.js';
import { FileAttachmentManager } from './aiSidebar/fileAttachmentManager.js';
import { LoadingIndicator } from './aiSidebar/loadingIndicator.js';
import { ModelUIHelper } from './aiSidebar/modelUI.js';
import { ModelDropdownRenderer } from './aiSidebar/modelDropdownRenderer.js';

export class AISidebarView extends Disposable {
    private modelManager: ModelManager;
    private apiService: APIService;
    private messageRenderer: MessageRenderer;
    private fileManager: FileAttachmentManager;
    private loadingIndicator: LoadingIndicator;
    // ...

    constructor(/* ... */) {
        super();
        this.modelManager = new ModelManager(this.storageService);
        this.apiService = new APIService();
        // Initialize other modules...
        this.create();
    }

    private async handleSendMessage(): Promise<void> {
        const message = this.inputElement.value.trim();
        this.messageRenderer.displayUserMessage(message);
        
        const model = this.modelManager.findCustomModel(this.modelManager.getSelectedModel());
        if (model) {
            this.loadingIndicator.show();
            try {
                const response = await this.apiService.sendRequest(message, this.fileManager.getAttachedFiles(), model);
                this.messageRenderer.displayAIMessage(response);
            } catch (error) {
                this.messageRenderer.displayAIMessage(error.message);
            } finally {
                this.loadingIndicator.hide();
            }
        }
    }
}
```

## Benefits

### Before Refactoring
- **1 file**: 2101 lines
- Hard to navigate
- Difficult to test individual components
- High coupling between UI and business logic

### After Refactoring
- **8 modules**: ~27-384 lines each
- Clear separation of concerns
- Each module can be tested independently
- Easy to locate and modify specific functionality
- Main file reduced to coordination logic (~800-900 lines)

## File Size Comparison

| Module | Lines | Purpose |
|--------|-------|---------|
| types.ts | 27 | Type definitions |
| modelManager.ts | 134 | State management |
| apiService.ts | 112 | API requests |
| messageRenderer.ts | 75 | Message display |
| fileAttachmentManager.ts | 112 | File handling |
| loadingIndicator.ts | 62 | Loading UI |
| modelUI.ts | 384 | Model form |
| modelDropdownRenderer.ts | 348 | Model dropdown |
| **Total** | **1,254** | **All components** |
| aiSidebarView.ts (refactored) | ~800-900 | Coordination |

## Next Steps

1. Update `aiSidebarView.ts` to import and use these modules
2. Remove duplicate code from main file
3. Test each module independently
4. Verify integration works correctly
5. Consider adding unit tests for each module
