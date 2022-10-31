import { Disposable, TextDocumentChangeEvent, window, workspace } from "vscode";
import DocumentTextChangeContent from "./DocumentTextChangeContent";

let shouldComplete = false;
let change = false;

function onChange(): void {
  change = true;
}

function onTextSelectionChange(): void {
  if (change) {
    shouldComplete = true;
    change = false;
  } else {
    shouldComplete = false;
  }
}
export function getShouldComplete(): boolean {
  return shouldComplete;
}

export function initTracker(): Disposable[] {
  return [
    workspace.onDidChangeTextDocument(
      ({ contentChanges }: TextDocumentChangeEvent) => {
        const contentChange = new DocumentTextChangeContent(contentChanges[0]);
        const changeHappened =
          (contentChange.isValidNonEmptyChange() &&
            contentChange.isNotIndentationChange() &&
            contentChange.isSingleCharNonWhitespaceChange()) ||
          contentChange.isIndentationOutChange();
        if (changeHappened) {
          onChange();
        }
      }
    ),
    window.onDidChangeTextEditorSelection(onTextSelectionChange),
  ];
}
