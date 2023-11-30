import * as vscode from "vscode";

export function getWorkspaceRootPaths() {
  return vscode.workspace.workspaceFolders
    ?.filter((wf) => wf.uri.scheme === "file")
    .map((wf) => wf.uri.fsPath);
}
