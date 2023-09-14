import * as vscode from "vscode";
import { prefetch } from "./binary/requests/prefetch";

// Notify the binary on changes to the active text editor.
export const activeTextEditorState = vscode.window.onDidChangeActiveTextEditor(
  async (editor) => {
    if (editor) {
      const filename = editor.document.uri.fsPath;
      await prefetch({ filename });
    }
  }
);
