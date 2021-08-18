import {
  DecorationOptions,
  Position,
  Range,
  TextDocument,
  window,
} from "vscode";
import { EOL } from "os";
import { ResultEntry } from "../binary/requests/requests";
import { clearState, getCurrentPrefix } from "./inlineSuggestionState";
import hoverPopup from "./hoverPopup";
import { trimEnd } from "../utils/utils";

const inlineDecorationType = window.createTextEditorDecorationType({});

export default function setInlineSuggestion(
  document: TextDocument,
  position: Position,
  newSuggestion: ResultEntry
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

  showInlineDecoration(position, suggestedHint);
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

function showInlineDecoration(position: Position, suggestion: string): void {
  const lines = suggestion.split(EOL);
  const lastLineLength = lines[lines.length - 1].length;

  const decorations = lines.map((line, index) =>
    getDecorationFor(line, position.translate(index))
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
  linePosition: Position
): DecorationOptions {
  const spaces = line.length - line.trimStart().length;
  const rems = Math.floor(spaces / 2);
  return {
    renderOptions: {
      after: {
        color: "gray",
        contentText: line,
        margin: `0 0 0 ${rems}rem`,
      },
    },
    range: new Range(linePosition, linePosition),
  };
}

export function clearInlineDecoration(): void {
  window.activeTextEditor?.setDecorations(inlineDecorationType, []);
}
