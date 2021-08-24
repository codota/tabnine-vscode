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
import {
  handleClearSnippetDecoration,
  handleCreateSnippetDecoration,
} from "./snippets/snippetDecoration";

const inlineDecorationType = window.createTextEditorDecorationType({});

export default function setInlineSuggestion(
  document: TextDocument,
  position: Position,
  newSuggestion: ResultEntry
): void {
  clearInlineDecoration();
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
  const lines = suggestion.split(EOL);
  const lastLineLength = lines[lines.length - 1].length;

  await handleCreateSnippetDecoration(lines, position);

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
        textDecoration: "none; white-space: pre;",
      },
    },
    range: new Range(
      startPosition.translate(
        index,
        index === 0 ? 0 : -startPosition.character
      ),
      startPosition.translate(
        index,
        index === 0 ? 0 : -startPosition.character + line.length
      )
    ),
  };
}

export function clearInlineDecoration(): void {
  handleClearSnippetDecoration();
  window.activeTextEditor?.setDecorations(inlineDecorationType, []);
}
