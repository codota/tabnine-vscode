import * as vscode from "vscode";
import * as path from "path";
import { TextEditor } from "vscode";

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
  const selectedCodeUsages = await getSelectedCodeUsages(editor);

  return {
    fileCode,
    selectedCode,
    selectedCodeUsages,
  };
}

const MAX_USAGES = 10;
const USAGE_LINES_RADIUS = 50;

async function getSelectedCodeUsages(
  editor: TextEditor
): Promise<SelectedCodeUsage[]> {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(
    editor.document.uri
  );
  if (!workspaceFolder) {
    return [];
  }
  const workspaceRoot = workspaceFolder.uri.fsPath;

  const references: vscode.Location[] | undefined =
    (await vscode.commands.executeCommand(
      "vscode.executeReferenceProvider",
      editor.document.uri,
      editor.selection.start
    )) || [];

  return await Promise.all(
    references.slice(0, MAX_USAGES).map(async (reference) => {
      const refDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(
        reference.uri
      );
      const startLine: number = Math.max(
        reference.range.start.line - USAGE_LINES_RADIUS,
        0
      );
      const endLine: number = Math.min(
        reference.range.end.line + USAGE_LINES_RADIUS,
        refDocument.lineCount - 1
      );
      const extendedRange: vscode.Range = new vscode.Range(
        startLine,
        0,
        endLine,
        refDocument.lineAt(endLine).text.length
      );
      const refCode: string = refDocument.getText(extendedRange);
      const refPathRelative: string = path.relative(
        workspaceRoot,
        refDocument.uri.fsPath
      );

      return {
        filePath: refPathRelative,
        code: refCode,
      };
    })
  );
}
