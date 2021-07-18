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
  return suggestedHint.replace(new RegExp(`${escapeRegExp(suffix)}$`), "");
}

function clearPrefixFromSuggestion(currentCompletion: string, prefix: string) {
  return currentCompletion?.replace(prefix, "");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function showInlineDecoration(position: Position, suggestion: string): void {
  const suggestionDecoration: DecorationOptions = {
    renderOptions: {
      after: {
        color: "gray",
        contentText: suggestion,
      },
    },
    range: new Range(
      new Position(position.line, position.character),
      new Position(position.line, position.character)
    ),
  };
  const hoverDecoration: DecorationOptions = {
    hoverMessage: hoverPopup,
    range: new Range(
      new Position(position.line, position.character),
      position.translate(undefined, position.character)
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
