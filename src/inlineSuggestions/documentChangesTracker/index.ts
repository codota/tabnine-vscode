import { Disposable, TextDocumentChangeEvent, window, workspace } from "vscode";
import DocumentTextChangeContent from "./DocumentTextChangeContent";
import tryApplyPythonIndentExtensionFix from "./pythonIndentExtensionFix";

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

export function initTracker(): Disposable {
  return Disposable.from(
    workspace.onDidChangeTextDocument(
      ({ contentChanges, document }: TextDocumentChangeEvent) => {
        const currentPosition = window.activeTextEditor?.selection.active;
        const relevantChange = contentChanges.find(
          ({ range }) => currentPosition && range.contains(currentPosition)
        );
        const contentChange = new DocumentTextChangeContent(
          document,
          relevantChange
        );
        const changeHappened =
          (contentChange.isValidNonEmptyChange() &&
            contentChange.isNotIndentationChange() &&
            contentChange.isSingleCharNonWhitespaceChange()) ||
          contentChange.isIndentOutChange();

        if (changeHappened) {
          onChange();
          tryApplyPythonIndentExtensionFix(contentChange);
        }
      }
    ),
    window.onDidChangeTextEditorSelection(onTextSelectionChange)
  );
}
