/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as dom from '../../../../base/browser/dom.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { URI } from '../../../../base/common/uri.js';
import { basename } from '../../../../base/common/path.js';
import { IQuickInputService, IQuickPickItemWithResource } from '../../../../platform/quickinput/common/quickInput.js';
import { AnythingQuickAccessProviderRunOptions } from '../../../../platform/quickinput/common/quickAccess.js';
import { AbstractGotoSymbolQuickAccessProvider, IGotoSymbolQuickPickItem } from '../../../../editor/contrib/quickAccess/browser/gotoSymbolQuickAccess.js';
import { AnythingQuickAccessProvider } from '../../search/browser/anythingQuickAccess.js';
import { SymbolsQuickAccessProvider } from '../../search/browser/symbolsQuickAccess.js';
import { IChatWidgetService } from './chat.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { ResourceLabels } from '../../../browser/labels.js';
import * as event from '../../../../base/common/event.js';
import { IStorageService, StorageScope, StorageTarget } from '../../../../platform/storage/common/storage.js';

const $ = dom.$;

export class AISidebarView extends Disposable {
    private container!: HTMLElement;
    private attachedFiles: Array<{ name: string; uri: URI }> = [];
    private filesDisplayArea!: HTMLElement;
    private resourceLabels!: ResourceLabels;
    private inputElement!: HTMLTextAreaElement;
    private messagesArea!: HTMLElement;
    private selectedModel: string = 'GPT-4';
	private autoModeEnabled: boolean = false;
	private recentModels: string[] = [];
	private customModels: Array<{ type: string; name: string; endpoint: string; modelIdentifier: string; apiKey: string }> = [];
	private readonly storageKeySelectedModel = 'acuxcode.chat.selectedModel';
	private readonly storageKeyRecentModels = 'acuxcode.chat.recentModels';
	private readonly storageKeyAutoMode = 'acuxcode.chat.autoMode';
	private readonly storageKeyCustomModels = 'acuxcode.chat.customModels';

    constructor(
        @IQuickInputService private readonly quickInputService: IQuickInputService,
        @IChatWidgetService private readonly chatWidgetService: IChatWidgetService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IStorageService private readonly storageService: IStorageService
    ) {
        super();
        console.log('[AcuxCode] AISidebarView constructor called');
        this.create();
        console.log('[AcuxCode] AISidebarView created successfully');
        this.tryBindWidget();
    }

