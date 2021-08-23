import { commands, Position, Range, SnippetString, TextEditor } from "vscode";
import { ResultEntry } from "../binary/requests/requests";
import { CompletionArguments } from "../CompletionArguments";
import { COMPLETION_IMPORTS } from "../selectionHandler";
import { escapeTabStopSign } from "../utils/utils";
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
    const inMultiLine = currentSuggestion.new_prefix.includes("\n");

    const range = inMultiLine
      ? currentTextPosition.with(undefined, 0)
      : getSuggestionRange(
          currentTextPosition,
          prefix,
          currentSuggestion.old_suffix
        );
    const insertText = constructInsertSnippet(currentSuggestion, editor);

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

function constructInsertSnippet(
  { new_prefix, new_suffix }: ResultEntry,
  editor: TextEditor
) {
  const inMultiLine = new_prefix.includes("\n");

  if (inMultiLine) {
    const insertText = new SnippetString(
      " ".repeat(editor.document.lineAt(editor.selection.active).text.length)
    );
    insertText.appendText(escapeTabStopSign(new_prefix));
    insertText.appendTabstop(0);

    return insertText;
  }
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
    currentTextPosition.translate(undefined, -prefix.trim().length),
    currentTextPosition.translate(undefined, oldPrefix.trim().length)
  );
}
