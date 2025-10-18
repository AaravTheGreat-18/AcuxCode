/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CustomModel, AttachedFile } from './types.js';

export class APIService {
	public async sendRequest(
		message: string,
		files: AttachedFile[],
		customModel: CustomModel
	): Promise<string> {
		console.log('[AcuxCode] Sending AI request...');
		console.log('[AcuxCode] Using custom model:', customModel.name);
		console.log('[AcuxCode] Endpoint:', customModel.endpoint);
		console.log('[AcuxCode] Model ID:', customModel.modelIdentifier);

		// Prepare the request body (OpenAI-compatible format)
		const requestBody: any = {
			model: customModel.modelIdentifier || 'default',
			messages: [
				{
					role: 'user',
					content: message
				}
			],
			stream: false
		};

		// Prepare headers
		const headers: Record<string, string> = {
			'Content-Type': 'application/json'
		};

		// Add API key if provided - try multiple header formats
		if (customModel.apiKey) {
			headers['Authorization'] = `Bearer ${customModel.apiKey}`;
			headers['api-key'] = customModel.apiKey;
			headers['x-api-key'] = customModel.apiKey;
		}

		// Determine the correct endpoint based on provider type
		let apiUrl = customModel.endpoint;
		if (customModel.type === 'Ollama') {
			apiUrl = `${customModel.endpoint}/api/generate`;
			// Ollama uses different format
			requestBody.model = customModel.modelIdentifier;
			requestBody.prompt = message;
			delete requestBody.messages;
		} else if (customModel.type === 'LM Studio') {
			apiUrl = `${customModel.endpoint}/chat/completions`;
		} else {
			// OpenAI Compatible API
			apiUrl = `${customModel.endpoint}/chat/completions`;
		}

		console.log('[AcuxCode] Sending request to:', apiUrl);
		console.log('[AcuxCode] Request body:', JSON.stringify(requestBody, null, 2));
		console.log('[AcuxCode] Headers:', headers);

		// Make the API request with mode: 'cors' and credentials
		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: headers,
			body: JSON.stringify(requestBody),
			mode: 'cors',
			credentials: 'omit'
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[AcuxCode] API request failed:', response.status, errorText);
			let errorMessage = `Error ${response.status}: API request failed\n\n`;
			try {
				const errorJson = JSON.parse(errorText);
				errorMessage += JSON.stringify(errorJson, null, 2);
			} catch {
				errorMessage += errorText;
			}
			throw new Error(errorMessage);
		}

		const data = await response.json();
		console.log('[AcuxCode] API response received:', data);

		// Extract the response message based on provider type
		let aiMessage: string | undefined;

		if (customModel.type === 'Ollama') {
			// Ollama format
			aiMessage = data.response;
		} else {
			// OpenAI format (LM Studio and OpenAI Compatible API)
			if (data.choices && data.choices.length > 0 && data.choices[0].message) {
				aiMessage = data.choices[0].message.content;
			}
		}

		if (aiMessage) {
			return aiMessage;
		} else {
			console.error('[AcuxCode] Unexpected response format:', data);
			throw new Error('Error: Unexpected response format from API\n\n' + JSON.stringify(data, null, 2));
		}
	}
}
