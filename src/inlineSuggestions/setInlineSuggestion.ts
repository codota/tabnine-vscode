import {
  DecorationOptions,
  Position,
  Range,
  TextDocument,
  window,
} from "vscode";
import { CompletionKind, ResultEntry } from "../binary/requests/requests";
import {
  clearState,
  getCurrentPrefix,
  getCurrentSuggestion,
} from "./inlineSuggestionState";
import getHoverContent from "./hoverPopup";
import { trimEnd } from "../utils/utils";
import {
  getSnippetDecorations,
  handleClearSnippetDecoration,
} from "./snippets/snippetDecoration";

const inlineDecorationType = window.createTextEditorDecorationType({});
let showingDecoration = false;

export default async function setInlineSuggestion(
  document: TextDocument,
  position: Position,
  newSuggestion: ResultEntry
): Promise<void> {
  await clearInlineDecoration();
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

async function showInlineDecoration(
  position: Position,
  suggestion: string
): Promise<void> {
  const currentCompletionKind = getCurrentSuggestion()?.completion_kind;
  const decorations =
    currentCompletionKind === CompletionKind.Snippet
      ? await getSnippetDecorations(position, suggestion)
      : getOneLineDecorations(suggestion, position);

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
        color: "gray",
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

export async function clearInlineDecoration(): Promise<void> {
  window.activeTextEditor?.setDecorations(inlineDecorationType, []);
  await handleClearSnippetDecoration();
  showingDecoration = false;
}

export function isShowingDecoration(): boolean {
  return showingDecoration;
}
