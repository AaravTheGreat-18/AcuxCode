/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../../base/browser/dom.js';

const $ = dom.$;

export class MessageRenderer {
	constructor(private messagesArea: HTMLElement) {}

	public displayUserMessage(message: string): void {
		// Create user message bubble
		const messageBubble = $('div');
		messageBubble.style.display = 'flex';
		messageBubble.style.justifyContent = 'flex-end';
		messageBubble.style.width = '100%';

		const messageContent = $('div');
		messageContent.style.maxWidth = '70%';
		messageContent.style.padding = '10px 14px';
		messageContent.style.border = '1px solid var(--vscode-input-border)';
		messageContent.style.borderRadius = '12px';
		messageContent.style.marginRight = '12px';
		messageContent.style.fontSize = '13px';
		messageContent.style.lineHeight = '1.5';
		messageContent.style.color = 'var(--vscode-foreground)';
		messageContent.style.whiteSpace = 'pre-wrap';
		messageContent.style.wordBreak = 'break-word';
		messageContent.style.userSelect = 'text';
		messageContent.style.cursor = 'text';
		messageContent.textContent = message;

		messageBubble.appendChild(messageContent);
		this.messagesArea.appendChild(messageBubble);

		// Scroll to bottom
		this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
	}

	public displayAIMessage(message: string): void {
		// Create AI message (no bubble, just paragraph on left)
		const messageContainer = $('div');
		messageContainer.style.display = 'flex';
		messageContainer.style.justifyContent = 'flex-start';
		messageContainer.style.width = '100%';

		const messageContent = $('div');
		messageContent.style.maxWidth = '85%';
		messageContent.style.marginLeft = '12px';
		messageContent.style.fontSize = '13px';
		messageContent.style.lineHeight = '1.6';
		messageContent.style.color = 'var(--vscode-foreground)';
		messageContent.style.whiteSpace = 'pre-wrap';
		messageContent.style.wordBreak = 'break-word';
		messageContent.style.userSelect = 'text';
		messageContent.style.cursor = 'text';
		messageContent.textContent = message;

		messageContainer.appendChild(messageContent);
		this.messagesArea.appendChild(messageContainer);

		// Scroll to bottom
		this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
	}

	public clearMessages(): void {
		while (this.messagesArea.firstChild) {
			this.messagesArea.removeChild(this.messagesArea.firstChild);
		}
	}
}
