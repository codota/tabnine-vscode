import {
  DecorationOptions,
  Position,
  Range,
  TextDocument,
  window,
} from "vscode";
import { ResultEntry } from "../binary/requests/requests";
import {
  clearState,
  getCurrentPrefix,
} from "./inlineSuggestionState";
import getHoverContent from "./hoverPopup";
import { trimEnd } from "../utils/utils";
import getHintColor from "./hintColor";

const inlineDecorationType = window.createTextEditorDecorationType({});
let showingDecoration = false;

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

function showInlineDecoration(position: Position, suggestion: string): void {
  const decorations = getOneLineDecorations(suggestion, position);

  window.activeTextEditor?.setDecorations(inlineDecorationType, decorations);
  showingDecoration = true;
}

function getOneLineDecorations(
  suggestion: string,
  position: Position
): DecorationOptions[] {
  const decorations: DecorationOptions[] = [];
  decorations.push({
    renderOptions: {
      after: {
        color: getHintColor(),
        contentText: suggestion,
        margin: `0 0 0 0`,
        textDecoration: "none; white-space: pre;",
      },
    },
    range: new Range(position, position),
  });
  decorations.push({
    hoverMessage: getHoverContent(),
    range: new Range(
      position,
      position.translate(undefined, suggestion.length)
    ),
  });
  return decorations;
}

export function clearInlineDecoration(): void {
  window.activeTextEditor?.setDecorations(inlineDecorationType, []);
  showingDecoration = false;
}

export function isShowingDecoration(): boolean {
  return showingDecoration;
}
