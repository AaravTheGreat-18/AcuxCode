/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../base/browser/dom.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { URI } from '../../../../base/common/uri.js';
import { basename } from '../../../../base/common/path.js';
import { IQuickInputService, IQuickPickItemWithResource } from '../../../../platform/quickinput/common/quickInput.js';
import { AnythingQuickAccessProviderRunOptions } from '../../../../platform/quickinput/common/quickAccess.js';
import { AbstractGotoSymbolQuickAccessProvider, IGotoSymbolQuickPickItem } from '../../../../editor/contrib/quickAccess/browser/gotoSymbolQuickAccess.js';
import { AnythingQuickAccessProvider } from '../../search/browser/anythingQuickAccess.js';
import { SymbolsQuickAccessProvider } from '../../search/browser/symbolsQuickAccess.js';
import { IChatWidgetService } from './chat.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { ResourceLabels } from '../../../browser/labels.js';
import * as event from '../../../../base/common/event.js';

const $ = dom.$;

export class AISidebarView extends Disposable {
    private container!: HTMLElement;
    private attachedFiles: Array<{ name: string; uri: URI }> = [];
    private filesDisplayArea!: HTMLElement;
    private resourceLabels!: ResourceLabels;
    private inputElement!: HTMLTextAreaElement;
    private selectedModel: string = 'GPT-4';

    constructor(
        @IQuickInputService private readonly quickInputService: IQuickInputService,
        @IChatWidgetService private readonly chatWidgetService: IChatWidgetService,
        @IInstantiationService private readonly instantiationService: IInstantiationService
    ) {
        super();
        console.log('[AcuxCode] AISidebarView constructor called');
        this.create();
        console.log('[AcuxCode] AISidebarView created successfully');
        this.tryBindWidget();
    }

    private create(): void {
        // Create main container with theme-aware styling
        this.container = $('div.ai-sidebar-simple');
        
        // Create resource labels for file icons
        this.resourceLabels = this._register(this.instantiationService.createInstance(ResourceLabels, { onDidChangeVisibility: event.Event.None }));
        
        // Use CSS variables for theme colors instead of hardcoded values
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.padding = '20px';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.overflow = 'auto';
        this.container.style.boxSizing = 'border-box';
        
        console.log('[AcuxCode] Container created with styles');

        // Add spacer to push input to bottom
        const spacer = $('div');
        spacer.style.flex = '1';
        this.container.appendChild(spacer);

        // Add input box at the bottom
        const inputContainer = $('div');
        inputContainer.style.display = 'flex';
        inputContainer.style.flexDirection = 'column';
        inputContainer.style.paddingBottom = '10px';
        inputContainer.style.flexShrink = '0';
        inputContainer.style.alignItems = 'center';
        inputContainer.style.justifyContent = 'center';
        
        // Create wrapper for the entire input area
        const inputWrapper = $('div');
        inputWrapper.style.position = 'relative';
        inputWrapper.style.width = '95%';
        inputWrapper.style.maxWidth = '900px';
        inputWrapper.style.display = 'flex';
        inputWrapper.style.flexDirection = 'column';
        inputWrapper.style.border = '1px solid var(--vscode-input-border)';
        inputWrapper.style.borderRadius = '12px';
        inputWrapper.style.backgroundColor = 'var(--vscode-input-background)';
        inputWrapper.style.overflow = 'hidden';
        
        // Files display area (above input)
        this.filesDisplayArea = $('div');
        this.filesDisplayArea.style.display = 'none'; // Hidden by default
        this.filesDisplayArea.style.padding = '8px 12px';
        this.filesDisplayArea.style.gap = '8px';
        this.filesDisplayArea.style.flexWrap = 'wrap';
        this.filesDisplayArea.style.borderBottom = '1px solid var(--vscode-input-border)';
        this.filesDisplayArea.style.backgroundColor = 'var(--vscode-input-background)';
        
        // Top half - text input area
        this.inputElement = $('textarea', { placeholder: 'Ask anything...' }) as HTMLTextAreaElement;
        const input = this.inputElement;
        input.style.padding = '12px 14px';
        input.style.border = 'none';
        input.style.fontSize = '13px';
        input.style.backgroundColor = 'transparent';
        input.style.color = 'var(--vscode-input-foreground)';
        input.style.outline = 'none';
        input.style.width = '100%';
        input.style.boxSizing = 'border-box';
        input.style.minHeight = '60px';
        input.style.resize = 'none';
        input.style.fontFamily = 'inherit';
        
        // Bottom half - controls area
        const controlsArea = $('div');
        controlsArea.style.display = 'flex';
        controlsArea.style.alignItems = 'center';
        controlsArea.style.justifyContent = 'space-between';
        controlsArea.style.padding = '8px 12px';
        controlsArea.style.backgroundColor = 'var(--vscode-input-background)';
        
        // Create model dropdown
        const modelSelect = $('select') as HTMLSelectElement;
        modelSelect.style.padding = '4px 8px';
        modelSelect.style.fontSize = '11px';
        modelSelect.style.fontWeight = '600';
        modelSelect.style.border = '1px solid var(--vscode-input-border)';
        modelSelect.style.borderRadius = '6px';
        modelSelect.style.backgroundColor = 'var(--vscode-input-background)';
        modelSelect.style.color = 'var(--vscode-input-foreground)';
        modelSelect.style.cursor = 'pointer';
        modelSelect.style.outline = 'none';
        
        // Add model options
        const models = ['GPT-4', 'GPT-3.5', 'Claude 3', 'Gemini'];
        models.forEach(modelName => {
            const option = $('option') as HTMLOptionElement;
            option.value = modelName;
            option.textContent = modelName;
            modelSelect.appendChild(option);
        });
        
        // Track selected model
        modelSelect.onchange = () => {
            this.selectedModel = modelSelect.value;
            console.log('[AcuxCode] Model changed to:', this.selectedModel);
        };
        
        // Create send button (circular with clean arrow)
        const sendButton = $('button');
        sendButton.style.width = '28px';
        sendButton.style.height = '28px';
        sendButton.style.borderRadius = '50%';
        sendButton.style.border = 'none';
        sendButton.style.backgroundColor = '#ffffff';
        sendButton.style.cursor = 'pointer';
        sendButton.style.display = 'flex';
        sendButton.style.alignItems = 'center';
        sendButton.style.justifyContent = 'center';
        sendButton.style.padding = '0';
        sendButton.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
        sendButton.setAttribute('aria-label', 'Send message');
        
        // Create SVG arrow using DOM
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '14');
        svg.setAttribute('height', '14');
        svg.setAttribute('viewBox', '0 0 16 16');
        svg.setAttribute('fill', 'none');
        svg.style.display = 'block';
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M8 3L8 13M8 3L4 7M8 3L12 7');
        path.setAttribute('stroke', '#000000');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        
        svg.appendChild(path);
        sendButton.appendChild(svg);
        
