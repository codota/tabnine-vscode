import * as vscode from 'vscode';

import { ImportDb, ImportObject } from './import-db';

import { PathHelper } from './helpers/path-helper';

export interface Context {
    document: vscode.TextDocument;
    range: vscode.Range;
    context: vscode.CodeActionContext;
    token: vscode.CancellationToken;
    imports?: Array<ImportObject>
}

export class ImportAction implements vscode.CodeActionProvider {

    public provideCodeActions(document: vscode.TextDocument, range: vscode.Range,
        context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.Command[] {

        let actionContext = this.createContext(document, range, context, token);

        if (this.canHandleAction(actionContext)) {
            return this.actionHandler(actionContext);
        }
    }

    private canHandleAction(context: Context): boolean {
        let diagnostic: vscode.Diagnostic = context.context.diagnostics[0];

        if (!diagnostic) {
            return false;
        }

        if (diagnostic.message.includes('is not defined')) {
            let imp = diagnostic.message.match(/'(.+)'/g)[0].replace(/'/g, '');
            try {

                let found = ImportDb.getImport(imp);

                if (found) {
                    context.imports = found;
                    return true
                }

            } catch (exception) {
                return false;
            }
        } else {
        }

        if (
            diagnostic.message.startsWith('JavaScript/TypeScript cant find name') ||
            diagnostic.message.startsWith('Cant find name')
        ) {
            console.log('diagnositc message2')
            let imp = diagnostic.message.replace('JavaScript/TypeScript cant find name', '')
                .replace('Cannot find name', '')
                .replace(/{|}|from|import|'|"| |\.|;/gi, '')

            try {

                let found = ImportDb.getImport(imp);

                if (found) {
                    context.imports = found;
                    return true
                }

            } catch (exception) {
                return false;
            }
        }

        return false;
    }

    private actionHandler(context: Context): vscode.Command[] {
        let handlers = [];
        context.imports.forEach(imp => {
            handlers.push({
                title: `Import ${imp.name} from ${imp.getPath(context.document)}`,
                command: 'extension.fixImportT9',
                arguments: [context.document, context.range, context.context, context.token, context.imports]
            });
        });

        return handlers;
    }

    private createContext(document: vscode.TextDocument, range: vscode.Range,
        context: vscode.CodeActionContext, token: vscode.CancellationToken): Context {
        return {
            document, range, context, token
        }
    }
}
