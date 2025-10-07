/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../base/browser/dom.js';
import { Emitter } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { Codicon } from '../../../../base/common/codicons.js';
import { localize } from '../../../../nls.js';

const $ = dom.$;

export class AISidebarInput extends Disposable {
    private container!: HTMLElement;
    private inputContainer!: HTMLElement;
    private inputElement!: HTMLTextAreaElement;
    private sendButtonElement!: HTMLButtonElement;

    private readonly _onDidSubmit = this._register(new Emitter<string>());
    readonly onDidSubmit = this._onDidSubmit.event;

    constructor() {
        super();
        this.create();
    }

    private create(): void {
        // Create main container with AI sidebar styling
        this.container = $('.ai-sidebar-container');

        // Create header
        const header = $('.ai-sidebar-header');
        const title = $('h3');
        title.textContent = localize('aiSidebar.title', 'AcuxCode AI');
        header.appendChild(title);
        this.container.appendChild(header);

        // Create content area
        const content = $('.ai-sidebar-content');
        this.container.appendChild(content);

        // Create input section
        const inputSection = $('.ai-input-section');
        content.appendChild(inputSection);

        // Create input container with border radius and styling
        this.inputContainer = $('.ai-input-container');
        inputSection.appendChild(this.inputContainer);

        // Create textarea with placeholder and styling
        this.inputElement = $('textarea', {
            class: 'ai-input-textarea',
            placeholder: localize('aiSidebar.placeholder', 'Do the Impossible'),
            rows: '8',
            maxlength: '1000',
            'data-testid': 'ai-input'
        }) as HTMLTextAreaElement;
        this.inputContainer.appendChild(this.inputElement);

        // Create input actions area
        const inputActions = $('.ai-input-actions');
        this.inputContainer.appendChild(inputActions);

        // Create buttons container
        const inputButtons = $('.ai-input-buttons');
        inputActions.appendChild(inputButtons);

        // Create send button
        this.sendButtonElement = $('button', {
            class: 'send-button ai-send-button',
            'aria-label': localize('aiSidebar.send', 'Send message')
        }) as HTMLButtonElement;
        inputButtons.appendChild(this.sendButtonElement);

        // Add send icon to button
        const sendIcon = $(`span.codicon.codicon-${Codicon.arrowRight.id}`);
        this.sendButtonElement.appendChild(sendIcon);

        // Create character counter
        const counterContainer = $('.ai-input-counter');
        const counter = $('span', { class: 'char-counter' }, '0/1000');
        counterContainer.appendChild(counter);
        inputButtons.appendChild(counterContainer);

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Handle input changes
        this._register(dom.addDisposableListener(this.inputElement, 'input', () => {
            const length = this.inputElement.value.length;
            const counter = this.container.querySelector('.char-counter') as HTMLElement;
            if (counter) {
                counter.textContent = `${length}/1000`;
                counter.classList.toggle('near-limit', length > 900);
            }

            // Enable/disable send button based on input
            this.sendButtonElement.disabled = !(length > 0 && length <= 1000);
        }));

        // Handle Enter key to submit
        this._register(dom.addDisposableListener(this.inputElement, 'keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submit();
            }
        }));

        // Handle send button click
        this._register(dom.addDisposableListener(this.sendButtonElement, 'click', () => this.submit()));

        // Handle focus events for styling
        this._register(dom.addDisposableListener(this.inputElement, 'focus', () => {
            this.inputContainer.classList.add('focused');
        }));

        this._register(dom.addDisposableListener(this.inputElement, 'blur', () => {
            this.inputContainer.classList.remove('focused');
        }));
    }

    private submit(): void {
        const value = this.inputElement.value.trim();
        if (value && value.length <= 1000) {
            this._onDidSubmit.fire(value);
            this.inputElement.value = '';
            // Trigger input event to update counter
            this.inputElement.dispatchEvent(new InputEvent('input'));
        }
    }

    public getDomNode(): HTMLElement {
        return this.container;
    }

    public focus(): void {
        this.inputElement.focus();
    }

    public getValue(): string {
        return this.inputElement.value;
    }

    public setValue(value: string): void {
        this.inputElement.value = value;
        this.inputElement.dispatchEvent(new InputEvent('input'));
    }

    override dispose(): void {
        super.dispose();
    }
}
