import { commands, SnippetString, TextEditor } from "vscode";
import { ResultEntry } from "../../binary/requests/requests";
import { CompletionArguments } from "../../CompletionArguments";
import { COMPLETION_IMPORTS } from "../../selectionHandler";
import { escapeTabStopSign } from "../../utils/utils";
import clearInlineSuggestionsState from "../clearDecoration";
import {
  getAllSuggestions,
  getCurrentSuggestion,
} from "../inlineSuggestionState";

export default async function acceptSnippet(
  editor: TextEditor
): Promise<boolean> {
  const currentSuggestion = getCurrentSuggestion();
  const currentTextPosition = editor.selection.active;
  const allSuggestions = getAllSuggestions();
  const inMultiLine = currentSuggestion?.new_prefix.includes("\n");

  if (!inMultiLine) {
    return false;
  }

  if (currentSuggestion && currentTextPosition && allSuggestions) {
    const range = currentTextPosition.with(undefined, 0);
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

  return true;
}

function constructInsertSnippet(
  { new_prefix }: ResultEntry,
  editor: TextEditor
) {
  const insertText = new SnippetString(
    " ".repeat(editor.selection.active.character)
  );
  insertText.appendText(escapeTabStopSign(new_prefix));
  insertText.appendTabstop(0);
  return insertText;
}
