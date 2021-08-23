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
  const inEmptyLine = isInEmptyLine(editor);
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
    const insertText = constructInsertSnippet(
      currentSuggestion,
      inEmptyLine ? " ".repeat(currentTextPosition.character) : ""
    );

    const completion: CompletionArguments = {
      currentCompletion: currentSuggestion.new_prefix,
      completions: allSuggestions,
      position: currentTextPosition,
      limited: false,
    };
    await clearInlineSuggestionsState();
    await editor.insertSnippet(
      insertText,
      inEmptyLine
        ? currentTextPosition.translate(0, -currentTextPosition.character)
        : range
    );

    void commands.executeCommand(COMPLETION_IMPORTS, completion);
  }
}

function isInEmptyLine(editor: TextEditor): boolean {
  return editor.document.lineAt(editor.selection.active.line)
    .isEmptyOrWhitespace;
}

function constructInsertSnippet(
  { new_prefix, new_suffix }: ResultEntry,
  a: string
) {
  const insertText = new SnippetString(escapeTabStopSign(a + new_prefix));

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
