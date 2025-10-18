/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../../base/browser/dom.js';
import { URI } from '../../../../../base/common/uri.js';
import { AttachedFile } from './types.js';
import { ResourceLabels } from '../../../../browser/labels.js';

const $ = dom.$;

export class FileAttachmentManager {
	private attachedFiles: AttachedFile[] = [];

	constructor(
		private filesDisplayArea: HTMLElement,
		private resourceLabels: ResourceLabels
	) {}

	public addFile(name: string, uri: URI): void {
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

	public removeFile(index: number): void {
		this.attachedFiles.splice(index, 1);
		this.updateFilesDisplay();
	}

	public getAttachedFiles(): AttachedFile[] {
		return this.attachedFiles;
	}

	public clearFiles(): void {
		this.attachedFiles = [];
		this.updateFilesDisplay();
	}

	public updateFilesDisplay(): void {
		console.log('[AcuxCode] updateFilesDisplay called, files:', this.attachedFiles.length);
		console.log('[AcuxCode] filesDisplayArea element:', this.filesDisplayArea);

		if (!this.filesDisplayArea) {
			console.error('[AcuxCode] filesDisplayArea is not initialized!');
			return;
		}

		// Clear existing display
		while (this.filesDisplayArea.firstChild) {
			this.filesDisplayArea.removeChild(this.filesDisplayArea.firstChild);
		}

		if (this.attachedFiles.length === 0) {
			this.filesDisplayArea.style.display = 'none';
			console.log('[AcuxCode] No files to display, hiding area');
			return;
		}

		this.filesDisplayArea.style.display = 'flex';
		console.log('[AcuxCode] Displaying files area with', this.attachedFiles.length, 'files');

		this.attachedFiles.forEach((file, index) => {
			console.log('[AcuxCode] Creating display for file:', file.name);
			const fileItem = $('div');
			fileItem.style.display = 'flex';
			fileItem.style.alignItems = 'center';
			fileItem.style.padding = '4px 8px';
			fileItem.style.background = 'var(--vscode-badge-background)';
			fileItem.style.color = 'var(--vscode-badge-foreground)';
			fileItem.style.borderRadius = '4px';
			fileItem.style.fontSize = '12px';
			fileItem.style.marginRight = '4px';

			const fileLabel = this.resourceLabels.create(fileItem, {
				supportIcons: true,
				supportHighlights: false,
			});

			fileLabel.setFile(file.uri, {
				fileKind: 1,
			});

			const removeButton = $('span');
			removeButton.textContent = '×';
			removeButton.style.marginLeft = '6px';
			removeButton.style.cursor = 'pointer';
			removeButton.style.fontWeight = 'bold';
			removeButton.onclick = () => {
				console.log('[AcuxCode] Remove button clicked for:', file.name);
				this.removeFile(index);
			};
			fileItem.appendChild(removeButton);

			this.filesDisplayArea.appendChild(fileItem);
		});
	}
}
