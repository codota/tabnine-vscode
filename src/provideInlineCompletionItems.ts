import * as vscode from "vscode";
import { AutocompleteResult, ResultEntry } from "./binary/requests/requests";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import { completionIsAllowed } from "./provideCompletionItems";
import runCompletion from "./runCompletion";
import { getShouldComplete } from "./inlineSuggestions/stateTracker";
import getAutoImportCommand from "./getAutoImportCommand";
import {
  clearCurrentLookAheadSuggestion,
  getLookAheadSuggestion,
} from "./lookAheadSuggestion";
import { handleFirstSuggestionDecoration } from "./firstSuggestionDecoration";

const INLINE_REQUEST_TIMEOUT = 3000;

export default async function provideInlineCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  context: vscode.InlineCompletionContext
): Promise<vscode.InlineCompletionList<TabnineInlineCompletionItem>> {
  try {
    clearCurrentLookAheadSuggestion();
    if (
      !completionIsAllowed(document, position) ||
      isInTheMiddleOfWord(document, position) ||
      !getShouldComplete()
    ) {
      return new vscode.InlineCompletionList([]);
    }

    const completionInfo = context.selectedCompletionInfo;
    if (completionInfo) {
      return await getLookAheadSuggestion(document, completionInfo, position);
    }
    const completions = await getInlineCompletionItems(document, position);
    await handleFirstSuggestionDecoration(position, completions);
    return completions;
  } catch (e) {
    console.error(`Error setting up request: ${e}`);

    return new vscode.InlineCompletionList([]);
  }
}

async function getInlineCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const isEmptyLine = document.lineAt(position.line).text.trim().length === 0;

  const response = await runCompletion(
    document,
    position,
    isEmptyLine ? INLINE_REQUEST_TIMEOUT : undefined
  );

  const completions = response?.results.map(
    (result) =>
      new TabnineInlineCompletionItem(
        result.new_prefix,
        calculateRange(position, response, result),
        getAutoImportCommand(result, response, position),
        result.completion_kind,
        result.is_cached,
        response.snippet_context
      )
  );

  return new vscode.InlineCompletionList(completions || []);
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

function isInTheMiddleOfWord(
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  const nextCharacter = document.getText(
    new vscode.Range(position, position.translate(0, 1))
  );
  return !isClosingCharacter(nextCharacter) && !!nextCharacter.trim();
}

function isClosingCharacter(nextCharacter: string) {
  const closingCharacters = ['"', "'", "`", "]", ")", "}", ">"];
  return closingCharacters.includes(nextCharacter);
}
