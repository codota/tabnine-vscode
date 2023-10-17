import * as vscode from "vscode";
import { prefetch } from "./binary/requests/prefetch";
import { sendEvent } from "./binary/requests/sendEvent";

// Notify the binary on changes to the active text editor.
export const activeTextEditorState = vscode.window.onDidChangeActiveTextEditor(
  async (editor) => {
    if (editor) {
      void sendEvent({
        name: "active_text_editor_changed",
        properties: {
          isDirty: editor.document.isDirty.toString(),
        },
      });
      const filename = editor.document.uri.fsPath;
      await prefetch({ filename });
    }
  }
);
