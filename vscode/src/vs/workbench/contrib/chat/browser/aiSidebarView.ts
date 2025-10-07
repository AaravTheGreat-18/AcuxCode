/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../base/browser/dom.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { localize } from '../../../../nls.js';
import { AISidebarInput } from './aiSidebarInput.js';

const $ = dom.$;

export class AISidebarView extends Disposable {
    private container!: HTMLElement;
    private inputComponent!: AISidebarInput;

    constructor() {
        super();
        console.log('[AcuxCode] AISidebarView constructor called');
        this.create();
        console.log('[AcuxCode] AISidebarView created successfully');
    }

    private create(): void {
        // Create main sidebar container
        this.container = $('.ai-sidebar-view');
        console.log('[AcuxCode] AI sidebar container created');

        // Create welcome section
        const welcomeSection = $('.ai-sidebar-welcome');
        this.container.appendChild(welcomeSection);

        const welcomeTitle = $('.ai-sidebar-welcome-title');
        welcomeTitle.textContent = localize('aiSidebar.welcome.title', 'Welcome to AcuxCode AI');
        welcomeSection.appendChild(welcomeTitle);

        const welcomeSubtitle = $('.ai-sidebar-welcome-subtitle');
        welcomeSubtitle.textContent = localize('aiSidebar.welcome.subtitle', 'Your intelligent coding companion');
        welcomeSection.appendChild(welcomeSubtitle);

        // Create input section
        const inputSection = $('.ai-sidebar-input-section');
        this.container.appendChild(inputSection);

        // Create the input component
        this.inputComponent = this._register(new AISidebarInput());

        // Listen for input submissions
        this._register(this.inputComponent.onDidSubmit((value) => {
            this.handleInputSubmission(value);
        }));

        inputSection.appendChild(this.inputComponent.getDomNode());

        // Create response area (for future use)
        const responseSection = $('.ai-sidebar-response-section');
        this.container.appendChild(responseSection);

        const responseArea = $('.ai-sidebar-response-area');
        responseSection.appendChild(responseArea);
    }

    private handleInputSubmission(value: string): void {
        // For now, just log the input. Later this will send to AI service
        console.log('AI Sidebar input submitted:', value);

        // Show a simple response for demonstration
        this.showResponse(`You said: "${value}"`);
    }

    private showResponse(response: string): void {
        const responseArea = this.container.querySelector('.ai-sidebar-response-area') as HTMLElement;
        if (responseArea) {
            const responseElement = $('.ai-sidebar-response');
            responseElement.textContent = response;
            responseArea.appendChild(responseElement);
        }
    }

    public getDomNode(): HTMLElement {
        return this.container;
    }

    public focus(): void {
        this.inputComponent.focus();
    }

    public getValue(): string {
        return this.inputComponent.getValue();
    }

    public setValue(value: string): void {
        this.inputComponent.setValue(value);
    }
}
