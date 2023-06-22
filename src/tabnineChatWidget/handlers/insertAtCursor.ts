import * as vscode from "vscode";

export function insertTextAtCursor({ code }: { code: string }): void {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(editor.document.uri, editor.selection, code, {
      needsConfirmation: true,
      label: "Insert code",
    });
    if (!editor.selection.isEmpty) {
      void vscode.workspace.applyEdit(edit);
    } else {
      const position = editor.selection.active;
      void editor.insertSnippet(new vscode.SnippetString(code), position);
    }
  }
}
