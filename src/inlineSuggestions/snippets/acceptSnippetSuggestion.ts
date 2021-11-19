import { commands, Position, Range, SnippetString, TextEditor } from "vscode";
import { ResultEntry } from "../../binary/requests/requests";
import { CompletionArguments } from "../../CompletionArguments";
import { COMPLETION_IMPORTS } from "../../selectionHandler";
import { escapeTabStopSign } from "../../utils/utils";
import clearInlineSuggestionsState from "../clearDecoration";

/**
 * Inserts the completion text into the editor.
 * This function replaces any existing text in the editor with the new text,
 * so if for example the text was "a" and the completion text was "abc\nxyz",
 * the previous "abc" will be overwritten by the string "abc\nxyz".
 */
export default async function acceptSnippet(
  editor: TextEditor,
  currentSuggestion: ResultEntry,
  currentTextPosition: Position,
  allSuggestions: ResultEntry[]
): Promise<void> {
  const position = currentTextPosition.with(undefined, 0);
  // "take 'abc'.length into consideration"
  const indentation =
    editor.selection.active.character -
    editor.document.lineAt(position).text.trim().length;
  const insertText = constructInsertSnippet(currentSuggestion, indentation);

  const completion: CompletionArguments = {
    currentCompletion: currentSuggestion.new_prefix,
    completions: allSuggestions,
    position: currentTextPosition,
    limited: false,
  };

  await clearInlineSuggestionsState();
  const range = new Range(position, currentTextPosition);
  await editor.insertSnippet(insertText, range);

  void commands.executeCommand(COMPLETION_IMPORTS, completion);
}

function constructInsertSnippet({ new_prefix }: ResultEntry, indent: number) {
  const insertText = new SnippetString(" ".repeat(indent));
  insertText.appendText(escapeTabStopSign(new_prefix));
  insertText.appendTabstop(0);
  return insertText;
}
