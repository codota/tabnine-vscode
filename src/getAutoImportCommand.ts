import * as vscode from "vscode";
import { AutocompleteResult, ResultEntry } from "./binary/requests/requests";
import { COMPLETION_IMPORTS } from "./selectionHandler";

export default function getAutoImportCommand(
  result: ResultEntry,
  response: AutocompleteResult | undefined,
  position: vscode.Position
): vscode.Command {
  return {
    arguments: [
      {
        currentCompletion: result.new_prefix,
        completions: response?.results,
        position,
        limited: response?.is_locked,
        snippetContext: response?.snippet_context,
        oldPrefix: response?.old_prefix,
      },
    ],
    command: COMPLETION_IMPORTS,
    title: "accept completion",
  };
}
