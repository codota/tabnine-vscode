import {
  DecorationOptions,
  Position,
  Range,
  TextDocument,
  window,
} from "vscode";
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
  const suggestionDecoration: DecorationOptions = {
    renderOptions: {
      after: {
        color: "gray",
        contentText: suggestion,
        margin: "0 0 0 0",
      },
    },
    range: new Range(position, position),
  };
  const hoverDecoration: DecorationOptions = {
    hoverMessage: hoverPopup,
    range: new Range(
      position,
      position.translate(undefined, suggestion.length)
    ),
  };

  window.activeTextEditor?.setDecorations(inlineDecorationType, [
    suggestionDecoration,
    hoverDecoration,
  ]);
}

export function clearInlineDecoration(): void {
  window.activeTextEditor?.setDecorations(inlineDecorationType, []);
}
