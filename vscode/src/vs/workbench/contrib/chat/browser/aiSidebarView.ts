/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../base/browser/dom.js';
import { Disposable } from '../../../../base/common/lifecycle.js';

const $ = dom.$;

export class AISidebarView extends Disposable {
    private container!: HTMLElement;

    constructor() {
        super();
        console.log('[AcuxCode] AISidebarView constructor called');
        this.create();
        console.log('[AcuxCode] AISidebarView created successfully');
    }

    private create(): void {
        // Create main container
        this.container = $('div.ai-sidebar-simple');
        
        // Set inline styles to ensure visibility
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.backgroundColor = '#1e1e1e';
        this.container.style.color = '#ffffff';
        this.container.style.padding = '20px';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '20px';
        
        console.log('[AcuxCode] Container created with styles');

        // Add a simple header
        const header = $('h1');
        header.textContent = 'AcuxCode AI Sidebar';
        header.style.margin = '0';
        header.style.fontSize = '24px';
        header.style.color = '#4ec9b0';
        this.container.appendChild(header);
        console.log('[AcuxCode] Header added');

        // Add a subtitle
        const subtitle = $('p');
        subtitle.textContent = 'This is a test to verify the sidebar is rendering correctly.';
        subtitle.style.margin = '0';
        subtitle.style.fontSize = '14px';
        subtitle.style.color = '#cccccc';
        this.container.appendChild(subtitle);
        console.log('[AcuxCode] Subtitle added');

        // Add a simple input box at the bottom
        const inputContainer = $('div');
        inputContainer.style.marginTop = 'auto';
        inputContainer.style.display = 'flex';
        inputContainer.style.flexDirection = 'column';
        inputContainer.style.gap = '10px';
        
        const inputLabel = $('label');
        inputLabel.textContent = 'Test Input:';
        inputLabel.style.fontSize = '12px';
        inputLabel.style.color = '#cccccc';
        inputContainer.appendChild(inputLabel);
        
        const input = $('input', { type: 'text', placeholder: 'Type something here...' }) as HTMLInputElement;
        input.style.padding = '10px';
        input.style.backgroundColor = '#2d2d2d';
        input.style.color = '#ffffff';
        input.style.border = '1px solid #3e3e3e';
        input.style.borderRadius = '4px';
        input.style.fontSize = '14px';
        inputContainer.appendChild(input);
        
        this.container.appendChild(inputContainer);
        console.log('[AcuxCode] Input box added at bottom');
        
        console.log('[AcuxCode] Container children count:', this.container.children.length);
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
}
