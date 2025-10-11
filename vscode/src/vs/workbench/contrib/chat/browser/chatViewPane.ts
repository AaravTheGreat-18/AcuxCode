/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from '../../../../base/common/uri.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { IContextKeyService } from '../../../../platform/contextkey/common/contextkey.js';
import { IContextMenuService } from '../../../../platform/contextview/browser/contextView.js';
import { IHoverService } from '../../../../platform/hover/browser/hover.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { IOpenerService } from '../../../../platform/opener/common/opener.js';
import { IThemeService } from '../../../../platform/theme/common/themeService.js';
import { IViewPaneOptions, ViewPane } from '../../../browser/parts/views/viewPane.js';
import { IViewDescriptorService } from '../../../common/views.js';
import { IChatViewState } from './chatWidget.js';
import { IViewWelcomeDelegate } from './viewsWelcome/chatViewWelcomeController.js';
import { AISidebarView } from './aiSidebarView.js';

export const CHAT_SIDEBAR_OLD_VIEW_PANEL_ID = 'workbench.panel.chatSidebar';
export const CHAT_SIDEBAR_PANEL_ID = 'workbench.panel.chat';
export class ChatViewPane extends ViewPane implements IViewWelcomeDelegate {
	// AcuxCode AI Sidebar
	private _aiSidebarView: AISidebarView | undefined;
	get widget(): any { return this._aiSidebarView; }

	constructor(
		options: IViewPaneOptions,
		@IKeybindingService keybindingService: IKeybindingService,
		@IContextMenuService contextMenuService: IContextMenuService,
		@IConfigurationService configurationService: IConfigurationService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService,
		@IInstantiationService instantiationService: IInstantiationService,
		@IOpenerService openerService: IOpenerService,
		@IThemeService themeService: IThemeService,
		@IHoverService hoverService: IHoverService,
	) {
		super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, hoverService);
	}

	override getActionsContext(): any {
		return undefined;
	}

	override shouldShowWelcome(): boolean {
		// Always show loading state
		return false;
	}

	protected override async renderBody(parent: HTMLElement): Promise<void> {
		console.log('[AcuxCode] ChatViewPane renderBody called');
		console.log('[AcuxCode] Parent element:', parent);
		
		// DO NOT call super.renderBody() - it creates ViewWelcomeController which shows "drag view here"
		// Instead, directly render our sidebar
		
		// Create and render the AI sidebar view
		this._aiSidebarView = this._register(new AISidebarView());
		const domNode = this._aiSidebarView.getDomNode();
		console.log('[AcuxCode] AI Sidebar DOM node created:', domNode);
		console.log('[AcuxCode] DOM node has', domNode.children.length, 'children');
		
		parent.appendChild(domNode);
		console.log('[AcuxCode] AI Sidebar appended to parent');
		console.log('[AcuxCode] Parent now has', parent.children.length, 'children');
	}

	acceptInput(query?: string): void {
		// Stub - widget removed
	}

	async loadSession(sessionId: string | URI, viewState?: IChatViewState): Promise<void> {
		// Stub - widget removed
	}

	focusInput(): void {
		this._aiSidebarView?.focus();
	}

	override focus(): void {
		super.focus();
		this._aiSidebarView?.focus();
	}

	protected override layoutBody(height: number, width: number): void {
		super.layoutBody(height, width);
		// Stub - widget removed
	}

	override saveState(): void {
		// Stub - widget removed
		super.saveState();
	}
}
