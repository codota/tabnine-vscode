import { SnippetString, TextEditor } from "vscode";
import { ResultEntry } from "../../binary/requests/requests";
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

    await clearInlineSuggestionsState();
    await editor.insertSnippet(insertText, range);
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
  // On windows it escapes the string with \r\n, which is wrong.
  insertText.value = insertText.value.replace("\r\n", "\n");
  return insertText;
}
