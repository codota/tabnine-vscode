import * as vscode from "vscode";

export interface NavigateToLocationPayload {
  path: string;
  range: {
    startLine: number;
    endLine: number;
  };
}
export function navigateToLocation(payload: NavigateToLocationPayload): void {
  void doNavigate(payload);
}

async function doNavigate({
  path,
  range,
}: NavigateToLocationPayload): Promise<void> {
  const uri = vscode.Uri.file(path);
  const document = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(document);
  const editor = vscode.window.visibleTextEditors.find(
    (visibleEditor) => visibleEditor.document === document
  );
  if (!editor) return;

  const endLineLength = document.lineAt(range.endLine).text.length;
  const navigationRange = new vscode.Range(
    range.startLine,
    0,
    range.endLine,
    endLineLength
  );
  editor.selection = new vscode.Selection(
    navigationRange.start,
    navigationRange.end
  );
  editor.revealRange(navigationRange);
}
