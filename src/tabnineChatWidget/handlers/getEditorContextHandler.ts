import * as vscode from "vscode";

export type SelectedCodeUsage = {
  filePath: string;
  code: string;
};

export type EditorContextResponse = {
  fileCode: string;
  selectedCode: string;
  selectedCodeUsages: SelectedCodeUsage[];
};

export async function getEditorContext(): Promise<EditorContextResponse> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return {
      fileCode: "",
      selectedCode: "",
      selectedCodeUsages: [],
    };
  }
  const doc = editor.document;
  const fileCode = doc.getText();
  const selectedCode = doc.getText(editor.selection);

  return {
    fileCode,
    selectedCode,
    selectedCodeUsages: [],
  };
}
