import vscode from "vscode";
import { DiagnosticsContext } from "./enrichingContextTypes";

export default async function getDiagnosticsContext(
  editor: vscode.TextEditor
): Promise<DiagnosticsContext | undefined> {
  const diagnosticsText = getDiagnosticsText(editor);
  if (!diagnosticsText) return undefined;

  return Promise.resolve({ diagnosticsText });
}

function getDiagnosticsText(editor: vscode.TextEditor): string | undefined {
  const visibleDiagnostics = vscode.languages
    .getDiagnostics(editor.document.uri)
    .filter(
      (e) =>
        e.severity === vscode.DiagnosticSeverity.Error &&
        editor.visibleRanges.some((r) => r.contains(e.range))
    );
  if (!visibleDiagnostics.length) return undefined;
  return formatDiagnostics(visibleDiagnostics);
}

function formatDiagnostics(diagnostics: vscode.Diagnostic[]): string {
  return `${diagnostics.map((e) => `${e.message}`).join("\n")}`;
}
