import * as vscode from "vscode";
import { prefetch } from "./binary/requests/prefetch";

export const activeTextEditorState = vscode.window.onDidChangeActiveTextEditor(
  async (editor) => {
    if (editor) {
      const filename = editor.document.uri.fsPath;
      await prefetch({ filename });
    }
  }
);
