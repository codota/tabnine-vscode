import { TextDocumentContentChangeEvent } from "vscode";
import getTabSize, { getTabsCount } from "../../binary/requests/tabSize";

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
      this.contentChange.text !== " ".repeat(getTabSize()) &&
      this.contentChange.text !==
        "\t".repeat(getTabsCount() * (1 + this.contentChange.rangeLength))
    );
  }
}
