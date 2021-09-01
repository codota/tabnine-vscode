import { commands, Position, SnippetString, TextEditor } from "vscode";
import { ResultEntry } from "../../binary/requests/requests";
import { CompletionArguments } from "../../CompletionArguments";
import { COMPLETION_IMPORTS } from "../../selectionHandler";
import { escapeTabStopSign } from "../../utils/utils";
import clearInlineSuggestionsState from "../clearDecoration";

export default async function acceptSnippet(
  editor: TextEditor,
  currentSuggestion: ResultEntry,
  currentTextPosition: Position,
  allSuggestions: ResultEntry[]
): Promise<void> {
  const position = currentTextPosition.with(undefined, 0);
  const insertText = constructInsertSnippet(currentSuggestion, editor);

  const completion: CompletionArguments = {
    currentCompletion: currentSuggestion.new_prefix,
    completions: allSuggestions,
    position: currentTextPosition,
    limited: false,
  };

  await clearInlineSuggestionsState();
  await editor.insertSnippet(insertText, position);

  void commands.executeCommand(COMPLETION_IMPORTS, completion);
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
