import {
  CommentMode,
  CommentThread,
  Uri,
  MarkdownString,
  Comment,
  CommentAuthorInformation,
  workspace,
  WorkspaceEdit,
  TextDocument,
} from "vscode";
import { fireEvent } from "../binary/requests/requests";
import * as api from "./api";

export default class TabnineComment implements Comment {
  suggestion: api.Suggestion;

  language: string;

  oldValue: string;

  constructor(oldValue: string, suggestion: api.Suggestion, language: string) {
    this.oldValue = oldValue;
    this.suggestion = suggestion;
    this.language = language;
  }

  get body(): MarkdownString {
    return new MarkdownString().appendCodeblock(
      this.suggestion.value,
      this.language
    );
  }

  // eslint-disable-next-line class-methods-use-this
  get mode(): CommentMode {
    return CommentMode.Preview;
  }

  // eslint-disable-next-line class-methods-use-this
  get author(): CommentAuthorInformation {
    const iconUri = Uri.parse(
      "https://www.tabnine.com/favicons/favicon-32x32.png"
    );
    return { name: "Tabnine", iconPath: iconUri };
  }

  apply(thread: CommentThread): boolean {
    const document = documentOf(thread);

    if (!document) {
      this.fireEvent("comment-applied", thread, {
        success: false,
        failureReason: "doument not found",
      });
      return false;
    }

    const oldText = document.getText(thread.range);

    if (this.oldValue !== oldText.trim()) {
      this.fireEvent("comment-applied", thread, {
        success: false,
        failureReason: "text did not match",
      });
      return false;
    }

    const edit = new WorkspaceEdit();
    edit.replace(thread.uri, thread.range, this.suggestion.value);
    void workspace.applyEdit(edit);

    this.fireEvent("comment-applied", thread, { success: true });

    return true;
  }

  hide(thread: CommentThread): void {
    this.fireEvent("comment-hidden", thread);
    thread.dispose();
  }

  // eslint-disable-next-line class-methods-use-this
  private fireEvent(
    event: string,
    thread: CommentThread,
    additionalProperties: Record<string, unknown> = {}
  ): void {
    void fireEvent({
      name: `code-review-${event}`,
      lineIndex: thread.range.start.line,
      file: thread.uri.path,
      lineCount: documentOf(thread)?.lineCount,
      ...additionalProperties,
    });
  }
}

function documentOf(thread: CommentThread): TextDocument | undefined {
  return workspace.textDocuments.find((doc) => doc.uri === thread.uri);
}
