import * as vscode from "vscode";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";
import { addSuggestions, DocumentThreads } from "./suggestions";
import TabnineComment from "./TabnineComment";

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
    "Tabnine.hideSuggestion",
    (thread: vscode.CommentThread) => {
      const comment = thread.comments[0] as TabnineComment | undefined;

      if (comment) {
        comment.hide(thread);
      }
    }
  );

  vscode.commands.registerCommand(
    "Tabnine.applySuggestion",
    (thread: vscode.CommentThread) => {
      const comment = thread.comments[0] as TabnineComment | undefined;

      if (comment && comment.apply(thread)) {
        thread.dispose();
      }
    }
  );

  vscode.window.onDidChangeActiveTextEditor(async () => {
    if (!isCapabilityEnabled(Capability.CODE_REVIEW)) return;
    
    const diffEditor = getActiveDiffEditor();

    let newThreads = null;
    if (diffEditor) {
      newThreads = await addSuggestions(
        controller,
        diffEditor.newEditor.document,
        diffEditor.oldEditor.document
      );
    }

    if (activeThreads) {
      activeThreads.dispose();
    }

    activeThreads = newThreads;
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
