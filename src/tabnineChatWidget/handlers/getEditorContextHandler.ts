import * as vscode from "vscode";
import { getFileMetadata } from "../../binary/requests/fileMetadata";

export type SelectedCodeUsage = {
  filePath: string;
  code: string;
};

export type EditorContextResponse = {
  fileCode: string;
  selectedCode: string;
  selectedCodeUsages: SelectedCodeUsage[];
  diagnosticsText?: string;
  fileUri?: string;
  language?: string;
  lineTextAtCursor?: string;
  metadata?: unknown;
};

export async function getEditorContext(): Promise<EditorContextResponse> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    const folder = vscode.workspace.workspaceFolders?.[0];
    let metadata;

    if (folder) {
      const firstFileInWorkspace = (
        await vscode.workspace.fs.readDirectory(folder?.uri)
      ).find(([, type]) => type === vscode.FileType.File);
      if (firstFileInWorkspace) {
        metadata = await getFileMetadata(
          vscode.Uri.joinPath(folder.uri, firstFileInWorkspace[0]).fsPath
        );
      }
    }
    return {
      fileCode: "",
      selectedCode: "",
      selectedCodeUsages: [],
      metadata,
    };
  }

  const doc = editor.document;
  const fileCode = doc.getText();
  const selectedCode = doc.getText(editor.selection);

  const metadata = await getFileMetadata(doc.fileName);

  return {
    fileCode,
    selectedCode,
    selectedCodeUsages: [],
    diagnosticsText: getDiagnosticsText(editor),
    fileUri: doc.uri.toString(),
    language: doc.languageId,
    lineTextAtCursor: doc.lineAt(editor.selection.active).text,
    metadata,
  };
}

function getDiagnosticsText(editor: vscode.TextEditor): string {
  const visibleDiagnostics = vscode.languages
    .getDiagnostics(editor.document.uri)
    .filter(
      (e) =>
        e.severity === vscode.DiagnosticSeverity.Error &&
        editor.visibleRanges.some((r) => r.contains(e.range))
    );
  return formatDiagnostics(visibleDiagnostics);
}

function formatDiagnostics(diagnostics: vscode.Diagnostic[]): string {
  return `${diagnostics.map((e) => `${e.message}`).join("\n")}`;
}
