/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';


//TODO URI remove console
//TODO URI  Todo check if auto import doesn’t happen in console log or like that
//TODO URI Todo check with non js/ts language and use language pattern Not js/ta... GlobPattern
import * as vscode from 'vscode';
import * as tsExtension from './typescript-language-features/extension';
import { getCompletionList, tabNineClient } from './tab-nine';

function registerTypescriptCompletion(context) {
	tsExtension.activate(context);
}

export function activate(context: vscode.ExtensionContext) {

	//TODO URI make sure /out is built good
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

	//vscode.languages.registerCompletionItemProvider({ pattern: '**' }, new GenericTabNineCompletionItemProvider(), ...this.triggers); TODO URI
	vscode.languages.registerCompletionItemProvider('javascript', new GenericTabNineCompletionItemProvider(), ...this.triggers);
}

class GenericTabNineCompletionItemProvider implements vscode.CompletionItemProvider {

	constructor() {
	}
	
	async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionList | null>  {
		try {
			let completionList = await getCompletionList(tabNineClient, document, position);
			return new vscode.CompletionList(completionList, true);
		} catch (e) {
			console.log(`Error setting up request: ${e}`);
		}
	}

}
