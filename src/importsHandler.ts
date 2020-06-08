import { Selection, commands, CodeAction, workspace, TextEditor, CodeActionKind } from 'vscode';

const importStatement = /Import ([\S]*) from module [\S]*/;
const existingImportStatement = /Add ([\S]*) to existing import declaration from [\S]*/;
const importDefaultStatement = /Import default ([\S]*) from module [\S]*/;
const existingDefaultImportStatement = /Add default import ([\S]*) to existing import declaration from [\S]*/;
const importStatements = [importStatement, existingImportStatement,importDefaultStatement, existingDefaultImportStatement];
const DELAY_FOR_CODE_ACTION_PROVIDER = 400;
export const COMPLETION_IMPORTS = 'tabnine-completion-imports';

export async function importsHandler(editor: TextEditor, edit, { completion }) {
    try {
        let selection = editor.selection;
        let completionSelection = new Selection(selection.active.translate(0, -completion.length), selection.active);
        setTimeout(async () => {
            try {
                let codeActionCommands = await commands.executeCommand<CodeAction[]>('vscode.executeCodeActionProvider', editor.document.uri, completionSelection, CodeActionKind.QuickFix);
                let importCommands = findImportCommands(codeActionCommands);
                let distinctImports = filterSameImportFromDifferentModules(importCommands);
                if (distinctImports.length) {
                    let [firstCommand] = distinctImports;
                    await workspace.applyEdit(firstCommand.edit);
                    await commands.executeCommand(COMPLETION_IMPORTS, { completion });
                }
            } catch (error) {
                console.error(error);
            }
        }, DELAY_FOR_CODE_ACTION_PROVIDER);
    } catch (error) {
        console.error(error);
    }
}
function findImportCommands(codeActionCommands: CodeAction[]): CodeAction[] {
    return codeActionCommands.filter(({ title }) => importStatements.some(statement => statement.test(title)));
}

/*
 filter imports with same name from different modules
 for example if there are multiple modules with same exported name: 
 Import {foo} from './a' and Import {foo} from './b'
 in this case we will ignore and not auto import it
*/
function filterSameImportFromDifferentModules(importCommands: CodeAction[]): CodeAction[] {
    let importNames = importCommands.map(getImportName);
    return importCommands.filter(command => importNames.filter(name => name == getImportName(command)).length <= 1);
}

function getImportName({ title }) {
    let statement = importStatements.map(statement => title.match(statement)).find(Boolean);
    return statement[1];
}
