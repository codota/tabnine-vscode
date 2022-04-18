import * as vscode from "vscode";
import { addComments, DocumentThreads } from "./comments";

let controller: vscode.CommentController | null = null;
let activeThreads: DocumentThreads | null = null;

export function registerCodeReview() {
  controller = vscode.comments.createCommentController(
    "tabnine.commentController",
    ""
  );
  controller.options = {
    placeHolder: "",
    prompt: "",
  };

  vscode.window.onDidChangeActiveTextEditor(async () => {
    let diffEditor = getActiveDiffEditor();

    let newThread = null;
    if (diffEditor) {
      newThread = await addComments(
        controller!,
        diffEditor.newEditor.document,
        diffEditor.oldEditor.document
      );
    }

    if (activeThreads) {
      activeThreads.dispose();
    }

    activeThreads = newThread;
  });
}

function getActiveDiffEditor(): {
  oldEditor: vscode.TextEditor;
  newEditor: vscode.TextEditor;
} | null {
  let visibleEditors = vscode.window.visibleTextEditors;
  if (visibleEditors.length !== 2) return null;
  if (
    visibleEditors[0].document.uri.path !== visibleEditors[1].document.uri.path
  )
    return null;

  let oldEditor = visibleEditors.find(isHeadGitEditor);
  let newEditor = visibleEditors.find(
    (editor) => editor.document.uri.scheme === "file"
  );

  if (oldEditor && newEditor) {
    return { oldEditor, newEditor };
  } else {
    return null;
  }
}

function isHeadGitEditor(editor: vscode.TextEditor): boolean {
  if (editor.document.uri.scheme === "git") {
    const query = JSON.parse(editor.document.uri.query);
    return query.ref === "HEAD" || query.ref === "~";
  }

  return false;
}
