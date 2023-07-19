import * as vscode from "vscode";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import { completionIsAllowed } from "./provideCompletionItems";
import { getShouldComplete } from "./inlineSuggestions/documentChangesTracker";
import {
  clearCurrentLookAheadSuggestion,
  getLookAheadSuggestion,
} from "./lookAheadSuggestion";
import debounceCompletions from "./debounceCompletions";
import reportSuggestionShown from "./reportSuggestionShown";
import { shouldBlockCompletions } from "./registration/forceRegistration";
import { Logger } from "./utils/logger";

const END_OF_LINE_VALID_REGEX = new RegExp("^\\s*[)}\\]\"'`]*\\s*[:{;,]?\\s*$");

export default async function provideInlineCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  context: vscode.InlineCompletionContext,
  token: vscode.CancellationToken
): Promise<
  vscode.InlineCompletionList<TabnineInlineCompletionItem> | undefined
> {
  try {
    clearCurrentLookAheadSuggestion();
    if (
      !completionIsAllowed(document, position) ||
      !isValidMidlinePosition(document, position) ||
      !getShouldComplete() ||
      shouldBlockCompletions()
    ) {
      return undefined;
    }

    const completionInfo = context.selectedCompletionInfo;
    if (completionInfo) {
      const result = await getLookAheadSuggestion(
        document,
        completionInfo,
        position,
        token
      );
      reportSuggestionShown(document, result);
      return result;
    }

    const completions = await debounceCompletions(document, position, token);
    reportSuggestionShown(document, completions);
    return completions;
  } catch (e) {
    Logger.error(`Error setting up request: ${e}`);

    return undefined;
  }
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
