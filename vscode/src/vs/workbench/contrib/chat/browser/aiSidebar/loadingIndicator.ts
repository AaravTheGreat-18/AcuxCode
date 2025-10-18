/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../../base/browser/dom.js';

const $ = dom.$;

export class LoadingIndicator {
	private loadingIndicatorEl: HTMLElement | undefined;
	private loadingIndicatorInterval: number | undefined;

	constructor(private messagesArea: HTMLElement) {}

	public show(): void {
		if (this.loadingIndicatorEl) {
			return; // Already showing
		}

		const loadingContainer = $('div');
		loadingContainer.style.display = 'flex';
		loadingContainer.style.justifyContent = 'flex-start';
		loadingContainer.style.width = '100%';
		loadingContainer.style.marginTop = '8px';

		const loadingContent = $('div');
		loadingContent.style.marginLeft = '12px';
		loadingContent.style.fontSize = '13px';
		loadingContent.style.color = 'var(--vscode-descriptionForeground)';

		let dotCount = 0;
		const updateDots = () => {
			dotCount = (dotCount + 1) % 4;
			loadingContent.textContent = 'Thinking' + '.'.repeat(dotCount);
		};

		updateDots();
		this.loadingIndicatorInterval = window.setInterval(updateDots, 500);

		loadingContainer.appendChild(loadingContent);
		this.messagesArea.appendChild(loadingContainer);
		this.loadingIndicatorEl = loadingContainer;

		// Scroll to bottom
		this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
	}

	public hide(): void {
		if (this.loadingIndicatorInterval) {
			clearInterval(this.loadingIndicatorInterval);
			this.loadingIndicatorInterval = undefined;
		}

		if (this.loadingIndicatorEl) {
			this.loadingIndicatorEl.remove();
			this.loadingIndicatorEl = undefined;
		}
	}
}
