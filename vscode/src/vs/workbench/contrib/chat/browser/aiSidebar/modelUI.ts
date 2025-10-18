/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../../base/browser/dom.js';
import { CustomModel } from './types.js';

const $ = dom.$;

export interface ModelSelectionCallbacks {
	onModelSelect: (modelName: string) => void;
	onAddModelClick: () => void;
}

export interface AddModelCallbacks {
	onSave: (modelData: CustomModel, isEditing: boolean, existingModel?: CustomModel) => void;
	onCancel: () => void;
	displayMessage: (message: string) => void;
}

export class ModelUIHelper {
	constructor() {
		// No dependencies needed for now
	}

	public createAddModelForm(
		container: HTMLElement,
		existingModel: CustomModel | undefined,
		callbacks: AddModelCallbacks
	): void {
		const isEditing = !!existingModel;

		// Create add model page container
		const pageContainer = $('div');
		pageContainer.style.padding = '20px';
		pageContainer.style.maxWidth = '600px';
		pageContainer.style.margin = '0 auto';

		// Title
		const title = $('h2');
		title.textContent = isEditing ? 'Edit Custom Model' : 'Add Custom Model';
		title.style.fontSize = '18px';
		title.style.fontWeight = '600';
		title.style.marginBottom = '20px';
		title.style.color = 'var(--vscode-foreground)';
		pageContainer.appendChild(title);

		// Model Type Selection
		const typeLabel = $('label');
		typeLabel.textContent = 'Model Type';
		typeLabel.style.display = 'block';
		typeLabel.style.fontSize = '13px';
		typeLabel.style.fontWeight = '600';
		typeLabel.style.marginBottom = '8px';
		typeLabel.style.color = 'var(--vscode-foreground)';
		pageContainer.appendChild(typeLabel);

		const typeSelect = $('select') as HTMLSelectElement;
		typeSelect.style.width = '100%';
		typeSelect.style.padding = '8px';
		typeSelect.style.marginBottom = '20px';
		typeSelect.style.border = '1px solid var(--vscode-input-border)';
		typeSelect.style.borderRadius = '4px';
		typeSelect.style.background = 'var(--vscode-input-background)';
		typeSelect.style.color = 'var(--vscode-input-foreground)';
		typeSelect.style.fontSize = '13px';

		['LM Studio', 'Ollama', 'OpenAI Compatible API'].forEach(type => {
			const option = $('option') as HTMLOptionElement;
			option.value = type;
			option.textContent = type;
			typeSelect.appendChild(option);
		});
		if (existingModel) {
			typeSelect.value = existingModel.type;
		}
		pageContainer.appendChild(typeSelect);

		// Create input fields
		const { nameInput, endpointLabel, endpointInput, identifierLabel, identifierInput, keyLabel, keyInput } =
			this.createFormFields(pageContainer, existingModel);

		// Update field visibility based on provider type
		const updateFieldsForProvider = () => {
			const selectedType = typeSelect.value;

			if (selectedType === 'LM Studio') {
				// LM Studio: Show name and endpoint, hide identifier and API key
				endpointLabel.style.display = 'block';
				endpointInput.style.display = 'block';
				identifierLabel.style.display = 'none';
				identifierInput.style.display = 'none';
				keyLabel.style.display = 'none';
				keyInput.style.display = 'none';
				// Set defaults
				if (!endpointInput.value) {
					endpointInput.value = 'http://localhost:1234/v1';
				}
				endpointInput.placeholder = 'http://localhost:1234/v1';
				endpointLabel.textContent = 'LM Studio Server URL';
				identifierInput.value = '';
				keyInput.value = '';
			} else if (selectedType === 'Ollama') {
				// Ollama: Show name, endpoint, and model identifier
				endpointLabel.style.display = 'block';
				endpointInput.style.display = 'block';
				identifierLabel.style.display = 'block';
				identifierInput.style.display = 'block';
				keyLabel.style.display = 'none';
				keyInput.style.display = 'none';
				// Set defaults
				if (!endpointInput.value) {
					endpointInput.value = 'http://localhost:11434';
				}
				endpointInput.placeholder = 'http://localhost:11434';
				endpointLabel.textContent = 'Ollama Server URL';
				identifierLabel.textContent = 'Model Name';
				identifierInput.placeholder = 'e.g., llama3.1, mistral, codellama';
				keyInput.value = '';
			} else {
				// OpenAI Compatible API: Show all fields
				endpointLabel.style.display = 'block';
				endpointInput.style.display = 'block';
				identifierLabel.style.display = 'block';
				identifierInput.style.display = 'block';
				keyLabel.style.display = 'block';
				keyInput.style.display = 'block';
				endpointInput.placeholder = 'https://api.openai.com/v1';
				endpointLabel.textContent = 'API Endpoint';
				identifierLabel.textContent = 'Model Identifier';
				identifierInput.placeholder = 'e.g., gpt-4, gpt-3.5-turbo';
				keyLabel.textContent = 'API Key';
			}
		};

		typeSelect.onchange = updateFieldsForProvider;
		updateFieldsForProvider(); // Call initially to set correct visibility

		// Buttons container
		const buttonsContainer = $('div');
		buttonsContainer.style.display = 'flex';
		buttonsContainer.style.gap = '12px';
		buttonsContainer.style.justifyContent = 'flex-end';

		// Cancel button
		const cancelButton = $('button');
		cancelButton.textContent = 'Cancel';
		cancelButton.style.padding = '8px 16px';
		cancelButton.style.border = '1px solid var(--vscode-input-border)';
		cancelButton.style.borderRadius = '4px';
		cancelButton.style.background = 'var(--vscode-input-background)';
		cancelButton.style.color = 'var(--vscode-foreground)';
		cancelButton.style.fontSize = '13px';
		cancelButton.style.cursor = 'pointer';
		cancelButton.onclick = () => callbacks.onCancel();
		buttonsContainer.appendChild(cancelButton);

		// Save button
		const saveButton = $('button');
		saveButton.textContent = isEditing ? 'Save Changes' : 'Add Model';
		saveButton.style.padding = '8px 16px';
		saveButton.style.border = 'none';
		saveButton.style.borderRadius = '4px';
		saveButton.style.background = 'var(--vscode-button-background)';
		saveButton.style.color = 'var(--vscode-button-foreground)';
		saveButton.style.fontSize = '13px';
		saveButton.style.fontWeight = '600';
		saveButton.style.cursor = 'pointer';
		saveButton.onclick = () => {
			const modelData: CustomModel = {
				type: typeSelect.value,
				name: nameInput.value.trim(),
				endpoint: endpointInput.value.trim(),
				modelIdentifier: identifierInput.value.trim(),
				apiKey: keyInput.value.trim()
			};

			// Validate required fields based on provider type
			if (!modelData.name) {
				callbacks.displayMessage('Please enter a Model Name.');
				return;
			}

			if (modelData.type === 'LM Studio') {
				// LM Studio: Require name and endpoint
				if (!modelData.endpoint) {
					callbacks.displayMessage('Please enter the LM Studio Server URL.');
					return;
				}
				modelData.modelIdentifier = '';
				modelData.apiKey = '';
			} else if (modelData.type === 'Ollama') {
				// Ollama: Require name, endpoint, and model identifier
				if (!modelData.endpoint) {
					callbacks.displayMessage('Please enter the Ollama Server URL.');
					return;
				}
				if (!modelData.modelIdentifier) {
					callbacks.displayMessage('Please enter the Model Name (e.g., llama3.1, mistral).');
					return;
				}
				modelData.apiKey = '';
			} else {
				// OpenAI Compatible API: Require all fields
				if (!modelData.endpoint) {
					callbacks.displayMessage('Please enter the API Endpoint.');
					return;
				}
				if (!modelData.modelIdentifier) {
					callbacks.displayMessage('Please enter the Model Identifier.');
					return;
				}
				if (!modelData.apiKey) {
					callbacks.displayMessage('Please enter the API Key.');
					return;
				}
			}

			callbacks.onSave(modelData, isEditing, existingModel);
		};
		buttonsContainer.appendChild(saveButton);

		pageContainer.appendChild(buttonsContainer);
		container.appendChild(pageContainer);
	}

