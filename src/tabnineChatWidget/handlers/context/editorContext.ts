import * as vscode from "vscode";
import { ContextTypeData, EditorContext } from "./enrichingContextTypes";

export default async function getEditorContext(
  editor: vscode.TextEditor
): Promise<ContextTypeData | undefined> {
  const fileCode = editor.document.getText();
  const selectedCode = editor.document.getText(editor.selection);
  const currentLine = editor.document.lineAt(editor.selection.active);

  const editorContext: EditorContext = {
    fileCode,
    selectedCode,
    selectedCodeUsages: [],
    lineTextAtCursor: currentLine.text,
    currentLineIndex: currentLine.lineNumber,
  };

  return Promise.resolve({
    type: "Editor",
    ...editorContext,
  });
}
