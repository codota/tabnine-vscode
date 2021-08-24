import {
  DecorationOptions,
  Position,
  Range,
  SnippetString,
  TextDocument,
  window,
} from "vscode";
import { EOL } from "os";
import { ResultEntry } from "../binary/requests/requests";
import { clearState, getCurrentPrefix } from "./inlineSuggestionState";
import hoverPopup from "./hoverPopup";
import { trimEnd } from "../utils/utils";

const inlineDecorationType = window.createTextEditorDecorationType({});

let temRange: Range | undefined;

export default function setInlineSuggestion(
  document: TextDocument,
  position: Position,
  newSuggestion: ResultEntry,
): void {
  const prefix = getCurrentPrefix();
  if (
    shouldNotHandleThisSuggestion(prefix, newSuggestion, document, position)
  ) {
    void clearState();
    return;
  }

  const suggestedHint = constructInlineHint(
    document,
    position,
    newSuggestion,
    prefix
  );

  void showInlineDecoration(position, suggestedHint);
}

function shouldNotHandleThisSuggestion(
  prefix: string,
  newSuggestion: ResultEntry,
  document: TextDocument,
  position: Position
) {
  return (
    !isMatchingPrefix(prefix, newSuggestion) ||
    isInTheMiddleOfWord(document, position)
  );
}

function isInTheMiddleOfWord(
  document: TextDocument,
  position: Position
): boolean {
  const nextCharacter = document.getText(
    new Range(position, position.translate(0, 1))
  );
  return !isClosingCharacter(nextCharacter) && !!nextCharacter.trim();
}

function isClosingCharacter(nextCharacter: string) {
  const closingCharacters = ['"', "'", "`", "]", ")", "}", ">"];
  return closingCharacters.includes(nextCharacter);
}

function isMatchingPrefix(prefix: string, newSuggestion: ResultEntry): boolean {
  return newSuggestion.new_prefix?.includes(prefix);
}

function constructInlineHint(
  document: TextDocument,
  position: Position,
  newSuggestion: ResultEntry,
  prefix: string | undefined
): string {
  const suggestionWithoutPrefix = clearPrefixFromSuggestion(
    newSuggestion?.new_prefix || "",
    prefix || ""
  );
  const existingSuffix = document.getText(
    new Range(position, position.translate(0, suggestionWithoutPrefix.length))
  );
  return trimEnd(suggestionWithoutPrefix, existingSuffix);
}

function clearPrefixFromSuggestion(currentCompletion: string, prefix: string) {
  return currentCompletion?.replace(prefix, "");
}

async function showInlineDecoration(position: Position, suggestion: string): Promise<void> {
  const lines = suggestion.split(EOL);
  const lastLineLength = lines[lines.length - 1].length;
  temRange = undefined;

  if (lines.length > 1) {
    const snippet = new SnippetString(window.activeTextEditor?.document.lineAt(position).text);
    snippet.appendTabstop(0);
    snippet.appendText("\n".repeat(lines.length - 1));
    temRange = new Range(position, position.translate(lines.length - 1, undefined));

    await window.activeTextEditor?.insertSnippet(snippet, position.with(undefined, 0));
  }

  const decorations = lines.map((line, index) =>
    getDecorationFor(line, position, index)
  );

  decorations.push({
    hoverMessage: hoverPopup,
    range: new Range(
      position,
      position.translate(lines.length, lastLineLength)
    ),
  });

  window.activeTextEditor?.setDecorations(inlineDecorationType, decorations);
}

function getDecorationFor(
  line: string,
  startPosition: Position,
  index: number
): DecorationOptions {
  return {
    renderOptions: {
      after: {
        color: "gray",
        contentText: line,
        margin: `0 0 0 0`,
        textDecoration: "none; white-space: pre;"
      },
    },
    range: new Range(
      startPosition.translate(
        index,
        index === 0 ? 0 : -startPosition.character
      ),
      startPosition.translate(index, index === 0 ? 0 : line.length)
    ),
  };
}

export function clearInlineDecoration(): void {
  if (temRange) {
    window.activeTextEditor?.edit((eb) => {
      eb.delete(temRange as Range);
    })
    // void commands.executeCommand("undo");
    temRange = undefined;
  }
  window.activeTextEditor?.setDecorations(inlineDecorationType, []);
}
