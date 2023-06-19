import * as vscode from "vscode";

export function insertTextAtCursor({ code }: { code: string }): void {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const position = editor.selection.active;
    void editor.insertSnippet(new vscode.SnippetString(code), position);
  }
}
