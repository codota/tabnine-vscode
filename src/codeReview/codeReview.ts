import * as vscode from "vscode";
import { addSuggestions, DocumentThreads } from "./suggestions";

let activeThreads: DocumentThreads | null = null;

export default function registerCodeReview(): void {
  const controller = vscode.comments.createCommentController(
    "tabnine.commentController",
    ""
  );
  controller.options = {
    placeHolder: "",
    prompt: "",
  };

  vscode.commands.registerCommand(
    "Tabnine.hideComment",
    (thread: vscode.CommentThread) => {
      thread.dispose();
    }
  );

  vscode.window.onDidChangeActiveTextEditor(async () => {
    const diffEditor = getActiveDiffEditor();

    let newThread = null;
    if (diffEditor) {
      newThread = await addSuggestions(
        controller,
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
  const visibleEditors = vscode.window.visibleTextEditors;
  if (visibleEditors.length !== 2) return null;
  if (
    visibleEditors[0].document.uri.path !== visibleEditors[1].document.uri.path
  )
    return null;

  const oldEditor = visibleEditors.find(isHeadGitEditor);
  const newEditor = visibleEditors.find(
    (editor) => editor.document.uri.scheme === "file"
  );

  if (oldEditor && newEditor) {
    return { oldEditor, newEditor };
  }
  return null;
}

function isHeadGitEditor(editor: vscode.TextEditor): boolean {
  if (editor.document.uri.scheme === "git") {
    const query = JSON.parse(editor.document.uri.query) as { ref: string };
    return query.ref === "HEAD" || query.ref === "~";
  }

  return false;
}
