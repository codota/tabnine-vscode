import { commands, Position, Range, SnippetString, TextEditor } from "vscode";
import { ResultEntry } from "../binary/requests/requests";
import { CompletionArguments } from "../CompletionArguments";
import { COMPLETION_IMPORTS } from "../selectionHandler";
import clearInlineSuggestionsState from "./clearDecoration";
import {
  getCurrentSuggestion,
  getCurrentPrefix,
  getAllSuggestions,
} from "./inlineSuggestionState";

export default async function acceptInlineSuggestion(
  editor: TextEditor
): Promise<void> {
  const currentSuggestion = getCurrentSuggestion();
  const currentTextPosition = editor.selection.active;
  const prefix = getCurrentPrefix();
  const allSuggestions = getAllSuggestions();
  if (currentSuggestion && currentTextPosition && allSuggestions) {
    const range = getSuggestionRange(
      currentTextPosition,
      prefix,
      currentSuggestion.old_suffix
    );
    const insertText = constructInsertSnippet(currentSuggestion);

    const completion: CompletionArguments = {
      currentCompletion: currentSuggestion.new_prefix,
      completions: allSuggestions,
      position: currentTextPosition,
      limited: false,
    };
    await clearInlineSuggestionsState();
    await editor.insertSnippet(insertText, range);

    void commands.executeCommand(COMPLETION_IMPORTS, completion);
  }
}

function constructInsertSnippet({ new_prefix, new_suffix }: ResultEntry) {
  const insertText = new SnippetString(escapeTabStopSign(new_prefix));

  if (new_suffix) {
    insertText.appendTabstop(0).appendText(escapeTabStopSign(new_suffix));
  }
  return insertText;
}

function getSuggestionRange(
  currentTextPosition: Position,
  prefix: string,
  oldPrefix: string
) {
  return new Range(
    currentTextPosition.translate(undefined, -prefix.length),
    currentTextPosition.translate(undefined, oldPrefix.length)
  );
}

export function escapeTabStopSign(value: string): string {
  return value.replace(new RegExp("\\$", "g"), "\\$");
}
