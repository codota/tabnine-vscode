import {
  CommentController,
  CommentMode,
  CommentThread,
  CommentThreadCollapsibleState,
  Range,
  TextDocument,
  Uri,
} from "vscode";
import * as path from "path";

export async function addComments(
  controller: CommentController,
  document: TextDocument,
  oldDocument: TextDocument
): Promise<CommentThread> {
  let iconUri = Uri.file(path.resolve(__dirname, "..", "small_logo.png"));
  let thread = controller.createCommentThread(
    document.uri,
    new Range(0, 0, 0, 0),
    [
      {
        author: { name: "Tabnine", iconPath: iconUri },
        mode: CommentMode.Preview,
        body: "Test...",
      },
    ]
  );

  thread.canReply = false;
  thread.collapsibleState = CommentThreadCollapsibleState.Expanded;
  thread.label = "Replace with";

  return thread;
}
