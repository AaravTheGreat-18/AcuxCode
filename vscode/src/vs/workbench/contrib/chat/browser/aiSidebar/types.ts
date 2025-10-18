/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from '../../../../../base/common/uri.js';

export interface CustomModel {
	type: string;
	name: string;
	endpoint: string;
	modelIdentifier: string;
	apiKey: string;
}

export interface ModelInfo {
	name: string;
	provider: string;
}

export interface AttachedFile {
	name: string;
	uri: URI;
}