	private createFormFields(container: HTMLElement, existingModel?: CustomModel) {
		const $ = dom.$;

		// Model Name
		const nameLabel = $('label');
		nameLabel.textContent = 'Model Name';
		nameLabel.style.display = 'block';
		nameLabel.style.fontSize = '13px';
		nameLabel.style.fontWeight = '600';
		nameLabel.style.marginBottom = '8px';
		nameLabel.style.color = 'var(--vscode-foreground)';
		container.appendChild(nameLabel);

		const nameInput = $('input', { type: 'text', placeholder: 'e.g., llama-3.1-70b' }) as HTMLInputElement;
		nameInput.style.width = '100%';
		nameInput.style.padding = '8px';
		nameInput.style.marginBottom = '20px';
		nameInput.style.border = '1px solid var(--vscode-input-border)';
		nameInput.style.borderRadius = '4px';
		nameInput.style.background = 'var(--vscode-input-background)';
		nameInput.style.color = 'var(--vscode-input-foreground)';
		nameInput.style.fontSize = '13px';
		nameInput.style.boxSizing = 'border-box';
		if (existingModel) {
			nameInput.value = existingModel.name;
		}
		container.appendChild(nameInput);

		// API Endpoint
		const endpointLabel = $('label');
		endpointLabel.textContent = 'API Endpoint';
		endpointLabel.style.display = 'block';
		endpointLabel.style.fontSize = '13px';
		endpointLabel.style.fontWeight = '600';
		endpointLabel.style.marginBottom = '8px';
		endpointLabel.style.color = 'var(--vscode-foreground)';
		container.appendChild(endpointLabel);

		const endpointInput = $('input', { type: 'text', placeholder: 'http://localhost:1234/v1' }) as HTMLInputElement;
		endpointInput.style.width = '100%';
		endpointInput.style.padding = '8px';
		endpointInput.style.marginBottom = '20px';
		endpointInput.style.border = '1px solid var(--vscode-input-border)';
		endpointInput.style.borderRadius = '4px';
		endpointInput.style.background = 'var(--vscode-input-background)';
		endpointInput.style.color = 'var(--vscode-input-foreground)';
		endpointInput.style.fontSize = '13px';
		endpointInput.style.boxSizing = 'border-box';
		if (existingModel) {
			endpointInput.value = existingModel.endpoint;
		}
		container.appendChild(endpointInput);

		// Model Identifier
		const identifierLabel = $('label');
		identifierLabel.textContent = 'Model Identifier';
		identifierLabel.style.display = 'block';
		identifierLabel.style.fontSize = '13px';
		identifierLabel.style.fontWeight = '600';
		identifierLabel.style.marginBottom = '8px';
		identifierLabel.style.color = 'var(--vscode-foreground)';
		container.appendChild(identifierLabel);

		const identifierInput = $('input', { type: 'text', placeholder: 'e.g., gpt-4, llama-3.1-70b' }) as HTMLInputElement;
		identifierInput.style.width = '100%';
		identifierInput.style.padding = '8px';
		identifierInput.style.marginBottom = '20px';
		identifierInput.style.border = '1px solid var(--vscode-input-border)';
		identifierInput.style.borderRadius = '4px';
		identifierInput.style.background = 'var(--vscode-input-background)';
		identifierInput.style.color = 'var(--vscode-input-foreground)';
		identifierInput.style.fontSize = '13px';
		identifierInput.style.boxSizing = 'border-box';
		if (existingModel) {
			identifierInput.value = existingModel.modelIdentifier;
		}
		container.appendChild(identifierInput);

		// API Key (optional)
		const keyLabel = $('label');
		keyLabel.textContent = 'API Key (optional)';
		keyLabel.style.display = 'block';
		keyLabel.style.fontSize = '13px';
		keyLabel.style.fontWeight = '600';
		keyLabel.style.marginBottom = '8px';
		keyLabel.style.color = 'var(--vscode-foreground)';
		container.appendChild(keyLabel);

		const keyInput = $('input', { type: 'password', placeholder: 'Leave empty for local models' }) as HTMLInputElement;
		keyInput.style.width = '100%';
		keyInput.style.padding = '8px';
		keyInput.style.marginBottom = '30px';
		keyInput.style.border = '1px solid var(--vscode-input-border)';
		keyInput.style.borderRadius = '4px';
		keyInput.style.background = 'var(--vscode-input-background)';
		keyInput.style.color = 'var(--vscode-input-foreground)';
		keyInput.style.fontSize = '13px';
		keyInput.style.boxSizing = 'border-box';
		if (existingModel) {
			keyInput.value = existingModel.apiKey;
		}
		container.appendChild(keyInput);

		return { nameInput, endpointLabel, endpointInput, identifierLabel, identifierInput, keyLabel, keyInput };
	}
}
