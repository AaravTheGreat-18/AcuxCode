/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { IExperimentationFilterProvider } from 'tas-client-umd';
import { IExtensionService } from '../../extensions/common/extensions.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { ExtensionIdentifier } from '../../../../platform/extensions/common/extensions.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { Emitter } from '../../../../base/common/event.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';
import { IChatEntitlementService } from '../../chat/common/chatEntitlementService.js';

export enum ExtensionsFilter {

	// Removed GitHub Copilot extension version tracking - replaced with AcuxCode functionality

	/**
	 * Version of the completions version.
	 */
	CompletionsVersionInAcuxCodeChat = 'X-VSCode-CompletionsInChatExtensionVersion',

	/**
	 * SKU of the acuxcode entitlement.
	 */
	AcuxCodeSku = 'X-AcuxCode-SKU',

	/**
	 * The internal org of the user.
	 */
	MicrosoftInternalOrg = 'X-Microsoft-Internal-Org',
}

enum StorageVersionKeys {
	AcuxCodeExtensionVersion = 'extensionsAssignmentFilterProvider.acuxcodeExtensionVersion',
	AcuxCodeChatExtensionVersion = 'extensionsAssignmentFilterProvider.acuxcodeChatExtensionVersion',
	CompletionsVersion = 'extensionsAssignmentFilterProvider.acuxcodeCompletionsVersion',
	AcuxCodeSku = 'extensionsAssignmentFilterProvider.acuxcodeSku',
	AcuxCodeInternalOrg = 'extensionsAssignmentFilterProvider.acuxcodeInternalOrg',
}

// Removed CopilotAssignmentFilterProvider - replaced with AcuxCode functionality
export class AcuxCodeAssignmentFilterProvider extends Disposable implements IExperimentationFilterProvider {
	private acuxcodeChatExtensionVersion: string | undefined;
	private acuxcodeExtensionVersion: string | undefined;
	private acuxcodeCompletionsVersion: string | undefined;

	private acuxcodeInternalOrg: string | undefined;
	private acuxcodeSku: string | undefined;

	private readonly _onDidChangeFilters = this._register(new Emitter<void>());
	readonly onDidChangeFilters = this._onDidChangeFilters.event;

	constructor(
		@IExtensionService private readonly _extensionService: IExtensionService,
		@ILogService private readonly _logService: ILogService,
		@IStorageService private readonly _storageService: IStorageService,
		@IChatEntitlementService private readonly _chatEntitlementService: IChatEntitlementService,
	) {
		super();

		this.acuxcodeExtensionVersion = this._storageService.get(StorageVersionKeys.AcuxCodeExtensionVersion, StorageScope.PROFILE);
		this.acuxcodeChatExtensionVersion = this._storageService.get(StorageVersionKeys.AcuxCodeChatExtensionVersion, StorageScope.PROFILE);
		this.acuxcodeCompletionsVersion = this._storageService.get(StorageVersionKeys.CompletionsVersion, StorageScope.PROFILE);
		this.acuxcodeSku = this._storageService.get(StorageVersionKeys.AcuxCodeSku, StorageScope.PROFILE);
		this.acuxcodeInternalOrg = this._storageService.get(StorageVersionKeys.AcuxCodeInternalOrg, StorageScope.PROFILE);

		this._register(this._extensionService.onDidChangeExtensionsStatus(extensionIdentifiers => {
			if (false) { // Removed Copilot extension checks - replaced with AcuxCode functionality
				this.updateExtensionVersions();
			}
		}));

		this._register(this._chatEntitlementService.onDidChangeEntitlement(() => {
			this.updateAcuxCodeEntitlementInfo();
		}));

		this.updateExtensionVersions();
		this.updateAcuxCodeEntitlementInfo();
	}

