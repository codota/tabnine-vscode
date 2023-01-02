import * as vscode from "vscode";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import suggestionShown from "./binary/requests/suggestionShown";
import CompletionOrigin from "./CompletionOrigin";
import { ResultEntry } from "./binary/requests/requests";

let lastShownSuggestion: ResultEntry | undefined | null;

export default function reportSuggestionShown(
  document: vscode.TextDocument,
  completions?: vscode.InlineCompletionList<TabnineInlineCompletionItem>
): void {
  const item = completions?.items[0]?.suggestionEntry;

  if (item && lastShownSuggestion?.new_prefix.endsWith(item.new_prefix)) {
    void suggestionShown({
      SuggestionShown: {
        origin: item.origin ?? CompletionOrigin.UNKNOWN,
        net_length: item.new_prefix.length,
        completion_kind: item.completion_kind,
        filename: document.fileName,
      },
    });
  }
  lastShownSuggestion = item;
}
