import * as vscode from "vscode";

export interface NavigateToLocationPayload {
  path: string;
  range: {
    startLine: number;
    endLine: number;
  };
}
export async function navigateToLocation({
  path,
  range,
}: NavigateToLocationPayload): Promise<void> {
  const uri = vscode.Uri.file(path);
  const document = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(document);

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
