import { TextDocument, TextDocumentContentChangeEvent } from "vscode";
import getTabSize from "../../binary/requests/tabSize";

const AUTO_CLOSED_BRACKETS_CHANGE = ["()", "{}", "[]", '""', "''", "``"];
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
    return (
      !!this.contentChange &&
      (this.contentChange?.text.trim().length <= 1 ||
        AUTO_CLOSED_BRACKETS_CHANGE.includes(this.contentChange.text))
    );
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
      // in case of /t the rangeLength will be 1, in case of spaces the rangeLength will be tabsize
      this.contentChange.rangeLength > 0 &&
      this.contentChange.range.isSingleLine &&
      this.document.lineAt(this.contentChange.range.end).isEmptyOrWhitespace
    );
  }
}