    private create(): void {
        // Create main container with theme-aware styling
        this.container = $('div.ai-sidebar-simple');
        
        // Create resource labels for file icons
        this.resourceLabels = this._register(this.instantiationService.createInstance(ResourceLabels, { onDidChangeVisibility: event.Event.None }));
        
        // Use CSS variables for theme colors instead of hardcoded values
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.padding = '20px';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.overflow = 'auto';
        this.container.style.boxSizing = 'border-box';
        
        console.log('[AcuxCode] Container created with styles');

        // Create messages area at the top
        this.messagesArea = $('div');
        this.messagesArea.style.flex = '1';
        this.messagesArea.style.overflow = 'auto';
        this.messagesArea.style.display = 'flex';
        this.messagesArea.style.flexDirection = 'column';
        this.messagesArea.style.gap = '12px';
        this.messagesArea.style.paddingBottom = '20px';
        this.container.appendChild(this.messagesArea);

        // Add input box at the bottom
        const inputContainer = $('div');
        inputContainer.style.display = 'flex';
        inputContainer.style.flexDirection = 'column';
        inputContainer.style.paddingBottom = '10px';
        inputContainer.style.flexShrink = '0';
        inputContainer.style.alignItems = 'center';
        inputContainer.style.justifyContent = 'center';
        
        // Create wrapper for the entire input area
        const inputWrapper = $('div');
        inputWrapper.style.position = 'relative';
        inputWrapper.style.width = '95%';
        inputWrapper.style.maxWidth = '900px';
        inputWrapper.style.display = 'flex';
        inputWrapper.style.flexDirection = 'column';
        inputWrapper.style.border = '1px solid var(--vscode-input-border)';
        inputWrapper.style.borderRadius = '12px';
        inputWrapper.style.backgroundColor = 'var(--vscode-input-background)';
        inputWrapper.style.overflow = 'hidden';
        
        // Files display area (above input)
        this.filesDisplayArea = $('div');
        this.filesDisplayArea.style.display = 'none'; // Hidden by default
        this.filesDisplayArea.style.padding = '8px 12px';
        this.filesDisplayArea.style.gap = '8px';
        this.filesDisplayArea.style.flexWrap = 'wrap';
        this.filesDisplayArea.style.borderBottom = '1px solid var(--vscode-input-border)';
        this.filesDisplayArea.style.backgroundColor = 'var(--vscode-input-background)';
        
        // Top half - text input area
        this.inputElement = $('textarea', { placeholder: 'Ask anything...' }) as HTMLTextAreaElement;
        const input = this.inputElement;
        input.style.padding = '12px 14px';
        input.style.border = 'none';
        input.style.fontSize = '13px';
        input.style.backgroundColor = 'transparent';
        input.style.color = 'var(--vscode-input-foreground)';
        input.style.outline = 'none';
        input.style.width = '100%';
        input.style.boxSizing = 'border-box';
        input.style.minHeight = '60px';
        input.style.resize = 'none';
        input.style.fontFamily = 'inherit';
        
        // Bottom half - controls area
        const controlsArea = $('div');
        controlsArea.style.display = 'flex';
        controlsArea.style.alignItems = 'center';
        controlsArea.style.justifyContent = 'space-between';
        controlsArea.style.padding = '8px 12px';
        controlsArea.style.backgroundColor = 'var(--vscode-input-background)';
        
        // Create custom model selector (with provider groups, search, and usage)
        type ModelInfo = { name: string; provider: string; usage: string };
        const availableModels: ModelInfo[] = [
            // Basic (0.5 request)
            { name: 'Gemini 2.0 Flash', provider: 'Google', usage: '0.5 request' },
            { name: 'Gemini 2.5 Flash', provider: 'Google', usage: '0.5 request' },
            { name: 'DeepSeek-Chat', provider: 'DeepSeek', usage: '0.5 request' },
            { name: 'DeepSeek-Reasoner', provider: 'DeepSeek', usage: '0.5 request' },
            { name: 'GPT-4o Mini', provider: 'OpenAI', usage: '0.5 request' },
            { name: 'GPT-5 Mini', provider: 'OpenAI', usage: '0.5 request' },
            { name: 'GPT-5 Nano', provider: 'OpenAI', usage: '0.5 request' },
            { name: 'GPT-4.1 Mini', provider: 'OpenAI', usage: '0.5 request' },
            { name: 'GPT-4.1 Nano', provider: 'OpenAI', usage: '0.5 request' },
            { name: 'Grok 3 Mini', provider: 'xAI', usage: '0.5 request' },
            { name: 'Claude 3.5 Haiku', provider: 'Anthropic', usage: '0.5 request' },
            { name: 'Llama 4 Scout', provider: 'Meta', usage: '0.5 request' },
            { name: 'o3 mini', provider: 'OpenAI', usage: '0.5 request' },

            // Premium (default 1 request unless specified)
            { name: 'DeepSeek-R1', provider: 'DeepSeek', usage: '1 request' },
            { name: 'DeepSeek-V3', provider: 'DeepSeek', usage: '1 request' },
            { name: 'GPT-4o', provider: 'OpenAI', usage: '1 request' },
            { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', usage: '1 request' },
            { name: 'Claude 3.7 Sonnet', provider: 'Anthropic', usage: '1 request' },
            { name: 'Claude Sonnet 4', provider: 'Anthropic', usage: '2 requests' },
            { name: 'Claude 4.5 Sonnet', provider: 'Anthropic', usage: '2 requests' },
            { name: 'Claude 4.5 Sonnet Thinking', provider: 'Anthropic', usage: '2.5 requests' },
            { name: 'GPT-4.1', provider: 'OpenAI', usage: '1 request' },
            { name: 'Grok 3 Beta', provider: 'xAI', usage: '1 request' },
            { name: 'Gemini 2.0 Pro', provider: 'Google', usage: '1 request' },
            { name: 'Gemini 2.5 Pro', provider: 'Google', usage: '1 request' },
            { name: 'o3', provider: 'OpenAI', usage: '1 request' },
            { name: 'GPT-5', provider: 'OpenAI', usage: '1 request' },
            { name: 'Kimi K2', provider: 'Kimi', usage: '1 request' },
            { name: 'Grok 4 Fast', provider: 'xAI', usage: '1 request' },

            // Enterprise/Master (20 requests)
            { name: 'Claude 3 Opus', provider: 'Anthropic', usage: '20 requests' },
            { name: 'GPT-4', provider: 'OpenAI', usage: '20 requests' },
            { name: 'Claude Opus 4', provider: 'Anthropic', usage: '20 requests' },
            { name: 'GPT-4 Turbo', provider: 'OpenAI', usage: '20 requests' }
        ];

        const modelDropdownRoot = $('div');
        modelDropdownRoot.style.position = 'relative';
        modelDropdownRoot.style.display = 'inline-block';

        const modelButton = $('button');
        modelButton.style.padding = '4px 8px';
        modelButton.style.fontSize = '11px';
        modelButton.style.fontWeight = '600';
        modelButton.style.border = '1px solid var(--vscode-input-border)';
        modelButton.style.borderRadius = '6px';
        modelButton.style.backgroundColor = 'var(--vscode-input-background)';
        modelButton.style.color = 'var(--vscode-input-foreground)';
        modelButton.style.cursor = 'pointer';
        modelButton.style.outline = 'none';
        modelButton.style.display = 'flex';
        modelButton.style.alignItems = 'center';
        modelButton.style.gap = '6px';

		// Persistence helpers
		const PERSIST_SCOPE = StorageScope.PROFILE;
		const persistState = () => {
			this.storageService.store(this.storageKeySelectedModel, this.selectedModel, PERSIST_SCOPE, StorageTarget.USER);
			this.storageService.store(this.storageKeyAutoMode, this.autoModeEnabled ? '1' : '0', PERSIST_SCOPE, StorageTarget.USER);
			this.storageService.store(this.storageKeyRecentModels, JSON.stringify(this.recentModels), PERSIST_SCOPE, StorageTarget.USER);
			this.storageService.store(this.storageKeyCustomModels, JSON.stringify(this.customModels), PERSIST_SCOPE, StorageTarget.USER);
		};
		const loadPersistedState = (all: ModelInfo[]) => {
			const savedModel = this.storageService.get(this.storageKeySelectedModel, PERSIST_SCOPE);
			const savedAuto = this.storageService.get(this.storageKeyAutoMode, PERSIST_SCOPE);
			const savedRecents = this.storageService.get(this.storageKeyRecentModels, PERSIST_SCOPE);
			const savedCustomModels = this.storageService.get(this.storageKeyCustomModels, PERSIST_SCOPE);
			this.autoModeEnabled = savedAuto === '1';
			try {
				if (savedRecents) {
					const parsed = JSON.parse(savedRecents);
					if (Array.isArray(parsed)) {
						this.recentModels = parsed.filter((n: unknown) => typeof n === 'string').slice(0, 3);
					}
				}
				if (savedCustomModels) {
					const parsed = JSON.parse(savedCustomModels);
					if (Array.isArray(parsed)) {
						this.customModels = parsed;
					}
				}
			} catch { /* ignore parse errors */ }
			if (savedModel) {
				const isBuiltIn = all.some(m => m.name === savedModel);
				const isCustom = this.customModels.some(m => m.name === savedModel);
				if (isBuiltIn || isCustom) {
					this.selectedModel = savedModel;
				}
			}
		};

		// Set default selected model
		this.selectedModel = 'Gemini 2.0 Flash';
		loadPersistedState(availableModels);
		const setButtonLabel = () => {
			modelButton.textContent = '';
			if (this.autoModeEnabled) {
				const autoSpan = $('span');
				autoSpan.textContent = 'Auto';
				autoSpan.style.fontWeight = '700';
				modelButton.appendChild(autoSpan);
				return;
			}
			const nameSpan = $('span');
			nameSpan.textContent = this.selectedModel;
			nameSpan.style.fontWeight = '400';
			nameSpan.style.opacity = '0.85';
			modelButton.appendChild(nameSpan);
		};

		const trackRecentModel = (name: string) => {
			// Maintain unique last-3 list
			this.recentModels = [name, ...this.recentModels.filter(n => n !== name)].slice(0, 3);
			persistState();
		};
        setButtonLabel();

        const dropdownPanel = $('div');
        dropdownPanel.style.position = 'fixed';
        dropdownPanel.style.left = '0px';
        dropdownPanel.style.top = '0px';
        dropdownPanel.style.minWidth = '260px';
        dropdownPanel.style.maxWidth = '360px';
        dropdownPanel.style.maxHeight = '500px';
        dropdownPanel.style.overflow = 'hidden';
        dropdownPanel.style.border = '1px solid var(--vscode-input-border)';
        dropdownPanel.style.borderRadius = '8px';
        dropdownPanel.style.background = 'var(--vscode-editor-background)';
        dropdownPanel.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)';
        dropdownPanel.style.display = 'none';
        dropdownPanel.style.zIndex = '10000';
        dropdownPanel.style.flexDirection = 'column';

		// Auto mode toggle (top of dropdown)
		const autoContainer = $('div');
		autoContainer.style.display = 'flex';
		autoContainer.style.alignItems = 'center';
		autoContainer.style.justifyContent = 'space-between';
		autoContainer.style.padding = '8px 10px 6px 10px';
		const autoLabel = $('div');
		autoLabel.textContent = 'Auto';
		autoLabel.style.fontSize = '12px';
		autoLabel.style.fontWeight = '600';
		autoLabel.style.color = 'var(--vscode-foreground)';
		// Apple-like switch
		const autoSwitch = $('button') as HTMLButtonElement;
		autoSwitch.setAttribute('role', 'switch');
		autoSwitch.setAttribute('aria-label', 'Auto');
		autoSwitch.style.width = '36px';
		autoSwitch.style.height = '22px';
		autoSwitch.style.minWidth = '36px';
		autoSwitch.style.border = 'none';
		autoSwitch.style.margin = '0';
		autoSwitch.style.padding = '0';
		autoSwitch.style.borderRadius = '999px';
		autoSwitch.style.position = 'relative';
		autoSwitch.style.cursor = 'pointer';
		autoSwitch.style.outline = 'none';
		autoSwitch.style.background = 'var(--vscode-input-border)';
		const knob = $('div');
		knob.style.position = 'absolute';
		knob.style.top = '3px';
		knob.style.left = '3px';
		knob.style.width = '16px';
		knob.style.height = '16px';
		knob.style.borderRadius = '999px';
		knob.style.background = 'var(--vscode-editor-background)';
		knob.style.boxShadow = '0 1px 2px rgba(0,0,0,0.25)';
		knob.style.transition = 'transform 120ms ease, left 120ms ease, background 120ms ease';
		autoSwitch.appendChild(knob);
		const setSwitchState = (on: boolean) => {
			autoSwitch.setAttribute('aria-checked', on ? 'true' : 'false');
			autoSwitch.style.background = on ? 'var(--vscode-button-background)' : 'var(--vscode-input-border)';
			knob.style.left = on ? '17px' : '3px';
			knob.style.background = on ? 'var(--vscode-editor-background)' : 'var(--vscode-editor-background)';
		};
		setSwitchState(this.autoModeEnabled);
		const toggleAuto = () => {
			this.autoModeEnabled = !this.autoModeEnabled;
			setSwitchState(this.autoModeEnabled);
			setButtonLabel();
			updateInteractivity();
			renderList(searchInput.value);
			persistState();
		};
		autoSwitch.onclick = (e) => {
			e.preventDefault();
			toggleAuto();
		};
		autoSwitch.onkeydown = (e) => {
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				toggleAuto();
			}
		};
		autoContainer.appendChild(autoLabel);
		autoContainer.appendChild(autoSwitch);

