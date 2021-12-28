import * as vscode from "vscode";
import { AutocompleteResult, ResultEntry } from "./binary/requests/requests";
import { completionIsAllowed } from "./provideCompletionItems";
import runCompletion from "./runCompletion";
import { COMPLETION_IMPORTS } from "./selectionHandler";

const INLINE_REQUEST_TIMEOUT = 3000;

export default async function provideInlineCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  context: vscode.InlineCompletionContext,
): Promise<vscode.InlineCompletionList> {
  try {
    if (!completionIsAllowed(document, position) || context.triggerKind === vscode.InlineCompletionTriggerKind.Explicit) {
      return new vscode.InlineCompletionList([]);
    }

    const isEmptyLine = document.lineAt(position.line).text.trim().length === 0;

    const response = await runCompletion(
      document,
      position,
      isEmptyLine ? INLINE_REQUEST_TIMEOUT : undefined
    );
    console.log("context:", JSON.stringify(context));

    const completions = response?.results.map(
      (result) =>
        new vscode.InlineCompletionItem(
          result.new_prefix,
          calculateRange(position, response, result),
          getAutoImportCommand(result, response, position)
        )
    );

    return new vscode.InlineCompletionList(completions || []);
  } catch (e) {
    console.error(`Error setting up request: ${e}`);

    return new vscode.InlineCompletionList([]);
  }
}

function getAutoImportCommand(
  result: ResultEntry,
  response: AutocompleteResult,
  position: vscode.Position
): vscode.Command {
  return {
    arguments: [
      {
        currentCompletion: result.new_prefix,
        completions: response.results,
        position,
        limited: response?.is_locked,
      },
    ],
    command: COMPLETION_IMPORTS,
    title: "accept completion",
  };
}

function calculateRange(
  position: vscode.Position,
  response: AutocompleteResult,
  result: ResultEntry
): vscode.Range {
  return new vscode.Range(
    position.translate(0, -response.old_prefix.length),
    position.translate(0, result.old_suffix.length)
  );
}
