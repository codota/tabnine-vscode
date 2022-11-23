import { TextDocument, TextDocumentContentChangeEvent } from "vscode";
import getTabSize from "../../binary/requests/tabSize";

export default class DocumentTextChangeContent {
  constructor(
    private readonly document: TextDocument,
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
    const isEndsWithWhitespace = this.contentChange?.text.endsWith(
      " ".repeat(getTabSize())
    );
    const isEndsWithTab = this.contentChange?.text.endsWith("\t");
    const isNewLine = this.contentChange?.text.includes("\n");
    return (
      !!this.contentChange &&
      (isNewLine || (!isEndsWithWhitespace && !isEndsWithTab))
    );
  }

  isPythonNewLineChange(): boolean {
    return (
      !!this.contentChange &&
      this.document.languageId === "python" &&
      this.contentChange?.text.startsWith("\n") &&
      this.contentChange?.text.trim() === ""
    );
  }

  isIndentOutChange(): boolean {
    return (
      !!this.contentChange &&
      this.contentChange.rangeLength > 0 &&
      this.document.lineAt(this.contentChange.range.end).isEmptyOrWhitespace
    );
  }
}
