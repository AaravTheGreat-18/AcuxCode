/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IStorageService, StorageScope, StorageTarget } from '../../../../../platform/storage/common/storage.js';
import { CustomModel } from './types.js';

export class ModelManager {
	private customModels: CustomModel[] = [];
	private selectedModel: string = 'GPT-4';
	private recentModels: string[] = [];
	private autoModeEnabled: boolean = false;

	private readonly storageKeySelectedModel = 'acuxcode.chat.selectedModel';
	private readonly storageKeyRecentModels = 'acuxcode.chat.recentModels';
	private readonly storageKeyAutoMode = 'acuxcode.chat.autoMode';
	private readonly storageKeyCustomModels = 'acuxcode.chat.customModels';

	constructor(private storageService: IStorageService) {
		this.loadPersistedState();
	}

	private loadPersistedState(): void {
		const PERSIST_SCOPE = StorageScope.PROFILE;
		
		const savedModel = this.storageService.get(this.storageKeySelectedModel, PERSIST_SCOPE);
		if (savedModel) {
			this.selectedModel = savedModel;
		}

		const savedAuto = this.storageService.get(this.storageKeyAutoMode, PERSIST_SCOPE);
		this.autoModeEnabled = savedAuto === '1';

		try {
			const savedRecents = this.storageService.get(this.storageKeyRecentModels, PERSIST_SCOPE);
			if (savedRecents) {
				const parsed = JSON.parse(savedRecents);
				if (Array.isArray(parsed)) {
					this.recentModels = parsed.filter((n: unknown) => typeof n === 'string').slice(0, 3);
				}
			}

			const savedCustomModels = this.storageService.get(this.storageKeyCustomModels, PERSIST_SCOPE);
			if (savedCustomModels) {
				const parsed = JSON.parse(savedCustomModels);
				if (Array.isArray(parsed)) {
					this.customModels = parsed;
				}
			}
		} catch { /* ignore parse errors */ }
	}

	public persistState(): void {
		const PERSIST_SCOPE = StorageScope.PROFILE;
		this.storageService.store(this.storageKeySelectedModel, this.selectedModel, PERSIST_SCOPE, StorageTarget.USER);
		this.storageService.store(this.storageKeyAutoMode, this.autoModeEnabled ? '1' : '0', PERSIST_SCOPE, StorageTarget.USER);
		this.storageService.store(this.storageKeyRecentModels, JSON.stringify(this.recentModels), PERSIST_SCOPE, StorageTarget.USER);
		this.storageService.store(this.storageKeyCustomModels, JSON.stringify(this.customModels), PERSIST_SCOPE, StorageTarget.USER);
	}

	public getSelectedModel(): string {
		return this.selectedModel;
	}

	public setSelectedModel(model: string): void {
		this.selectedModel = model;
		this.persistState();
	}

	public getAutoModeEnabled(): boolean {
		return this.autoModeEnabled;
	}

	public setAutoModeEnabled(enabled: boolean): void {
		this.autoModeEnabled = enabled;
		this.persistState();
	}

	public getRecentModels(): string[] {
		return this.recentModels;
	}

	public addRecentModel(modelName: string): void {
		this.recentModels = this.recentModels.filter(m => m !== modelName);
		this.recentModels.unshift(modelName);
		this.recentModels = this.recentModels.slice(0, 3);
		this.persistState();
	}

	public getCustomModels(): CustomModel[] {
		return this.customModels;
	}

	public addCustomModel(model: CustomModel): void {
		this.customModels.push(model);
		this.persistState();
	}

	public updateCustomModel(oldModel: CustomModel, newModel: CustomModel): void {
		const index = this.customModels.findIndex(m =>
			m.name === oldModel.name &&
			m.endpoint === oldModel.endpoint
		);
		if (index !== -1) {
			this.customModels[index] = newModel;
			this.persistState();
		}
	}

	public deleteCustomModel(model: CustomModel): void {
		const index = this.customModels.findIndex(m =>
			m.name === model.name &&
			m.endpoint === model.endpoint
		);
		if (index !== -1) {
			this.customModels.splice(index, 1);
			this.persistState();
		}
	}

	public findCustomModel(name: string): CustomModel | undefined {
		return this.customModels.find(m => m.name === name);
	}
}
