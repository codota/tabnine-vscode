import * as vscode from "vscode";

export function insertTextAtCursor({ code }: { code: string }): void {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    if (!editor.selection.isEmpty) {
      void editor.edit((editBuilder) => {
        editBuilder.replace(editor.selection, code);
      });
    } else {
      const position = editor.selection.active;
      void editor.insertSnippet(new vscode.SnippetString(code), position);
    }
  }
}
