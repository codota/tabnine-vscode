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
import { calcDebounceTime, updateLastCompletionRequestTime } from "./inlineCompletionDebouncer";

const INLINE_REQUEST_TIMEOUT = 3000;
const END_OF_LINE_VALID_REGEX = new RegExp("^\\s*[)}\\]\"'`]*\\s*[:{;,]?\\s*$");
let lastCompletionRenderTask: NodeJS.Timeout;

export default async function provideInlineCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  context: vscode.InlineCompletionContext
): Promise<vscode.InlineCompletionList<TabnineInlineCompletionItem>> {
  return new Promise(async resolve => {
    try {
      clearTimeout(lastCompletionRenderTask);
      clearCurrentLookAheadSuggestion();
      if (
        !completionIsAllowed(document, position) ||
        !isValidMidlinePosition(document, position) ||
        !getShouldComplete()
      ) {
        resolve(new vscode.InlineCompletionList([]));
        return;
      }
  
      const completionInfo = context.selectedCompletionInfo;
      if (completionInfo) {
        resolve(await getLookAheadSuggestion(document, completionInfo, position));
        return;
      }
      updateLastCompletionRequestTime();
      const completions = await getInlineCompletionItems(document, position);

      lastCompletionRenderTask = setTimeout(
        async () => {
          await handleFirstSuggestionDecoration(position, completions);
          resolve(completions);
          return;
        }
      , calcDebounceTime());
    } catch (e) {
      console.error(`Error setting up request: ${e}`);
  
      resolve(new vscode.InlineCompletionList([]));
      return;
    }
  });
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

function isValidMidlinePosition(
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  const lineSuffix = document.getText(
    new vscode.Range(position, document.lineAt(position.line).range.end)
  );
  return END_OF_LINE_VALID_REGEX.test(lineSuffix);
}
