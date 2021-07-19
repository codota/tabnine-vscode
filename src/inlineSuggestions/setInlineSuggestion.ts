import {
  DecorationOptions,
  Position,
  Range,
  TextDocument,
  window,
} from "vscode";
import { ResultEntry } from "../binary/requests/requests";
import { getCurrentPrefix } from "./inlineSuggestionState";
import hoverPopup from "./hoverPopup";
import { trimEnd } from "../utils/utils";

const inlineDecorationType = window.createTextEditorDecorationType({});

export default function setInlineSuggestion(
  document: TextDocument,
  position: Position,
  newSuggestion: ResultEntry
): void {
  const prefix = getCurrentPrefix();
  if (!isMatchingPrefix(prefix, newSuggestion)) {
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

function isMatchingPrefix(prefix: string, newSuggestion: ResultEntry): boolean {
  return newSuggestion.new_prefix?.includes(prefix);
}

function constructInlineHint(
  document: TextDocument,
  position: Position,
  newSuggestion: ResultEntry,
  prefix: string | undefined
): string {
  const suffix = document.getText(
    new Range(position, document.lineAt(position.line).range.end)
  );
  const suggestedHint = clearPrefixFromSuggestion(
    newSuggestion?.new_prefix || "",
    prefix || ""
  );
  return trimEnd(suggestedHint, suffix);
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
