import * as vscode from "vscode";
import {
  CodeAction,
  CodeActionKind,
  commands,
  Selection,
  TextEditor,
  TextEditorEdit,
  workspace,
} from "vscode";
import findImports from "./findImports";
import CompletionOrigin from "./CompletionOrigin";
import { DELAY_FOR_CODE_ACTION_PROVIDER } from "./consts";
import { ResultEntry } from "./binary/requests/requests";
import setState, {
  SelectionStateRequest,
  SetStateSuggestion,
} from "./binary/requests/setState";
import { CompletionArguments } from "./provideCompletionItems";

export const COMPLETION_IMPORTS = "tabnine-completion-imports";

export async function selectionHandler(
  editor: TextEditor,
  edit: TextEditorEdit,
  { currentCompletion, completions, position }: CompletionArguments
) {
  try {
    const eventData = eventDataOf(
      completions,
      currentCompletion,
      editor,
      position
    );
    setState(eventData);

    handleImports(editor, currentCompletion);
  } catch (error) {
    console.error(error);
  }
}

function eventDataOf(
  completions: ResultEntry[],
  currentCompletion: string,
  editor: TextEditor,
  position: vscode.Position
) {
  const index = completions.findIndex(
    ({ new_prefix }) => new_prefix == currentCompletion
  );

  let numOfVanillaSuggestions = 0;
  let numOfDeepLocalSuggestions = 0;
  let numOfDeepCloudSuggestions = 0;
  let numOfLspSuggestions = 0;
  const currInCompletions = completions[index];

  const suggestions: SetStateSuggestion[] = completions.map((c) => {
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
      origin: c.origin!,
    };
  });

  const { length } = currentCompletion;
  const netLength = editor.selection.anchor.character - position.character;
  const strength = resolveDetailOf(currInCompletions);
  const { origin } = currInCompletions;
  const prefixLength = editor.document
    .getText(new vscode.Range(new vscode.Position(position.line, 0), position))
    .trimLeft().length;
  const netPrefixLength = prefixLength - (currentCompletion.length - netLength);
  const language = editor.document.fileName.split(".").pop();
  const suffixLength =
    editor.document.lineAt(position).text.trim().length -
    (prefixLength + netLength);
  const numOfSuggestions = completions.length;

  const eventData: SelectionStateRequest = {
    Selection: {
      language: language!,
      length,
      net_length: netLength,
      strength,
      origin: origin!,
      index,
      line_prefix_length: prefixLength,
      line_net_prefix_length: netPrefixLength,
      line_suffix_length: suffixLength,
      num_of_suggestions: numOfSuggestions,
      num_of_vanilla_suggestions: numOfVanillaSuggestions,
      num_of_deep_local_suggestions: numOfDeepLocalSuggestions,
      num_of_deep_cloud_suggestions: numOfDeepCloudSuggestions,
      num_of_lsp_suggestions: numOfLspSuggestions,
      suggestions,
    },
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
  const { selection } = editor;
  const completionSelection = new Selection(
    selection.active.translate(0, -completion.length),
    selection.active
  );
  setTimeout(async () => {
    try {
      const codeActionCommands = await commands.executeCommand<CodeAction[]>(
        "vscode.executeCodeActionProvider",
        editor.document.uri,
        completionSelection,
        CodeActionKind.QuickFix
      );
      const importCommand = findImports(codeActionCommands!)[0];

      if (importCommand && importCommand.edit) {
        await workspace.applyEdit(importCommand.edit!);
        await commands.executeCommand(COMPLETION_IMPORTS, { completion });
      }
    } catch (error) {
      console.error(error);
    }
  }, DELAY_FOR_CODE_ACTION_PROVIDER);
}
