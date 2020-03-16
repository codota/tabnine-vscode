import * as vscode from 'vscode'
import * as path from 'path';

import { ImportObject } from './import-db';

export class ImportFixer {

    private spacesBetweenBraces;
    private doubleQuotes;
    private semicolon;

    constructor() {
        let config = vscode.workspace.getConfiguration('autoimport');

        this.spacesBetweenBraces = config.get<boolean>('spaceBetweenBraces');
        this.doubleQuotes = config.get<boolean>('doubleQuotes');
        this.semicolon = config.get<boolean>('semicolon');
    }

    public fix(document: vscode.TextDocument, range: vscode.Range,
        context: vscode.CodeActionContext, token: vscode.CancellationToken, imports: Array<ImportObject>): void {

        let edit = this.getTextEdit(document, imports);

        vscode.workspace.applyEdit(edit);

    }

    public getTextEdit(document: vscode.TextDocument, imports: Array<ImportObject>) {
        const edit: vscode.WorkspaceEdit = new vscode.WorkspaceEdit();
        imports.forEach(importObject => {
            const importObj: ImportObject = importObject;
            const path = importObj.getPath(document);
    
            if (this.alreadyResolved(document, path, importObj.name)) {
                return edit;
            }
    
            if (this.shouldMergeImport(document, path)) {
                edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0),
                    this.mergeImports(document, edit, importObj.name, importObj.file, path));
            } else if (/^\/(\/\*) *@flow/.test(document.getText())) {
                edit.insert(document.uri, new vscode.Position(1, 0),
                    this.createImportStatement(importObject.name, path, true, importObject.isDefault));
            } else {
                let insertPosition: vscode.Position = document.positionAt(document.getText().lastIndexOf('import')).translate(1, 0);
                edit.insert(document.uri, insertPosition,
                    this.createImportStatement(importObject.name, path, true, importObject.isDefault));
            }
    
        })

        return edit;
    }

    private alreadyResolved(document: vscode.TextDocument, path, importName) {

        let exp = new RegExp('(?:import\ \{)(?:.*)(?:\}\ from\ \')(?:' + path + ')(?:\'\;)')

        let currentDoc = document.getText();

        let foundImport = currentDoc.match(exp)

        if (foundImport && foundImport.length > 0 && foundImport[0].indexOf(importName) > -1) {
            return true;
        }

        return false;
    }

    private shouldMergeImport(document: vscode.TextDocument, path): boolean {
        let currentDoc = document.getText();

        let isCommentLine = (text: string): boolean => {
            let firstTwoLetters = text.trim().substr(0, 2);
            return firstTwoLetters === '//' || firstTwoLetters === '/*';
        }

        return currentDoc.indexOf(path) !== -1 && !isCommentLine(currentDoc);
    }

    private mergeImports(document: vscode.TextDocument, edit: vscode.WorkspaceEdit, name, file, path: string) {

        let exp = new RegExp('(?:import\ \{)(?:.*)(?:\}\ from\ \')(?:' + path + ')(?:\'\;)')

        let currentDoc = document.getText();

        let foundImport = currentDoc.match(exp)

        if (foundImport) {
            let workingString = foundImport[0];

            workingString = workingString
                .replace(/{|}|from|import|'|"| |;/gi, '').replace(path, '');

            let importArray = workingString.split(',');

            importArray.push(name)

            let newImport = this.createImportStatement(importArray.join(', '), path);

            currentDoc = currentDoc.replace(exp, newImport);
        }

        return currentDoc;
    }

    private createImportStatement(imp: string, path: string, endline: boolean = false, isDefault: boolean = false): string {
        let formattedPath = path.replace(/\"/g, '').replace(/\'/g, '');
        const quoteSymbol = this.doubleQuotes ? `"` : `'`;
        const importStr = [
            'import ',
            isDefault ? '' : this.spacesBetweenBraces ? '{ ' : '{',
            imp,
            isDefault ? '' : this.spacesBetweenBraces ? ' }' : '}',
            ' from ',
            quoteSymbol + formattedPath + quoteSymbol,
            this.semicolon ? ';' : '',
            endline ? '\r\n' : '',
        ].join('');
        return importStr;
    }

    private getRelativePath(document, importObj: vscode.Uri | any): string {
        return importObj.discovered ? importObj.fsPath :
            path.relative(path.dirname(document.fileName), importObj.fsPath);
    }

    private normaliseRelativePath(importObj, relativePath: string): string {

        let removeFileExtenion = (rp: string) => {
            if (rp) {
                rp = rp.substring(0, rp.lastIndexOf('.'))
            }
            return rp;
        }

        let makeRelativePath = (rp) => {

            let preAppend = './';

            if (!rp.startsWith(preAppend) && !rp.startsWith('../')) {
                rp = preAppend + rp;
            }

            if (/^win/.test(process.platform)) {
                rp = rp.replace(/\\/g, '/');
            }

            return rp;
        }

        if (importObj.discovered === undefined) {
            relativePath = makeRelativePath(relativePath);
            relativePath = removeFileExtenion(relativePath);
        }

        return relativePath;
    }
}