        // Add hover effect
        sendButton.onmouseenter = () => {
            sendButton.style.backgroundColor = '#f2f2f2';
        };
        sendButton.onmouseleave = () => {
            sendButton.style.backgroundColor = '#ffffff';
        };
        
        // Add send button click handler
        sendButton.onclick = () => {
            this.handleSendMessage();
        };
        
        // Add Enter key handler for input (Shift+Enter for new line)
        input.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        };
        
        // Create add file button
        const addFileButton = $('button');
        addFileButton.style.width = '28px';
        addFileButton.style.height = '28px';
        addFileButton.style.borderRadius = '50%';
        addFileButton.style.border = '1px solid var(--vscode-input-border)';
        addFileButton.style.backgroundColor = 'transparent';
        addFileButton.style.cursor = 'pointer';
        addFileButton.style.display = 'flex';
        addFileButton.style.alignItems = 'center';
        addFileButton.style.justifyContent = 'center';
        addFileButton.style.padding = '0';
        addFileButton.setAttribute('aria-label', 'Add file');
        
        // Create plus SVG icon
        const plusSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        plusSvg.setAttribute('width', '14');
        plusSvg.setAttribute('height', '14');
        plusSvg.setAttribute('viewBox', '0 0 16 16');
        plusSvg.setAttribute('fill', 'none');
        plusSvg.style.display = 'block';
        
        const plusPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        plusPath.setAttribute('d', 'M8 3V13M3 8H13');
        plusPath.setAttribute('stroke', 'var(--vscode-input-foreground)');
        plusPath.setAttribute('stroke-width', '2');
        plusPath.setAttribute('stroke-linecap', 'round');
        
        plusSvg.appendChild(plusPath);
        addFileButton.appendChild(plusSvg);
        
        // Add hover effect for file button
        addFileButton.onmouseenter = () => {
            addFileButton.style.backgroundColor = 'var(--vscode-list-hoverBackground)';
        };
        addFileButton.onmouseleave = () => {
            addFileButton.style.backgroundColor = 'transparent';
        };
        
        // Add click handler for file button
        addFileButton.onclick = () => {
            console.log('[AcuxCode] Add file button clicked');
            this.openFilePicker();
        };
        
        // Left side controls (model + add file)
        const leftControls = $('div');
        leftControls.style.display = 'flex';
        leftControls.style.gap = '8px';
        leftControls.style.alignItems = 'center';
        leftControls.appendChild(modelSelect);
        leftControls.appendChild(addFileButton);
        
        // Assemble the controls area
        controlsArea.appendChild(leftControls);
        controlsArea.appendChild(sendButton);
        
        // Assemble the input wrapper
        inputWrapper.appendChild(this.filesDisplayArea);
        inputWrapper.appendChild(input);
        inputWrapper.appendChild(controlsArea);
        inputContainer.appendChild(inputWrapper);
        
        this.container.appendChild(inputContainer);
        console.log('[AcuxCode] Input box added');
    }
    private tryBindWidget(): void {
        const widget = this.chatWidgetService.lastFocusedWidget;
        if (!widget) {
            return;
        }
        this._register(widget.attachmentModel.onDidChange(() => {
            this.syncFromWidget();
        }));
        this.syncFromWidget();
    }

    private syncFromWidget(): void {
        const widget = this.chatWidgetService.lastFocusedWidget;
        if (!widget) {
            return;
        }
        const fileUris = widget.attachmentModel.fileAttachments;
        this.attachedFiles = fileUris.map(uri => ({ name: basename(uri.path), uri }));
        this.updateFilesDisplay();
    }


    public getDomNode(): HTMLElement {
        console.log('[AcuxCode] getDomNode called, returning:', this.container);
        return this.container;
    }

    public focus(): void {
        console.log('[AcuxCode] focus called');
    }

    public getValue(): string {
        return this.inputElement?.value || '';
    }

    public setValue(value: string): void {
        console.log('[AcuxCode] setValue called with:', value);
        if (this.inputElement) {
            this.inputElement.value = value;
        }
    }
    
    private async openFilePicker(): Promise<void> {
        console.log('[AcuxCode] openFilePicker called');
        
        const isIQuickPickItemWithResource = (obj: unknown): obj is IQuickPickItemWithResource => {
            return !!obj && typeof obj === 'object' && 'resource' in obj && URI.isUri((obj as IQuickPickItemWithResource).resource);
        };

        const isIGotoSymbolQuickPickItem = (obj: unknown): obj is IGotoSymbolQuickPickItem => {
            return !!obj && typeof obj === 'object' && 'uri' in obj && 'range' in obj && !!(obj as IGotoSymbolQuickPickItem).uri && !!(obj as IGotoSymbolQuickPickItem).range;
        };

        const providerOptions: AnythingQuickAccessProviderRunOptions = {
            handleAccept: async (item: unknown, isBackground: boolean) => {
                console.log('[AcuxCode] handleAccept called with item:', item);
                try {
                    if (isIQuickPickItemWithResource(item) && item.resource) {
                        const uri = item.resource;
                        console.log('[AcuxCode] Adding file from IQuickPickItemWithResource:', uri.toString());
                        this.addFile(basename(uri.path), uri);
                        return true; // Return true to prevent default file opening behavior
                    } else if (isIGotoSymbolQuickPickItem(item) && item.uri) {
                        const uri = item.uri;
                        console.log('[AcuxCode] Adding file from IGotoSymbolQuickPickItem:', uri.toString());
                        this.addFile(basename(uri.path), uri);
                        return true; // Return true to prevent default file opening behavior
                    } else {
                        console.log('[AcuxCode] Item did not match expected types');
                    }
                } catch (error) {
                    console.error('[AcuxCode] Error in handleAccept:', error);
                }
                return false;
            }
        };

        console.log('[AcuxCode] Showing quick access picker');
        this.quickInputService.quickAccess.show('', {
            enabledProviderPrefixes: [
                AnythingQuickAccessProvider.PREFIX,
                SymbolsQuickAccessProvider.PREFIX,
                AbstractGotoSymbolQuickAccessProvider.PREFIX
            ],
            placeholder: 'Search files to attach',
            providerOptions
        });
    }
    
    private addFile(name: string, uri: URI): void {
        console.log('[AcuxCode] Adding file:', name, uri.toString());
        
        // Check if file is already attached
        const isDuplicate = this.attachedFiles.some(file => file.uri.toString() === uri.toString());
        if (isDuplicate) {
            console.log('[AcuxCode] File already attached, skipping:', name);
            return;
        }
        
        this.attachedFiles.push({ name, uri });
        console.log('[AcuxCode] Total attached files:', this.attachedFiles.length);
        this.updateFilesDisplay();
    }
    
    private removeFile(index: number): void {
        this.attachedFiles.splice(index, 1);
        this.updateFilesDisplay();
    }
    
    private handleSendMessage(): void {
        const message = this.inputElement.value.trim();
        
        if (!message && this.attachedFiles.length === 0) {
            console.log('[AcuxCode] No message or files to send');
            return;
        }
        
        console.log('[AcuxCode] ========== SENDING MESSAGE ==========');
        console.log('[AcuxCode] Message:', message);
        console.log('[AcuxCode] Model:', this.selectedModel);
        console.log('[AcuxCode] Attached files count:', this.attachedFiles.length);
        
        if (this.attachedFiles.length > 0) {
            console.log('[AcuxCode] Attached files:');
            this.attachedFiles.forEach((file, index) => {
                console.log(`[AcuxCode]   ${index + 1}. ${file.name} (${file.uri.toString()})`);
            });
        }
        
        // TODO: This is where you'll integrate with your AI backend
        // For now, we'll just log the data that would be sent
        const requestData = {
            message: message,
            model: this.selectedModel,
            files: this.attachedFiles.map(f => ({
                name: f.name,
                uri: f.uri.toString(),
                path: f.uri.fsPath
            }))
        };
        
        console.log('[AcuxCode] Request data that would be sent to AI:');
        console.log(JSON.stringify(requestData, null, 2));
        console.log('[AcuxCode] =====================================');
        
        // Clear input and files after sending
        this.inputElement.value = '';
        this.attachedFiles = [];
        this.updateFilesDisplay();
        
        console.log('[AcuxCode] Input cleared, ready for next message');
    }
    
    private updateFilesDisplay(): void {
        console.log('[AcuxCode] updateFilesDisplay called, files:', this.attachedFiles.length);
        console.log('[AcuxCode] filesDisplayArea element:', this.filesDisplayArea);
        
        // Clear existing content using DOM methods (not innerHTML for security)
        while (this.filesDisplayArea.firstChild) {
            this.filesDisplayArea.removeChild(this.filesDisplayArea.firstChild);
        }
        
        if (this.attachedFiles.length === 0) {
            console.log('[AcuxCode] No files, hiding display area');
            this.filesDisplayArea.style.display = 'none';
            return;
        }
        
        console.log('[AcuxCode] Showing files display area');
        this.filesDisplayArea.style.display = 'flex';
        
        this.attachedFiles.forEach((file, index) => {
            const fileChip = dom.$('div');
            fileChip.classList.add('chat-attached-context-pill');
            fileChip.style.display = 'flex';
            fileChip.style.alignItems = 'center';
            fileChip.style.gap = '4px';
            fileChip.style.padding = '2px 6px';
            fileChip.style.backgroundColor = 'transparent';
            fileChip.style.color = 'var(--vscode-foreground)';
            fileChip.style.border = '1px solid var(--vscode-input-border)';
            fileChip.style.borderRadius = '10px';
            fileChip.style.fontSize = '11px';
            fileChip.style.maxWidth = '180px';
            fileChip.classList.add('show-file-icons');

            // Use ResourceLabel for proper file icons
            const labelContainer = dom.$('span');
            labelContainer.style.display = 'flex';
            labelContainer.style.alignItems = 'center';
            labelContainer.style.flex = '1';
            labelContainer.style.minWidth = '0';
            
            const resourceLabel = this.resourceLabels.create(labelContainer, { supportIcons: true });
            resourceLabel.setFile(file.uri, { fileKind: 0 /* FileKind.FILE */ });

            // Remove button
            const removeBtn = dom.$('button');
            removeBtn.textContent = '×';
            removeBtn.style.border = 'none';
            removeBtn.style.background = 'none';
            removeBtn.style.color = 'inherit';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.padding = '0';
            removeBtn.style.fontSize = '14px';
            removeBtn.style.lineHeight = '1';
            removeBtn.style.width = '14px';
            removeBtn.style.height = '14px';
            removeBtn.style.display = 'flex';
            removeBtn.style.alignItems = 'center';
            removeBtn.style.justifyContent = 'center';
            removeBtn.onclick = () => this.removeFile(index);

            fileChip.appendChild(labelContainer);
            fileChip.appendChild(removeBtn);
            this.filesDisplayArea.appendChild(fileChip);
        });
    }
    
}