		// Search bar
        const searchContainer = $('div');
        searchContainer.style.padding = '8px';
        const searchInput = $('input', { type: 'text', placeholder: 'Search models...' }) as HTMLInputElement;
        searchInput.style.width = '100%';
        searchInput.style.boxSizing = 'border-box';
        searchInput.style.padding = '6px 8px';
        searchInput.style.border = '1px solid var(--vscode-input-border)';
        searchInput.style.borderRadius = '4px';
        searchInput.style.background = 'var(--vscode-input-background)';
        searchInput.style.color = 'var(--vscode-input-foreground)';
        searchContainer.appendChild(searchInput);

        // List area
        const listScroll = $('div');
        listScroll.style.overflow = 'auto';
        listScroll.style.maxHeight = '380px';
        listScroll.style.flex = '1';
        listScroll.style.minHeight = '0';

        const providers = Array.from(new Set(availableModels.map(m => m.provider)));

		const renderList = (filter: string) => {
            while (listScroll.firstChild) {
                listScroll.removeChild(listScroll.firstChild);
            }
            const norm = (s: string) => s.toLowerCase();
            const f = norm(filter || '');

			// Recently used
			if (this.recentModels.length > 0) {
				const recentModelsInfo = this.recentModels
					.map(n => availableModels.find(m => m.name === n))
					.filter((m): m is ModelInfo => !!m)
					.filter(m => !f || norm(m.name).includes(f));
				if (recentModelsInfo.length > 0) {
					const rHeader = $('div');
					rHeader.textContent = 'Recently used';
					rHeader.style.position = 'sticky';
					rHeader.style.top = '0';
					rHeader.style.zIndex = '1';
					rHeader.style.padding = '6px 8px';
					rHeader.style.background = 'var(--vscode-editor-background)';
					rHeader.style.color = 'var(--vscode-descriptionForeground)';
					rHeader.style.fontSize = '10px';
					rHeader.style.fontWeight = '700';
					rHeader.style.textTransform = 'uppercase';
					listScroll.appendChild(rHeader);

					recentModelsInfo.forEach(model => {
						const item = $('div');
						item.style.display = 'flex';
						item.style.alignItems = 'center';
						item.style.justifyContent = 'space-between';
						item.style.gap = '8px';
						item.style.padding = '8px';
						item.style.cursor = 'pointer';
						item.style.fontSize = '12px';
						item.style.borderTop = '1px solid var(--vscode-widget-border, transparent)';
						if (this.autoModeEnabled) { item.style.pointerEvents = 'none'; item.style.opacity = '0.6'; }
						const name = $('span');
						name.textContent = model.name;
						name.style.color = 'var(--vscode-foreground)';
						name.style.whiteSpace = 'nowrap';
						name.style.overflow = 'hidden';
						name.style.textOverflow = 'ellipsis';
						const usage = $('span');
						usage.textContent = model.usage;
						usage.style.color = 'var(--vscode-descriptionForeground)';
						usage.style.fontSize = '11px';
						item.appendChild(name);
						item.appendChild(usage);

						item.onmouseenter = () => { if (!this.autoModeEnabled) { item.style.background = 'var(--vscode-list-hoverBackground)'; } };
						item.onmouseleave = () => item.style.background = 'transparent';
						item.onclick = () => {
							if (this.autoModeEnabled) { return; }
							this.selectedModel = model.name;
							trackRecentModel(model.name);
							setButtonLabel();
							dropdownPanel.style.display = 'none';
							console.log('[AcuxCode] Model changed to:', this.selectedModel);
						};
						listScroll.appendChild(item);
					});
				}
			}
			providers.forEach(provider => {
                const models = availableModels.filter(m => m.provider === provider && (!f || norm(m.name).includes(f)));
                if (models.length === 0) {
                    return;
                }
                const header = $('div');
                header.textContent = provider;
                header.style.position = 'sticky';
                header.style.top = '0';
                header.style.zIndex = '1';
                header.style.padding = '6px 8px';
                header.style.background = 'var(--vscode-editor-background)';
                header.style.color = 'var(--vscode-descriptionForeground)';
                header.style.fontSize = '10px';
                header.style.fontWeight = '700';
                header.style.textTransform = 'uppercase';
                listScroll.appendChild(header);

				models.forEach(model => {
                    const item = $('div');
                    item.style.display = 'flex';
                    item.style.alignItems = 'center';
                    item.style.justifyContent = 'space-between';
                    item.style.gap = '8px';
                    item.style.padding = '8px';
                    item.style.cursor = 'pointer';
                    item.style.fontSize = '12px';
                    item.style.borderTop = '1px solid var(--vscode-widget-border, transparent)';
					if (this.autoModeEnabled) { item.style.pointerEvents = 'none'; item.style.opacity = '0.6'; }
                    const name = $('span');
                    name.textContent = model.name;
                    name.style.color = 'var(--vscode-foreground)';
                    name.style.whiteSpace = 'nowrap';
                    name.style.overflow = 'hidden';
                    name.style.textOverflow = 'ellipsis';
                    const usage = $('span');
                    usage.textContent = model.usage;
                    usage.style.color = 'var(--vscode-descriptionForeground)';
                    usage.style.fontSize = '11px';
                    item.appendChild(name);
                    item.appendChild(usage);

					item.onmouseenter = () => { if (!this.autoModeEnabled) { item.style.background = 'var(--vscode-list-hoverBackground)'; } };
                    item.onmouseleave = () => item.style.background = 'transparent';
                    item.onclick = () => {
						if (this.autoModeEnabled) { return; }
						this.selectedModel = model.name;
						trackRecentModel(model.name);
						setButtonLabel();
						dropdownPanel.style.display = 'none';
						console.log('[AcuxCode] Model changed to:', this.selectedModel);
                    };
                    listScroll.appendChild(item);
                });
            });
            
            // My Models section (at the bottom)
			if (this.customModels.length > 0) {
				const filteredCustom = this.customModels.filter(m => !f || norm(m.name).includes(f));
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
						if (this.autoModeEnabled) { item.style.pointerEvents = 'none'; item.style.opacity = '0.6'; }
						
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
							btn.onmouseenter = () => btn.style.background = 'var(--vscode-button-hoverBackground)';
							btn.onmouseleave = () => btn.style.background = 'var(--vscode-input-background)';
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
							this.showAddModelPage(model);
						};
						
						deleteBtn.onclick = (e) => {
							e.stopPropagation();
							// Remove from array
							const index = this.customModels.findIndex(m => m.name === model.name && m.endpoint === model.endpoint);
							if (index !== -1) {
								this.customModels.splice(index, 1);
								// Persist to storage
								const PERSIST_SCOPE = StorageScope.PROFILE;
								this.storageService.store(this.storageKeyCustomModels, JSON.stringify(this.customModels), PERSIST_SCOPE, StorageTarget.USER);
								// Re-render list
								renderList(searchInput.value);
								console.log('[AcuxCode] Custom model deleted:', model.name);
							}
						};

						item.onmouseenter = () => { 
							if (!this.autoModeEnabled) { 
								item.style.background = 'var(--vscode-list-hoverBackground)'; 
								actions.style.display = 'flex';
							} 
						};
						item.onmouseleave = () => { 
							item.style.background = 'transparent'; 
							actions.style.display = 'none';
						};
						
						item.onclick = () => {
							if (this.autoModeEnabled) { return; }
							this.selectedModel = model.name;
							trackRecentModel(model.name);
							setButtonLabel();
							dropdownPanel.style.display = 'none';
							console.log('[AcuxCode] Model changed to:', this.selectedModel);
						};
						listScroll.appendChild(item);
					});
				}
			}
        };

        renderList('');
        searchInput.oninput = () => renderList(searchInput.value);

		// Add Model button at bottom (fixed, not scrollable)
		const addModelButton = $('button');
		addModelButton.textContent = '+ Add Model';
		addModelButton.style.width = '100%';
		addModelButton.style.padding = '10px';
		addModelButton.style.border = 'none';
		addModelButton.style.borderTop = '1px solid var(--vscode-input-border)';
		addModelButton.style.background = 'var(--vscode-editor-background)';
		addModelButton.style.color = 'var(--vscode-button-foreground)';
		addModelButton.style.fontSize = '12px';
		addModelButton.style.fontWeight = '600';
		addModelButton.style.cursor = 'pointer';
		addModelButton.style.textAlign = 'center';
		addModelButton.style.flexShrink = '0';
		addModelButton.onmouseenter = () => addModelButton.style.background = 'var(--vscode-list-hoverBackground)';
		addModelButton.onmouseleave = () => addModelButton.style.background = 'var(--vscode-editor-background)';
		addModelButton.onclick = () => {
			closeDropdown();
			this.showAddModelPage();
		};

		dropdownPanel.appendChild(autoContainer);
		dropdownPanel.appendChild(searchContainer);
        dropdownPanel.appendChild(listScroll);
		dropdownPanel.appendChild(addModelButton);

		const updateInteractivity = () => {
			searchInput.disabled = this.autoModeEnabled;
			listScroll.style.pointerEvents = this.autoModeEnabled ? 'none' : 'auto';
			listScroll.style.opacity = this.autoModeEnabled ? '0.6' : '1';
		};

        // Render dropdown in body to avoid clipping by overflow/scroll containers
        document.body.appendChild(dropdownPanel);

        const positionDropdown = () => {
            const btnRect = modelButton.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const panelMaxHeight = Math.min(500, Math.max(200, viewportHeight - 24));
            dropdownPanel.style.maxHeight = panelMaxHeight + 'px';

            // Preferred: open upwards if there is more space above; otherwise open below
            const spaceBelow = viewportHeight - btnRect.bottom;
            const spaceAbove = btnRect.top;
            const openUpwards = spaceAbove > spaceBelow;

            const panelWidth = Math.min(360, Math.max(260, btnRect.width));
            dropdownPanel.style.width = panelWidth + 'px';

            const left = Math.min(Math.max(8, btnRect.left), Math.max(8, window.innerWidth - panelWidth - 8));
            dropdownPanel.style.left = left + 'px';

            if (openUpwards) {
                const desiredBottom = viewportHeight - btnRect.top + 4; // 4px gap
                dropdownPanel.style.bottom = desiredBottom + 'px';
                dropdownPanel.style.top = '';
            } else {
                const top = btnRect.bottom + 4; // 4px gap
                dropdownPanel.style.top = top + 'px';
                dropdownPanel.style.bottom = '';
            }
        };

        const openDropdown = () => {
            positionDropdown();
            dropdownPanel.style.display = 'block';
            searchInput.focus();
            window.addEventListener('scroll', positionDropdown, true);
            window.addEventListener('resize', positionDropdown);
        };
        const closeDropdown = () => {
            dropdownPanel.style.display = 'none';
            window.removeEventListener('scroll', positionDropdown, true);
            window.removeEventListener('resize', positionDropdown);
        };

        let outsideClickHandler: ((e: MouseEvent) => void) | null = null;
        modelButton.onclick = (e) => {
            e.stopPropagation();
            if (dropdownPanel.style.display === 'none') {
                openDropdown();
                if (!outsideClickHandler) {
                    outsideClickHandler = (ev: MouseEvent) => {
                        if (!dropdownPanel.contains(ev.target as Node) && ev.target !== modelButton) {
                            closeDropdown();
                            if (outsideClickHandler) {
                                document.removeEventListener('click', outsideClickHandler);
                                outsideClickHandler = null;
                            }
                        }
                    };
                    document.addEventListener('click', outsideClickHandler);
                }
            } else {
                closeDropdown();
                if (outsideClickHandler) {
                    document.removeEventListener('click', outsideClickHandler);
                    outsideClickHandler = null;
                }
            }
        };

        // Keyboard handling for search (Esc to close)
        searchInput.onkeydown = (ev) => {
            if (ev.key === 'Escape') {
                closeDropdown();
                modelButton.focus();
            }
        };

        modelDropdownRoot.appendChild(modelButton);
        modelDropdownRoot.appendChild(dropdownPanel);
        
        // Create send button (circular with clean arrow)
        const sendButton = $('button');
        sendButton.style.width = '28px';
        sendButton.style.height = '28px';
        sendButton.style.borderRadius = '50%';
        sendButton.style.border = 'none';
        sendButton.style.backgroundColor = '#ffffff';
        sendButton.style.cursor = 'pointer';
        sendButton.style.display = 'flex';
        sendButton.style.alignItems = 'center';
        sendButton.style.justifyContent = 'center';
        sendButton.style.padding = '0';
        sendButton.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
        sendButton.setAttribute('aria-label', 'Send message');
        
        // Create SVG arrow using DOM
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '14');
        svg.setAttribute('height', '14');
        svg.setAttribute('viewBox', '0 0 16 16');
        svg.setAttribute('fill', 'none');
        svg.style.display = 'block';
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M8 3L8 13M8 3L4 7M8 3L12 7');
        path.setAttribute('stroke', '#000000');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        
        svg.appendChild(path);
        sendButton.appendChild(svg);
        
        // Add hover effect
        sendButton.onmouseenter = () => {
            sendButton.style.backgroundColor = '#f2f2f2';
        };
        sendButton.onmouseleave = () => {
            sendButton.style.backgroundColor = '#ffffff';
        };
        
        // Add send button click handler
        sendButton.onclick = () => {
            this.handleSendMessage();
        };
        
        // Add Enter key handler for input (Shift+Enter for new line)
        input.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        };
        
        // Create add file button
        const addFileButton = $('button');
        addFileButton.style.width = '28px';
        addFileButton.style.height = '28px';
        addFileButton.style.borderRadius = '50%';
        addFileButton.style.border = '1px solid var(--vscode-input-border)';
        addFileButton.style.backgroundColor = 'transparent';
        addFileButton.style.cursor = 'pointer';
        addFileButton.style.display = 'flex';
        addFileButton.style.alignItems = 'center';
        addFileButton.style.justifyContent = 'center';
        addFileButton.style.padding = '0';
        addFileButton.setAttribute('aria-label', 'Add file');
        
        // Create plus SVG icon
        const plusSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        plusSvg.setAttribute('width', '14');
        plusSvg.setAttribute('height', '14');
        plusSvg.setAttribute('viewBox', '0 0 16 16');
        plusSvg.setAttribute('fill', 'none');
        plusSvg.style.display = 'block';
        
        const plusPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        plusPath.setAttribute('d', 'M8 3V13M3 8H13');
        plusPath.setAttribute('stroke', 'var(--vscode-input-foreground)');
        plusPath.setAttribute('stroke-width', '2');
        plusPath.setAttribute('stroke-linecap', 'round');
        
        plusSvg.appendChild(plusPath);
        addFileButton.appendChild(plusSvg);
        
        // Add hover effect for file button
        addFileButton.onmouseenter = () => {
            addFileButton.style.backgroundColor = 'var(--vscode-list-hoverBackground)';
        };
        addFileButton.onmouseleave = () => {
            addFileButton.style.backgroundColor = 'transparent';
        };
        
        // Add click handler for file button
        addFileButton.onclick = () => {
            console.log('[AcuxCode] Add file button clicked');
            this.openFilePicker();
        };
        
        // Left side controls (model + add file)
        const leftControls = $('div');
        leftControls.style.display = 'flex';
        leftControls.style.gap = '8px';
        leftControls.style.alignItems = 'center';
        leftControls.appendChild(modelDropdownRoot);
        leftControls.appendChild(addFileButton);
        
        // Assemble the controls area
        controlsArea.appendChild(leftControls);
        controlsArea.appendChild(sendButton);
        
        // Assemble the input wrapper
        inputWrapper.appendChild(this.filesDisplayArea);
        inputWrapper.appendChild(input);
        inputWrapper.appendChild(controlsArea);
        inputContainer.appendChild(inputWrapper);
        
        this.container.appendChild(inputContainer);
        console.log('[AcuxCode] Input box added');
    }
    private tryBindWidget(): void {
        const widget = this.chatWidgetService.lastFocusedWidget;
        if (!widget) {
            return;
        }
        this._register(widget.attachmentModel.onDidChange(() => {
            this.syncFromWidget();
        }));
        this.syncFromWidget();
    }

    private syncFromWidget(): void {
        const widget = this.chatWidgetService.lastFocusedWidget;
        if (!widget) {
            return;
        }
        const fileUris = widget.attachmentModel.fileAttachments;
        this.attachedFiles = fileUris.map(uri => ({ name: basename(uri.path), uri }));
        this.updateFilesDisplay();
    }


    public getDomNode(): HTMLElement {
        console.log('[AcuxCode] getDomNode called, returning:', this.container);
        return this.container;
    }

    public focus(): void {
        console.log('[AcuxCode] focus called');
    }

    public getValue(): string {
        return this.inputElement?.value || '';
    }

    public setValue(value: string): void {
        console.log('[AcuxCode] setValue called with:', value);
        if (this.inputElement) {
            this.inputElement.value = value;
        }
    }
    
    private async openFilePicker(): Promise<void> {
        console.log('[AcuxCode] openFilePicker called');
        
        const isIQuickPickItemWithResource = (obj: unknown): obj is IQuickPickItemWithResource => {
            return !!obj && typeof obj === 'object' && 'resource' in obj && URI.isUri((obj as IQuickPickItemWithResource).resource);
        };

        const isIGotoSymbolQuickPickItem = (obj: unknown): obj is IGotoSymbolQuickPickItem => {
            return !!obj && typeof obj === 'object' && 'uri' in obj && 'range' in obj && !!(obj as IGotoSymbolQuickPickItem).uri && !!(obj as IGotoSymbolQuickPickItem).range;
        };

        const providerOptions: AnythingQuickAccessProviderRunOptions = {
            handleAccept: async (item: unknown, isBackground: boolean) => {
                console.log('[AcuxCode] handleAccept called with item:', item);
                try {
                    if (isIQuickPickItemWithResource(item) && item.resource) {
                        const uri = item.resource;
                        console.log('[AcuxCode] Adding file from IQuickPickItemWithResource:', uri.toString());
                        this.addFile(basename(uri.path), uri);
                        return true; // Return true to prevent default file opening behavior
                    } else if (isIGotoSymbolQuickPickItem(item) && item.uri) {
                        const uri = item.uri;
                        console.log('[AcuxCode] Adding file from IGotoSymbolQuickPickItem:', uri.toString());
                        this.addFile(basename(uri.path), uri);
                        return true; // Return true to prevent default file opening behavior
                    } else {
                        console.log('[AcuxCode] Item did not match expected types');
                    }
                } catch (error) {
                    console.error('[AcuxCode] Error in handleAccept:', error);
                }
                return false;
            }
        };

        console.log('[AcuxCode] Showing quick access picker');
        this.quickInputService.quickAccess.show('', {
            enabledProviderPrefixes: [
                AnythingQuickAccessProvider.PREFIX,
                SymbolsQuickAccessProvider.PREFIX,
                AbstractGotoSymbolQuickAccessProvider.PREFIX
            ],
            placeholder: 'Search files to attach',
            providerOptions
        });
    }
    
    private addFile(name: string, uri: URI): void {
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
    
    private removeFile(index: number): void {
        this.attachedFiles.splice(index, 1);
        this.updateFilesDisplay();
    }
    
    private handleSendMessage(): void {
        const message = this.inputElement.value.trim();
        
        if (!message && this.attachedFiles.length === 0) {
            console.log('[AcuxCode] No message or files to send');
            return;
        }
        
        console.log('[AcuxCode] ========== SENDING MESSAGE ==========');
        console.log('[AcuxCode] Message:', message);
        console.log('[AcuxCode] Model:', this.selectedModel);
        console.log('[AcuxCode] Attached files count:', this.attachedFiles.length);
        
        // Display user message
        if (message) {
            this.displayUserMessage(message);
        }
        
        if (this.attachedFiles.length > 0) {
            console.log('[AcuxCode] Attached files:');
            this.attachedFiles.forEach((file, index) => {
                console.log(`[AcuxCode]   ${index + 1}. ${file.name} (${file.uri.toString()})`);
            });
        }
        
        // Clear input and files after sending
        this.inputElement.value = '';
        const filesSnapshot = [...this.attachedFiles];
        this.attachedFiles = [];
        this.updateFilesDisplay();
        
        // Send API request
        this.sendAIRequest(message, filesSnapshot);
        
        console.log('[AcuxCode] Input cleared, ready for next message');
    }
    
    private async sendAIRequest(message: string, files: Array<{ name: string; uri: URI }>): Promise<void> {
        console.log('[AcuxCode] Sending AI request...');
        
        // Find the custom model configuration if it's a custom model
        const customModel = this.customModels.find(m => m.name === this.selectedModel);
        
        if (!customModel) {
            // TODO: Handle built-in models (will need backend API endpoint)
            console.log('[AcuxCode] Built-in model selected, backend integration needed');
            this.displayAIMessage('Built-in models require backend integration. Please add a custom model or configure the backend API.');
            return;
        }
        
        console.log('[AcuxCode] Using custom model:', customModel.name);
        console.log('[AcuxCode] Endpoint:', customModel.endpoint);
        console.log('[AcuxCode] Model ID:', customModel.modelIdentifier);
        
        try {
            // Prepare the request body (OpenAI-compatible format)
            const requestBody = {
                model: customModel.modelIdentifier,
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
            
            // Add API key if provided
            if (customModel.apiKey) {
                headers['Authorization'] = `Bearer ${customModel.apiKey}`;
            }
            
            console.log('[AcuxCode] Sending request to:', `${customModel.endpoint}/chat/completions`);
            
            // Make the API request
            const response = await fetch(`${customModel.endpoint}/chat/completions`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[AcuxCode] API request failed:', response.status, errorText);
                this.displayAIMessage(`Error: API request failed with status ${response.status}\n\n${errorText}`);
                return;
            }
            
            const data = await response.json();
            console.log('[AcuxCode] API response received:', data);
            
            // Extract the response message
            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                const aiMessage = data.choices[0].message.content;
                this.displayAIMessage(aiMessage);
            } else {
                console.error('[AcuxCode] Unexpected response format:', data);
                this.displayAIMessage('Error: Unexpected response format from API');
            }
            
        } catch (error) {
            console.error('[AcuxCode] API request error:', error);
            this.displayAIMessage(`Error: Failed to connect to API\n\n${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    private displayUserMessage(message: string): void {
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
        messageContent.textContent = message;
        
        messageBubble.appendChild(messageContent);
        this.messagesArea.appendChild(messageBubble);
        
        // Scroll to bottom
        this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
    }
    
    private displayAIMessage(message: string): void {
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
        messageContent.textContent = message;
        
        messageContainer.appendChild(messageContent);
        this.messagesArea.appendChild(messageContainer);
        
        // Scroll to bottom
        this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
    }
    
    private showAddModelPage(existingModel?: { type: string; name: string; endpoint: string; modelIdentifier: string; apiKey: string }): void {
        // Clear messages area and show add model configuration page
        while (this.messagesArea.firstChild) {
            this.messagesArea.removeChild(this.messagesArea.firstChild);
        }
        
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
        
        // Model Name
        const nameLabel = $('label');
        nameLabel.textContent = 'Model Name';
        nameLabel.style.display = 'block';
        nameLabel.style.fontSize = '13px';
        nameLabel.style.fontWeight = '600';
        nameLabel.style.marginBottom = '8px';
        nameLabel.style.color = 'var(--vscode-foreground)';
        pageContainer.appendChild(nameLabel);
        
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
        pageContainer.appendChild(nameInput);
        
        // API Endpoint
        const endpointLabel = $('label');
        endpointLabel.textContent = 'API Endpoint';
        endpointLabel.style.display = 'block';
        endpointLabel.style.fontSize = '13px';
        endpointLabel.style.fontWeight = '600';
        endpointLabel.style.marginBottom = '8px';
        endpointLabel.style.color = 'var(--vscode-foreground)';
        pageContainer.appendChild(endpointLabel);
        
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
        pageContainer.appendChild(endpointInput);
        
        // Model Identifier
        const identifierLabel = $('label');
        identifierLabel.textContent = 'Model Identifier';
        identifierLabel.style.display = 'block';
        identifierLabel.style.fontSize = '13px';
        identifierLabel.style.fontWeight = '600';
        identifierLabel.style.marginBottom = '8px';
        identifierLabel.style.color = 'var(--vscode-foreground)';
        pageContainer.appendChild(identifierLabel);
        
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
        pageContainer.appendChild(identifierInput);
        
        // API Key (optional)
        const keyLabel = $('label');
        keyLabel.textContent = 'API Key (optional)';
        keyLabel.style.display = 'block';
        keyLabel.style.fontSize = '13px';
        keyLabel.style.fontWeight = '600';
        keyLabel.style.marginBottom = '8px';
        keyLabel.style.color = 'var(--vscode-foreground)';
        pageContainer.appendChild(keyLabel);
        
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
        pageContainer.appendChild(keyInput);
        
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
        cancelButton.onclick = () => {
            // Clear the page and return to chat
            while (this.messagesArea.firstChild) {
                this.messagesArea.removeChild(this.messagesArea.firstChild);
            }
        };
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
            const modelData = {
                type: typeSelect.value,
                name: nameInput.value.trim(),
                endpoint: endpointInput.value.trim(),
                modelIdentifier: identifierInput.value.trim(),
                apiKey: keyInput.value.trim()
            };
            
            // Validate required fields based on provider type
            if (!modelData.name) {
                this.displayAIMessage('Please enter a Model Name.');
                return;
            }
            
            if (modelData.type === 'LM Studio') {
                // LM Studio: Require name and endpoint
                if (!modelData.endpoint) {
                    this.displayAIMessage('Please enter the LM Studio Server URL.');
                    return;
                }
                modelData.modelIdentifier = '';
                modelData.apiKey = '';
            } else if (modelData.type === 'Ollama') {
                // Ollama: Require name, endpoint, and model identifier
                if (!modelData.endpoint) {
                    this.displayAIMessage('Please enter the Ollama Server URL.');
                    return;
                }
                if (!modelData.modelIdentifier) {
                    this.displayAIMessage('Please enter the Model Name (e.g., llama3.1, mistral).');
                    return;
                }
                modelData.apiKey = '';
            } else {
                // OpenAI Compatible API: Require all fields
                if (!modelData.endpoint) {
                    this.displayAIMessage('Please enter the API Endpoint.');
                    return;
                }
                if (!modelData.modelIdentifier) {
                    this.displayAIMessage('Please enter the Model Identifier.');
                    return;
                }
                if (!modelData.apiKey) {
                    this.displayAIMessage('Please enter the API Key.');
                    return;
                }
            }
            
            if (isEditing && existingModel) {
                // Update existing model
                const index = this.customModels.findIndex(m => 
                    m.name === existingModel.name && 
                    m.endpoint === existingModel.endpoint
                );
                if (index !== -1) {
                    this.customModels[index] = modelData;
                    console.log('[AcuxCode] Custom model updated:', modelData);
                }
            } else {
                // Add new model
                this.customModels.push(modelData);
                console.log('[AcuxCode] Custom model added:', modelData);
            }
            
            // Persist to storage
            const PERSIST_SCOPE = StorageScope.PROFILE;
            this.storageService.store(this.storageKeyCustomModels, JSON.stringify(this.customModels), PERSIST_SCOPE, StorageTarget.USER);
            
            console.log('[AcuxCode] Total custom models:', this.customModels.length);
            
            // Clear the add model page and return to fresh chat
            while (this.messagesArea.firstChild) {
                this.messagesArea.removeChild(this.messagesArea.firstChild);
            }
        };
        buttonsContainer.appendChild(saveButton);
        
        pageContainer.appendChild(buttonsContainer);
        this.messagesArea.appendChild(pageContainer);
    }
    
    private updateFilesDisplay(): void {
        console.log('[AcuxCode] updateFilesDisplay called, files:', this.attachedFiles.length);
        console.log('[AcuxCode] filesDisplayArea element:', this.filesDisplayArea);
        
        // Clear existing content using DOM methods (not innerHTML for security)
        while (this.filesDisplayArea.firstChild) {
            this.filesDisplayArea.removeChild(this.filesDisplayArea.firstChild);
        }
        
        if (this.attachedFiles.length === 0) {
            console.log('[AcuxCode] No files, hiding display area');
            this.filesDisplayArea.style.display = 'none';
            return;
        }
        
        console.log('[AcuxCode] Showing files display area');
        this.filesDisplayArea.style.display = 'flex';
        
        this.attachedFiles.forEach((file, index) => {
            const fileChip = dom.$('div');
            fileChip.classList.add('chat-attached-context-pill');
            fileChip.style.display = 'flex';
            fileChip.style.alignItems = 'center';
            fileChip.style.gap = '4px';
            fileChip.style.padding = '2px 6px';
            fileChip.style.backgroundColor = 'transparent';
            fileChip.style.color = 'var(--vscode-foreground)';
            fileChip.style.border = '1px solid var(--vscode-input-border)';
            fileChip.style.borderRadius = '10px';
            fileChip.style.fontSize = '11px';
            fileChip.style.maxWidth = '180px';
            fileChip.classList.add('show-file-icons');

            // Use ResourceLabel for proper file icons
            const labelContainer = dom.$('span');
            labelContainer.style.display = 'flex';
            labelContainer.style.alignItems = 'center';
            labelContainer.style.flex = '1';
            labelContainer.style.minWidth = '0';
            
            const resourceLabel = this.resourceLabels.create(labelContainer, { supportIcons: true });
            resourceLabel.setFile(file.uri, { fileKind: 0 /* FileKind.FILE */ });

            // Remove button
            const removeBtn = dom.$('button');
            removeBtn.textContent = '×';
            removeBtn.style.border = 'none';
            removeBtn.style.background = 'none';
            removeBtn.style.color = 'inherit';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.padding = '0';
            removeBtn.style.fontSize = '14px';
            removeBtn.style.lineHeight = '1';
            removeBtn.style.width = '14px';
            removeBtn.style.height = '14px';
            removeBtn.style.display = 'flex';
            removeBtn.style.alignItems = 'center';
            removeBtn.style.justifyContent = 'center';
            removeBtn.onclick = () => this.removeFile(index);

            fileChip.appendChild(labelContainer);
            fileChip.appendChild(removeBtn);
            this.filesDisplayArea.appendChild(fileChip);
        });
    }
    
}
