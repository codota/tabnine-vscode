import * as vscode from "vscode";
import { ContextTypeData, DiagnosticItem } from "./enrichingContextTypes";

export default async function getDiagnosticsContext(
  editor: vscode.TextEditor
): Promise<ContextTypeData | undefined> {
  const diagnosticsContext = buildDiagnosticsContext(editor);
  if (!diagnosticsContext) return undefined;

  return Promise.resolve({
    type: "Diagnostics",
    diagnostics: diagnosticsContext,
  });
}

function buildDiagnosticsContext(editor: vscode.TextEditor): DiagnosticItem[] {
  const selectedRange = editor.selection;

  return vscode.languages
    .getDiagnostics(editor.document.uri)
    .filter((e: vscode.Diagnostic) => {
      if (e.severity !== vscode.DiagnosticSeverity.Error) {
        return false;
      }
      if (selectedRange.isEmpty) {
        return editor.visibleRanges.some((r) => r.contains(e.range));
      }
      return selectedRange.contains(e.range);
    })
    .map((e: vscode.Diagnostic) => ({
      errorMessage: e.message,
      lineCode: editor.document.lineAt(e.range.start.line).text.trim(),
      lineNumber: e.range.start.line + 1,
    }));
}
