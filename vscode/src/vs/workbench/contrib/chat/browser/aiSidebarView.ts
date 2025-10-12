/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../base/browser/dom.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IFileDialogService } from '../../../../platform/dialogs/common/dialogs.js';
import { URI } from '../../../../base/common/uri.js';
import { basename } from '../../../../base/common/path.js';

const $ = dom.$;

export class AISidebarView extends Disposable {
    private container!: HTMLElement;
    private attachedFiles: Array<{ name: string; uri: URI }> = [];
    private filesDisplayArea!: HTMLElement;

    constructor(
        @IFileDialogService private readonly fileDialogService: IFileDialogService
    ) {
        super();
        console.log('[AcuxCode] AISidebarView constructor called');
        this.create();
        console.log('[AcuxCode] AISidebarView created successfully');
    }

    private create(): void {
        // Create main container with theme-aware styling
        this.container = $('div.ai-sidebar-simple');
        
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
        const input = $('textarea', { placeholder: 'Ask anything...' }) as HTMLTextAreaElement;
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

    public getDomNode(): HTMLElement {
        console.log('[AcuxCode] getDomNode called, returning:', this.container);
        return this.container;
    }

    public focus(): void {
        console.log('[AcuxCode] focus called');
    }

    public getValue(): string {
        return '';
    }

    public setValue(value: string): void {
        console.log('[AcuxCode] setValue called with:', value);
    }
    
    private async openFilePicker(): Promise<void> {
        // Use VSCode's file dialog to pick files from workspace
        const uris = await this.fileDialogService.showOpenDialog({
            canSelectMany: true,
            canSelectFiles: true,
            canSelectFolders: false,
            title: 'Select files to attach'
        });
        
        if (uris && uris.length > 0) {
            uris.forEach(uri => {
                const fileName = basename(uri.path);
                this.addFile(fileName, uri);
            });
        }
    }
    
    private addFile(name: string, uri: URI): void {
        this.attachedFiles.push({ name, uri });
        this.updateFilesDisplay();
    }
    
    private removeFile(index: number): void {
        this.attachedFiles.splice(index, 1);
        this.updateFilesDisplay();
    }
    
    private updateFilesDisplay(): void {
        // Clear existing content
        this.filesDisplayArea.innerHTML = '';
        
        if (this.attachedFiles.length === 0) {
            this.filesDisplayArea.style.display = 'none';
            return;
        }
        
        this.filesDisplayArea.style.display = 'flex';
        
        this.attachedFiles.forEach((file, index) => {
            const fileChip = dom.$('div');
            fileChip.style.display = 'flex';
            fileChip.style.alignItems = 'center';
            fileChip.style.gap = '6px';
            fileChip.style.padding = '4px 8px';
            fileChip.style.backgroundColor = 'var(--vscode-badge-background)';
            fileChip.style.color = 'var(--vscode-badge-foreground)';
            fileChip.style.borderRadius = '4px';
            fileChip.style.fontSize = '11px';
            fileChip.style.maxWidth = '200px';
            
            // File icon (simple document icon)
            const icon = dom.$('span');
            icon.textContent = '📄';
            icon.style.fontSize = '12px';
            
            // File name
            const fileName = dom.$('span');
            fileName.textContent = file.name;
            fileName.style.overflow = 'hidden';
            fileName.style.textOverflow = 'ellipsis';
            fileName.style.whiteSpace = 'nowrap';
            fileName.title = file.uri.fsPath; // Show full path on hover
            
            // Remove button
            const removeBtn = dom.$('button');
            removeBtn.textContent = '×';
            removeBtn.style.border = 'none';
            removeBtn.style.background = 'none';
            removeBtn.style.color = 'inherit';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.padding = '0 2px';
            removeBtn.style.fontSize = '16px';
            removeBtn.style.lineHeight = '1';
            removeBtn.onclick = () => this.removeFile(index);
            
            fileChip.appendChild(icon);
            fileChip.appendChild(fileName);
            fileChip.appendChild(removeBtn);
            this.filesDisplayArea.appendChild(fileChip);
        });
    }
}
