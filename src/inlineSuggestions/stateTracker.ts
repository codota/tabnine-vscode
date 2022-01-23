import { Disposable, TextDocumentChangeEvent, window, workspace } from "vscode";

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

export function init(): Disposable[] {
  return [
    workspace.onDidChangeTextDocument(
      ({ contentChanges }: TextDocumentChangeEvent) => {
        const contentChange = contentChanges[0];
        const changeHappened =
          contentChange?.rangeLength >= 0 && contentChange?.text !== "";
        if (changeHappened) {
          onChange();
        }
      }
    ),
    window.onDidChangeTextEditorSelection(onTextSelectionChange),
  ];
}
