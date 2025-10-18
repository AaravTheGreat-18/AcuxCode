/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../../base/browser/dom.js';
import { CustomModel, ModelInfo } from './types.js';

const $ = dom.$;

export interface ModelDropdownCallbacks {
	onModelSelect: (modelName: string) => void;
	onAutoModeToggle: (enabled: boolean) => void;
	onAddModelClick: () => void;
	onEditModel: (model: CustomModel) => void;
	onDeleteModel: (model: CustomModel) => void;
	trackRecentModel: (modelName: string) => void;
}

export class ModelDropdownRenderer {
	constructor() {
		// No dependencies needed for now
	}

	public renderDropdown(
		container: HTMLElement,
		allModels: ModelInfo[],
		customModels: CustomModel[],
		recentModels: string[],
		selectedModel: string,
		autoModeEnabled: boolean,
		callbacks: ModelDropdownCallbacks
	): void {
		const dropdownPanel = $('div');
		dropdownPanel.style.position = 'absolute';
		dropdownPanel.style.top = '100%';
		dropdownPanel.style.left = '0';
		dropdownPanel.style.right = '0';
		dropdownPanel.style.maxHeight = '400px';
		dropdownPanel.style.background = 'var(--vscode-dropdown-background)';
		dropdownPanel.style.border = '1px solid var(--vscode-dropdown-border)';
		dropdownPanel.style.borderRadius = '4px';
		dropdownPanel.style.boxShadow = '0 2px 8px var(--vscode-widget-shadow)';
		dropdownPanel.style.zIndex = '1000';
		dropdownPanel.style.display = 'none';
		dropdownPanel.style.marginTop = '4px';

		// Search input
		const searchInput = $('input', { type: 'text', placeholder: 'Search models...' }) as HTMLInputElement;
		searchInput.style.width = '100%';
		searchInput.style.padding = '8px';
		searchInput.style.border = 'none';
		searchInput.style.borderBottom = '1px solid var(--vscode-widget-border)';
		searchInput.style.background = 'var(--vscode-input-background)';
		searchInput.style.color = 'var(--vscode-input-foreground)';
		searchInput.style.fontSize = '13px';
		searchInput.style.boxSizing = 'border-box';
		searchInput.style.outline = 'none';
		dropdownPanel.appendChild(searchInput);

		// Scrollable list area
		const listScroll = $('div');
		listScroll.style.maxHeight = '340px';
		listScroll.style.overflowY = 'auto';
		dropdownPanel.appendChild(listScroll);

		const renderList = (filter: string) => {
			while (listScroll.firstChild) {
				listScroll.removeChild(listScroll.firstChild);
			}

			const f = filter.toLowerCase();
			const norm = (s: string) => s.toLowerCase();

			// Helper to set button label
			const setButtonLabel = () => {
				// This would update the button text - handled by parent
			};

			// Track recent model
			const trackRecentModel = (modelName: string) => {
				callbacks.trackRecentModel(modelName);
			};

			// Recently used
			const filteredRecent = recentModels.filter(name => !f || norm(name).includes(f));
			if (filteredRecent.length > 0) {
				const recentHeader = $('div');
				recentHeader.textContent = 'Recently Used';
				recentHeader.style.position = 'sticky';
				recentHeader.style.top = '0';
				recentHeader.style.zIndex = '1';
				recentHeader.style.padding = '6px 8px';
				recentHeader.style.background = 'var(--vscode-editor-background)';
				recentHeader.style.color = 'var(--vscode-descriptionForeground)';
				recentHeader.style.fontSize = '10px';
				recentHeader.style.fontWeight = '700';
				recentHeader.style.textTransform = 'uppercase';
				listScroll.appendChild(recentHeader);

				filteredRecent.forEach(modelName => {
					const item = $('div');
					item.textContent = modelName;
					item.style.padding = '8px';
					item.style.cursor = 'pointer';
					item.style.fontSize = '12px';
					item.style.color = 'var(--vscode-foreground)';
					item.style.borderTop = '1px solid var(--vscode-widget-border, transparent)';
					if (autoModeEnabled) {
						item.style.pointerEvents = 'none';
						item.style.opacity = '0.6';
					}
					item.onmouseenter = () => {
						if (!autoModeEnabled) {
							item.style.background = 'var(--vscode-list-hoverBackground)';
						}
					};
					item.onmouseleave = () => (item.style.background = 'transparent');
					item.onclick = () => {
						if (autoModeEnabled) {
							return;
						}
						callbacks.onModelSelect(modelName);
						setButtonLabel();
						dropdownPanel.style.display = 'none';
						console.log('[AcuxCode] Model changed to:', modelName);
					};
					listScroll.appendChild(item);
				});
			}

			// Group models by provider
			const providerGroups: Record<string, ModelInfo[]> = {};
			allModels.forEach(m => {
				if (!providerGroups[m.provider]) {
					providerGroups[m.provider] = [];
				}
				providerGroups[m.provider].push(m);
			});

			Object.keys(providerGroups).forEach(provider => {
				const models = providerGroups[provider].filter(m => !f || norm(m.name).includes(f));
				if (models.length === 0) {
					return;
				}

				const providerHeader = $('div');
				providerHeader.textContent = provider;
				providerHeader.style.position = 'sticky';
				providerHeader.style.top = '0';
				providerHeader.style.zIndex = '1';
				providerHeader.style.padding = '6px 8px';
				providerHeader.style.background = 'var(--vscode-editor-background)';
				providerHeader.style.color = 'var(--vscode-descriptionForeground)';
				providerHeader.style.fontSize = '10px';
				providerHeader.style.fontWeight = '700';
				providerHeader.style.textTransform = 'uppercase';
				listScroll.appendChild(providerHeader);

				models.forEach(model => {
					const item = $('div');
					item.textContent = model.name;
					item.style.padding = '8px';
					item.style.cursor = 'pointer';
					item.style.fontSize = '12px';
					item.style.color = 'var(--vscode-foreground)';
					item.style.borderTop = '1px solid var(--vscode-widget-border, transparent)';
					if (autoModeEnabled) {
						item.style.pointerEvents = 'none';
						item.style.opacity = '0.6';
					}
					item.onmouseenter = () => {
						if (!autoModeEnabled) {
							item.style.background = 'var(--vscode-list-hoverBackground)';
						}
					};
					item.onmouseleave = () => (item.style.background = 'transparent');
					item.onclick = () => {
						if (autoModeEnabled) {
							return;
						}
						callbacks.onModelSelect(model.name);
						trackRecentModel(model.name);
						setButtonLabel();
						dropdownPanel.style.display = 'none';
						console.log('[AcuxCode] Model changed to:', model.name);
					};
					listScroll.appendChild(item);
				});
			});

			// My Models section (at the bottom)
			if (customModels.length > 0) {
				const filteredCustom = customModels.filter(m => !f || norm(m.name).includes(f));
				if (filteredCustom.length > 0) {
					const customHeader = $('div');
					customHeader.textContent = 'My Models';
					customHeader.style.position = 'sticky';
					customHeader.style.top = '0';
					customHeader.style.zIndex = '1';
					customHeader.style.padding = '6px 8px';
					customHeader.style.background = 'var(--vscode-editor-background)';
					customHeader.style.color = 'var(--vscode-descriptionForeground)';
					customHeader.style.fontSize = '10px';
					customHeader.style.fontWeight = '700';
					customHeader.style.textTransform = 'uppercase';
					listScroll.appendChild(customHeader);

					filteredCustom.forEach(model => {
						const item = $('div');
						item.style.display = 'flex';
						item.style.alignItems = 'center';
						item.style.justifyContent = 'space-between';
						item.style.gap = '8px';
						item.style.padding = '8px';
						item.style.cursor = 'pointer';
						item.style.fontSize = '12px';
						item.style.borderTop = '1px solid var(--vscode-widget-border, transparent)';
						if (autoModeEnabled) {
							item.style.pointerEvents = 'none';
							item.style.opacity = '0.6';
						}

						const name = $('span');
						name.textContent = model.name;
						name.style.color = 'var(--vscode-foreground)';
						name.style.whiteSpace = 'nowrap';
						name.style.overflow = 'hidden';
						name.style.textOverflow = 'ellipsis';
						name.style.flex = '1';
						item.appendChild(name);

						// Actions (edit/delete) on hover
						const actions = $('div');
						actions.style.display = 'none';
						actions.style.gap = '4px';

						const makeIconButton = (label: string) => {
							const btn = $('button');
							btn.textContent = label;
							btn.style.border = '1px solid var(--vscode-input-border)';
							btn.style.background = 'var(--vscode-input-background)';
							btn.style.color = 'var(--vscode-foreground)';
							btn.style.fontSize = '10px';
							btn.style.padding = '3px 8px';
							btn.style.borderRadius = '3px';
							btn.style.cursor = 'pointer';
							btn.style.lineHeight = '1';
							btn.onmouseenter = () => (btn.style.background = 'var(--vscode-button-hoverBackground)');
							btn.onmouseleave = () => (btn.style.background = 'var(--vscode-input-background)');
							return btn;
						};

						const editBtn = makeIconButton('Edit');
						const deleteBtn = makeIconButton('Delete');
						deleteBtn.style.color = 'var(--vscode-errorForeground)';
						actions.appendChild(editBtn);
						actions.appendChild(deleteBtn);
						item.appendChild(actions);

						editBtn.onclick = (e) => {
							e.stopPropagation();
							dropdownPanel.style.display = 'none';
							callbacks.onEditModel(model);
						};

						deleteBtn.onclick = (e) => {
							e.stopPropagation();
							callbacks.onDeleteModel(model);
							renderList(searchInput.value);
						};

						item.onmouseenter = () => {
							if (!autoModeEnabled) {
								item.style.background = 'var(--vscode-list-hoverBackground)';
								actions.style.display = 'flex';
							}
						};
						item.onmouseleave = () => {
							item.style.background = 'transparent';
							actions.style.display = 'none';
						};

						item.onclick = () => {
							if (autoModeEnabled) {
								return;
							}
							callbacks.onModelSelect(model.name);
							trackRecentModel(model.name);
							setButtonLabel();
							dropdownPanel.style.display = 'none';
							console.log('[AcuxCode] Model changed to:', model.name);
						};
						listScroll.appendChild(item);
					});
				}
			}

			// Add Model button at the bottom
			const addModelButton = $('div');
			addModelButton.textContent = '+ Add Model';
			addModelButton.style.padding = '10px 8px';
			addModelButton.style.cursor = 'pointer';
			addModelButton.style.fontSize = '12px';
			addModelButton.style.color = 'var(--vscode-textLink-foreground)';
			addModelButton.style.borderTop = '2px solid var(--vscode-widget-border)';
			addModelButton.style.background = 'var(--vscode-editor-background)';
			addModelButton.style.fontWeight = '600';
			addModelButton.style.position = 'sticky';
			addModelButton.style.bottom = '0';
			addModelButton.onmouseenter = () => {
				addModelButton.style.background = 'var(--vscode-list-hoverBackground)';
			};
			addModelButton.onmouseleave = () => {
				addModelButton.style.background = 'var(--vscode-editor-background)';
			};
			addModelButton.onclick = () => {
				dropdownPanel.style.display = 'none';
				callbacks.onAddModelClick();
			};
			listScroll.appendChild(addModelButton);
		};

		renderList('');
		searchInput.oninput = () => renderList(searchInput.value);

		container.appendChild(dropdownPanel);

		// Return control functions if needed
		return;
	}
}
