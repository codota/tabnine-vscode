import * as vscode from "vscode";
import { AutocompleteResult, ResultEntry } from "./binary/requests/requests";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import { completionIsAllowed } from "./provideCompletionItems";
import runCompletion from "./runCompletion";
import { getShouldComplete } from "./inlineSuggestions/documentChangesTracker";
import getAutoImportCommand from "./getAutoImportCommand";
import {
  clearCurrentLookAheadSuggestion,
  getLookAheadSuggestion,
} from "./lookAheadSuggestion";
import { handleFirstSuggestionDecoration } from "./firstSuggestionDecoration";
import { SuggestionTrigger } from "./globals/consts";
import { isMultiline } from "./utils/utils";

const INLINE_REQUEST_TIMEOUT = 3000;
const END_OF_LINE_VALID_REGEX = new RegExp("^\\s*[)}\\]\"'`]*\\s*[:{;,]?\\s*$");

export default async function provideInlineCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  context: vscode.InlineCompletionContext
): Promise<vscode.InlineCompletionList<TabnineInlineCompletionItem>> {
  try {
    clearCurrentLookAheadSuggestion();
    if (
      !completionIsAllowed(document, position) ||
      !isValidMidlinePosition(document, position) ||
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
        getAutoImportCommand(
          result,
          response,
          position,
          SuggestionTrigger.DocumentChanged
        ),
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
    isMultiline(result.old_suffix)
      ? position
      : position.translate(0, result.old_suffix.length)
  );
}

function isValidMidlinePosition(
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  const lineSuffix = document.getText(
    new vscode.Range(position, document.lineAt(position.line).range.end)
  );
  return END_OF_LINE_VALID_REGEX.test(lineSuffix);
}
