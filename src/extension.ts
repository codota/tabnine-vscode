/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';


import * as vscode from 'vscode';
import * as tsExtension from './typescript-language-features/extension';
import { getCompletionList, tabNineClient } from './tab-nine';

function registerTypescriptCompletion(context) {
	tsExtension.activate(context);
}

export function activate(context: vscode.ExtensionContext) {

	this.triggers = [
		' ',
		'.',
		'(',
		')',
		'{',
		'}',
		'[',
		']',
		',',
		':',
		'\'',
		'"',
		'=',
		'<',
		'>',
		'/',
		'\\',
		'+',
		'-',
		'|',
		'&',
		'*',
		'%',
		'=',
		'$',
		'#',
		'@',
		'!',
	];

	registerTypescriptCompletion(context);

	vscode.languages.registerCompletionItemProvider({ pattern: '**' }, new GenericTabNineCompletionItemProvider(), ...this.triggers);
}

class GenericTabNineCompletionItemProvider implements vscode.CompletionItemProvider {

	constructor() {
	}

	async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionList | null> {
		if (document.languageId !== 'typescript') {
			try {
				let completionList = await getCompletionList(tabNineClient, document, position);
				return new vscode.CompletionList(completionList, true);
			} catch (e) {
				console.log(`Error setting up request: ${e}`);
			}
		} 
	}
}
