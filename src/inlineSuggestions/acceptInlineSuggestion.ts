import { EOL } from "os";
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
    
    

    let rangeStartTranslate = -currentTextPosition.character;
    let firstLineIndent = currentTextPosition.character;

    if (getLinesCount(currentSuggestion.new_prefix) <= 1) { 
      rangeStartTranslate = -prefix.trim().length;
      firstLineIndent = 0;
    } 

    let indentSpaces = ' '.repeat(firstLineIndent);

    const insertText = constructInsertSnippet(indentSpaces, currentSuggestion);

    const range = new Range(
      currentTextPosition.translate(undefined, rangeStartTranslate),
      getEndPosition(insertText.value,currentTextPosition),
    );

    // const range = getSuggestionRange(
    //   currentTextPosition,
    //   prefix,
    //   insertText.value,
    //   currentSuggestion.old_suffix
    // );

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

function constructInsertSnippet(indentSpaces : string, { new_prefix, new_suffix }: ResultEntry) {
  const insertText = new SnippetString(escapeTabStopSign(indentSpaces + new_prefix));

  if (new_suffix) {
    insertText.appendTabstop(0).appendText(escapeTabStopSign(new_suffix));
  }
  return insertText;
}

// function getSuggestionRange(
//   currentTextPosition: Position,
//   prefix: string,
//   insertText : string,
//   oldPrefix: string
// ) {
//   return new Range(
//     currentTextPosition.translate(undefined, -4), //-prefix.length),
//     getEndPosition(insertText,currentTextPosition),
//   );
// }

export function getEndPosition(
  text: string, start: Position
): Position {
  const lineDelta = getLinesCount(text);
  const lines = text.split(EOL);
  const lastLineLength = lines[lines.length - 1].length;
  
  return start.translate(lineDelta, lastLineLength);
}

function getLinesCount(text: string) {
  return text.split(EOL).length - 1;
}

