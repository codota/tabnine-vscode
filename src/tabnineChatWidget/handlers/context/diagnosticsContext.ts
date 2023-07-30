import vscode from "vscode";
import { ContextTypeData, DiagnosticsContext } from "./enrichingContextTypes";

export default async function getDiagnosticsContext(
  editor: vscode.TextEditor
): Promise<ContextTypeData | undefined> {
  const diagnosticsContext = buildDiagnosticsContext(editor);
  if (!diagnosticsContext) return undefined;

  return Promise.resolve({ type: "Diagnostics", ...diagnosticsContext });
}

function buildDiagnosticsContext(
  editor: vscode.TextEditor
): DiagnosticsContext | undefined {
  const visibleDiagnostics = vscode.languages
    .getDiagnostics(editor.document.uri)
    .filter(
      (e) =>
        e.severity === vscode.DiagnosticSeverity.Error &&
        editor.visibleRanges.some((r) => r.contains(e.range))
    );
  if (!visibleDiagnostics.length) return undefined;
  return { diagnosticsText: formatDiagnostics(visibleDiagnostics) };
}

function formatDiagnostics(diagnostics: vscode.Diagnostic[]): string {
  return `${diagnostics.map((e) => `${e.message}`).join("\n")}`;
}
