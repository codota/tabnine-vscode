import * as vscode from "vscode";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import runCompletion from "./runCompletion";
import getAutoImportCommand from "./getAutoImportCommand";
import { SuggestionTrigger } from "./globals/consts";
import { AutocompleteResult, ResultEntry } from "./binary/requests/requests";
import { isMultiline } from "./utils/utils";

export default async function getInlineCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<vscode.InlineCompletionList<TabnineInlineCompletionItem>> {
  const response = await runCompletion({
    document,
    position,
  });

  const completions = response?.results.map(
    (result) =>
      new TabnineInlineCompletionItem(
        result.new_prefix,
        result,
        calculateRange(position, response, result),
        getAutoImportCommand(
          result,
          response,
          position,
          SuggestionTrigger.DocumentChanged
        ),
        result.completion_metadata?.completion_kind,
        result.completion_metadata?.is_cached,
        result.completion_metadata?.snippet_context
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
