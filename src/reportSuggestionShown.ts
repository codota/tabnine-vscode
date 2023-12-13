import * as vscode from "vscode";
import suggestionShown from "./binary/requests/suggestionShown";
import { ResultEntry } from "./binary/requests/requests";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";

let lastShownSuggestion: ResultEntry | undefined | null;

export default function reportSuggestionShown(
  document: vscode.TextDocument,
  completions?: vscode.InlineCompletionList
): void {
  const item = (completions?.items[0] as TabnineInlineCompletionItem)
    .suggestionEntry;

  if (item && !lastShownSuggestion?.new_prefix.endsWith(item.new_prefix)) {
    void suggestionShown({
      SuggestionShown: {
        net_length: item.new_prefix.length,
        filename: document.fileName,
        metadata: item.completion_metadata,
      },
    });
  }
  lastShownSuggestion = item;
}
