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

/**
 * Temporary workaround for snippet completions:
 * If its a snippet completions (== at line with only whitespaces):
 * - Insert the snippet at position 0 of this line
 * - Add spaces so that the first line will be indented correctly.
 *
 * Example Snippet:
 * `console.log("hello world");
 * });`
 *
 * At line 1 character 4, would appear in like so when accepted:
 *  ______________________________________
 * | 1.    console.log("hello world");    |
 * | 2.    });                            |
 * | 3.                                   |
 * |______________________________________|
 *
 * With line 2 in indentation 4 instead of 0.
 *
 * Solution:
 * Make the snippet start at position 0 in line 1:
 *  ______________________________________
 * | 1.console.log("hello world");        |
 * | 2.});                                |
 * | 3.                                   |
 * |______________________________________|
 *
 * Now line 2 is indented correctly, but line 1 not.
 * So now we insert 4 spaces to the text, such that the snippet would be:
 * `    console.log("hello world");
 * });`
 *
 * Now when accepting this snippet at indentation 0 we will get:
 *  ______________________________________
 * | 1.    console.log("hello world");    |
 * | 2.});                                |
 * | 3.                                   |
 * |______________________________________|
 */
export default async function acceptInlineSuggestion(
  editor: TextEditor
): Promise<void> {
  const inEmptyLine = isInEmptyLine(editor);
  const currentSuggestion = getCurrentSuggestion();
  const currentTextPosition = editor.selection.active;
  const prefix = getCurrentPrefix();
  const allSuggestions = getAllSuggestions();

  if (currentSuggestion && currentTextPosition && allSuggestions) {
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
    const snippetStartPositionHack = currentTextPosition.translate(
      0,
      -currentTextPosition.character
    );

    await clearInlineSuggestionsState();

    await editor.insertSnippet(
      insertText,
      inEmptyLine
        ? snippetStartPositionHack
        : getSuggestionRange(
            currentTextPosition,
            prefix,
            currentSuggestion.old_suffix
          )
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
  prefixHackForSnippets: string
) {
  const insertText = new SnippetString(
    escapeTabStopSign(prefixHackForSnippets + new_prefix)
  );

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
