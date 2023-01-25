import * as vscode from "vscode";
import { AutocompleteResult, ResultEntry } from "./binary/requests/requests";
import { SuggestionTrigger } from "./globals/consts";
import { COMPLETION_IMPORTS } from "./selectionHandler";

export default function getAutoImportCommand(
  result: ResultEntry,
  response: AutocompleteResult | undefined,
  position: vscode.Position,
  suggestionTrigger?: SuggestionTrigger
): vscode.Command {
  return {
    arguments: [
      {
        currentCompletion: result.new_prefix,
        completions: response?.results,
        position,
        limited: response?.is_locked,
        snippetContext: result.completion_metadata?.snippet_context,
        oldPrefix: response?.old_prefix,
        suggestionTrigger,
      },
    ],
    command: COMPLETION_IMPORTS,
    title: "accept completion",
  };
}
