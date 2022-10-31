import { TextDocumentContentChangeEvent } from "vscode";
import getTabSize from "../../binary/requests/tabSize";

export default class DocumentTextChangeContent {
  constructor(
    private readonly contentChange?: TextDocumentContentChangeEvent
  ) {}

  isValidNonEmptyChange(): boolean {
    return (
      !!this.contentChange &&
      this.contentChange.rangeLength >= 0 &&
      this.contentChange.text !== ""
    );
  }

  isSingleCharNonWhitespaceChange(): boolean {
    return !!this.contentChange && this.contentChange?.text.trim().length <= 1;
  }

  isNotIndentationChange(): boolean {
    return (
      !!this.contentChange &&
      this.contentChange.text !== " ".repeat(getTabSize())
    );
  }
}
