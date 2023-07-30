import vscode from "vscode";
import { EditorContext } from "./enrichingContextTypes";

export default async function getEditorContext(
  editor: vscode.TextEditor
): Promise<EditorContext | undefined> {
  const fileCode = editor.document.getText();
  const selectedCode = editor.document.getText(editor.selection);
  const currentLine = editor.document.lineAt(editor.selection.active);

  return Promise.resolve({
    fileCode,
    selectedCode,
    selectedCodeUsages: [],
    lineTextAtCursor: currentLine.text,
    currentLineIndex: currentLine.lineNumber,
  });
}
