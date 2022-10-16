import {
  Disposable,
  TextDocumentChangeEvent,
  TextDocumentContentChangeEvent,
  window,
  workspace,
} from "vscode";
import getTabSize from "../binary/requests/tabSize";

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
        const contentChange = new Change(contentChanges[0]);
        const changeHappened =
          contentChange.isValid() &&
          contentChange.isNotTab() &&
          contentChange.isSingleCharChange();
        if (changeHappened) {
          onChange();
        }
      }
    ),
    window.onDidChangeTextEditorSelection(onTextSelectionChange),
  ];
}

class Change {
  constructor(private readonly contentChange: TextDocumentContentChangeEvent) {}

  isValid(): boolean {
    return (
      this.contentChange?.rangeLength >= 0 && this.contentChange?.text !== ""
    );
  }

  isSingleCharChange() {
    return this.contentChange?.text.trim().length <= 1;
  }

  isNotTab() {
    return this.contentChange?.text !== " ".repeat(getTabSize());
  }
}
