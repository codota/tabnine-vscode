import * as vscode from "vscode";

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
};

export function getEditorContext(): EditorContextResponse {
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
    diagnosticsText: getDiagnosticsText(editor),
    fileUri: doc.uri.toString(),
    language: doc.languageId,
    lineTextAtCursor: doc.lineAt(editor.selection.active).text,
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
