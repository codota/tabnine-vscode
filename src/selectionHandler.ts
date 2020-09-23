import { Selection, commands, CodeAction, workspace, TextEditor, CodeActionKind, Range } from 'vscode';
import { tabNineProcess } from './TabNine';
import * as vscode from 'vscode';
import { CompletionOrigin } from './extension';
const importStatement = /Import ([\S]*) from module [\S]*/;
const existingImportStatement = /Add ([\S]*) to existing import declaration from [\S]*/;
const importDefaultStatement = /Import default ([\S]*) from module [\S]*/;
const existingDefaultImportStatement = /Add default import ([\S]*) to existing import declaration from [\S]*/;
const importStatements = [importStatement, existingImportStatement,importDefaultStatement, existingDefaultImportStatement];
const DELAY_FOR_CODE_ACTION_PROVIDER = 800;
import { EOL } from 'os'
export const COMPLETION_IMPORTS = 'tabnine-completion-imports';

export async function selectionHandler(editor: TextEditor, edit, {currentCompletion, completions, position }) {
    try {
        const eventData = eventDataOf(completions, currentCompletion, editor, position);
        tabNineProcess.setState(eventData);

        handleImports(editor, currentCompletion);
    } catch (error) {
        console.error(error);
    }
}

function eventDataOf(completions: any, currentCompletion: any, editor: TextEditor, position: any) {
    let index = completions.findIndex(({new_prefix}) => new_prefix == currentCompletion);

    let numOfVanillaSuggestions = 0;
    let numOfDeepLocalSuggestions = 0;
    let numOfDeepCloudSuggestions = 0;
    let numOfLspSuggestions = 0;
    let currInCompletions = completions[index];

    let suggestions = completions.map(c => {
        if (c.origin == CompletionOrigin.VANILLA) {
            numOfVanillaSuggestions += 1;
        } else if (c.origin == CompletionOrigin.LOCAL) {
            numOfDeepLocalSuggestions += 1;
        } else if (c.origin == CompletionOrigin.CLOUD) {
            numOfDeepCloudSuggestions += 1;
        } else if (c.origin == CompletionOrigin.LSP) {
            numOfLspSuggestions += 1;
        }

        return { 
            length: c.new_prefix.length, 
            strength: resolveDetailOf(c),
            origin: c.origin
        };
    });

    const length = currentCompletion.length;
    const netLength = editor.document.getText(new vscode.Range(position, editor.selection.anchor))
    .replace('(\r\n|\r|\n)\s+', '').length;
    const strength = resolveDetailOf(currInCompletions);
    const origin = currInCompletions.origin;
    const prefixLength = editor.document.getText(new vscode.Range(new vscode.Position(position.line, 0), position)).trimLeft().length;
    const netPrefixLength = prefixLength - (currentCompletion.length - netLength);
    const language = editor.document.fileName.split('.').pop();
    const suffixLength = editor.document.getText(
        new vscode.Range(editor.selection.anchor, new vscode.Position(
            editor.selection.anchor.line, 
            editor.document.lineAt(editor.selection.anchor).text.length))
        ).trimLeft().length;
    const numOfSuggestions = completions.length;

    const eventData = {
        "Selection": {
            language: language,
            length: length,
            net_length: netLength,
            strength: strength,
            origin: origin,
            index: index,
            line_prefix_length: prefixLength,
            line_net_prefix_length: netPrefixLength,
            line_suffix_length: suffixLength,
            num_of_suggestions: numOfSuggestions,
            num_of_vanilla_suggestions: numOfVanillaSuggestions,
            num_of_deep_local_suggestions: numOfDeepLocalSuggestions,
            num_of_deep_cloud_suggestions: numOfDeepCloudSuggestions,
            num_of_lsp_suggestions: numOfLspSuggestions,
            suggestions: suggestions
        }
    };
    
    return eventData;
}

function resolveDetailOf(completion: any): string {
    if (completion.origin == CompletionOrigin.LSP) {
        return "";
    }

    return completion.detail;
}

async function handleImports(editor: TextEditor, completion: any) {
    let selection = editor.selection;
    let lineDelta = 0;
    let characterDelta = -completion.length;

    if (completion.indexOf(EOL) > 0) {
        lineDelta = -1;
        characterDelta = editor.document.lineAt(new vscode.Position(selection.active.line - 1, 0))
            .text.length - completion.length + 1;   
    }
    
    let completionSelection = new Selection(selection.active.translate(lineDelta, characterDelta), selection.active);
    
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
        }
        catch (error) {
            console.error(error);
        }
    }, DELAY_FOR_CODE_ACTION_PROVIDER);
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
