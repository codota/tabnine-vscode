import {
  commands,
  Position,
  Range,
  SnippetString,
  TextEditor,
  extensions,
} from "vscode";
import { ResultEntry } from "../binary/requests/requests";
import { CompletionArguments } from "../CompletionArguments";
import { COMPLETION_IMPORTS } from "../selectionHandler";
import { escapeTabStopSign, isMultiline } from "../utils/utils";
import clearInlineSuggestionsState from "./clearDecoration";
import {
  getCurrentSuggestion,
  getCurrentPrefix,
  getAllSuggestions,
} from "./inlineSuggestionState";
import acceptSnippetSuggestion from "./snippets/acceptSnippetSuggestion";

export default async function acceptInlineSuggestion(
  editor: TextEditor
): Promise<void> {
  const currentSuggestion = getCurrentSuggestion();
  const currentTextPosition = editor.selection.active;
  const prefix = getCurrentPrefix();
  const allSuggestions = getAllSuggestions();

  if (currentSuggestion && currentTextPosition && allSuggestions) {
    await (isMultiline(currentSuggestion?.new_prefix)
      ? acceptSnippetSuggestion(
          editor,
          currentSuggestion,
          currentTextPosition,
          allSuggestions,
          prefix
        )
      : acceptOneLineSuggestion(
          currentTextPosition,
          prefix,
          currentSuggestion,
          allSuggestions,
          editor,
          prefix
        ));

    const vimActive = extensions.getExtension("vscodevim.vim")?.isActive;
    if (vimActive) {
      await vimReturnToInsertMode(currentSuggestion);
    }
  }
}

async function vimReturnToInsertMode(suggestion: ResultEntry) {
  await commands.executeCommand("extension.vim_escape");
  await commands.executeCommand("extension.vim_insert");
  const suggestionString = suggestion.new_prefix + suggestion.new_suffix;
  vimMoveCursorRight(suggestionString.length);
}

function vimMoveCursorRight(steps: number) {
  let count = 0;
  while (count < steps) {
    void commands.executeCommand("extension.vim_right");
    count += 1;
  }
}

async function acceptOneLineSuggestion(
  currentTextPosition: Position,
  prefix: string,
  currentSuggestion: ResultEntry,
  allSuggestions: ResultEntry[],
  editor: TextEditor,
  oldPrefix: string
) {
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
    oldPrefix,
  };
  await clearInlineSuggestionsState();
  await editor.insertSnippet(insertText, range);

  void commands.executeCommand(COMPLETION_IMPORTS, completion);
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
    currentTextPosition.translate(undefined, -prefix.trim().length),
    currentTextPosition.translate(undefined, oldPrefix.trim().length)
  );
}
