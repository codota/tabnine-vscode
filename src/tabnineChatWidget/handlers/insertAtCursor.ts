import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export type RelevantLines = {
  startLine: number;
  endLine: number;
};

export async function insertTextAtCursor({ code }: { code: string }): Promise<void> {
  const activeEditor = vscode.window.activeTextEditor;

  if (!activeEditor) {
    vscode.window.showErrorMessage("No active text editor found.");
    return;
  }

  const originalUri = activeEditor.document.uri;

  const tempFilePath = path.join(os.tmpdir(), "temp");
  fs.writeFileSync(tempFilePath, code);

  const fixedUri = vscode.Uri.file(tempFilePath);

  await vscode.commands.executeCommand(
    "vscode.diff",
    fixedUri,
    originalUri,
    "Tabnine - Diff Preview"
  );
}
