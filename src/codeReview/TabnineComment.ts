import {
  CommentMode,
  CommentThread,
  Uri,
  MarkdownString,
  Comment,
  CommentAuthorInformation,
  workspace,
  WorkspaceEdit,
} from "vscode";
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
    const document = workspace.textDocuments.find(
      (doc) => doc.uri === thread.uri
    );

    if (!document) {
      return false;
    }

    const oldText = document.getText(thread.range);

    if (this.oldValue !== oldText.trim()) {
      return false;
    }

    const edit = new WorkspaceEdit();
    edit.replace(thread.uri, thread.range, this.suggestion.value);
    void workspace.applyEdit(edit);

    return true;
  }
}
