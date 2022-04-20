import {
  CommentController,
  CommentThread,
  CommentThreadCollapsibleState,
  TextDocument,
  Uri,
  window,
  StatusBarAlignment,
} from "vscode";
import * as path from "path";
import * as diff from "diff";
import * as api from "./api";
import TabnineComment from "./TabnineComment";

export async function addSuggestions(
  controller: CommentController,
  document: TextDocument,
  oldDocument: TextDocument
): Promise<DocumentThreads | null> {
  const extensions = await supportedExtensions();
  if (!extensions.includes(path.extname(document.uri.path))) {
    return null;
  }

  const text = document.getText();

  const ranges: api.Range[] = [];
  const changes = diff.diffLines(text, oldDocument.getText());
  let currentPosition = 0;
  changes.forEach((change) => {
    if (change.removed) {
      ranges.push({
        start: currentPosition,
        end: currentPosition + change.value.length,
      });
    }

    if (!change.added) {
      currentPosition += change.value.length;
    }
  });

  const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, -1);
  statusBarItem.text = "Fecthing Tabnine code review suggestions...";
  statusBarItem.show();

  let response;
  try {
    response = await api.querySuggestions({
      filename: path.basename(document.uri.path),
      buffer: text,
      ranges,
      threshold: "review",
    });
  } finally {
    statusBarItem.dispose();
  }

  const threads: CommentThread[] = [];
  response.focus.forEach((focus) => {
    const suggestion = focus.suggestions.find(
      (s) => s.classification.type === "other"
    );
    if (!suggestion) {
      return;
    }

    const line = document.lineAt(document.positionAt(focus.start));
    const thread = controller.createCommentThread(document.uri, line.range, [
      new TabnineComment(focus.old_value, suggestion, document.languageId),
    ]);

    thread.canReply = false;
    thread.collapsibleState = CommentThreadCollapsibleState.Expanded;
    thread.label = suggestion.classification.description;

    threads.push(thread);
  });

  return new DocumentThreads(document.uri, threads);
}

export class DocumentThreads {
  readonly uri: Uri;

  private readonly threads: CommentThread[];

  constructor(uri: Uri, threads: CommentThread[]) {
    this.uri = uri;
    this.threads = threads;
  }

  dispose(): void {
    this.threads.forEach((thread) => thread.dispose());
  }
}

let cachedSupportedExtensions: string[] | null = null;
async function supportedExtensions(): Promise<string[]> {
  if (!cachedSupportedExtensions) {
    cachedSupportedExtensions = (await api.supportedExtensions()).extensions;
  }

  return cachedSupportedExtensions;
}

setInterval(() => {
  cachedSupportedExtensions = null;
}, 1000 * 60 * 10); // reset extension cache every 10 minutes
