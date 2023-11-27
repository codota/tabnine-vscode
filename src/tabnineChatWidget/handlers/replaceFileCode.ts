import * as vscode from "vscode";

export type ReplaceCodePayload = {
  code: string;
};

export async function replaceFileCode({ code }: ReplaceCodePayload): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const fullRange = new vscode.Range(
      editor.document.positionAt(0),
      editor.document.positionAt(editor.document.getText().length)
    );

    await editor.edit((editBuilder) => {
      editBuilder.replace(fullRange, code);
    });
    editor.document.save();
  } else {
    vscode.window.showErrorMessage("No active editor found");
  }
}