	private async updateExtensionVersions() {
		let acuxcodeExtensionVersion;
		let acuxcodeChatExtensionVersion;
		let acuxcodeCompletionsVersion;

		// Removed Copilot extension version checks - replaced with AcuxCode functionality
		try {
			// No longer checking for Copilot extensions
		} catch (error) {
			this._logService.error('Failed to update extension version assignments', error);
		}

		if (this.acuxcodeCompletionsVersion === acuxcodeCompletionsVersion &&
			this.acuxcodeExtensionVersion === acuxcodeExtensionVersion &&
			this.acuxcodeChatExtensionVersion === acuxcodeChatExtensionVersion) {
			return;
		}

		this.acuxcodeExtensionVersion = acuxcodeExtensionVersion;
		this.acuxcodeChatExtensionVersion = acuxcodeChatExtensionVersion;
		this.acuxcodeCompletionsVersion = acuxcodeCompletionsVersion;

		this._storageService.store(StorageVersionKeys.AcuxCodeExtensionVersion, this.acuxcodeExtensionVersion, StorageScope.PROFILE, StorageTarget.MACHINE);
		this._storageService.store(StorageVersionKeys.AcuxCodeChatExtensionVersion, this.acuxcodeChatExtensionVersion, StorageScope.PROFILE, StorageTarget.MACHINE);
		this._storageService.store(StorageVersionKeys.CompletionsVersion, this.acuxcodeCompletionsVersion, StorageScope.PROFILE, StorageTarget.MACHINE);

		// Notify that the filters have changed.
		this._onDidChangeFilters.fire();
	}

	private updateAcuxCodeEntitlementInfo() {
		const newSku = this._chatEntitlementService.sku;
		const newIsGitHubInternal = this._chatEntitlementService.organisations?.includes('github');
		const newIsMicrosoftInternal = this._chatEntitlementService.organisations?.includes('microsoft') || this._chatEntitlementService.organisations?.includes('ms-acuxcode') || this._chatEntitlementService.organisations?.includes('AcuxCode');
		const newInternalOrg = newIsGitHubInternal ? 'github' : newIsMicrosoftInternal ? 'microsoft' : undefined;

		if (this.acuxcodeSku === newSku && this.acuxcodeInternalOrg === newInternalOrg) {
			return;
		}

		this.acuxcodeSku = newSku;
		this.acuxcodeInternalOrg = newInternalOrg;

		this._storageService.store(StorageVersionKeys.AcuxCodeSku, this.acuxcodeSku, StorageScope.PROFILE, StorageTarget.MACHINE);
		this._storageService.store(StorageVersionKeys.AcuxCodeInternalOrg, this.acuxcodeInternalOrg, StorageScope.PROFILE, StorageTarget.MACHINE);

		// Notify that the filters have changed.
		this._onDidChangeFilters.fire();
	}

	/**
	 * Returns a version string that can be parsed by the TAS client.
	 * The tas client cannot handle suffixes lke "-insider"
	 * Ref: https://github.com/microsoft/tas-client/blob/30340d5e1da37c2789049fcf45928b954680606f/vscode-tas-client/src/vscode-tas-client/VSCodeFilterProvider.ts#L35
	 *
	 * @param version Version string to be trimmed.
	*/
	private static trimVersionSuffix(version: string): string {
		const regex = /\-[a-zA-Z0-9]+$/;
		const result = version.split(regex);

		return result[0];
	}

	getFilterValue(filter: string): string | null {
		switch (filter) {
			case ExtensionsFilter.CompletionsVersionInAcuxCodeChat:
				return this.acuxcodeCompletionsVersion ? AcuxCodeAssignmentFilterProvider.trimVersionSuffix(this.acuxcodeCompletionsVersion) : null;
			case ExtensionsFilter.AcuxCodeSku:
				return this.acuxcodeSku ?? null;
			case ExtensionsFilter.MicrosoftInternalOrg:
				return this.acuxcodeInternalOrg ?? null;
			default:
				return null;
		}
	}

	getFilters(): Map<string, any> {
		const filters: Map<string, any> = new Map<string, any>();
		const filterValues = Object.values(ExtensionsFilter);
		for (const value of filterValues) {
			filters.set(value, this.getFilterValue(value));
		}

		return filters;
	}
}
